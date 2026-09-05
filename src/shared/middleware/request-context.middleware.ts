import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { requestContext } from '@/shared/context/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    requestContext.run({}, () => {
      const ipAddress =
        req.ip ||
        req.headers['x-forwarded-for']?.toString().split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        undefined;

      const userAgent = req.headers['user-agent']?.toString() || undefined;

      requestContext.setRequestMeta(ipAddress, userAgent);
      next();
    });
  }
}
