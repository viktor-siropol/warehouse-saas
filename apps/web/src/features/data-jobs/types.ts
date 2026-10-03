export type DataJobType = "PRODUCT_IMPORT" | "PRODUCT_EXPORT";

export type DataJobStatus =
  "PENDING" | "PROCESSING" | "SUCCEEDED" | "PARTIALLY_SUCCEEDED" | "FAILED";

export type DataJobCreated = {
  id: string;

  type: DataJobType;

  status: DataJobStatus;

  inputFileName?: string | null;

  createdAt: string;
};

export type DataJobListItem = {
  id: string;

  type: DataJobType;

  status: DataJobStatus;

  inputFileName: string | null;

  outputFileName: string | null;

  totalRows: number;

  processedRows: number;

  successfulRows: number;

  failedRows: number;

  attempts: number;

  startedAt: string | null;

  completedAt: string | null;

  lastError: string | null;

  createdAt: string;

  updatedAt: string;

  createdBy: {
    id: string;

    email: string;

    firstName: string;

    lastName: string;
  };

  _count: {
    errors: number;
  };
};

export type DataJobsPage = {
  items: DataJobListItem[];

  nextCursor: string | null;
};

export type DataJobErrorItem = {
  id: string;

  rowNumber: number;

  code: string;

  message: string;

  rowData: unknown;

  createdAt: string;
};

export type DataJobDetail = {
  id: string;

  type: DataJobType;

  status: DataJobStatus;

  inputFileName: string | null;

  outputFileName: string | null;

  outputText: string | null;

  totalRows: number;

  processedRows: number;

  successfulRows: number;

  failedRows: number;

  attempts: number;

  startedAt: string | null;

  completedAt: string | null;

  lastError: string | null;

  createdAt: string;

  updatedAt: string;

  createdBy: {
    id: string;

    email: string;

    firstName: string;

    lastName: string;
  };

  errors: DataJobErrorItem[];
};

export type ProductImportTemplate = {
  fileName: string;

  csv: string;
};
