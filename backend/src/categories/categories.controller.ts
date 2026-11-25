import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './dto/category.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Rubriques')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des rubriques actives (toutes si ?includeInactive=true)' })
  @ApiQuery({ name: 'includeInactive', required: false, type: Boolean })
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.categoriesService.findAll(includeInactive === 'true');
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'une rubrique' })
  findOne(@Param('id') id: string) {
    return this.categoriesService.findOne(id);
  }

  @Get(':id/stats')
  @ApiOperation({ summary: 'Statistiques d\'une rubrique' })
  getStats(@Param('id') id: string) {
    return this.categoriesService.getStats(id);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY)
  @Post()
  @ApiOperation({ summary: 'Créer une rubrique (admin)' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.create(dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY)
  @Patch(':id')
  @ApiOperation({ summary: 'Modifier / renommer une rubrique (admin)' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateCategoryDto,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.categoriesService.update(id, dto, user);
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY)
  @Delete(':id')
  @ApiOperation({ summary: 'Désactiver ou supprimer une rubrique inutilisée (admin)' })
  remove(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.categoriesService.softDelete(id, user);
  }
}
