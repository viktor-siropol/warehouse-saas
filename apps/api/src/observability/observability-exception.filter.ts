import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Injectable,
  Logger,
} from "@nestjs/common";

import { HttpAdapterHost } from "@nestjs/core";

import type { RequestWithId } from "./request-with-id.type.js";

@Injectable()
@Catch()
export class ObservabilityExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger("HTTP");

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  catch(
    exception: unknown,

    host: ArgumentsHost,
  ): void {
    const http = host.switchToHttp();

    const request = http.getRequest<RequestWithId>();

    const response = http.getResponse();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const errorName =
      exception instanceof Error ? exception.name : "UnknownError";

    const event = {
      event:
        statusCode >= 500 ? "http_request_failed" : "http_request_rejected",

      requestId: request.requestId ?? null,

      method: request.method,

      path: request.path,

      statusCode,

      userId: request.user?.id ?? null,

      organizationId: request.params?.organizationId ?? null,

      errorName,
    };

    if (statusCode >= 500) {
      this.logger.error({
        ...event,

        stack:
          process.env.NODE_ENV === "production"
            ? undefined
            : exception instanceof Error
              ? exception.stack
              : undefined,
      });
    } else {
      this.logger.warn(event);
    }

    const body = this.buildResponseBody(exception, statusCode);

    this.httpAdapterHost.httpAdapter.reply(response, body, statusCode);
  }

  private buildResponseBody(
    exception: unknown,

    statusCode: number,
  ): unknown {
    if (exception instanceof HttpException) {
      const response = exception.getResponse();

      if (typeof response === "string") {
        return {
          statusCode,

          message: response,
        };
      }

      return response;
    }

    return {
      statusCode: HttpStatus.INTERNAL_SERVER_ERROR,

      message: "Internal server error",
    };
  }
}
