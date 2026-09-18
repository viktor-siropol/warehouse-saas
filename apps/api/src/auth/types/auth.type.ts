import type { MembershipRole } from '../../generated/prisma/client.js';

export type AccessTokenPayload = {
  sub: string;
  type: 'access';

  iat?: number;
  exp?: number;
  iss?: string;
  aud?: string | string[];
};

export type AuthenticatedUser = {
  id: string;
};

export type AuthMembership = {
  id: string;
  role: MembershipRole;

  organization: {
    id: string;
    name: string;
    slug: string;
  };
};

export type AuthUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  memberships: AuthMembership[];
};

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
  accessTokenExpiresInSeconds: number;
  refreshTokenExpiresInSeconds: number;
};

export type AuthResponse = {
  user: AuthUser;
  tokens: AuthTokens;
};
