import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ConfirmReportDto } from './dto/confirmation.dto';
import { AUDIT_ACTIONS } from '../auth/enums/role.enum';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class ConfirmationsService {
  constructor(private prisma: PrismaService) {}

  async confirm(reportId: string, dto: ConfirmReportDto, user: AuthenticatedUser) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id: reportId },
      include: { confirmations: true, assembly: true },
    });
    if (!report) throw new NotFoundException('Rapport introuvable.');

    if (report.status !== 'SUBMITTED') {
      throw new BadRequestException(
        'Seul un rapport soumis peut être confirmé. Statut actuel : ' + report.status,
      );
    }

    // Vérifier qu'aucune confirmation n'existe déjà
    if (report.confirmations.length > 0) {
      throw new BadRequestException('Une confirmation existe déjà pour ce rapport.');
    }

    // Règle fondamentale : reported_amount = received_amount
    const reportedAmount = Number(report.totalAmount);
    if (Math.abs(dto.receivedAmount - reportedAmount) > 0.01) {
      throw new BadRequestException(
        `Le montant reçu (${dto.receivedAmount} FCFA) ne correspond pas au montant du rapport (${reportedAmount} FCFA). ` +
          'Le système ne gère pas les écarts de remise.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const confirmation = await tx.reportConfirmation.create({
        data: {
          reportId,
          confirmedBy: user.id,
          reportedAmount: new Prisma.Decimal(reportedAmount),
          receivedAmount: new Prisma.Decimal(dto.receivedAmount),
          notes: dto.notes,
        },
      });

      await tx.monthlyReport.update({
        where: { id: reportId },
        data: { status: 'CONFIRMED' },
      });

      await tx.auditLog.create({
        data: {
          userId: user.id,
          assemblyId: report.assemblyId,
          action: AUDIT_ACTIONS.REPORT_CONFIRM,
          entityType: 'ReportConfirmation',
          entityId: confirmation.id,
          newValues: confirmation as any,
        },
      });

      return tx.reportConfirmation.findUnique({
        where: { id: confirmation.id },
        include: { report: true, confirmer: { select: { id: true, fullName: true } } },
      });
    });
  }

  async findByReport(reportId: string) {
    return this.prisma.reportConfirmation.findUnique({
      where: { reportId },
      include: { confirmer: { select: { id: true, fullName: true } } },
    });
  }
}
