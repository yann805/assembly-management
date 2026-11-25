import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { AssembliesService } from './assemblies.service';
import { CreateAssemblyDto, UpdateAssemblyDto, AssignResponsibilityDto } from './dto/assembly.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Assemblées')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('assemblies')
export class AssembliesController {
  constructor(private readonly assembliesService: AssembliesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des assemblées' })
  findAll() {
    return this.assembliesService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une assemblée' })
  findOne(@Param('id') id: string) {
    return this.assembliesService.findOne(id);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY)
  @Post()
  @ApiOperation({ summary: 'Créer une assemblée (admin)' })
  create(@Body() dto: CreateAssemblyDto, @CurrentUser() user: AuthenticatedUser) {
    return this.assembliesService.create(dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY)
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier une assemblée (admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateAssemblyDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assembliesService.update(id, dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY)
  @Patch(':id/toggle-status')
  @ApiOperation({ summary: 'Activer / désactiver une assemblée' })
  toggleStatus(@Param('id') id: string) {
    return this.assembliesService.toggleStatus(id);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY)
  @Post(':id/responsibilities')
  @ApiOperation({ summary: 'Désigner un dirigeant ou un trésorier' })
  assignResponsibility(
    @Param('id') id: string,
    @Body() dto: AssignResponsibilityDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.assembliesService.assignResponsibility(id, dto, user);
  }
}
