import { IsString, IsDateString, IsNumber, IsArray, ValidateNested, Min, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class AllocationDto {
  @ApiProperty({ description: 'ID de la rubrique' })
  @IsString()
  categoryId: string;

  @ApiProperty({ example: 5000 })
  @IsNumber()
  @Min(0)
  amount: number;
}

export class CreateContributionDto {
  @ApiProperty({ description: 'ID de l\'appartenance du membre (membership)' })
  @IsString()
  membershipId: string;

  @ApiProperty({ example: '2024-11-03' })
  @IsDateString()
  paymentDate: string;

  @ApiProperty({ description: 'Montant de la dîme (FCFA)', example: 10000 })
  @IsNumber()
  @Min(0)
  titheAmount: number;

  @ApiProperty({ description: 'Montant total de l\'offrande (FCFA)', example: 15000 })
  @IsNumber()
  @Min(0)
  offeringAmount: number;

  @ApiPropertyOptional({ description: 'Répartition de l\'offrande entre les rubriques', type: [AllocationDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AllocationDto)
  allocations?: AllocationDto[];

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  note?: string;
}

export class ContributionQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  membershipId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assemblyId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ description: 'Mois (1-12)' })
  @IsOptional()
  month?: number;

  @ApiPropertyOptional({ description: 'Année (ex : 2024)' })
  @IsOptional()
  year?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 50 })
  @IsOptional()
  limit?: number;
}
