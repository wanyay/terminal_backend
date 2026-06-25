import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { instanceToPlain } from 'class-transformer';
import { PaginatedResult } from '../interfaces/paginated-result.interface';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
  };
  timestamp: string;
}

@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<
  T,
  ApiResponse<T>
> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const response = context.switchToHttp().getResponse();

    return next.handle().pipe(
      map((data) => {
        // Handle paginated responses
        if (isPaginatedResult(data)) {
          return {
            success: true,
            message: 'Data retrieved successfully',
            data: instanceToPlain(data.data) as T,
            meta: data.meta,
            timestamp: new Date().toISOString(),
          };
        }

        // Handle message-only responses (e.g., { message: '...' })
        if (data && typeof data === 'object' && 'message' in data) {
          return {
            success: true,
            message: data.message,
            data: instanceToPlain(data.data ?? null) as T,
            timestamp: new Date().toISOString(),
          };
        }

        // Default response
        return {
          success: true,
          message: 'Success',
          data: instanceToPlain(data) as T,
          timestamp: new Date().toISOString(),
        };
      }),
    );
  }
}

function isPaginatedResult(value: unknown): value is PaginatedResult<unknown> {
  return (
    value !== null &&
    typeof value === 'object' &&
    'data' in value &&
    'meta' in value &&
    Array.isArray((value as PaginatedResult<unknown>).data)
  );
}
