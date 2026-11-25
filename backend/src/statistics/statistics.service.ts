import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoleName } from '../auth/enums/role.enum';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { AssemblyMembership, MemberMonthlyStatistic } from '@prisma/client';

type FidelityMembership = Pick<AssemblyMembership, 'id' | 'joinedAt'>;

@Injectable()
export class StatisticsService {
  constructor(private prisma: PrismaService) {}

  private getAssemblyRole(user: AuthenticatedUser) {
    return (
      user.roles.find((r) => r.name === RoleName.ASSEMBLY_TREASURER && r.assemblyId) ??
      user.roles.find((r) => r.name === RoleName.ASSEMBLY_LEADER && r.assemblyId)
    );
  }

  async getDashboard(user: AuthenticatedUser, filters?: { assemblyId?: string; month?: number; year?: number }) {
    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);

    if (isGeneral) {
      return this.getAdminDashboard(filters);
    }

    const assemblyId = this.getAssemblyRole(user)?.assemblyId;
    if (!assemblyId) {
      return { scope: 'none', message: 'Aucune assemblée assignée.' };
    }
    return this.getTreasurerDashboard(assemblyId, filters);
  }

  async getAssemblyMembers(user: AuthenticatedUser, year?: number) {
    const assemblyId = this.getAssemblyRole(user)?.assemblyId;
    if (!assemblyId) {
      throw new ForbiddenException("Aucune assemblée n'est assignée à votre rôle.");
    }

    const memberships = await this.prisma.assemblyMembership.findMany({
      where: { assemblyId },
      include: {
        member: true,
        statistics: { where: year ? { year } : undefined },
      },
      orderBy: { member: { fullName: 'asc' } },
    });

    return memberships.map((membership) => {
      const fidelity = this.buildMemberFidelity(
        membership.memberId,
        [membership],
        membership.statistics,
        year,
      );
      return {
        membershipId: membership.id,
        memberId: membership.memberId,
        memberName: membership.member.fullName,
        memberStatus: membership.member.status,
        membershipStatus: membership.status,
        totalTithes: fidelity.titheFidelity.cumulated,
        totalOfferings: fidelity.offeringFidelity.cumulated,
        totalAmount: fidelity.summary.totalCumulated,
        totalMonths: fidelity.totalMonths,
        globalFidelityRate: fidelity.summary.globalFidelityRate,
      };
    });
  }

  private async getAdminDashboard(filters?: { assemblyId?: string; month?: number; year?: number }) {
    const selectedYear = filters?.year ?? new Date().getFullYear();
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear, 11, 31, 23, 59, 59, 999);
    const contributionWhere: any = {};
    const reportWhere: any = {};

    if (filters?.assemblyId) {
      contributionWhere.assemblyId = filters.assemblyId;
      reportWhere.assemblyId = filters.assemblyId;
    }

    if (filters?.month && filters?.year) {
      const start = new Date(filters.year, filters.month - 1, 1);
      const end = new Date(filters.year, filters.month, 0, 23, 59, 59);
      contributionWhere.paymentDate = { gte: start, lte: end };
      reportWhere.month = filters.month;
      reportWhere.year = filters.year;
    } else if (filters?.year) {
      const start = new Date(filters.year, 0, 1);
      const end = new Date(filters.year, 11, 31, 23, 59, 59);
      contributionWhere.paymentDate = { gte: start, lte: end };
      reportWhere.year = filters.year;
    }

    const [
      totalAssemblies,
      activeAssemblies,
      totalMembers,
      activeMembers,
      monthlyMembers,
      assemblies,
      totalTreasurers,
      totalLeaders,
      contributions,
      reportsSubmitted,
      reportsConfirmed,
      confirmedAmount,
    ] = await Promise.all([
      this.prisma.assembly.count({ where: filters?.assemblyId ? { id: filters.assemblyId } : {} }),
      this.prisma.assembly.count({
        where: { status: 'ACTIVE', ...(filters?.assemblyId ? { id: filters.assemblyId } : {}) },
      }),
      this.prisma.member.count({
        where: filters?.assemblyId ? { memberships: { some: { assemblyId: filters.assemblyId } } } : {},
      }),
      this.prisma.member.count({
        where: {
          status: 'ACTIVE',
          ...(filters?.assemblyId ? { memberships: { some: { assemblyId: filters.assemblyId } } } : {}),
        },
      }),
      this.prisma.member.findMany({
        where: {
          arrivalDate: { gte: yearStart, lte: yearEnd },
          ...(filters?.assemblyId ? { memberships: { some: { assemblyId: filters.assemblyId } } } : {}),
        },
        select: { arrivalDate: true },
      }),
      this.prisma.assembly.findMany({
        where: filters?.assemblyId ? { id: filters.assemblyId } : {},
        select: {
          id: true,
          name: true,
          status: true,
          _count: { select: { memberships: { where: { status: 'ACTIVE' } } } },
        },
        orderBy: { name: 'asc' },
      }),
      this.prisma.assemblyResponsibility.count({
        where: {
          responsibilityType: 'TREASURER',
          isCurrent: true,
          ...(filters?.assemblyId ? { assemblyId: filters.assemblyId } : {}),
        },
      }),
      this.prisma.assemblyResponsibility.count({
        where: {
          responsibilityType: 'LEADER',
          isCurrent: true,
          ...(filters?.assemblyId ? { assemblyId: filters.assemblyId } : {}),
        },
      }),
      this.prisma.contribution.findMany({
        where: contributionWhere,
        include: { allocations: true },
      }),
      this.prisma.monthlyReport.count({ where: { ...reportWhere, status: 'SUBMITTED' } }),
      this.prisma.monthlyReport.count({ where: { ...reportWhere, status: 'CONFIRMED' } }),
      this.prisma.reportConfirmation.aggregate({
        _sum: { receivedAmount: true },
      }),
    ]);

    const totalTithes = contributions.reduce((s, c) => s + Number(c.titheAmount), 0);
    const totalOfferings = contributions.reduce((s, c) => s + Number(c.offeringAmount), 0);
    const totalAmount = contributions.reduce((s, c) => s + Number(c.totalAmount), 0);

    const monthlyStats = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthContributions = contributions.filter((c) => {
        const paymentDate = new Date(c.paymentDate);
        return paymentDate.getFullYear() === selectedYear && paymentDate.getMonth() + 1 === month;
      });
      return {
        month,
        newMembers: monthlyMembers.filter((m) =>
          m.arrivalDate.getFullYear() === selectedYear && m.arrivalDate.getMonth() + 1 === month,
        ).length,
        tithes: monthContributions.reduce((sum, contribution) => sum + Number(contribution.titheAmount), 0),
        offerings: monthContributions.reduce((sum, contribution) => sum + Number(contribution.offeringAmount), 0),
        total: monthContributions.reduce((sum, contribution) => sum + Number(contribution.totalAmount), 0),
      };
    });
    const assemblyContributions: Record<string, number> = {};
    for (const contribution of contributions) {
      assemblyContributions[contribution.assemblyId] =
        (assemblyContributions[contribution.assemblyId] || 0) + Number(contribution.totalAmount);
    }

    // Totaux par rubrique
    const categoryTotals: Record<string, number> = {};
    for (const c of contributions) {
      for (const a of c.allocations) {
        categoryTotals[a.categoryId] = (categoryTotals[a.categoryId] || 0) + Number(a.amount);
      }
    }
    const categoryIds = Object.keys(categoryTotals);
    const categories = await this.prisma.offeringCategory.findMany({
      where: { id: { in: categoryIds } },
    });
    const categoryStats = categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      total: categoryTotals[cat.id] || 0,
    }));

    return {
      scope: 'general',
      filters,
      indicators: {
        totalAssemblies,
        activeAssemblies,
        totalMembers,
        activeMembers,
        totalTreasurers,
        totalLeaders,
        totalTithes,
        totalOfferings,
        totalAmount,
        contributionsCount: contributions.length,
        reportsSubmitted,
        reportsConfirmed,
        confirmedReceivedAmount: Number(confirmedAmount._sum.receivedAmount || 0),
      },
      categoryStats,
      monthlyStats,
      assemblyStats: assemblies.map((assembly) => ({
        id: assembly.id,
        name: assembly.name,
        status: assembly.status,
        activeMembers: assembly._count.memberships,
        totalAmount: assemblyContributions[assembly.id] || 0,
      })),
    };
  }

  private async getTreasurerDashboard(assemblyId: string, filters?: { month?: number; year?: number }) {
    const selectedYear = filters?.year ?? new Date().getFullYear();
    const yearStart = new Date(selectedYear, 0, 1);
    const yearEnd = new Date(selectedYear + 1, 0, 1);
    const contributionWhere: any = { assemblyId };

    if (filters?.month && filters?.year) {
      const start = new Date(filters.year, filters.month - 1, 1);
      const end = new Date(filters.year, filters.month, 0, 23, 59, 59);
      contributionWhere.paymentDate = { gte: start, lte: end };
    } else if (filters?.year) {
      const start = new Date(filters.year, 0, 1);
      const end = new Date(filters.year, 11, 31, 23, 59, 59);
      contributionWhere.paymentDate = { gte: start, lte: end };
    }

    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const nextMonthStart = new Date(now.getFullYear(), now.getMonth() + 1, 1);
    const [totalMembers, activeMembers, newMembers, yearMemberships, contributions, reports] = await Promise.all([
      this.prisma.assemblyMembership.count({ where: { assemblyId } }),
      this.prisma.assemblyMembership.count({ where: { assemblyId, status: 'ACTIVE' } }),
      this.prisma.assemblyMembership.count({
        where: { assemblyId, status: 'ACTIVE', joinedAt: { gte: monthStart, lt: nextMonthStart } },
      }),
      this.prisma.assemblyMembership.findMany({
        where: {
          assemblyId,
          joinedAt: { gte: yearStart, lt: yearEnd },
        },
        select: { joinedAt: true },
      }),
      this.prisma.contribution.findMany({
        where: contributionWhere,
        include: { allocations: { include: { category: true } } },
      }),
      this.prisma.monthlyReport.findMany({
        where: { assemblyId },
        include: { confirmations: true },
        orderBy: [{ year: 'desc' }, { month: 'desc' }],
        take: 5,
      }),
    ]);

    const totalTithes = contributions.reduce((s, c) => s + Number(c.titheAmount), 0);
    const totalOfferings = contributions.reduce((s, c) => s + Number(c.offeringAmount), 0);
    const totalAmount = contributions.reduce((s, c) => s + Number(c.totalAmount), 0);

    const categoryTotals: Record<string, { name: string; total: number }> = {};
    for (const c of contributions) {
      for (const a of c.allocations) {
        if (!categoryTotals[a.categoryId]) {
          categoryTotals[a.categoryId] = { name: a.category.name, total: 0 };
        }
        categoryTotals[a.categoryId].total += Number(a.amount);
      }
    }

    const monthlyStats = Array.from({ length: 12 }, (_, index) => {
      const month = index + 1;
      const monthContributions = contributions.filter((contribution) => {
        const paymentDate = new Date(contribution.paymentDate);
        return paymentDate.getFullYear() === selectedYear && paymentDate.getMonth() + 1 === month;
      });
      return {
        month,
        newMembers: yearMemberships.filter((membership) => membership.joinedAt.getMonth() + 1 === month).length,
        tithes: monthContributions.reduce((sum, contribution) => sum + Number(contribution.titheAmount), 0),
        offerings: monthContributions.reduce((sum, contribution) => sum + Number(contribution.offeringAmount), 0),
        total: monthContributions.reduce((sum, contribution) => sum + Number(contribution.totalAmount), 0),
      };
    });

    return {
      scope: 'treasurer',
      assemblyId,
      filters,
      indicators: {
        totalMembers,
        activeMembers,
        newMembers,
        contributionsCount: contributions.length,
        totalTithes,
        totalOfferings,
        totalAmount,
      },
      categoryStats: Object.entries(categoryTotals).map(([id, v]) => ({ id, ...v })),
      monthlyStats,
      recentReports: reports,
    };
  }

  async getMemberFidelity(memberId: string, user: AuthenticatedUser, year?: number) {
    const member = await this.prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    });
    if (!member) throw new NotFoundException('Membre introuvable.');

    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    const assemblyId = isGeneral ? undefined : this.getAssemblyRole(user)?.assemblyId;
    if (!isGeneral && !assemblyId) {
      throw new ForbiddenException("Aucune assemblée n'est assignée à votre rôle.");
    }
    const memberships = await this.prisma.assemblyMembership.findMany({
      where: {
        memberId,
        ...(assemblyId ? { assemblyId } : {}),
      },
      select: { id: true, joinedAt: true },
    });
    if (!isGeneral && memberships.length === 0) {
      throw new ForbiddenException("Ce membre n'appartient pas à votre assemblée.");
    }

    const stats = await this.prisma.memberMonthlyStatistic.findMany({
      where: {
        membershipId: { in: memberships.map((membership) => membership.id) },
        ...(year ? { year } : {}),
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });

    return this.buildMemberFidelity(memberId, memberships, stats, year);
  }

  private buildMemberFidelity(
    memberId: string,
    memberships: FidelityMembership[],
    stats: MemberMonthlyStatistic[],
    year?: number,
  ) {
    const monthlyStats = new Map<string, { tithe: number; offering: number }>();
    for (const statistic of stats) {
      const key = `${statistic.year}-${statistic.month}`;
      const current = monthlyStats.get(key) ?? { tithe: 0, offering: 0 };
      current.tithe += Number(statistic.tithePaid);
      current.offering += Number(statistic.offeringPaid);
      monthlyStats.set(key, current);
    }

    const now = new Date();
    const expectedMonths = new Set<string>();
    for (const membership of memberships) {
      if (year && year > now.getFullYear()) continue;
      const start = year
        ? new Date(Math.max(membership.joinedAt.getTime(), new Date(year, 0, 1).getTime()))
        : membership.joinedAt;
      const end = year && year < now.getFullYear()
        ? new Date(year, 11, 1)
        : now;
      if (start > end) continue;

      const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
      while (cursor <= end) {
        expectedMonths.add(`${cursor.getFullYear()}-${cursor.getMonth() + 1}`);
        cursor.setMonth(cursor.getMonth() + 1);
      }
    }

    const monthsWithTithe = [...monthlyStats.entries()]
      .filter(([, amounts]) => amounts.tithe > 0)
      .map(([key, amounts]) => {
        const [statYear, month] = key.split('-').map(Number);
        return { month, year: statYear, amount: amounts.tithe };
      });
    const monthsWithOffering = [...monthlyStats.entries()]
      .filter(([, amounts]) => amounts.offering > 0)
      .map(([key, amounts]) => {
        const [statYear, month] = key.split('-').map(Number);
        return { month, year: statYear, amount: amounts.offering };
      });
    const monthsWithoutTithe = [...expectedMonths]
      .filter((key) => (monthlyStats.get(key)?.tithe ?? 0) <= 0)
      .map((key) => {
        const [statYear, month] = key.split('-').map(Number);
        return { month, year: statYear };
      });
    const monthsWithoutOffering = [...expectedMonths]
      .filter((key) => (monthlyStats.get(key)?.offering ?? 0) <= 0)
      .map((key) => {
        const [statYear, month] = key.split('-').map(Number);
        return { month, year: statYear };
      });

    const cumulatedTithes = [...monthlyStats.values()].reduce((sum, amounts) => sum + amounts.tithe, 0);
    const cumulatedOfferings = [...monthlyStats.values()].reduce((sum, amounts) => sum + amounts.offering, 0);
    const totalMonths = expectedMonths.size;
    const titheRate = totalMonths ? (monthsWithTithe.length / totalMonths) * 100 : 0;
    const offeringRate = totalMonths ? (monthsWithOffering.length / totalMonths) * 100 : 0;

    return {
      memberId,
      totalMonths,
      titheFidelity: {
        monthsWithTithe,
        monthsWithoutTithe,
        rate: titheRate,
        cumulated: cumulatedTithes,
      },
      offeringFidelity: {
        monthsWithOffering,
        monthsWithoutOffering,
        rate: offeringRate,
        cumulated: cumulatedOfferings,
      },
      summary: {
        totalCumulated: cumulatedTithes + cumulatedOfferings,
        globalFidelityRate: (titheRate + offeringRate) / 2,
      },
    };
  }
}
