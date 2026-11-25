import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { AuditService } from './audit.service';
import { Roles } from '../common/decorators/roles.decorator';
import { RoleName } from '../auth/enums/role.enum';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Audit')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('audit')
export class AuditController {
  constructor(private readonly auditService: AuditService) {}

  @Get()
  @ApiOperation({ summary: 'Journal d\'audit (filtré par scope)' })
  @ApiQuery({ name: 'action', required: false })
  @ApiQuery({ name: 'assemblyId', required: false })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  findAll(
    @CurrentUser() user: AuthenticatedUser,
    @Query('action') action?: string,
    @Query('assemblyId') assemblyId?: string,
    @Query('userId') userId?: string,
    @Query('limit') limit?: string,
  ) {
    return this.auditService.findAll(user, {
      action,
      assemblyId,
      userId,
      limit: limit ? Number(limit) : undefined,
    });
  }
}
