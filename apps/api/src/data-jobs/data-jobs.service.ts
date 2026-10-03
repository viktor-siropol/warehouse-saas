import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import {
  AUDIT_ACTION,
  AUDIT_ENTITY_TYPE,
  createAuditLogData,
} from '../audit/audit-log.js';

import {
  DataJobStatus,
  DataJobType,
  Prisma,
} from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import {
  MAX_ACTIVE_DATA_JOBS_PER_ORGANIZATION,
  MAX_PRODUCT_IMPORT_BYTES,
} from './data-job.constants.js';

import { CreateProductImportJobDto } from './dto/create-product-import-job.dto.js';

import { DataJobQueryDto } from './dto/data-job-query.dto.js';

import { buildProductImportTemplateCsv } from './product-csv.js';

@Injectable()
export class DataJobsService {
  constructor(private readonly prisma: PrismaService) {}

  async createProductImport(
    organizationId: string,

    userId: string,

    dto: CreateProductImportJobDto,
  ) {
    const fileName = dto.fileName.trim();

    const byteLength = Buffer.byteLength(dto.csv, 'utf8');

    if (byteLength === 0) {
      throw new BadRequestException('CSV file is empty');
    }

    if (byteLength > MAX_PRODUCT_IMPORT_BYTES) {
      throw new BadRequestException(
        `CSV file exceeds the ${MAX_PRODUCT_IMPORT_BYTES} byte limit`,
      );
    }

    await this.assertJobCapacity(organizationId);

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.dataJob.create({
        data: {
          organizationId,

          createdById: userId,

          type: DataJobType.PRODUCT_IMPORT,

          inputFileName: fileName,

          inputText: dto.csv,
        },

        select: {
          id: true,
          type: true,
          status: true,
          inputFileName: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: createAuditLogData({
          organizationId,

          actorUserId: userId,

          action: AUDIT_ACTION.DATA_JOB_CREATED,

          entityType: AUDIT_ENTITY_TYPE.DATA_JOB,

          entityId: job.id,

          metadata: {
            type: DataJobType.PRODUCT_IMPORT,

            inputFileName: fileName,
          },
        }),
      });

      return job;
    });
  }

  async createProductExport(
    organizationId: string,

    userId: string,
  ) {
    await this.assertJobCapacity(organizationId);

    return this.prisma.$transaction(async (tx) => {
      const job = await tx.dataJob.create({
        data: {
          organizationId,

          createdById: userId,

          type: DataJobType.PRODUCT_EXPORT,
        },

        select: {
          id: true,
          type: true,
          status: true,
          createdAt: true,
        },
      });

      await tx.auditLog.create({
        data: createAuditLogData({
          organizationId,

          actorUserId: userId,

          action: AUDIT_ACTION.DATA_JOB_CREATED,

          entityType: AUDIT_ENTITY_TYPE.DATA_JOB,

          entityId: job.id,

          metadata: {
            type: DataJobType.PRODUCT_EXPORT,
          },
        }),
      });

      return job;
    });
  }

  getProductImportTemplate() {
    return {
      fileName: 'products-import-template.csv',

      csv: buildProductImportTemplateCsv(),
    };
  }

  async findAll(
    organizationId: string,

    query: DataJobQueryDto,
  ) {
    const where: Prisma.DataJobWhereInput = {
      organizationId,

      ...(query.status
        ? {
            status: query.status,
          }
        : {}),

      ...(query.type
        ? {
            type: query.type,
          }
        : {}),
    };

    const rows = await this.prisma.dataJob.findMany({
      where,

      select: {
        id: true,
        type: true,
        status: true,
        inputFileName: true,
        outputFileName: true,

        totalRows: true,
        processedRows: true,
        successfulRows: true,
        failedRows: true,

        attempts: true,
        startedAt: true,
        completedAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,

        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },

        _count: {
          select: {
            errors: true,
          },
        },
      },

      orderBy: [
        {
          createdAt: 'desc',
        },

        {
          id: 'desc',
        },
      ],

      take: query.limit + 1,

      ...(query.cursor
        ? {
            cursor: {
              id: query.cursor,
            },

            skip: 1,
          }
        : {}),
    });

    const hasMore = rows.length > query.limit;

    const items = hasMore ? rows.slice(0, query.limit) : rows;

    return {
      items,

      nextCursor: hasMore ? (items[items.length - 1]?.id ?? null) : null,
    };
  }

  async findOne(
    organizationId: string,

    jobId: string,
  ) {
    const job = await this.prisma.dataJob.findFirst({
      where: {
        id: jobId,

        organizationId,
      },

      select: {
        id: true,
        type: true,
        status: true,

        inputFileName: true,

        outputFileName: true,
        outputText: true,

        totalRows: true,
        processedRows: true,
        successfulRows: true,
        failedRows: true,

        attempts: true,
        startedAt: true,
        completedAt: true,
        lastError: true,
        createdAt: true,
        updatedAt: true,

        createdBy: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },

        errors: {
          select: {
            id: true,
            rowNumber: true,
            code: true,
            message: true,
            rowData: true,
            createdAt: true,
          },

          orderBy: [
            {
              rowNumber: 'asc',
            },

            {
              createdAt: 'asc',
            },
          ],

          take: 500,
        },
      },
    });

    if (!job) {
      throw new NotFoundException('Data job not found');
    }

    return job;
  }

  private async assertJobCapacity(organizationId: string): Promise<void> {
    const activeJobs = await this.prisma.dataJob.count({
      where: {
        organizationId,

        status: {
          in: [DataJobStatus.PENDING, DataJobStatus.PROCESSING],
        },
      },
    });

    if (activeJobs >= MAX_ACTIVE_DATA_JOBS_PER_ORGANIZATION) {
      throw new ConflictException(
        `Organization already has ${MAX_ACTIVE_DATA_JOBS_PER_ORGANIZATION} active data jobs`,
      );
    }
  }
}
