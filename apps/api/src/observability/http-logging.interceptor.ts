import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from "@nestjs/common";

import { ConfigService } from "@nestjs/config";

import type { Response } from "express";

import { Observable, tap } from "rxjs";

import type { RequestWithId } from "./request-with-id.type.js";

@Injectable()
export class HttpLoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger("HTTP");

  constructor(private readonly configService: ConfigService) {}

  intercept(
    context: ExecutionContext,

    next: CallHandler,
  ): Observable<unknown> {
    if (context.getType() !== "http") {
      return next.handle();
    }

    const http = context.switchToHttp();

    const request = http.getRequest<RequestWithId>();

    const response = http.getResponse<Response>();

    const startedAt = process.hrtime.bigint();

    return next.handle().pipe(
      tap({
        next: () => {
          const elapsedNanoseconds = process.hrtime.bigint() - startedAt;

          const durationMs = Number(elapsedNanoseconds) / 1_000_000;

          const roundedDurationMs = Math.round(durationMs * 100) / 100;

          const event = {
            event: "http_request_completed",

            requestId: request.requestId ?? null,

            method: request.method,

            path: request.path,

            statusCode: response.statusCode,

            durationMs: roundedDurationMs,

            userId: request.user?.id ?? null,

            organizationId: request.params?.organizationId ?? null,
          };

          if (request.path.startsWith("/health/")) {
            this.logger.debug(event);

            return;
          }

          if (roundedDurationMs >= this.getSlowRequestThresholdMs()) {
            this.logger.warn({
              ...event,

              event: "http_request_slow",
            });

            return;
          }

          this.logger.log(event);
        },
      }),
    );
  }

  private getSlowRequestThresholdMs(): number {
    const raw = this.configService.get<string>("SLOW_REQUEST_MS");

    if (raw === undefined) {
      return 1_000;
    }

    const parsed = Number(raw);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : 1_000;
  }
}
