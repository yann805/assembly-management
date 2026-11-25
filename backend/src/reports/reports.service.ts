import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import * as ExcelJS from 'exceljs';
import { PrismaService } from '../prisma/prisma.service';
import { GenerateReportDto, ReportQueryDto } from './dto/report.dto';
import { RoleName, AUDIT_ACTIONS } from '../auth/enums/role.enum';
import { AuthenticatedUser } from '../common/decorators/current-user.decorator';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async generate(dto: GenerateReportDto, user: AuthenticatedUser) {
    // Vérifier le scope
    await this.checkScope(dto.assemblyId, user);

    const assembly = await this.prisma.assembly.findUnique({ where: { id: dto.assemblyId } });
    if (!assembly) throw new NotFoundException('Assemblée introuvable.');

    // Vérifier qu'aucun rapport final n'existe déjà
    const existing = await this.prisma.monthlyReport.findFirst({
      where: {
        assemblyId: dto.assemblyId,
        month: dto.month,
        year: dto.year,
        status: { in: ['SUBMITTED', 'CONFIRMED'] },
      },
    });
    if (existing) {
      throw new BadRequestException('Un rapport final existe déjà pour cette période.');
    }

    // Calculer les totaux à partir des contributions
    const start = new Date(dto.year, dto.month - 1, 1);
    const end = new Date(dto.year, dto.month, 0, 23, 59, 59);

    const contributions = await this.prisma.contribution.findMany({
      where: { assemblyId: dto.assemblyId, paymentDate: { gte: start, lte: end } },
      include: { allocations: { include: { category: true } }, membership: true },
    });

    const totalTithes = contributions.reduce((s, c) => s + Number(c.titheAmount), 0);
    const totalOfferings = contributions.reduce((s, c) => s + Number(c.offeringAmount), 0);
    const totalAmount = contributions.reduce((s, c) => s + Number(c.totalAmount), 0);

    const totalMembers = await this.prisma.assemblyMembership.count({
      where: { assemblyId: dto.assemblyId, status: 'ACTIVE' },
    });
    const contributingMembers = new Set(contributions.map((c) => c.membership.memberId)).size;

    // Totaux par rubrique
    const categoryMap: Record<string, { categoryId: string; name: string; amount: number }> = {};
    for (const c of contributions) {
      for (const a of c.allocations) {
        if (!categoryMap[a.categoryId]) {
          categoryMap[a.categoryId] = { categoryId: a.categoryId, name: a.category.name, amount: 0 };
        }
        categoryMap[a.categoryId].amount += Number(a.amount);
      }
    }

    // Supprimer les anciens brouillons pour cette période
    await this.prisma.monthlyReport.deleteMany({
      where: { assemblyId: dto.assemblyId, month: dto.month, year: dto.year, status: 'DRAFT' },
    });

    // Créer le rapport en brouillon
    return this.prisma.$transaction(async (tx) => {
      const report = await tx.monthlyReport.create({
        data: {
          assemblyId: dto.assemblyId,
          month: dto.month,
          year: dto.year,
          totalTithes: new Prisma.Decimal(totalTithes),
          totalOfferings: new Prisma.Decimal(totalOfferings),
          totalAmount: new Prisma.Decimal(totalAmount),
          totalMembers,
          contributingMembers,
          submittedBy: user.id,
          status: 'DRAFT',
        },
      });

      // Instantané des totaux par rubrique
      if (Object.keys(categoryMap).length > 0) {
        await tx.monthlyReportCategoryTotal.createMany({
          data: Object.values(categoryMap).map((v) => ({
            reportId: report.id,
            categoryId: v.categoryId,
            categoryNameSnapshot: v.name,
            totalAmount: new Prisma.Decimal(v.amount),
          })),
        });
      }

      return tx.monthlyReport.findUnique({
        where: { id: report.id },
        include: {
          assembly: true,
          categoryTotals: { include: { category: true } },
          submitter: { select: { id: true, fullName: true } },
        },
      });
    });
  }

  async submit(id: string, user: AuthenticatedUser) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id },
      include: { assembly: true },
    });
    if (!report) throw new NotFoundException('Rapport introuvable.');
    await this.checkScope(report.assemblyId, user);

    if (report.status !== 'DRAFT') {
      throw new BadRequestException('Seul un brouillon peut être soumis.');
    }

    const updated = await this.prisma.monthlyReport.update({
      where: { id },
      data: {
        status: 'SUBMITTED',
        submittedAt: new Date(),
      },
      include: {
        assembly: true,
        categoryTotals: true,
        submitter: { select: { id: true, fullName: true } },
      },
    });

    await this.prisma.auditLog.create({
      data: {
        userId: user.id,
        assemblyId: report.assemblyId,
        action: AUDIT_ACTIONS.REPORT_SUBMIT,
        entityType: 'MonthlyReport',
        entityId: id,
        newValues: { status: 'SUBMITTED' } as any,
      },
    });

    return updated;
  }

  async findAll(query: ReportQueryDto, user: AuthenticatedUser) {
    const where: any = {};
    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    if (!isGeneral) {
      const userAssemblyIds = user.roles.filter((r) => r.assemblyId).map((r) => r.assemblyId);
      if (userAssemblyIds.length === 0) return [];
      where.assemblyId = { in: userAssemblyIds };
    } else if (query.assemblyId) {
      where.assemblyId = query.assemblyId;
    }
    if (query.status) where.status = query.status;
    if (query.year) where.year = query.year;

    return this.prisma.monthlyReport.findMany({
      where,
      include: {
        assembly: true,
        submitter: { select: { id: true, fullName: true } },
        confirmations: { include: { confirmer: { select: { fullName: true } } } },
        _count: { select: { categoryTotals: true } },
      },
      orderBy: [{ year: 'desc' }, { month: 'desc' }],
    });
  }

  async findOne(id: string, user: AuthenticatedUser) {
    const report = await this.prisma.monthlyReport.findUnique({
      where: { id },
      include: {
        assembly: true,
        categoryTotals: { include: { category: true } },
        submitter: { select: { id: true, fullName: true } },
        confirmations: { include: { confirmer: { select: { id: true, fullName: true } } } },
      },
    });
    if (!report) throw new NotFoundException('Rapport introuvable.');
    await this.checkScope(report.assemblyId, user);
    return report;
  }

  async exportExcel(id: string, user: AuthenticatedUser) {
    const report = await this.findOne(id, user);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Assembly Management';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Rapport Mensuel');

    // En-tête
    sheet.mergeCells('A1:D1');
    sheet.getCell('A1').value = 'RAPPORT FINANCIER MENSUEL';
    sheet.getCell('A1').font = { size: 16, bold: true };
    sheet.getCell('A1').alignment = { horizontal: 'center' };

    sheet.addRow([]);
    sheet.addRow(['Assemblée', report.assembly.name]);
    sheet.addRow(['Localisation', report.assembly.location || '—']);
    sheet.addRow(['Mois / Année', `${report.month} / ${report.year}`]);
    sheet.addRow(['Trésorier', report.submitter?.fullName || '—']);
    sheet.addRow(['Date de génération', new Date().toLocaleString('fr-FR')]);
    sheet.addRow(['Statut', report.status]);
    sheet.addRow([]);

    // Section Membres
    sheet.addRow(['INFORMATIONS GÉNÉRALES']);
    sheet.getCell(`A${sheet.rowCount}`).font = { bold: true, size: 12 };
    sheet.addRow(['Nombre total de membres', report.totalMembers]);
    sheet.addRow(['Membres ayant contribué', report.contributingMembers]);
    sheet.addRow([]);

    // Section Dîmes et Offrandes
    sheet.addRow(['SYNTHÈSE FINANCIÈRE']);
    sheet.getCell(`A${sheet.rowCount}`).font = { bold: true, size: 12 };
    sheet.addRow(['Total des dîmes (FCFA)', Number(report.totalTithes)]);
    sheet.addRow(['Total des offrandes (FCFA)', Number(report.totalOfferings)]);
    sheet.addRow(['TOTAL GÉNÉRAL (FCFA)', Number(report.totalAmount)]);
    sheet.addRow([]);

    // Répartition par rubrique
    sheet.addRow(['RÉPARTITION DES OFFRANDES']);
    sheet.getCell(`A${sheet.rowCount}`).font = { bold: true, size: 12 };
    sheet.addRow(['Rubrique', 'Montant (FCFA)']);
    const headerRow = sheet.getRow(sheet.rowCount);
    headerRow.font = { bold: true };
    for (const ct of report.categoryTotals) {
      sheet.addRow([ct.categoryNameSnapshot, Number(ct.totalAmount)]);
    }

    // Largeurs
    sheet.getColumn(1).width = 35;
    sheet.getColumn(2).width = 25;

    const buffer = await workbook.xlsx.writeBuffer();
    return {
      buffer: Buffer.from(buffer),
      filename: `rapport_${report.assembly.name}_${report.month}_${report.year}.xlsx`.replace(/\s+/g, '_'),
    };
  }

  async exportPdf(id: string, user: AuthenticatedUser) {
    const report = await this.findOne(id, user);
    // Génération HTML simple — sera converti en PDF par le frontend ou un outil externe
    const html = this.buildReportHtml(report);
    return {
      html,
      filename: `rapport_${report.assembly.name}_${report.month}_${report.year}.html`.replace(/\s+/g, '_'),
    };
  }

  private buildReportHtml(report: any): string {
    const categoryRows = report.categoryTotals
      .map(
        (ct: any) =>
          `<tr><td>${ct.categoryNameSnapshot}</td><td style="text-align:right">${Number(
            ct.totalAmount,
          ).toLocaleString('fr-FR')} FCFA</td></tr>`,
      )
      .join('');

    return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="utf-8">
<title>Rapport ${report.assembly.name} - ${report.month}/${report.year}</title>
<style>
  body { font-family: Arial, sans-serif; padding: 40px; color: #1a1a1a; }
  h1 { color: #1e40af; border-bottom: 3px solid #1e40af; padding-bottom: 10px; }
  h2 { color: #1e3a8a; margin-top: 30px; }
  table { width: 100%; border-collapse: collapse; margin-top: 10px; }
  th, td { padding: 10px; border: 1px solid #ddd; }
  th { background: #f1f5f9; text-align: left; }
  .total { font-weight: bold; background: #e0e7ff; }
  .header { display: flex; justify-content: space-between; }
</style>
</head>
<body>
  <div class="header">
    <div>
      <h1>Rapport Financier Mensuel</h1>
      <p><strong>Assemblée :</strong> ${report.assembly.name}<br>
      <strong>Localisation :</strong> ${report.assembly.location || '—'}<br>
      <strong>Période :</strong> ${report.month} / ${report.year}</p>
    </div>
    <div style="text-align:right">
      <p><strong>Trésorier :</strong> ${report.submitter?.fullName || '—'}<br>
      <strong>Date :</strong> ${new Date().toLocaleDateString('fr-FR')}<br>
      <strong>Statut :</strong> ${report.status}</p>
    </div>
  </div>

  <h2>Informations générales</h2>
  <table>
    <tr><td>Nombre total de membres</td><td>${report.totalMembers}</td></tr>
    <tr><td>Membres ayant contribué</td><td>${report.contributingMembers}</td></tr>
  </table>

  <h2>Synthèse financière</h2>
  <table>
    <tr><td>Total des dîmes</td><td style="text-align:right">${Number(report.totalTithes).toLocaleString('fr-FR')} FCFA</td></tr>
    <tr><td>Total des offrandes</td><td style="text-align:right">${Number(report.totalOfferings).toLocaleString('fr-FR')} FCFA</td></tr>
    <tr class="total"><td>TOTAL GÉNÉRAL</td><td style="text-align:right">${Number(report.totalAmount).toLocaleString('fr-FR')} FCFA</td></tr>
  </table>

  <h2>Répartition des offrandes</h2>
  <table>
    <tr><th>Rubrique</th><th style="text-align:right">Montant</th></tr>
    ${categoryRows}
  </table>
</body>
</html>`;
  }

  private async checkScope(assemblyId: string, user: AuthenticatedUser) {
    const isGeneral = user.roles.some((r) => r.name === RoleName.GENERAL_TREASURY);
    if (isGeneral) return;
    const userAssemblyIds = user.roles.filter((r) => r.assemblyId).map((r) => r.assemblyId);
    if (!userAssemblyIds.includes(assemblyId)) {
      throw new ForbiddenException('Vous n\'avez pas accès à cette assemblée.');
    }
  }
}
