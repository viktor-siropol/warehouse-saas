import type { Request } from 'express';

import type { MembershipRole } from '../../generated/prisma/client.js';

import type { AuthenticatedUser } from './auth.type.js';

export type RequestMembership = {
  id: string;
  userId: string;
  organizationId: string;
  role: MembershipRole;
};

export type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
  membership?: RequestMembership;
};
