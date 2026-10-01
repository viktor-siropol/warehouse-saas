export type NotificationKind = "INFO" | "SUCCESS" | "WARNING";

export type NotificationItem = {
  id: string;

  kind: NotificationKind;

  title: string;

  message: string;

  readAt: string | null;

  createdAt: string;

  outboxEventId: string;

  outboxEvent: {
    eventType: string;

    aggregateType: string;

    aggregateId: string | null;
  };
};

export type NotificationPage = {
  items: NotificationItem[];

  unreadCount: number;

  nextCursor: string | null;
};

export type OutboxEventStatus =
  "PENDING" | "PROCESSING" | "PROCESSED" | "DEAD_LETTER";

export type OutboxJob = {
  id: string;

  eventType: string;

  aggregateType: string;

  aggregateId: string | null;

  status: OutboxEventStatus;

  attempts: number;

  availableAt: string;

  lockedAt: string | null;

  lockedBy: string | null;

  processedAt: string | null;

  lastError: string | null;

  createdAt: string;

  updatedAt: string;
};

export type OutboxJobsPage = {
  items: OutboxJob[];

  statusCounts: Array<{
    status: OutboxEventStatus;

    count: number;
  }>;

  nextCursor: string | null;
};
