import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@/modules/users/users.service';
import { RegisterDto, LoginDto, ChangePasswordDto, TokensDto } from './dto';
import { User } from '@/modules/users/entities/user.entity';
import { Role } from '@/modules/roles/enums/role.enum';
import { AuditLogsService } from '@/modules/audit-logs/audit-logs.service';
import { AuditAction, AuditModule } from '@/modules/audit-logs/enums/audit.enum';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly auditLogsService: AuditLogsService,
  ) {}

  async register(registerDto: RegisterDto): Promise<TokensDto> {
    const existingUser = await this.usersService.findByUsername(
      registerDto.username,
    );
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    if (registerDto.email) {
      const existingEmail = await this.usersService.findByEmail(
        registerDto.email,
      );
      if (existingEmail) {
        throw new ConflictException('Email already exists');
      }
    }

    const user = await this.usersService.create({
      ...registerDto,
      roles: ['USER'],
    });

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    await this.auditLogsService.log({
      userId: user.id,
      username: user.username,
      action: AuditAction.CREATE,
      module: AuditModule.USERS,
    });

    return tokens;
  }

  async login(loginDto: LoginDto): Promise<TokensDto> {
    const user = await this.usersService.findByUsername(loginDto.username);
    if (!user) {
      await this.auditLogsService.log({
        username: loginDto.username,
        action: AuditAction.LOGIN_FAILED,
        module: AuditModule.AUTH,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await user.validatePassword(loginDto.password);
    if (!isPasswordValid) {
      await this.auditLogsService.log({
        userId: user.id,
        username: user.username,
        action: AuditAction.LOGIN_FAILED,
        module: AuditModule.AUTH,
      });
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      await this.auditLogsService.log({
        userId: user.id,
        username: user.username,
        action: AuditAction.LOGIN_FAILED,
        module: AuditModule.AUTH,
      });
      throw new UnauthorizedException('User account is inactive');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    await this.auditLogsService.log({
      userId: user.id,
      username: user.username,
      action: AuditAction.LOGIN,
      module: AuditModule.AUTH,
    });

    return tokens;
  }

  async changePassword(
    currentUserId: string,
    currentUserRoles: string[],
    changePasswordDto: ChangePasswordDto,
  ): Promise<{ message: string }> {
    const isAdminReset = !!changePasswordDto.targetUserId;

    if (isAdminReset) {
      const isAdmin =
        currentUserRoles.includes(Role.SUPER_ADMIN) ||
        currentUserRoles.includes(Role.SUPERVISOR);
      if (!isAdmin) {
        throw new ForbiddenException(
          'Only admins can reset another user password',
        );
      }
    }

    const targetUserId = isAdminReset
      ? changePasswordDto.targetUserId!
      : currentUserId;

    const user = await this.usersService.findOne(targetUserId);

    if (!isAdminReset) {
      const isCurrentPasswordValid = await user.validatePassword(
        changePasswordDto.currentPassword!,
      );
      if (!isCurrentPasswordValid) {
        throw new BadRequestException('Current password is incorrect');
      }

      if (changePasswordDto.currentPassword === changePasswordDto.newPassword) {
        throw new BadRequestException(
          'New password must be different from current password',
        );
      }
    }

    user.password = changePasswordDto.newPassword;
    user.mustChangePassword = changePasswordDto.mustChangePassword ?? false;
    await this.usersService.save(user);

    await this.auditLogsService.log({
      userId: user.id,
      username: user.username,
      action: AuditAction.CHANGE_PASSWORD,
      module: AuditModule.AUTH,
      newValues: { targetUserId: user.id },
    });

    return { message: 'Password changed successfully' };
  }

  async logout(userId: string): Promise<void> {
    const user = await this.usersService.findOne(userId);
    await this.usersService.updateRefreshToken(userId, null);

    await this.auditLogsService.log({
      userId,
      username: user?.username,
      action: AuditAction.LOGOUT,
      module: AuditModule.AUTH,
    });
  }

  async refreshTokens(
    userId: string,
    refreshToken: string,
  ): Promise<TokensDto> {
    const user = await this.usersService.findOne(userId);

    if (!user || !user.refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const tokens = await this.generateTokens(user);
    await this.usersService.updateRefreshToken(user.id, tokens.refreshToken);

    return tokens;
  }

  async getProfile(userId: string): Promise<User> {
    return this.usersService.findOne(userId);
  }

  private async generateTokens(user: User): Promise<TokensDto> {
    const payload = {
      sub: user.id,
      username: user.username,
      email: user.email,
      roles: user.roles.map((role) => role.name),
    };

    const accessSecret =
      this.configService.get<string>('jwt.accessSecret') || 'access_secret';
    const refreshSecret =
      this.configService.get<string>('jwt.refreshSecret') || 'refresh_secret';
    const accessExpiresIn =
      this.configService.get<number>('jwt.accessExpiresInSeconds') || 900;
    const refreshExpiresIn =
      this.configService.get<number>('jwt.refreshExpiresInSeconds') || 604800;

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessSecret,
        expiresIn: accessExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshSecret,
        expiresIn: refreshExpiresIn,
      }),
    ]);

    return {
      accessToken,
      refreshToken,
    };
  }
}
