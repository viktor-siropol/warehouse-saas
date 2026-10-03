import { Injectable } from '@nestjs/common';

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

import { MAX_PRODUCT_EXPORT_ROWS } from './data-job.constants.js';

import { PermanentDataJobError } from './data-job.errors.js';

import { buildProductExportCsv, parseProductImportCsv } from './product-csv.js';

export type ClaimedDataJob = {
  id: string;

  organizationId: string;

  createdById: string;

  type: DataJobType;

  inputFileName: string | null;

  inputText: string | null;

  attempts: number;
};

@Injectable()
export class DataJobProcessorService {
  constructor(private readonly prisma: PrismaService) {}

  async process(job: ClaimedDataJob): Promise<void> {
    switch (job.type) {
      case DataJobType.PRODUCT_IMPORT:
        await this.processProductImport(job);

        return;

      case DataJobType.PRODUCT_EXPORT:
        await this.processProductExport(job);

        return;

      default:
        throw new PermanentDataJobError(
          `Unsupported data job type: ${String(job.type)}`,
        );
    }
  }

  private async processProductImport(job: ClaimedDataJob): Promise<void> {
    if (!job.inputText) {
      throw new PermanentDataJobError('Product import job has no input CSV');
    }

    const parsed = parseProductImportCsv(job.inputText);

    const terminalStatus =
      parsed.validRows.length === 0
        ? DataJobStatus.FAILED
        : parsed.errors.length > 0
          ? DataJobStatus.PARTIALLY_SUCCEEDED
          : DataJobStatus.SUCCEEDED;

    await this.prisma.$transaction(
      async (tx) => {
        await tx.dataJobError.deleteMany({
          where: {
            dataJobId: job.id,
          },
        });

        if (parsed.errors.length > 0) {
          await tx.dataJobError.createMany({
            data: parsed.errors.map((error) => ({
              dataJobId: job.id,

              rowNumber: error.rowNumber,

              code: error.code,

              message: error.message,

              rowData: error.rowData,
            })),
          });
        }

        const uniqueCategories = [
          ...new Set(parsed.validRows.map((row) => row.category)),
        ];

        const categoryIds = new Map<string, string>();

        for (const categoryName of uniqueCategories) {
          const category = await tx.category.upsert({
            where: {
              organizationId_name: {
                organizationId: job.organizationId,

                name: categoryName,
              },
            },

            update: {},

            create: {
              organizationId: job.organizationId,

              name: categoryName,
            },

            select: {
              id: true,
              name: true,
            },
          });

          categoryIds.set(category.name, category.id);
        }

        for (const row of parsed.validRows) {
          const categoryId = categoryIds.get(row.category);

          if (!categoryId) {
            throw new Error(`Category resolution failed for "${row.category}"`);
          }

          await tx.product.upsert({
            where: {
              organizationId_sku: {
                organizationId: job.organizationId,

                sku: row.sku,
              },
            },

            update: {
              name: row.name,

              description: row.description,

              categoryId,

              isActive: row.isActive,
            },

            create: {
              organizationId: job.organizationId,

              sku: row.sku,

              name: row.name,

              description: row.description,

              categoryId,

              isActive: row.isActive,
            },
          });
        }

        await tx.dataJob.update({
          where: {
            id: job.id,
          },

          data: {
            status: terminalStatus,

            totalRows: parsed.totalRows,

            processedRows: parsed.totalRows,

            successfulRows: parsed.validRows.length,

            failedRows: parsed.errors.length,

            completedAt: new Date(),

            inputText: null,

            lockedAt: null,

            lockedBy: null,

            lastError:
              parsed.validRows.length === 0
                ? 'No valid product rows were imported'
                : null,
          },
        });

        await tx.auditLog.create({
          data: createAuditLogData({
            organizationId: job.organizationId,

            actorUserId: job.createdById,

            action: AUDIT_ACTION.PRODUCT_IMPORT_COMPLETED,

            entityType: AUDIT_ENTITY_TYPE.DATA_JOB,

            entityId: job.id,

            metadata: {
              status: terminalStatus,

              inputFileName: job.inputFileName,

              totalRows: parsed.totalRows,

              successfulRows: parsed.validRows.length,

              failedRows: parsed.errors.length,
            },
          }),
        });
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,

        maxWait: 5_000,

        timeout: 60_000,
      },
    );
  }

  private async processProductExport(job: ClaimedDataJob): Promise<void> {
    const products = await this.prisma.product.findMany({
      where: {
        organizationId: job.organizationId,
      },

      select: {
        sku: true,
        name: true,
        description: true,
        isActive: true,

        category: {
          select: {
            name: true,
          },
        },
      },

      orderBy: [
        {
          sku: 'asc',
        },

        {
          id: 'asc',
        },
      ],

      take: MAX_PRODUCT_EXPORT_ROWS + 1,
    });

    if (products.length > MAX_PRODUCT_EXPORT_ROWS) {
      throw new PermanentDataJobError(
        `Product export exceeds the ${MAX_PRODUCT_EXPORT_ROWS} row limit`,
      );
    }

    const csv = buildProductExportCsv(
      products.map((product) => ({
        sku: product.sku,

        name: product.name,

        category: product.category?.name ?? '',

        description: product.description,

        isActive: product.isActive,
      })),
    );

    const date = new Date().toISOString().slice(0, 10);

    const outputFileName = `products-${date}.csv`;

    await this.prisma.$transaction(async (tx) => {
      await tx.dataJob.update({
        where: {
          id: job.id,
        },

        data: {
          status: DataJobStatus.SUCCEEDED,

          outputFileName,

          outputText: csv,

          totalRows: products.length,

          processedRows: products.length,

          successfulRows: products.length,

          failedRows: 0,

          completedAt: new Date(),

          lockedAt: null,

          lockedBy: null,

          lastError: null,
        },
      });

      await tx.auditLog.create({
        data: createAuditLogData({
          organizationId: job.organizationId,

          actorUserId: job.createdById,

          action: AUDIT_ACTION.PRODUCT_EXPORT_COMPLETED,

          entityType: AUDIT_ENTITY_TYPE.DATA_JOB,

          entityId: job.id,

          metadata: {
            outputFileName,

            totalRows: products.length,
          },
        }),
      });
    });
  }
}
