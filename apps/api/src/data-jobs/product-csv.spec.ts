import { describe, expect, it } from 'vitest';

import { PermanentDataJobError } from './data-job.errors.js';

import {
  buildProductExportCsv,
  buildProductImportTemplateCsv,
  parseProductImportCsv,
} from './product-csv.js';

describe('product CSV', () => {
  it('parses valid rows and reports invalid rows independently', () => {
    const result = parseProductImportCsv(
      [
        'sku,name,category,description,isActive',
        'SKU-1,"Laptop, 13 inch",Electronics,Demo product,true',
        'SKU-2,Mouse,Accessories,Demo mouse,false',
        'SKU-2,Duplicate,Accessories,Duplicate,true',
        'SKU-3,Keyboard,Accessories,Keyboard,not-a-boolean',
      ].join('\n'),
    );

    expect(result.totalRows).toBe(4);

    expect(result.validRows).toHaveLength(2);

    expect(result.errors).toHaveLength(2);

    expect(result.validRows[0]).toMatchObject({
      rowNumber: 2,

      sku: 'SKU-1',

      name: 'Laptop, 13 inch',

      category: 'Electronics',

      isActive: true,
    });

    expect(result.errors[0]).toMatchObject({
      rowNumber: 4,

      code: 'DUPLICATE_SKU_IN_FILE',
    });

    expect(result.errors[1]).toMatchObject({
      rowNumber: 5,

      code: 'INVALID_IS_ACTIVE',
    });
  });

  it('rejects an invalid header', () => {
    expect(() =>
      parseProductImportCsv(
        ['sku,name,description', 'SKU-1,Product,Description'].join('\n'),
      ),
    ).toThrow(PermanentDataJobError);
  });

  it('creates a product import template', () => {
    const csv = buildProductImportTemplateCsv();

    expect(csv).toContain('sku,name,category,description,isActive');
  });

  it('creates a spreadsheet-compatible CSV export', () => {
    const csv = buildProductExportCsv([
      {
        sku: 'SKU-1',

        name: 'Laptop, 13 inch',

        category: 'Electronics',

        description: 'Example',

        isActive: true,
      },
    ]);

    expect(csv).toContain('sku,name,category,description,isActive');

    expect(csv).toContain('"Laptop, 13 inch"');
  });

  it('neutralizes formula-like spreadsheet values', () => {
    const csv = buildProductExportCsv([
      {
        sku: '=1+1',

        name: '+SUM(1,1)',

        category: '@Example',

        description: '-10+20',

        isActive: true,
      },
    ]);

    expect(csv).toContain("'=1+1");

    expect(csv).toContain("'+SUM(1,1)");

    expect(csv).toContain("'@Example");

    expect(csv).toContain("'-10+20");
  });
});
