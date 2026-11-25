import { IsString, IsOptional, IsDateString, IsIn } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateAssemblyDto {
  @ApiProperty({ example: 'Assemblée Centrale' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ example: 'Abidjan, Côte d\'Ivoire' })
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional({ example: 'Assemblée principale' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  creationDate?: string;
}

export class UpdateAssemblyDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  location?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;
}

export class AssignResponsibilityDto {
  @ApiProperty({ description: 'ID de l\'appartenance (membership) du membre', example: 'uuid' })
  @IsString()
  membershipId: string;

  @ApiProperty({ enum: ['LEADER', 'TREASURER'], description: 'Type de responsabilité' })
  @IsIn(['LEADER', 'TREASURER'])
  responsibilityType: string;

  @ApiPropertyOptional({ description: 'ID du compte utilisateur à associer (trésorier)' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: 'Mot de passe temporaire du compte utilisateur' })
  @IsOptional()
  @IsString()
  temporaryPassword?: string;
}
