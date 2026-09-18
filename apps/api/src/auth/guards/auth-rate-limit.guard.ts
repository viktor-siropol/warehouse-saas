import {
  CanActivate,
  ExecutionContext,
  HttpException,
  Injectable,
} from '@nestjs/common';

import { Reflector } from '@nestjs/core';

import type { Request, Response } from 'express';

import { createHash } from 'node:crypto';

import { RateLimiterMemory } from 'rate-limiter-flexible';

import {
  AUTH_RATE_LIMIT_KEY,
  type AuthRateLimitOptions,
} from '../decorators/auth-rate-limit.decorator.js';

type RateLimitRejection = {
  msBeforeNext: number;
};

function isRateLimitRejection(value: unknown): value is RateLimitRejection {
  if (typeof value !== 'object' || value === null) {
    return false;
  }

  if (!('msBeforeNext' in value)) {
    return false;
  }

  return typeof value.msBeforeNext === 'number';
}

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly limiters = new Map<string, RateLimiterMemory>();

  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const options = this.reflector.getAllAndOverride<AuthRateLimitOptions>(
      AUTH_RATE_LIMIT_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!options) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();

    const response = context.switchToHttp().getResponse<Response>();

    const limiter = this.getOrCreateLimiter(options);

    const clientKey = this.getClientKey(request, options);

    try {
      await limiter.consume(clientKey);

      return true;
    } catch (error) {
      const retryAfterMilliseconds = isRateLimitRejection(error)
        ? error.msBeforeNext
        : options.durationSeconds * 1000;

      const retryAfterSeconds = Math.max(
        1,
        Math.ceil(retryAfterMilliseconds / 1000),
      );

      response.setHeader('Retry-After', String(retryAfterSeconds));

      throw new HttpException(
        {
          statusCode: 429,
          message: 'Too many requests',
          error: 'Too Many Requests',
        },
        429,
      );
    }
  }

  private getOrCreateLimiter(options: AuthRateLimitOptions): RateLimiterMemory {
    const existingLimiter = this.limiters.get(options.name);

    if (existingLimiter) {
      return existingLimiter;
    }

    const limiter = new RateLimiterMemory({
      points: options.limit,
      duration: options.durationSeconds,
    });

    this.limiters.set(options.name, limiter);

    return limiter;
  }

  private getClientKey(
    request: Request,
    options: AuthRateLimitOptions,
  ): string {
    if (options.keyBy === 'email') {
      const email = this.getEmailFromBody(request);

      if (email) {
        return `email:${this.hashKey(email)}`;
      }
    }

    const ip = request.ip || request.socket.remoteAddress || 'unknown-client';

    return `ip:${ip}`;
  }

  private getEmailFromBody(request: Request): string | undefined {
    const body: unknown = request.body;

    if (typeof body !== 'object' || body === null || !('email' in body)) {
      return undefined;
    }

    const email = body.email;

    if (typeof email !== 'string') {
      return undefined;
    }

    const normalizedEmail = email.trim().toLowerCase();

    if (!normalizedEmail) {
      return undefined;
    }

    return normalizedEmail;
  }

  private hashKey(value: string): string {
    return createHash('sha256').update(value).digest('hex');
  }
}
