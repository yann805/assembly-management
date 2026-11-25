import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMemberDto, UpdateMemberDto, MemberQueryDto } from './dto/member.dto';
import { RoleName } from '../auth/enums/role.enum';
import { AUDIT_ACTIONS } from '../auth/enums/role.enum';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class MembersService {
  constructor(private prisma: PrismaService) {}

  /**
   * Détermine l'assemblée cible pour un trésorier.
   * - Un admin peut cibler n'importe quelle assemblée via dto.assemblyId.
   * - Un trésorier ne peut créer que dans son assemblée.
   */
  private resolveAssemblyId(user: AuthenticatedUser, dtoAssemblyId?: string): string {
    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    if (isGeneral) {
      if (!dtoAssemblyId) throw new BadRequestException('assemblyId requis pour l\'administrateur.');
      return dtoAssemblyId;
    }
    const treasurerAssembly = user.roles.find((r) => r.name === RoleName.ASSEMBLY_TREASURER && r.assemblyId);
    if (!treasurerAssembly) throw new ForbiddenException('Aucune assemblée assignée.');
    if (dtoAssemblyId && dtoAssemblyId !== treasurerAssembly.assemblyId) {
      throw new ForbiddenException('Vous ne pouvez créer un membre que dans votre assemblée.');
    }
    return treasurerAssembly.assemblyId!;
  }

  private getUserAssemblyIds(user: AuthenticatedUser): string[] {
    const roleName = user.roles.some((r) => r.name === RoleName.ASSEMBLY_TREASURER)
      ? RoleName.ASSEMBLY_TREASURER
      : RoleName.ASSEMBLY_LEADER;
    return user.roles
      .filter((r) => r.name === roleName && r.assemblyId)
      .map((r) => r.assemblyId!);
  }

  async create(dto: CreateMemberDto, user: AuthenticatedUser) {
    const assemblyId = this.resolveAssemblyId(user, dto.assemblyId);
    const filiereName = dto.filiere?.trim();
    const levelName = dto.level?.trim();
    return this.prisma.$transaction(async (tx) => {
      const [filiere, level] = await Promise.all([
        filiereName
          ? tx.filiere.upsert({
              where: { name: filiereName },
              update: {},
              create: { name: filiereName },
            })
          : null,
        levelName
          ? tx.level.upsert({
              where: { name: levelName },
              update: {},
              create: { name: levelName },
            })
          : null,
      ]);

      const member = await tx.member.create({
        data: {
          fullName: dto.fullName,
          gender: dto.gender,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          conversionDate: dto.conversionDate ? new Date(dto.conversionDate) : undefined,
          waterBaptismDate: dto.waterBaptismDate ? new Date(dto.waterBaptismDate) : undefined,
          holySpiritBaptismDate: dto.holySpiritBaptismDate ? new Date(dto.holySpiritBaptismDate) : undefined,
          maritalStatusId: dto.maritalStatusId || undefined,
          filiereId: filiere?.id || dto.filiereId || undefined,
          levelId: level?.id || dto.levelId || undefined,
          profession: dto.profession,
          arrivalDate: dto.arrivalDate ? new Date(dto.arrivalDate) : new Date(),
          status: 'ACTIVE',
        },
      });

      await tx.assemblyMembership.create({
        data: {
          assemblyId,
          memberId: member.id,
          joinedAt: new Date(),
          status: 'ACTIVE',
        },
      });

      if (dto.contacts && dto.contacts.length > 0) {
        await tx.memberContact.createMany({
          data: dto.contacts.map((c) => ({
            memberId: member.id,
            contactValue: c.contactValue,
            contactType: c.contactType,
            isPrimary: c.isPrimary ?? false,
          })),
        });
      }

      await tx.auditLog.create({
        data: {
          userId: user.id,
          assemblyId,
          action: AUDIT_ACTIONS.MEMBER_CREATE,
          entityType: 'Member',
          entityId: member.id,
          newValues: member as any,
        },
      });

      return tx.member.findUnique({
        where: { id: member.id },
        include: { contacts: true, memberships: true },
      });
    });
  }

  async findAll(query: MemberQueryDto, user: AuthenticatedUser) {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    const skip = (page - 1) * limit;

    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    let assemblyFilter: any = {};
    if (!isGeneral) {
      const userAssemblyIds = this.getUserAssemblyIds(user);
      if (userAssemblyIds.length === 0) return { data: [], total: 0, page, limit };
      assemblyFilter = { assemblyId: { in: userAssemblyIds } };
    } else if (query.assemblyId) {
      assemblyFilter = { assemblyId: query.assemblyId };
    }

    const where: any = {
      memberships: { some: { ...assemblyFilter, status: 'ACTIVE' } },
    };

    if (query.search) {
      where.fullName = { contains: query.search, mode: 'insensitive' };
    }
    if (query.status) {
      where.status = query.status;
    }

    const [data, total] = await Promise.all([
      this.prisma.member.findMany({
        where,
        include: {
          contacts: { where: { isPrimary: true }, take: 1 },
          memberships: { where: { status: 'ACTIVE' }, include: { assembly: true } },
        },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.member.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    const userAssemblyIds = isGeneral ? [] : this.getUserAssemblyIds(user);
    const member = await this.prisma.member.findUnique({
      where: { id },
      include: {
        contacts: true,
        memberships: {
          where: isGeneral ? undefined : { assemblyId: { in: userAssemblyIds } },
          include: { assembly: true },
        },
        maritalStatus: true,
        filiere: true,
        level: true,
        user: { select: { id: true, email: true, phone: true, isActive: true } },
      },
    });
    if (!member) throw new NotFoundException('Membre introuvable.');

    // Vérification du scope
    if (!isGeneral) {
      const memberAssemblyIds = member.memberships.map((m) => m.assemblyId);
      const hasAccess = memberAssemblyIds.some((aid) => userAssemblyIds.includes(aid));
      if (!hasAccess) {
        throw new ForbiddenException('Ce membre n\'appartient pas à votre assemblée.');
      }
    }

    return member;
  }

  async update(id: string, dto: UpdateMemberDto, user: AuthenticatedUser) {
    const old = await this.findOne(id, user);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.member.update({
        where: { id },
        data: {
          fullName: dto.fullName,
          gender: dto.gender,
          dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
          conversionDate: dto.conversionDate ? new Date(dto.conversionDate) : undefined,
          waterBaptismDate: dto.waterBaptismDate ? new Date(dto.waterBaptismDate) : undefined,
          holySpiritBaptismDate: dto.holySpiritBaptismDate ? new Date(dto.holySpiritBaptismDate) : undefined,
          maritalStatusId: dto.maritalStatusId || undefined,
          filiereId: dto.filiereId || undefined,
          levelId: dto.levelId || undefined,
          profession: dto.profession,
          arrivalDate: dto.arrivalDate ? new Date(dto.arrivalDate) : undefined,
          status: dto.status,
        },
        include: { contacts: true },
      });

      if (dto.contacts) {
        await tx.memberContact.deleteMany({ where: { memberId: id } });
        if (dto.contacts.length > 0) {
          await tx.memberContact.createMany({
            data: dto.contacts.map((c) => ({
              memberId: id,
              contactValue: c.contactValue,
              contactType: c.contactType,
              isPrimary: c.isPrimary ?? false,
            })),
          });
        }
      }

      const assemblyId = old.memberships[0]?.assemblyId;
      await tx.auditLog.create({
        data: {
          userId: user.id,
          assemblyId: assemblyId ?? null,
          action: dto.status === 'INACTIVE' ? AUDIT_ACTIONS.MEMBER_DEACTIVATE : AUDIT_ACTIONS.MEMBER_UPDATE,
          entityType: 'Member',
          entityId: id,
          oldValues: old as any,
          newValues: updated as any,
        },
      });

      return updated;
    });
  }

  async deactivate(id: string, user: AuthenticatedUser) {
    return this.update(id, { status: 'INACTIVE' }, user);
  }

  async getMemberContributions(id: string, user: AuthenticatedUser) {
    const member = await this.findOne(id, user);
    const assemblyIds = member.memberships.map((membership) => membership.assemblyId);
    if (assemblyIds.length === 0) return [];
    return this.prisma.contribution.findMany({
      where: { membership: { memberId: id, assemblyId: { in: assemblyIds } } },
      include: {
        allocations: { include: { category: true } },
        membership: { include: { assembly: true } },
        recorder: { select: { fullName: true } },
      },
      orderBy: { paymentDate: 'desc' },
    });
  }

  async getReferenceData() {
    const [maritalStatuses, filieres, levels] = await Promise.all([
      this.prisma.maritalStatus.findMany(),
      this.prisma.filiere.findMany(),
      this.prisma.level.findMany(),
    ]);
    return { maritalStatuses, filieres, levels };
  }
}
