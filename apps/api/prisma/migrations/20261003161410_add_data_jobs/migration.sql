-- CreateEnum
CREATE TYPE "DataJobType" AS ENUM ('PRODUCT_IMPORT', 'PRODUCT_EXPORT');

-- CreateEnum
CREATE TYPE "DataJobStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCEEDED', 'PARTIALLY_SUCCEEDED', 'FAILED');

-- CreateTable
CREATE TABLE "DataJob" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "createdById" UUID NOT NULL,
    "type" "DataJobType" NOT NULL,
    "status" "DataJobStatus" NOT NULL DEFAULT 'PENDING',
    "inputFileName" VARCHAR(255),
    "inputText" TEXT,
    "outputFileName" VARCHAR(255),
    "outputText" TEXT,
    "totalRows" INTEGER NOT NULL DEFAULT 0,
    "processedRows" INTEGER NOT NULL DEFAULT 0,
    "successfulRows" INTEGER NOT NULL DEFAULT 0,
    "failedRows" INTEGER NOT NULL DEFAULT 0,
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" VARCHAR(100),
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DataJob_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DataJobError" (
    "id" UUID NOT NULL,
    "dataJobId" UUID NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "code" VARCHAR(100) NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "rowData" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DataJobError_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DataJob_organizationId_createdAt_idx" ON "DataJob"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "DataJob_organizationId_status_createdAt_idx" ON "DataJob"("organizationId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "DataJob_status_availableAt_createdAt_idx" ON "DataJob"("status", "availableAt", "createdAt");

-- CreateIndex
CREATE INDEX "DataJob_status_lockedAt_idx" ON "DataJob"("status", "lockedAt");

-- CreateIndex
CREATE INDEX "DataJob_createdById_createdAt_idx" ON "DataJob"("createdById", "createdAt");

-- CreateIndex
CREATE INDEX "DataJobError_dataJobId_rowNumber_idx" ON "DataJobError"("dataJobId", "rowNumber");

-- AddForeignKey
ALTER TABLE "DataJob" ADD CONSTRAINT "DataJob_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataJob" ADD CONSTRAINT "DataJob_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DataJobError" ADD CONSTRAINT "DataJobError_dataJobId_fkey" FOREIGN KEY ("dataJobId") REFERENCES "DataJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "DataJob"
ADD CONSTRAINT "DataJob_attempts_nonnegative"
CHECK ("attempts" >= 0);

ALTER TABLE "DataJob"
ADD CONSTRAINT "DataJob_counters_nonnegative"
CHECK (
  "totalRows" >= 0
  AND "processedRows" >= 0
  AND "successfulRows" >= 0
  AND "failedRows" >= 0
);

ALTER TABLE "DataJob"
ADD CONSTRAINT "DataJob_processed_rows_consistent"
CHECK (
  "processedRows" =
  "successfulRows" + "failedRows"
);

ALTER TABLE "DataJob"
ADD CONSTRAINT "DataJob_processed_not_above_total"
CHECK (
  "processedRows" <= "totalRows"
);

ALTER TABLE "DataJob"
ADD CONSTRAINT "DataJob_processing_requires_lock"
CHECK (
  "status" <> 'PROCESSING'::"DataJobStatus"
  OR (
    "lockedAt" IS NOT NULL
    AND "lockedBy" IS NOT NULL
  )
);

ALTER TABLE "DataJob"
ADD CONSTRAINT "DataJob_terminal_requires_completed_at"
CHECK (
  "status" NOT IN (
    'SUCCEEDED'::"DataJobStatus",
    'PARTIALLY_SUCCEEDED'::"DataJobStatus",
    'FAILED'::"DataJobStatus"
  )
  OR "completedAt" IS NOT NULL
);