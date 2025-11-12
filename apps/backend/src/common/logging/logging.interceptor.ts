import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggingInterceptor.name);

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const { method, url, user } = request;
    const userAgent = request.get("User-Agent") || "";
    const userId = user?.id || "anonymous";

    const now = Date.now();

    return next.handle().pipe(
      tap(() => {
        const response = context.switchToHttp().getResponse();
        const { statusCode } = response;
        const contentLength = response.get("Content-Length");

        this.logger.log(`Request completed`, {
          method,
          url,
          statusCode,
          contentLength,
          userAgent,
          userId,
          duration: `${Date.now() - now}ms`,
        });
      }),
    );
  }
}
