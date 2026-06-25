import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { requestContext } from '@/shared/context/request-context';

@Injectable()
export class RequestContextMiddleware implements NestMiddleware {
  use(_req: Request, _res: Response, next: NextFunction) {
    requestContext.run({}, () => {
      next();
    });
  }
}
