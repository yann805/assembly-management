import { IsString, IsNumber, IsOptional, Min, Max, IsInt } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GenerateReportDto {
  @ApiProperty({ description: 'ID de l\'assemblée' })
  @IsString()
  assemblyId: string;

  @ApiProperty({ description: 'Mois (1-12)', minimum: 1, maximum: 12 })
  @IsInt()
  @Min(1)
  @Max(12)
  month: number;

  @ApiProperty({ description: 'Année', example: 2024 })
  @IsInt()
  @Min(2020)
  year: number;
}

export class ReportQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assemblyId?: string;

  @ApiPropertyOptional({ enum: ['DRAFT', 'SUBMITTED', 'CONFIRMED'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsInt()
  year?: number;
}
