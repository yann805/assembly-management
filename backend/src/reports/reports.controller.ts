import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
  UseGuards,
  StreamableFile,
  Header,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import type { Response } from 'express';
import { ReportsService } from './reports.service';
import { GenerateReportDto, ReportQueryDto } from './dto/report.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Rapports')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des rapports' })
  findAll(@Query() query: ReportQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un rapport' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.findOne(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY, RoleName.ASSEMBLY_TREASURER)
  @Post('generate')
  @ApiOperation({ summary: 'Générer un rapport mensuel (brouillon)' })
  generate(@Body() dto: GenerateReportDto, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.generate(dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.ASSEMBLY_TREASURER)
  @Post(':id/submit')
  @ApiOperation({ summary: 'Soumettre un rapport' })
  submit(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.reportsService.submit(id, user);
  }

  @Get(':id/export/excel')
  @ApiOperation({ summary: 'Exporter un rapport en Excel' })
  async exportExcel(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { buffer, filename } = await this.reportsService.exportExcel(id, user);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return new StreamableFile(buffer);
  }

  @Get(':id/export/html')
  @ApiOperation({ summary: 'Exporter un rapport en HTML (pour impression PDF)' })
  async exportHtml(
    @Param('id') id: string,
    @CurrentUser() user: AuthenticatedUser,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { html, filename } = await this.reportsService.exportPdf(id, user);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return html;
  }
}
