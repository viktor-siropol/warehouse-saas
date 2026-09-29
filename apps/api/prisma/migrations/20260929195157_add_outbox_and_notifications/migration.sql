-- CreateEnum
CREATE TYPE "OutboxEventStatus" AS ENUM ('PENDING', 'PROCESSING', 'PROCESSED', 'DEAD_LETTER');

-- CreateEnum
CREATE TYPE "NotificationKind" AS ENUM ('INFO', 'SUCCESS', 'WARNING');

-- CreateTable
CREATE TABLE "OutboxEvent" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "eventType" VARCHAR(150) NOT NULL,
    "aggregateType" VARCHAR(100) NOT NULL,
    "aggregateId" UUID,
    "payload" JSONB NOT NULL,
    "status" "OutboxEventStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "availableAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lockedAt" TIMESTAMP(3),
    "lockedBy" VARCHAR(100),
    "processedAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "OutboxEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "recipientUserId" UUID NOT NULL,
    "outboxEventId" UUID NOT NULL,
    "kind" "NotificationKind" NOT NULL,
    "title" VARCHAR(200) NOT NULL,
    "message" VARCHAR(1000) NOT NULL,
    "readAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "OutboxEvent_status_availableAt_createdAt_idx" ON "OutboxEvent"("status", "availableAt", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_status_lockedAt_idx" ON "OutboxEvent"("status", "lockedAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_organizationId_createdAt_idx" ON "OutboxEvent"("organizationId", "createdAt");

-- CreateIndex
CREATE INDEX "OutboxEvent_eventType_createdAt_idx" ON "OutboxEvent"("eventType", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_organizationId_recipientUserId_readAt_createdA_idx" ON "Notification"("organizationId", "recipientUserId", "readAt", "createdAt");

-- CreateIndex
CREATE INDEX "Notification_recipientUserId_createdAt_idx" ON "Notification"("recipientUserId", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_outboxEventId_recipientUserId_key" ON "Notification"("outboxEventId", "recipientUserId");

-- AddForeignKey
ALTER TABLE "OutboxEvent" ADD CONSTRAINT "OutboxEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientUserId_fkey" FOREIGN KEY ("recipientUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_outboxEventId_fkey" FOREIGN KEY ("outboxEventId") REFERENCES "OutboxEvent"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "OutboxEvent"
ADD CONSTRAINT "OutboxEvent_attempts_nonnegative"
CHECK ("attempts" >= 0);

ALTER TABLE "OutboxEvent"
ADD CONSTRAINT "OutboxEvent_processing_requires_lock"
CHECK (
  "status" <> 'PROCESSING'
  OR (
    "lockedAt" IS NOT NULL
    AND "lockedBy" IS NOT NULL
  )
);