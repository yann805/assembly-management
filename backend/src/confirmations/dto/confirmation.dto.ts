import { IsString, IsNumber, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmReportDto {
  @ApiProperty({ description: 'Montant reçu physiquement (doit être égal au montant du rapport)' })
  @IsNumber()
  receivedAmount: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
