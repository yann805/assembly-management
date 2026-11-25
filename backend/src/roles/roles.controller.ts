import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { RolesService } from './roles.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';

@ApiTags('Rôles')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('roles')
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  @Get()
  @ApiOperation({ summary: 'Liste des rôles disponibles' })
  findAll() {
    return this.rolesService.findAll();
  }

  @UseGuards(RolesGuard)
  @Roles(RoleName.GENERAL_TREASURY)
  @Get('assignments')
  @ApiOperation({ summary: 'Liste des attributions de rôles (admin)' })
  findAssignments() {
    return this.rolesService.findAssignments();
  }
}
