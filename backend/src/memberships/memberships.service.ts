import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleName } from '../auth/enums/role.enum';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class MembershipsService {
  constructor(private prisma: PrismaService) {}

  async findByAssembly(assemblyId: string, user: AuthenticatedUser) {
    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    if (!isGeneral) {
      const roleName = user.roles.some((r) => r.name === RoleName.ASSEMBLY_TREASURER)
        ? RoleName.ASSEMBLY_TREASURER
        : RoleName.ASSEMBLY_LEADER;
      const userAssemblyIds = user.roles
        .filter((r) => r.name === roleName && r.assemblyId)
        .map((r) => r.assemblyId!);
      if (!userAssemblyIds.includes(assemblyId)) {
        throw new ForbiddenException('Accès non autorisé à cette assemblée.');
      }
    }

    return this.prisma.assemblyMembership.findMany({
      where: { assemblyId, status: 'ACTIVE' },
      include: {
        member: { include: { contacts: true, user: { select: { id: true, email: true, isActive: true } } } },
        responsibilities: { where: { isCurrent: true } },
      },
      orderBy: { member: { fullName: 'asc' } },
    });
  }
}
