export const MAX_PRODUCT_IMPORT_BYTES = 2 * 1024 * 1024;

export const MAX_PRODUCT_IMPORT_CHARACTERS = MAX_PRODUCT_IMPORT_BYTES;

export const MAX_PRODUCT_IMPORT_ROWS = 1_000;

export const MAX_PRODUCT_EXPORT_ROWS = 10_000;

export const MAX_ACTIVE_DATA_JOBS_PER_ORGANIZATION = 5;

export const PRODUCT_IMPORT_HEADERS = [
  'sku',
  'name',
  'category',
  'description',
  'isActive',
] as const;
