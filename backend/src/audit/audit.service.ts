import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { RoleName } from '../auth/enums/role.enum';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    user: AuthenticatedUser,
    params?: { action?: string; assemblyId?: string; userId?: string; limit?: number },
  ) {
    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    const where: any = {};

    if (!isGeneral) {
      const userAssemblyIds = user.roles.filter((r) => r.assemblyId).map((r) => r.assemblyId);
      if (userAssemblyIds.length === 0) return [];
      where.assemblyId = { in: userAssemblyIds };
    } else if (params?.assemblyId) {
      where.assemblyId = params.assemblyId;
    }

    if (params?.action) where.action = params.action;
    if (params?.userId) where.userId = params.userId;

    return this.prisma.auditLog.findMany({
      where,
      include: {
        user: { select: { id: true, fullName: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: params?.limit || 100,
    });
  }
}
