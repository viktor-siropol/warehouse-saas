import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { isUUID } from 'class-validator';

import { PrismaService } from '../../prisma/prisma.service.js';

import type { AuthenticatedRequest } from '../types/auth-request.type.js';

@Injectable()
export class OrganizationMembershipGuard implements CanActivate {
  constructor(private readonly prisma: PrismaService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (!request.user) {
      throw new UnauthorizedException('Authentication required');
    }

    const organizationId = request.params.organizationId;

    if (typeof organizationId !== 'string' || !isUUID(organizationId)) {
      throw new BadRequestException('organizationId must be a valid UUID');
    }

    const membership = await this.prisma.membership.findUnique({
      where: {
        userId_organizationId: {
          userId: request.user.id,
          organizationId,
        },
      },

      select: {
        id: true,
        userId: true,
        organizationId: true,
        role: true,
      },
    });

    if (!membership) {
      throw new ForbiddenException(
        'You do not have access to this organization',
      );
    }

    request.membership = membership;

    return true;
  }
}
