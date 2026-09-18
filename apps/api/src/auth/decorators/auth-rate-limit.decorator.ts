import { SetMetadata } from '@nestjs/common';

export const AUTH_RATE_LIMIT_KEY = 'authRateLimit';

export type AuthRateLimitKey = 'email' | 'ip';

export type AuthRateLimitOptions = {
  name: string;
  limit: number;
  durationSeconds: number;
  keyBy: AuthRateLimitKey;
};

export const AuthRateLimit = (options: AuthRateLimitOptions) =>
  SetMetadata(AUTH_RATE_LIMIT_KEY, options);
