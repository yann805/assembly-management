import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateContributionDto, ContributionQueryDto } from './dto/contribution.dto';
import { RoleName, AUDIT_ACTIONS } from '../auth/enums/role.enum';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { isPositiveAmount } from '../common/utils/financial';

@Injectable()
export class ContributionsService {
  constructor(private prisma: PrismaService) {}

  private getUserAssemblyIds(user: AuthenticatedUser): string[] {
    const roleName = user.roles.some((r) => r.name === RoleName.ASSEMBLY_TREASURER)
      ? RoleName.ASSEMBLY_TREASURER
      : RoleName.ASSEMBLY_LEADER;
    return user.roles
      .filter((r) => r.name === roleName && r.assemblyId)
      .map((r) => r.assemblyId!);
  }

  async create(dto: CreateContributionDto, user: AuthenticatedUser) {
    // 1. Vérifier la membership
    const membership = await this.prisma.assemblyMembership.findUnique({
      where: { id: dto.membershipId },
      include: { assembly: true, member: true },
    });
    if (!membership) throw new NotFoundException('Appartenance introuvable.');

    // 2. Vérifier le scope du trésorier
    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    if (!isGeneral) {
      const treasurerAssembly = user.roles.find((r) => r.name === RoleName.ASSEMBLY_TREASURER && r.assemblyId);
      if (!treasurerAssembly || treasurerAssembly.assemblyId !== membership.assemblyId) {
        throw new ForbiddenException('Ce membre n\'appartient pas à votre assemblée.');
      }
    }

    // 3. Vérifier que la membership est active
    if (membership.status !== 'ACTIVE') {
      throw new BadRequestException('Le membre est inactif dans cette assemblée.');
    }

    // 4. Vérifier la période : si un rapport est déjà soumis/confirmé pour ce mois, refuser
    const paymentDate = new Date(dto.paymentDate);
    const month = paymentDate.getMonth() + 1;
    const year = paymentDate.getFullYear();
    const existingReport = await this.prisma.monthlyReport.findFirst({
      where: {
        assemblyId: membership.assemblyId,
        month,
        year,
        status: { in: ['SUBMITTED', 'CONFIRMED'] },
      },
    });
    if (existingReport) {
      throw new BadRequestException(
        'La période financière est verrouillée : un rapport a déjà été soumis pour ce mois.',
      );
    }

    // 5. Validation des montants
    if (!isPositiveAmount(dto.titheAmount) || !isPositiveAmount(dto.offeringAmount)) {
      throw new BadRequestException('Les montants ne peuvent pas être négatifs.');
    }

    // Égalité 1 : total = dîme + offrande
    const computedTotal = dto.titheAmount + dto.offeringAmount;
    if (Math.abs(computedTotal - (dto.titheAmount + dto.offeringAmount)) > 0.01) {
      throw new BadRequestException('Incohérence du montant total.');
    }

    // Égalité 2 : somme des allocations = offrande
    if (dto.allocations && dto.allocations.length > 0) {
      const allocationsSum = dto.allocations.reduce((s, a) => s + a.amount, 0);
      if (Math.abs(allocationsSum - dto.offeringAmount) > 0.01) {
        throw new BadRequestException(
          `La somme des répartitions (${allocationsSum} FCFA) ne correspond pas au montant de l'offrande (${dto.offeringAmount} FCFA).`,
        );
      }

      // Vérifier que toutes les rubriques sont actives
      const categoryIds = [...new Set(dto.allocations.map((a) => a.categoryId))];
      const categories = await this.prisma.offeringCategory.findMany({
        where: { id: { in: categoryIds } },
      });
      if (categories.length !== categoryIds.length) {
        throw new BadRequestException('Une ou plusieurs rubriques sont introuvables.');
      }
      const inactive = categories.filter((c) => !c.isActive);
      if (inactive.length > 0) {
        throw new BadRequestException(
          `Rubriques inactives : ${inactive.map((c) => c.name).join(', ')}`,
        );
      }
      for (const a of dto.allocations) {
        if (!isPositiveAmount(a.amount)) {
          throw new BadRequestException('Les montants des répartitions ne peuvent pas être négatifs.');
        }
      }
    } else if (dto.offeringAmount > 0) {
      throw new BadRequestException(
        'L\'offrande est supérieure à 0 mais aucune répartition n\'a été fournie.',
      );
    }

    // 6. Transaction SQL : enregistrer contribution + allocations + recalculer stats
    return this.prisma.$transaction(async (tx) => {
      const contribution = await tx.contribution.create({
        data: {
          membershipId: dto.membershipId,
          assemblyId: membership.assemblyId,
          paymentDate,
          titheAmount: new Prisma.Decimal(dto.titheAmount),
          offeringAmount: new Prisma.Decimal(dto.offeringAmount),
          totalAmount: new Prisma.Decimal(computedTotal),
          recordedBy: user.id,
          note: dto.note,
        },
      });

      if (dto.allocations && dto.allocations.length > 0) {
        await tx.contributionAllocation.createMany({
          data: dto.allocations.map((a) => ({
            contributionId: contribution.id,
            categoryId: a.categoryId,
            amount: new Prisma.Decimal(a.amount),
          })),
        });
      }

      // Mettre à jour les statistiques mensuelles
      await this.updateMonthlyStats(tx, dto.membershipId, month, year, dto.titheAmount, dto.offeringAmount);

      // Audit
      await tx.auditLog.create({
        data: {
          userId: user.id,
          assemblyId: membership.assemblyId,
          action: AUDIT_ACTIONS.CONTRIBUTION_CREATE,
          entityType: 'Contribution',
          entityId: contribution.id,
          newValues: { ...contribution, allocations: dto.allocations } as any,
        },
      });

      return tx.contribution.findUnique({
        where: { id: contribution.id },
        include: {
          allocations: { include: { category: true } },
          membership: { include: { member: true } },
          recorder: { select: { id: true, fullName: true } },
        },
      });
    });
  }

  async findAll(query: ContributionQueryDto, user: AuthenticatedUser) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 50;
    const skip = (page - 1) * limit;

    const where: any = {};

    // Scope
    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    if (!isGeneral) {
      const userAssemblyIds = this.getUserAssemblyIds(user);
      if (userAssemblyIds.length === 0) return { data: [], total: 0, page, limit };
      where.assemblyId = { in: userAssemblyIds };
    } else if (query.assemblyId) {
      where.assemblyId = query.assemblyId;
    }

    if (query.membershipId) where.membershipId = query.membershipId;
    if (query.memberId) {
      where.membership = { memberId: query.memberId };
    }
    if (query.month || query.year) {
      where.paymentDate = {};
      if (query.year) {
        const start = new Date(query.year, (query.month || 1) - 1, 1);
        const end = query.month
          ? new Date(query.year, query.month, 0, 23, 59, 59)
          : new Date(query.year, 11, 31, 23, 59, 59);
        where.paymentDate = { gte: start, lte: end };
      }
    }

    const [data, total] = await Promise.all([
      this.prisma.contribution.findMany({
        where,
        include: {
          allocations: { include: { category: true } },
          membership: { include: { member: true } },
          recorder: { select: { id: true, fullName: true } },
        },
        skip,
        take: limit,
        orderBy: { paymentDate: 'desc' },
      }),
      this.prisma.contribution.count({ where }),
    ]);

    // Convert Decimal
    const formatted = data.map((c) => ({
      ...c,
      titheAmount: Number(c.titheAmount),
      offeringAmount: Number(c.offeringAmount),
      totalAmount: Number(c.totalAmount),
      allocations: c.allocations.map((a) => ({ ...a, amount: Number(a.amount) })),
    }));

    return { data: formatted, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const contribution = await this.prisma.contribution.findUnique({
      where: { id },
      include: {
        allocations: { include: { category: true } },
        membership: { include: { member: true, assembly: true } },
        recorder: { select: { id: true, fullName: true } },
      },
    });
    if (!contribution) throw new NotFoundException('Contribution introuvable.');

    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    if (!isGeneral) {
      const userAssemblyIds = this.getUserAssemblyIds(user);
      if (!userAssemblyIds.includes(contribution.assemblyId)) {
        throw new ForbiddenException('Accès non autorisé à cette contribution.');
      }
    }

    return {
      ...contribution,
      titheAmount: Number(contribution.titheAmount),
      offeringAmount: Number(contribution.offeringAmount),
      totalAmount: Number(contribution.totalAmount),
      allocations: contribution.allocations.map((a) => ({ ...a, amount: Number(a.amount) })),
    };
  }

  async getMonthlyTotals(assemblyId: string, month: number, year: number, user: AuthenticatedUser) {
    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    if (!isGeneral && !this.getUserAssemblyIds(user).includes(assemblyId)) {
      throw new ForbiddenException("Vous n'avez pas accès à cette assemblée.");
    }

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 0, 23, 59, 59);

    const contributions = await this.prisma.contribution.findMany({
      where: { assemblyId, paymentDate: { gte: start, lte: end } },
      include: { allocations: { include: { category: true } }, membership: { include: { member: true } } },
    });

    const totalTithes = contributions.reduce((s, c) => s + Number(c.titheAmount), 0);
    const totalOfferings = contributions.reduce((s, c) => s + Number(c.offeringAmount), 0);
    const totalAmount = contributions.reduce((s, c) => s + Number(c.totalAmount), 0);

    const categoryTotals: Record<string, { name: string; amount: number }> = {};
    for (const c of contributions) {
      for (const a of c.allocations) {
        const key = a.categoryId;
        if (!categoryTotals[key]) {
          categoryTotals[key] = { name: a.category.name, amount: 0 };
        }
        categoryTotals[key].amount += Number(a.amount);
      }
    }

    return {
      month,
      year,
      contributionsCount: contributions.length,
      contributingMembers: new Set(contributions.map((c) => c.membership.memberId)).size,
      totalTithes,
      totalOfferings,
      totalAmount,
      categoryTotals: Object.entries(categoryTotals).map(([id, v]) => ({ categoryId: id, ...v })),
      contributions: contributions.map((c) => ({
        ...c,
        titheAmount: Number(c.titheAmount),
        offeringAmount: Number(c.offeringAmount),
        totalAmount: Number(c.totalAmount),
        allocations: c.allocations.map((a) => ({ ...a, amount: Number(a.amount) })),
      })),
    };
  }

  private async updateMonthlyStats(
    tx: Prisma.TransactionClient,
    membershipId: string,
    month: number,
    year: number,
    titheAdded: number,
    offeringAdded: number,
  ) {
    const existing = await tx.memberMonthlyStatistic.findUnique({
      where: { membershipId_month_year: { membershipId, month, year } },
    });

    if (existing) {
      await tx.memberMonthlyStatistic.update({
        where: { id: existing.id },
        data: {
          tithePaid: Number(existing.tithePaid) + titheAdded,
          offeringPaid: Number(existing.offeringPaid) + offeringAdded,
          hasTithe: titheAdded > 0 ? true : existing.hasTithe,
          hasOffering: offeringAdded > 0 ? true : existing.hasOffering,
          calculatedAt: new Date(),
        },
      });
    } else {
      await tx.memberMonthlyStatistic.create({
        data: {
          membershipId,
          month,
          year,
          tithePaid: titheAdded,
          offeringPaid: offeringAdded,
          hasTithe: titheAdded > 0,
          hasOffering: offeringAdded > 0,
        },
      });
    }
  }
}
