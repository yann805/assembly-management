import { IsString, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'admin@assembly.org', description: 'Email ou téléphone' })
  @IsString()
  identifier: string;

  @ApiProperty({ example: 'Admin@123' })
  @IsString()
  @MinLength(6)
  password: string;
}

export class ChangePasswordDto {
  @ApiProperty()
  @IsString()
  currentPassword: string;

  @ApiProperty()
  @IsString()
  @MinLength(6)
  newPassword: string;
}

export class CreateUserDto {
  @ApiProperty()
  @IsString()
  fullName: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  email?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  memberId?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  isActive?: boolean;
}

export class ResetCredentialsDto {
  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MinLength(6)
  newPassword?: string;

  @ApiPropertyOptional({ default: true })
  @IsOptional()
  isActive?: boolean;
}
