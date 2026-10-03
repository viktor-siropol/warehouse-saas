import { Module } from "@nestjs/common";

import { APP_FILTER, APP_INTERCEPTOR } from "@nestjs/core";

import { HttpLoggingInterceptor } from "./http-logging.interceptor.js";

import { ObservabilityExceptionFilter } from "./observability-exception.filter.js";

@Module({
  providers: [
    {
      provide: APP_INTERCEPTOR,

      useClass: HttpLoggingInterceptor,
    },

    {
      provide: APP_FILTER,

      useClass: ObservabilityExceptionFilter,
    },
  ],
})
export class ObservabilityModule {}
