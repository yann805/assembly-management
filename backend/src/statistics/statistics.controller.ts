import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Statistiques')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Tableau de bord (selon le rôle)' })
  @ApiQuery({ name: 'assemblyId', required: false })
  @ApiQuery({ name: 'month', required: false, type: Number })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getDashboard(
    @CurrentUser() user: AuthenticatedUser,
    @Query('assemblyId') assemblyId?: string,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    return this.statisticsService.getDashboard(user, {
      assemblyId,
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
    });
  }

  @Get('assembly-members')
  @ApiOperation({ summary: "Contributions et fidélité des membres de l'assemblée" })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getAssemblyMembers(
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
  ) {
    return this.statisticsService.getAssemblyMembers(user, year ? Number(year) : undefined);
  }

  @Get('members/:memberId/fidelity')
  @ApiOperation({ summary: 'Fidélité d\'un membre (dîmes + offrandes)' })
  @ApiQuery({ name: 'year', required: false, type: Number })
  getFidelity(
    @Param('memberId') memberId: string,
    @CurrentUser() user: AuthenticatedUser,
    @Query('year') year?: string,
  ) {
    return this.statisticsService.getMemberFidelity(memberId, user, year ? Number(year) : undefined);
  }
}
