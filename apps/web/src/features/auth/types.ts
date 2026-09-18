export type MembershipRole = "OWNER" | "ADMIN" | "MANAGER" | "WORKER";

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

export type AuthActionState = {
  error: string | null;
};
