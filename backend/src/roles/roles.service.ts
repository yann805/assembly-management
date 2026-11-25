import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RolesService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.role.findMany({ include: { _count: { select: { userAssignments: true } } } });
  }

  async findAssignments() {
    return this.prisma.userRoleAssignment.findMany({
      include: {
        user: { select: { id: true, fullName: true, email: true, isActive: true } },
        role: true,
        assembly: { select: { id: true, name: true } },
        assigner: { select: { id: true, fullName: true } },
      },
      orderBy: { assignedAt: 'desc' },
    });
  }
}
