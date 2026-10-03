import { parse } from 'csv-parse/sync';

import { stringify } from 'csv-stringify/sync';

import {
  MAX_PRODUCT_IMPORT_ROWS,
  PRODUCT_IMPORT_HEADERS,
} from './data-job.constants.js';

import { PermanentDataJobError } from './data-job.errors.js';

export type ParsedProductImportRow = {
  rowNumber: number;

  sku: string;

  name: string;

  category: string;

  description: string | null;

  isActive: boolean;
};

export type ProductImportRowError = {
  rowNumber: number;

  code: string;

  message: string;

  rowData: Record<string, string>;
};

export type ParsedProductImport = {
  totalRows: number;

  validRows: ParsedProductImportRow[];

  errors: ProductImportRowError[];
};

export type ProductExportRow = {
  sku: string;

  name: string;

  category: string;

  description: string | null;

  isActive: boolean;
};

function makeSpreadsheetSafe(value: string): string {
  const trimmed = value.trimStart();

  const startsWithControlCharacter = /^[\t\r\n]/u.test(value);

  const startsWithFormulaCharacter = /^[=+\-@＝＋－＠]/u.test(trimmed);

  if (startsWithControlCharacter || startsWithFormulaCharacter) {
    return `'${value}`;
  }

  return value;
}

function stringifyCsv(records: Array<Array<string | boolean>>): string {
  const csv = stringify(records, {
    record_delimiter: '\r\n',
  });

  return `\uFEFF${csv}`;
}

export function buildProductImportTemplateCsv(): string {
  return stringifyCsv([[...PRODUCT_IMPORT_HEADERS]]);
}

export function parseProductImportCsv(csvText: string): ParsedProductImport {
  let records: string[][];

  try {
    records = parse(csvText, {
      bom: true,

      trim: true,

      skip_empty_lines: true,

      relax_column_count: true,

      max_record_size: 10_000,
    }) as string[][];
  } catch (error) {
    throw new PermanentDataJobError(
      error instanceof Error
        ? `CSV parsing failed: ${error.message}`
        : 'CSV parsing failed',
    );
  }

  if (records.length === 0) {
    throw new PermanentDataJobError('CSV file is empty');
  }

  const header = records[0];

  if (!header) {
    throw new PermanentDataJobError('CSV header is missing');
  }

  const normalizedHeader = header.map((value) => value.trim().toLowerCase());

  const expectedHeader = PRODUCT_IMPORT_HEADERS.map((value) =>
    value.toLowerCase(),
  );

  const headerMatches =
    normalizedHeader.length === expectedHeader.length &&
    normalizedHeader.every((value, index) => value === expectedHeader[index]);

  if (!headerMatches) {
    throw new PermanentDataJobError(
      `Invalid CSV header. Expected: ${PRODUCT_IMPORT_HEADERS.join(',')}`,
    );
  }

  const dataRows = records.slice(1);

  if (dataRows.length === 0) {
    throw new PermanentDataJobError(
      'CSV must contain at least one product row',
    );
  }

  if (dataRows.length > MAX_PRODUCT_IMPORT_ROWS) {
    throw new PermanentDataJobError(
      `CSV contains too many rows. Maximum: ${MAX_PRODUCT_IMPORT_ROWS}`,
    );
  }

  const validRows: ParsedProductImportRow[] = [];

  const errors: ProductImportRowError[] = [];

  const seenSkus = new Set<string>();

  for (let index = 0; index < dataRows.length; index += 1) {
    const rawRow = dataRows[index] ?? [];

    const rowNumber = index + 2;

    const [
      rawSku = '',
      rawName = '',
      rawCategory = '',
      rawDescription = '',
      rawIsActive = '',
    ] = rawRow;

    const rowData = {
      sku: rawSku,

      name: rawName,

      category: rawCategory,

      description: rawDescription,

      isActive: rawIsActive,
    };

    if (rawRow.length !== PRODUCT_IMPORT_HEADERS.length) {
      errors.push({
        rowNumber,

        code: 'INVALID_COLUMN_COUNT',

        message: `Expected ${PRODUCT_IMPORT_HEADERS.length} columns, received ${rawRow.length}`,

        rowData,
      });

      continue;
    }

    const sku = rawSku.trim();

    const name = rawName.trim();

    const category = rawCategory.trim();

    const description = rawDescription.trim();

    const isActiveText = rawIsActive.trim().toLowerCase();

    if (sku.length === 0) {
      errors.push({
        rowNumber,

        code: 'SKU_REQUIRED',

        message: 'sku is required',

        rowData,
      });

      continue;
    }

    if (sku.length > 100) {
      errors.push({
        rowNumber,

        code: 'SKU_TOO_LONG',

        message: 'sku must not exceed 100 characters',

        rowData,
      });

      continue;
    }

    if (name.length === 0) {
      errors.push({
        rowNumber,

        code: 'NAME_REQUIRED',

        message: 'name is required',

        rowData,
      });

      continue;
    }

    if (name.length > 200) {
      errors.push({
        rowNumber,

        code: 'NAME_TOO_LONG',

        message: 'name must not exceed 200 characters',

        rowData,
      });

      continue;
    }

    if (category.length === 0) {
      errors.push({
        rowNumber,

        code: 'CATEGORY_REQUIRED',

        message: 'category is required',

        rowData,
      });

      continue;
    }

    if (category.length > 120) {
      errors.push({
        rowNumber,

        code: 'CATEGORY_TOO_LONG',

        message: 'category must not exceed 120 characters',

        rowData,
      });

      continue;
    }

    if (description.length > 2_000) {
      errors.push({
        rowNumber,

        code: 'DESCRIPTION_TOO_LONG',

        message: 'description must not exceed 2000 characters',

        rowData,
      });

      continue;
    }

    if (isActiveText !== 'true' && isActiveText !== 'false') {
      errors.push({
        rowNumber,

        code: 'INVALID_IS_ACTIVE',

        message: 'isActive must be true or false',

        rowData,
      });

      continue;
    }

    if (seenSkus.has(sku)) {
      errors.push({
        rowNumber,

        code: 'DUPLICATE_SKU_IN_FILE',

        message: `Duplicate SKU in CSV: ${sku}`,

        rowData,
      });

      continue;
    }

    seenSkus.add(sku);

    validRows.push({
      rowNumber,
      sku,
      name,
      category,

      description: description.length > 0 ? description : null,

      isActive: isActiveText === 'true',
    });
  }

  return {
    totalRows: dataRows.length,

    validRows,

    errors,
  };
}

export function buildProductExportCsv(products: ProductExportRow[]): string {
  const records: Array<Array<string | boolean>> = [[...PRODUCT_IMPORT_HEADERS]];

  for (const product of products) {
    records.push([
      makeSpreadsheetSafe(product.sku),

      makeSpreadsheetSafe(product.name),

      makeSpreadsheetSafe(product.category),

      makeSpreadsheetSafe(product.description ?? ''),

      product.isActive,
    ]);
  }

  return stringifyCsv(records);
}
