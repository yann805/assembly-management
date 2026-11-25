import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';
import { CreateUserDto, ResetCredentialsDto } from '../auth/dto/auth.dto';

@ApiTags('Utilisateurs')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RoleName.GENERAL_TREASURY)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des utilisateurs (admin)' })
  findAll() {
    return this.usersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Détail d\'un utilisateur' })
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Créer un compte utilisateur' })
  create(@Body() dto: CreateUserDto, @CurrentUser() user: AuthenticatedUser) {
    return this.usersService.create(dto, user.id);
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Activer / désactiver un compte' })
  toggleActive(@Param('id') id: string) {
    return this.usersService.toggleActive(id);
  }

  @Patch(':id/reset-credentials')
  @ApiOperation({ summary: 'Réinitialiser les identifiants d\'un compte' })
  resetCredentials(@Param('id') id: string, @Body() dto: ResetCredentialsDto) {
    return this.usersService.resetCredentials(id, dto);
  }
}
