import { Injectable } from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import {
  DataJobStatus,
  OutboxEventStatus,
} from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class OperationsService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly configService: ConfigService,
  ) {}

  async getHealth(organizationId: string) {
    const now = Date.now();

    const outboxLockTimeoutMs = this.getPositiveInteger(
      'OUTBOX_LOCK_TIMEOUT_MS',
      60_000,
    );

    const dataJobsLockTimeoutMs = this.getPositiveInteger(
      'DATA_JOBS_LOCK_TIMEOUT_MS',
      300_000,
    );

    const pendingWarnSeconds = this.getPositiveInteger(
      'OPERATIONS_PENDING_WARN_SECONDS',
      60,
    );

    const [
      outboxGroups,
      dataJobGroups,

      oldestPendingOutbox,
      oldestPendingDataJob,

      staleOutboxProcessing,
      staleDataJobProcessing,
    ] = await Promise.all([
      this.prisma.outboxEvent.groupBy({
        by: ['status'],

        where: {
          organizationId,
        },

        _count: {
          _all: true,
        },
      }),

      this.prisma.dataJob.groupBy({
        by: ['status'],

        where: {
          organizationId,
        },

        _count: {
          _all: true,
        },
      }),

      this.prisma.outboxEvent.findFirst({
        where: {
          organizationId,

          status: OutboxEventStatus.PENDING,
        },

        select: {
          createdAt: true,
        },

        orderBy: {
          createdAt: 'asc',
        },
      }),

      this.prisma.dataJob.findFirst({
        where: {
          organizationId,

          status: DataJobStatus.PENDING,
        },

        select: {
          createdAt: true,
        },

        orderBy: {
          createdAt: 'asc',
        },
      }),

      this.prisma.outboxEvent.count({
        where: {
          organizationId,

          status: OutboxEventStatus.PROCESSING,

          lockedAt: {
            lt: new Date(now - outboxLockTimeoutMs),
          },
        },
      }),

      this.prisma.dataJob.count({
        where: {
          organizationId,

          status: DataJobStatus.PROCESSING,

          lockedAt: {
            lt: new Date(now - dataJobsLockTimeoutMs),
          },
        },
      }),
    ]);

    const outbox = {
      PENDING: 0,

      PROCESSING: 0,

      PROCESSED: 0,

      DEAD_LETTER: 0,
    };

    for (const group of outboxGroups) {
      outbox[group.status] = group._count._all;
    }

    const dataJobs = {
      PENDING: 0,

      PROCESSING: 0,

      SUCCEEDED: 0,

      PARTIALLY_SUCCEEDED: 0,

      FAILED: 0,
    };

    for (const group of dataJobGroups) {
      dataJobs[group.status] = group._count._all;
    }

    const oldestPendingOutboxAgeSeconds = oldestPendingOutbox
      ? Math.max(
          0,

          Math.floor((now - oldestPendingOutbox.createdAt.getTime()) / 1_000),
        )
      : null;

    const oldestPendingDataJobAgeSeconds = oldestPendingDataJob
      ? Math.max(
          0,

          Math.floor((now - oldestPendingDataJob.createdAt.getTime()) / 1_000),
        )
      : null;

    const warnings: string[] = [];

    if (outbox.DEAD_LETTER > 0) {
      warnings.push('OUTBOX_DEAD_LETTER_PRESENT');
    }

    if (staleOutboxProcessing > 0) {
      warnings.push('OUTBOX_STALE_PROCESSING');
    }

    if (staleDataJobProcessing > 0) {
      warnings.push('DATA_JOB_STALE_PROCESSING');
    }

    if (
      oldestPendingOutboxAgeSeconds !== null &&
      oldestPendingOutboxAgeSeconds > pendingWarnSeconds
    ) {
      warnings.push('OUTBOX_PENDING_TOO_LONG');
    }

    if (
      oldestPendingDataJobAgeSeconds !== null &&
      oldestPendingDataJobAgeSeconds > pendingWarnSeconds
    ) {
      warnings.push('DATA_JOB_PENDING_TOO_LONG');
    }

    return {
      status: warnings.length === 0 ? 'ok' : 'degraded',

      generatedAt: new Date(now).toISOString(),

      warnings,

      outbox: {
        counts: outbox,

        staleProcessing: staleOutboxProcessing,

        oldestPendingAgeSeconds: oldestPendingOutboxAgeSeconds,
      },

      dataJobs: {
        counts: dataJobs,

        staleProcessing: staleDataJobProcessing,

        oldestPendingAgeSeconds: oldestPendingDataJobAgeSeconds,
      },
    };
  }

  private getPositiveInteger(
    key: string,

    fallback: number,
  ): number {
    const raw = this.configService.get<string>(key);

    if (raw === undefined) {
      return fallback;
    }

    const parsed = Number(raw);

    return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
  }
}
