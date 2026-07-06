import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  MinLength,
  IsBoolean,
  IsOptional,
  IsUUID,
  ValidateIf,
} from 'class-validator';

export class ChangePasswordDto {
  @ApiPropertyOptional({ example: 'oldPassword123' })
  @ValidateIf((o) => !o.targetUserId)
  @IsString()
  @IsNotEmpty()
  currentPassword?: string;

  @ApiProperty({ example: 'newPassword456', minLength: 6 })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  newPassword: string;

  @ApiPropertyOptional({
    description:
      'ID of the target user. Required when an admin resets another user password. Omit when changing own password.',
    example: 'uuid-of-target-user',
  })
  @ValidateIf((o) => !o.currentPassword)
  @IsUUID('4')
  @IsNotEmpty()
  targetUserId?: string;

  @ApiPropertyOptional({
    description:
      'Whether the target user must change password on next login. Defaults to false.',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  mustChangePassword?: boolean;
}
