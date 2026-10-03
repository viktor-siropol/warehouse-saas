import {
  Injectable,
  Logger,
  OnApplicationBootstrap,
  OnApplicationShutdown,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { randomUUID } from 'node:crypto';

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  createAuditLogData,
} from '../audit/audit-log.js';

import { DataJobStatus } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import { PermanentDataJobError } from './data-job.errors.js';

import {
  ClaimedDataJob,
  DataJobProcessorService,
} from './data-job-processor.service.js';

@Injectable()
export class DataJobsWorkerService
  implements OnApplicationBootstrap, OnApplicationShutdown
{
  private readonly logger = new Logger(DataJobsWorkerService.name);

  private readonly workerId = randomUUID();

  private timer: NodeJS.Timeout | null = null;

  private isRunning = false;

  constructor(
    private readonly prisma: PrismaService,

    private readonly configService: ConfigService,

    private readonly processor: DataJobProcessorService,
  ) {}

  onApplicationBootstrap(): void {
    if (!this.isEnabled()) {
      this.logger.log('Data jobs worker is disabled');

      return;
    }

    const intervalMs = this.getPositiveInteger(
      'DATA_JOBS_POLL_INTERVAL_MS',
      1_000,
    );

    this.logger.log(
      `Data jobs worker ${this.workerId} started; polling every ${intervalMs} ms`,
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
      const jobs = await this.claimBatch();

      for (const job of jobs) {
        await this.processJob(job);
      }
    } catch (error) {
      this.logger.error(
        'Data jobs polling iteration failed',

        error instanceof Error ? error.stack : String(error),
      );
    } finally {
      this.isRunning = false;
    }
  }

  private async claimBatch(): Promise<ClaimedDataJob[]> {
    const batchSize = this.getPositiveInteger('DATA_JOBS_BATCH_SIZE', 5);

    const maxAttempts = this.getPositiveInteger('DATA_JOBS_MAX_ATTEMPTS', 3);

    const lockTimeoutMs = this.getPositiveInteger(
      'DATA_JOBS_LOCK_TIMEOUT_MS',
      300_000,
    );

    const staleBefore = new Date(Date.now() - lockTimeoutMs);

    return this.prisma.$queryRaw<ClaimedDataJob[]>`
      WITH "candidate" AS (
        SELECT
          "id"

        FROM "DataJob"

        WHERE
          (
            (
              "status" =
                'PENDING'::"DataJobStatus"

              AND "availableAt" <=
                NOW()
            )

            OR

            (
              "status" =
                'PROCESSING'::"DataJobStatus"

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

      UPDATE "DataJob"
      SET
        "status" =
          'PROCESSING'::"DataJobStatus",

        "attempts" =
          "DataJob"."attempts" + 1,

        "lockedAt" =
          NOW(),

        "lockedBy" =
          ${this.workerId},

        "startedAt" =
          COALESCE(
            "DataJob"."startedAt",
            NOW()
          ),

        "updatedAt" =
          NOW()

      FROM "candidate"

      WHERE
        "DataJob"."id" =
          "candidate"."id"

      RETURNING
        "DataJob"."id",
        "DataJob"."organizationId",
        "DataJob"."createdById",
        "DataJob"."type",
        "DataJob"."inputFileName",
        "DataJob"."inputText",
        "DataJob"."attempts"
    `;
  }

  private async processJob(job: ClaimedDataJob): Promise<void> {
    try {
      await this.processor.process(job);
    } catch (error) {
      await this.handleFailure(job, error);
    }
  }

  private async handleFailure(
    job: ClaimedDataJob,

    error: unknown,
  ): Promise<void> {
    const maxAttempts = this.getPositiveInteger('DATA_JOBS_MAX_ATTEMPTS', 3);

    const message = error instanceof Error ? error.message : String(error);

    const permanent = error instanceof PermanentDataJobError;

    const terminalFailure = permanent || job.attempts >= maxAttempts;

    const backoffMs = Math.min(
      60_000,

      1_000 * 2 ** Math.max(0, job.attempts - 1),
    );

    const result = await this.prisma.$transaction(async (tx) => {
      const updateResult = await tx.dataJob.updateMany({
        where: {
          id: job.id,

          status: DataJobStatus.PROCESSING,

          lockedBy: this.workerId,
        },

        data: terminalFailure
          ? {
              status: DataJobStatus.FAILED,

              availableAt: new Date(),

              completedAt: new Date(),

              inputText: null,

              lockedAt: null,

              lockedBy: null,

              lastError: message.slice(0, 10_000),
            }
          : {
              status: DataJobStatus.PENDING,

              availableAt: new Date(Date.now() + backoffMs),

              completedAt: null,

              lockedAt: null,

              lockedBy: null,

              lastError: message.slice(0, 10_000),
            },
      });

      if (terminalFailure && updateResult.count === 1) {
        await tx.auditLog.create({
          data: createAuditLogData({
            organizationId: job.organizationId,

            actorUserId: job.createdById,

            action: AUDIT_ACTION.DATA_JOB_FAILED,

            entityType: AUDIT_ENTITY_TYPE.DATA_JOB,

            entityId: job.id,

            metadata: {
              type: job.type,

              attempts: job.attempts,

              error: message.slice(0, 1_000),
            },
          }),
        });
      }

      return updateResult;
    });

    if (result.count === 0) {
      this.logger.warn(
        `Data job ${job.id} could not be updated after processing failure`,
      );

      return;
    }

    if (terminalFailure) {
      this.logger.error(
        `Data job ${job.id} failed permanently after ${job.attempts} attempt(s): ${message}`,
      );

      return;
    }

    this.logger.warn(
      `Data job ${job.id} failed on attempt ${job.attempts}; retry in ${backoffMs} ms: ${message}`,
    );
  }

  private isEnabled(): boolean {
    return (
      (
        this.configService.get<string>('DATA_JOBS_WORKER_ENABLED') ?? 'true'
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
