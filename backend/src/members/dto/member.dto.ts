import {
  IsString,
  IsOptional,
  IsDateString,
  IsIn,
  IsBoolean,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';

export class ContactDto {
  @ApiProperty()
  @IsString()
  contactValue: string;

  @ApiProperty({ enum: ['PHONE', 'EMAIL', 'ADDRESS'] })
  @IsIn(['PHONE', 'EMAIL', 'ADDRESS'])
  contactType: string;

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isPrimary?: boolean;
}

export class CreateMemberDto {
  @ApiProperty({ example: 'Jean Kouassi' })
  @IsString()
  fullName: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  @IsOptional()
  @IsIn(['M', 'F'])
  gender?: string;

  @ApiPropertyOptional({ example: '1990-05-12' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional({ description: 'Date de conversion' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsDateString()
  conversionDate?: string;

  @ApiPropertyOptional({ description: 'Date de baptême d\'eau' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsDateString()
  waterBaptismDate?: string;

  @ApiPropertyOptional({ description: 'Date de baptême du Saint-Esprit' })
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsDateString()
  holySpiritBaptismDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maritalStatusId?: string;

  @ApiPropertyOptional({ description: 'Nom de la filière (créée automatiquement si nouvelle)' })
  @IsOptional()
  @IsString()
  filiere?: string;

  @ApiPropertyOptional({ description: 'ID d’une filière existante (compatibilité API)' })
  @IsOptional()
  @IsString()
  filiereId?: string;

  @ApiPropertyOptional({ description: 'Nom du niveau (créé automatiquement si nouveau)' })
  @IsOptional()
  @IsString()
  level?: string;

  @ApiPropertyOptional({ description: 'ID d’un niveau existant (compatibilité API)' })
  @IsOptional()
  @IsString()
  levelId?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsString()
  profession?: string;

  @ApiPropertyOptional({ example: '2024-01-15' })
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @ApiPropertyOptional({ description: 'ID de l\'assemblée (admin) — sinon prend l\'assemblée du trésorier' })
  @IsOptional()
  @IsString()
  assemblyId?: string;

  @ApiPropertyOptional({ type: [ContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  contacts?: ContactDto[];
}

export class UpdateMemberDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  fullName?: string;

  @ApiPropertyOptional({ enum: ['M', 'F'] })
  @IsOptional()
  @IsIn(['M', 'F'])
  gender?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsDateString()
  conversionDate?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsDateString()
  waterBaptismDate?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsDateString()
  holySpiritBaptismDate?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  maritalStatusId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  filiereId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  levelId?: string;

  @ApiPropertyOptional()
  @Transform(({ value }) => value === '' ? undefined : value)
  @IsOptional()
  @IsString()
  profession?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsDateString()
  arrivalDate?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;

  @ApiPropertyOptional({ type: [ContactDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ContactDto)
  contacts?: ContactDto[];
}

export class MemberQueryDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  assemblyId?: string;

  @ApiPropertyOptional({ enum: ['ACTIVE', 'INACTIVE'] })
  @IsOptional()
  @IsIn(['ACTIVE', 'INACTIVE'])
  status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ default: 20 })
  @IsOptional()
  limit?: number;
}
