import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAssemblyDto, UpdateAssemblyDto, AssignResponsibilityDto } from './dto/assembly.dto';
import { AUDIT_ACTIONS } from '../auth/enums/role.enum';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class AssembliesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.assembly.findMany({
      include: {
        memberships: { where: { status: 'ACTIVE' }, include: { member: { include: { contacts: true } } } },
        responsibilities: {
          where: { isCurrent: true },
          include: { membership: { include: { member: true } } },
        },
        _count: { select: { memberships: { where: { status: 'ACTIVE' } } } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const assembly = await this.prisma.assembly.findUnique({
      where: { id },
      include: {
        memberships: {
          where: { status: 'ACTIVE' },
          include: {
            member: { include: { contacts: true, user: { select: { id: true, email: true, phone: true, isActive: true } } } },
            responsibilities: { where: { isCurrent: true } },
          },
        },
        responsibilities: {
          include: { membership: { include: { member: true } } },
        },
      },
    });
    if (!assembly) throw new NotFoundException('Assemblée introuvable.');
    return assembly;
  }

  async create(dto: CreateAssemblyDto, user: AuthenticatedUser) {
    const assembly = await this.prisma.assembly.create({
      data: {
        name: dto.name,
        location: dto.location,
        description: dto.description,
        creationDate: dto.creationDate ? new Date(dto.creationDate) : new Date(),
      },
    });
    await this.logAudit(user, AUDIT_ACTIONS.ASSEMBLY_CREATE, 'Assembly', assembly.id, null, assembly, assembly.id);
    return assembly;
  }

  async update(id: string, dto: UpdateAssemblyDto, user: AuthenticatedUser) {
    const old = await this.findOne(id);
    const updated = await this.prisma.assembly.update({
      where: { id },
      data: {
        name: dto.name,
        location: dto.location,
        description: dto.description,
        status: dto.status,
      },
    });
    await this.logAudit(user, AUDIT_ACTIONS.ASSEMBLY_UPDATE, 'Assembly', id, old, updated, id);
    return updated;
  }

  async toggleStatus(id: string) {
    const assembly = await this.findOne(id);
    return this.prisma.assembly.update({
      where: { id },
      data: { status: assembly.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE' },
    });
  }

  async assignResponsibility(assemblyId: string, dto: AssignResponsibilityDto, user: AuthenticatedUser) {
    const assembly = await this.findOne(assemblyId);

    // Vérifier que la membership appartient bien à cette assemblée
    const membership = assembly.memberships.find((m) => m.id === dto.membershipId);
    if (!membership) {
      throw new BadRequestException('Ce membre n\'appartient pas à cette assemblée.');
    }

    return this.prisma.$transaction(async (tx) => {
      // Clôturer l'ancien responsable actif du même type
      await tx.assemblyResponsibility.updateMany({
        where: {
          assemblyId,
          responsibilityType: dto.responsibilityType,
          isCurrent: true,
        },
        data: {
          isCurrent: false,
          endDate: new Date(),
        },
      });

      // Créer la nouvelle responsabilité
      const responsibility = await tx.assemblyResponsibility.create({
        data: {
          assemblyId,
          membershipId: dto.membershipId,
          responsibilityType: dto.responsibilityType,
          startDate: new Date(),
          assignedBy: user.id,
          isCurrent: true,
        },
      });

      const roleName = dto.responsibilityType === 'TREASURER'
        ? 'ASSEMBLY_TREASURER'
        : 'ASSEMBLY_LEADER';
      const role = await tx.role.findUnique({ where: { name: roleName } });
      if (!role) {
        throw new BadRequestException(`Le rôle ${roleName} n'est pas configuré.`);
      }

      const requestedUser = dto.userId
        ? await tx.user.findUnique({ where: { id: dto.userId } })
        : null;
      if (dto.userId && !requestedUser) {
        throw new NotFoundException('Compte utilisateur introuvable.');
      }

      let assignedUserId = requestedUser?.id ?? membership.member.user?.id;
      let credentials: { identifier: string; temporaryPassword: string } | undefined;

      if (!assignedUserId) {
        const email = membership.member.contacts.find((contact) => contact.contactType === 'EMAIL')?.contactValue
          || `member.${membership.memberId}@assembly.local`;
        const phone = membership.member.contacts.find((contact) => contact.contactType === 'PHONE')?.contactValue;
        const existingContact = await tx.user.findFirst({
          where: {
            OR: [
              { email },
              ...(phone ? [{ phone }] : []),
            ],
          },
        });
        if (existingContact) {
          throw new BadRequestException('Les coordonnées de ce membre sont déjà associées à un autre compte.');
        }

        const temporaryPassword = `${randomBytes(12).toString('base64url')}A1!`;
        const passwordHash = await bcrypt.hash(temporaryPassword, 10);
        const newUser = await tx.user.create({
          data: {
            fullName: membership.member.fullName,
            email,
            phone,
            passwordHash,
            memberId: membership.memberId,
            isActive: true,
          },
        });
        assignedUserId = newUser.id;
        credentials = {
          identifier: membership.member.contacts.find((contact) => contact.contactType === 'EMAIL')?.contactValue
            || phone
            || email,
          temporaryPassword,
        };
      } else if (requestedUser && requestedUser.memberId !== membership.memberId) {
        if (requestedUser.memberId) {
          throw new BadRequestException('Ce compte est déjà lié à un autre membre.');
        }
        await tx.user.update({
          where: { id: requestedUser.id },
          data: { memberId: membership.memberId },
        });
      }

      await tx.userRoleAssignment.deleteMany({
        where: { roleId: role.id, assemblyId },
      });
      await tx.userRoleAssignment.create({
        data: {
          userId: assignedUserId,
          roleId: role.id,
          assemblyId,
          assignedBy: user.id,
        },
      });

      await this.logAudit(
        user,
        AUDIT_ACTIONS.RESPONSIBILITY_ASSIGN,
        'AssemblyResponsibility',
        responsibility.id,
        null,
        responsibility,
        assemblyId,
      );
      return {
        responsibility,
        ...(credentials && {
          credentials: {
            fullName: membership.member.fullName,
            identifier: credentials.identifier,
            temporaryPassword: credentials.temporaryPassword,
          },
        }),
      };
    });
  }

  async getDashboardStats() {
    const [assemblies, activeAssemblies, members, leaders, treasurers] = await Promise.all([
      this.prisma.assembly.count(),
      this.prisma.assembly.count({ where: { status: 'ACTIVE' } }),
      this.prisma.member.count(),
      this.prisma.assemblyResponsibility.count({ where: { responsibilityType: 'LEADER', isCurrent: true } }),
      this.prisma.assemblyResponsibility.count({ where: { responsibilityType: 'TREASURER', isCurrent: true } }),
    ]);

    return {
      totalAssemblies: assemblies,
      activeAssemblies,
      totalMembers: members,
      totalLeaders: leaders,
      totalTreasurers: treasurers,
    };
  }

  private async logAudit(
    user: AuthenticatedUser,
    action: string,
    entityType: string,
    entityId: string,
    oldValues: any,
    newValues: any,
    assemblyId?: string,
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
          assemblyId: assemblyId ?? null,
        },
      });
    } catch (e) {
      // L'audit ne doit jamais bloquer l'opération principale
    }
  }
}
