import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '@/modules/users/users.service';
import { requestContext } from '@/shared/context/request-context';

export interface JwtPayload {
  sub: string;
  username: string;
  email: string | null;
  roles: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secretOrKey =
      configService.get<string>('jwt.accessSecret') || 'access_secret';
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey,
    });
  }

  async validate(payload: JwtPayload) {
    const user = await this.usersService.findOne(payload.sub);
    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Set user in request context for audit trail
    requestContext.setUser(payload.sub, payload.username);

    // Collect all permissions from user's roles
    const permissions = user.roles.flatMap((role) =>
      role.permissions.map((p) => p.name),
    );

    return {
      id: payload.sub,
      username: payload.username,
      email: payload.email,
      roles: payload.roles,
      permissions,
      mustChangePassword: user.mustChangePassword,
    };
  }
}
