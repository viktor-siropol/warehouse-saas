import { describe, expect, it } from 'vitest';

import { validateRuntimeEnvironment } from './runtime-env.js';

describe('validateRuntimeEnvironment', () => {
  it('accepts local development configuration', () => {
    const result = validateRuntimeEnvironment({
      DATABASE_URL:
        'postgresql://postgres:password@localhost:5432/warehouse_db',

      NODE_ENV: 'development',

      PORT: '3001',
    });

    expect(result).toEqual({
      nodeEnv: 'development',

      port: 3001,

      logFormat: 'pretty',
    });
  });

  it('defaults production logging to json', () => {
    const result = validateRuntimeEnvironment({
      DATABASE_URL:
        'postgresql://warehouse:password@warehouse-db.internal:5432/warehouse_db',

      NODE_ENV: 'production',

      PORT: '3001',
    });

    expect(result.logFormat).toBe('json');
  });

  it('rejects a local database in production', () => {
    expect(() =>
      validateRuntimeEnvironment({
        DATABASE_URL:
          'postgresql://postgres:password@localhost:5432/warehouse_db',

        NODE_ENV: 'production',
      }),
    ).toThrow('Refusing to start production against a local database host');
  });

  it('rejects the development seed flag in production', () => {
    expect(() =>
      validateRuntimeEnvironment({
        DATABASE_URL:
          'postgresql://warehouse:password@warehouse-db.internal:5432/warehouse_db',

        NODE_ENV: 'production',

        DEV_SEED_ENABLED: 'true',
      }),
    ).toThrow('DEV_SEED_ENABLED must never be true in production');
  });

  it('rejects invalid log formats', () => {
    expect(() =>
      validateRuntimeEnvironment({
        DATABASE_URL:
          'postgresql://postgres:password@localhost:5432/warehouse_db',

        NODE_ENV: 'development',

        LOG_FORMAT: 'xml',
      }),
    ).toThrow('LOG_FORMAT must be "pretty" or "json"');
  });

  it('rejects invalid worker configuration', () => {
    expect(() =>
      validateRuntimeEnvironment({
        DATABASE_URL:
          'postgresql://postgres:password@localhost:5432/warehouse_db',

        NODE_ENV: 'development',

        OUTBOX_BATCH_SIZE: '0',
      }),
    ).toThrow('OUTBOX_BATCH_SIZE must be a positive integer');
  });
});
