import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { AUDIT_ACTIONS } from '../auth/enums/role.enum';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async findAll(includeInactive = false) {
    return this.prisma.offeringCategory.findMany({
      where: includeInactive ? {} : { isActive: true, deletedAt: null },
      include: {
        _count: {
          select: { allocations: true },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async findOne(id: string) {
    const category = await this.prisma.offeringCategory.findUnique({
      where: { id },
      include: {
        allocations: {
          include: { contribution: { include: { membership: { include: { member: true } } } } },
        },
      },
    });
    if (!category) throw new NotFoundException('Rubrique introuvable.');
    return category;
  }

  async getStats(id: string) {
    const category = await this.findOne(id);
    const total = await this.prisma.contributionAllocation.aggregate({
      where: { categoryId: id },
      _sum: { amount: true },
      _count: true,
    });
    return {
      category,
      totalAllocated: total._sum.amount,
      allocationCount: total._count,
    };
  }

  async create(dto: CreateCategoryDto, user: AuthenticatedUser) {
    const exists = await this.prisma.offeringCategory.findUnique({ where: { name: dto.name } });
    if (exists) throw new BadRequestException('Une rubrique avec ce nom existe déjà.');

    const category = await this.prisma.offeringCategory.create({
      data: {
        name: dto.name,
        description: dto.description,
        isActive: true,
        createdBy: user.id,
      },
    });

    await this.logAudit(user, AUDIT_ACTIONS.CATEGORY_CREATE, 'OfferingCategory', category.id, null, category);
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto, user: AuthenticatedUser) {
    const old = await this.findOne(id);

    // Si renommage, vérifier l'unicité
    if (dto.name && dto.name !== old.name) {
      const exists = await this.prisma.offeringCategory.findUnique({ where: { name: dto.name } });
      if (exists) throw new BadRequestException('Ce nom est déjà utilisé.');
    }

    const updated = await this.prisma.offeringCategory.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        isActive: dto.isActive,
      },
    });

    await this.logAudit(
      user,
      dto.isActive === false ? AUDIT_ACTIONS.CATEGORY_DEACTIVATE : AUDIT_ACTIONS.CATEGORY_UPDATE,
      'OfferingCategory',
      id,
      old,
      updated,
    );
    return updated;
  }

  async softDelete(id: string, user: AuthenticatedUser) {
    // Vérifier que la rubrique n'est pas utilisée
    const usageCount = await this.prisma.contributionAllocation.count({
      where: { categoryId: id },
    });
    if (usageCount > 0) {
      // On ne supprime pas, on désactive
      return this.update(id, { isActive: false }, user);
    }
    // Suppression physique possible car inutilisée
    await this.prisma.offeringCategory.delete({ where: { id } });
    return { message: 'Rubrique supprimée (jamais utilisée).' };
  }

  private async logAudit(
    user: AuthenticatedUser,
    action: string,
    entityType: string,
    entityId: string,
    oldValues: any,
    newValues: any,
  ) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: user.id,
          action,
          entityType,
          entityId,
          oldValues: oldValues ?? undefined,
          newValues: newValues ?? undefined,
        },
      });
    } catch (e) {}
  }
}
