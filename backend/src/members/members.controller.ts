import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { MembersService } from './members.service';
import { CreateMemberDto, UpdateMemberDto, MemberQueryDto } from './dto/member.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Membres')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('members')
export class MembersController {
  constructor(private readonly membersService: MembersService) {}

  @Get()
  @ApiOperation({ summary: 'Liste paginée des membres' })
  @ApiQuery({ name: 'search', required: false })
  @ApiQuery({ name: 'assemblyId', required: false })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'page', required: false })
  @ApiQuery({ name: 'limit', required: false })
  findAll(@Query() query: MemberQueryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.membersService.findAll(query, user);
  }

  @Get('reference-data')
  @ApiOperation({ summary: 'Données de référence (statuts, filières, niveaux)' })
  getReferenceData() {
    return this.membersService.getReferenceData();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fiche d\'un membre' })
  findOne(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.membersService.findOne(id, user);
  }

  @Get(':id/contributions')
  @ApiOperation({ summary: 'Historique des contributions d\'un membre' })
  getContributions(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.membersService.getMemberContributions(id, user);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY, RoleName.ASSEMBLY_TREASURER)
  @Post()
  @ApiOperation({ summary: 'Ajouter un membre' })
  create(@Body() dto: CreateMemberDto, @CurrentUser() user: AuthenticatedUser) {
    return this.membersService.create(dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY, RoleName.ASSEMBLY_TREASURER)
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier un membre' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMemberDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.membersService.update(id, dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY, RoleName.ASSEMBLY_TREASURER)
  @Patch(':id/deactivate')
  @ApiOperation({ summary: 'Désactiver un membre (conserve l\'historique)' })
  deactivate(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.membersService.deactivate(id, user);
  }
}
