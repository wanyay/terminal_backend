import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  IsOptional,
  IsArray,
  IsUUID,
} from 'class-validator';

export class CreateUserDto {
  @ApiProperty({ example: 'john_doe' })
  @IsString()
  @IsNotEmpty()
  username: string;

  @ApiProperty({ example: 'john@example.com', required: false })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: 'John Doe' })
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @ApiProperty({ example: ['USER'], required: false })
  @IsArray()
  @IsOptional()
  roles?: string[];

  @ApiPropertyOptional({ example: 'gate-id-1' })
  @IsUUID()
  @IsOptional()
  assignedGateId?: string;

  @ApiPropertyOptional({ example: ['gate-id-1', 'gate-id-2'] })
  @IsUUID('4', { each: true })
  @IsArray()
  @IsOptional()
  manageableGateIds?: string[];
}
