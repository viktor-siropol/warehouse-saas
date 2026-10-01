import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { randomUUID } from 'node:crypto';

import { OutboxEventStatus, Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { OutboxEventProcessorService } from './outbox-event-processor.service.js';

type ClaimedOutboxEvent = {
  id: string;

  organizationId: string;

  eventType: string;

  aggregateType: string;

  aggregateId: string | null;

  payload: Prisma.JsonValue;

  attempts: number;
};

@Injectable()
export class OutboxWorkerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(OutboxWorkerService.name);

  private readonly workerId = randomUUID();

  private timer: NodeJS.Timeout | null = null;

  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,

    private readonly configService: ConfigService,

    private readonly processor: OutboxEventProcessorService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.isEnabled()) {
      this.logger.log('Outbox worker is disabled');

      return;
    }

    const intervalMs = this.getPositiveInteger(
      'OUTBOX_POLL_INTERVAL_MS',
      2_000,
    );

    this.logger.log(
      `Outbox worker ${this.workerId} started; polling every ${intervalMs} ms`,
    );

    void this.tick();

    this.timer = setInterval(() => {
      void this.tick();
    }, intervalMs);

    this.timer.unref();
  }

  onApplicationShutdown(): void {
    if (this.timer) {
      clearInterval(this.timer);

      this.timer = null;
    }
  }

  private async tick(): Promise<void> {
    if (this.isRunning) {
      return;
    }

    this.isRunning = true;

    try {
      const events = await this.claimBatch();

      for (const event of events) {
        await this.processEvent(event);
      }
    } catch (error) {
      this.logger.error(
        'Outbox polling iteration failed',

        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }

  private async claimBatch(): Promise<ClaimedOutboxEvent[]> {
    const batchSize = this.getPositiveInteger('OUTBOX_BATCH_SIZE', 20);

    const maxAttempts = this.getPositiveInteger('OUTBOX_MAX_ATTEMPTS', 5);

    const lockTimeoutMs = this.getPositiveInteger(
      'OUTBOX_LOCK_TIMEOUT_MS',
      60_000,
    );

    const staleBefore = new Date(Date.now() - lockTimeoutMs);

    return this.prisma.$queryRaw<ClaimedOutboxEvent[]>`
      WITH "candidate" AS (
        SELECT
          "id"

        FROM "OutboxEvent"

        WHERE
          (
            (
              "status" =
                'PENDING'::"OutboxEventStatus"

              AND "availableAt" <=
                NOW()
            )

            OR

            (
              "status" =
                'PROCESSING'::"OutboxEventStatus"

              AND "lockedAt" <=
                ${staleBefore}
            )
          )

          AND "attempts" <
            ${maxAttempts}

        ORDER BY
          "createdAt" ASC,
          "id" ASC

        FOR UPDATE
        SKIP LOCKED

        LIMIT
          ${batchSize}
      )

      UPDATE "OutboxEvent"
      SET
        "status" =
          'PROCESSING'::"OutboxEventStatus",

        "attempts" =
          "OutboxEvent"."attempts" + 1,

        "lockedAt" =
          NOW(),

        "lockedBy" =
          ${this.workerId},

        "updatedAt" =
          NOW()

      FROM "candidate"

      WHERE
        "OutboxEvent"."id" =
          "candidate"."id"

      RETURNING
        "OutboxEvent"."id",
        "OutboxEvent"."organizationId",
        "OutboxEvent"."eventType",
        "OutboxEvent"."aggregateType",
        "OutboxEvent"."aggregateId",
        "OutboxEvent"."payload",
        "OutboxEvent"."attempts"
    `;
  }

  private async processEvent(event: ClaimedOutboxEvent): Promise<void> {
    try {
      await this.processor.process(event);

      await this.prisma.outboxEvent.updateMany({
        where: {
          id: event.id,

          status: OutboxEventStatus.PROCESSING,

          lockedBy: this.workerId,
        },

        data: {
          status: OutboxEventStatus.PROCESSED,

          processedAt: new Date(),

          lockedAt: null,

          lockedBy: null,

          lastError: null,
        },
      });
    } catch (error) {
      await this.handleFailure(event, error);
    }
  }

  private async handleFailure(
    event: ClaimedOutboxEvent,

    error: unknown,
  ): Promise<void> {
    const maxAttempts = this.getPositiveInteger('OUTBOX_MAX_ATTEMPTS', 5);

    const message = error instanceof Error ? error.message : String(error);

    const deadLetter = event.attempts >= maxAttempts;

    const backoffMs = Math.min(
      60_000,

      1_000 * 2 ** Math.max(0, event.attempts - 1),
    );

    await this.prisma.outboxEvent.updateMany({
      where: {
        id: event.id,

        status: OutboxEventStatus.PROCESSING,

        lockedBy: this.workerId,
      },

      data: {
        status: deadLetter
          ? OutboxEventStatus.DEAD_LETTER
          : OutboxEventStatus.PENDING,

        availableAt: deadLetter ? new Date() : new Date(Date.now() + backoffMs),

        lockedAt: null,

        lockedBy: null,

        lastError: message.slice(0, 10_000),
      },
    });

    if (deadLetter) {
      this.logger.error(
        `Outbox event ${event.id} moved to DEAD_LETTER after ${event.attempts} attempts: ${message}`,
      );

      return;
    }

    this.logger.warn(
      `Outbox event ${event.id} failed on attempt ${event.attempts}; retry scheduled in ${backoffMs} ms: ${message}`,
    );
  }

  private isEnabled(): boolean {
    return (
      (
        this.configService.get<string>('OUTBOX_WORKER_ENABLED') ?? 'true'
      ).toLowerCase() === 'true'
    );
  }

  private getPositiveInteger(
    key: string,

    fallback: number,
  ): number {
    const rawValue = this.configService.get<string>(key);

    if (rawValue === undefined) {
      return fallback;
    }

    const parsed = Number(rawValue);

    if (!Number.isInteger(parsed) || parsed <= 0) {
      this.logger.warn(`${key}="${rawValue}" is invalid; using ${fallback}`);

      return fallback;
    }

    return parsed;
  }
}
