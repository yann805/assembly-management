import { Controller, Get, Post, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ContributionsService } from './contributions.service';
import { CreateContributionDto, ContributionQueryDto } from './dto/contribution.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Contributions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('contributions')
export class ContributionsController {
  constructor(private readonly contributionsService: ContributionsService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des contributions (filtrée par scope)' })
  findAll(@Query() query: ContributionQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.contributionsService.findAll(query, user);
  }

  @Get('monthly-totals/:assemblyId')
  @ApiOperation({ summary: 'Totaux mensuels d\'une assemblée' })
  @ApiQuery({ name: 'month', required: true, type: Number })
  @ApiQuery({ name: 'year', required: true, type: Number })
  getMonthlyTotals(
    @Param('assemblyId') assemblyId: string,
    @Query('month') month: number,
    @Query('year') year: number,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.contributionsService.getMonthlyTotals(assemblyId, Number(month), Number(year), user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une contribution' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.contributionsService.findOne(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY, RoleName.ASSEMBLY_TREASURER)
  @Post()
  @ApiOperation({ summary: 'Enregistrer une contribution' })
  create(@Body() dto: CreateContributionDto, @CurrentUser() user: AuthenticatedUser) {
    return this.contributionsService.create(dto, user);
  }
}
