import { Controller, Get, Post, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ConfirmationsService } from './confirmations.service';
import { ConfirmReportDto } from './dto/confirmation.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Confirmations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('confirmations')
export class ConfirmationsController {
  constructor(private readonly confirmationsService: ConfirmationsService) {}

  @Get(':reportId')
  @ApiOperation({ summary: 'Récupérer la confirmation d\'un rapport' })
  findByReport(@Param('reportId') reportId: string) {
    return this.confirmationsService.findByReport(reportId);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY)
  @Post(':reportId')
  @ApiOperation({ summary: 'Confirmer la réception physique d\'un rapport (admin)' })
  confirm(
    @Param('reportId') reportId: string,
    @Body() dto: ConfirmReportDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.confirmationsService.confirm(reportId, dto, user);
  }
}
