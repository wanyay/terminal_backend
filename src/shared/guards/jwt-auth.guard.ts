import {
  Injectable,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { SKIP_MUST_CHANGE_PASSWORD_KEY } from '../decorators/skip-must-change-password.decorator';

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    return super.canActivate(context);
  }

  handleRequest<TUser = unknown>(
    err: Error | null,
    user: TUser | false,
    info: unknown,
    context: ExecutionContext,
  ): TUser {
    if (err || !user) {
      throw err || new UnauthorizedException('Invalid or expired token');
    }

    // Check if user is active
    const isActive = (user as any)?.isActive;
    if (isActive === false) {
      throw new UnauthorizedException(
        'Your account has been deactivated. Please contact an administrator.',
      );
    }

    // Check if user must change password
    const mustChangePassword = (user as any)?.mustChangePassword;
    if (mustChangePassword === true) {
      const skipCheck = this.reflector.getAllAndOverride<boolean>(
        SKIP_MUST_CHANGE_PASSWORD_KEY,
        [context.getHandler(), context.getClass()],
      );

      if (!skipCheck) {
        throw new UnauthorizedException(
          'You must change your password before accessing this resource. Please use the /auth/change-password endpoint.',
        );
      }
    }

    return user;
  }
}
