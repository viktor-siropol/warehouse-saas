import {
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { CurrentUser } from '../auth/decorators/current-user.decorator.js';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import type { AuthenticatedUser } from '../auth/types/auth.type.js';

import { NotificationQueryDto } from './dto/notification-query.dto.js';

import { NotificationsService } from './notifications.service.js';

@Controller('organizations/:organizationId/notifications')
@UseGuards(OrganizationMembershipGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  findMine(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @CurrentUser()
    user: AuthenticatedUser,

    @Query()
    query: NotificationQueryDto,
  ) {
    return this.notificationsService.findMine(organizationId, user.id, query);
  }

  @Post(':notificationId/read')
  markRead(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @Param('notificationId', ParseUUIDPipe)
    notificationId: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.notificationsService.markRead(
      organizationId,
      user.id,
      notificationId,
    );
  }

  @Post('read-all')
  markAllRead(
    @Param('organizationId', ParseUUIDPipe)
    organizationId: string,

    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.notificationsService.markAllRead(organizationId, user.id);
  }
}
