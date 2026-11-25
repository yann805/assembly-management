import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { MembershipsService } from './memberships.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser, AuthenticatedUser } from '../common/decorators/current-user.decorator';

@ApiTags('Appartenances')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('memberships')
export class MembershipsController {
  constructor(private readonly membershipsService: MembershipsService) {}

  @Get('assembly/:assemblyId')
  @ApiOperation({ summary: 'Membres d\'une assemblée' })
  findByAssembly(@Param('assemblyId') assemblyId: string, @CurrentUser() user: AuthenticatedUser) {
    return this.membershipsService.findByAssembly(assemblyId, user);
  }
}
