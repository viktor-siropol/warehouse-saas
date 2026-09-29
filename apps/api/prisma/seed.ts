import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

import {
  MembershipRole,
  PrismaClient,
} from '../src/generated/prisma/client.js';

const DEV_SEED_ENABLED_VALUE = 'true';

const EXPECTED_LOCAL_DATABASE_NAME = 'warehouse_db';

const LOCAL_DATABASE_HOSTS = new Set([
  'localhost',
  '127.0.0.1',
  '::1',
  '[::1]',
]);

const DEV_OWNER = {
  email: 'admin@warehouse.local',

  firstName: 'Demo',

  lastName: 'Admin',

  password: 'warehouse-demo-password-2026',
} as const;

const DEV_WORKER = {
  email: 'worker@warehouse.local',

  firstName: 'Demo',

  lastName: 'Worker',

  password: 'warehouse-worker-password-2026',
} as const;

function getConnectionString(): string {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    throw new Error('DATABASE_URL is not defined');
  }

  return connectionString;
}

function assertDevSeedAllowed(connectionString: string): void {
  if (process.env.DEV_SEED_ENABLED !== DEV_SEED_ENABLED_VALUE) {
    throw new Error(
      [
        'DEV seed is disabled.',
        'Set DEV_SEED_ENABLED=true only in your local development/test environment.',
        'This seed must never be enabled in a public deployment.',
      ].join(' '),
    );
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run DEV seed with NODE_ENV=production.');
  }

  let databaseUrl: URL;

  try {
    databaseUrl = new URL(connectionString);
  } catch {
    throw new Error('DATABASE_URL is not a valid URL');
  }

  if (
    databaseUrl.protocol !== 'postgresql:' &&
    databaseUrl.protocol !== 'postgres:'
  ) {
    throw new Error(
      `Refusing to seed unsupported database protocol: ${databaseUrl.protocol}`,
    );
  }

  if (!LOCAL_DATABASE_HOSTS.has(databaseUrl.hostname)) {
    throw new Error(
      [
        'Refusing to run DEV seed against a non-local database.',
        `Database host: ${databaseUrl.hostname}`,
        'Allowed hosts: localhost, 127.0.0.1, ::1.',
      ].join(' '),
    );
  }

  const databaseName = decodeURIComponent(
    databaseUrl.pathname.replace(/^\/+/, ''),
  );

  if (databaseName !== EXPECTED_LOCAL_DATABASE_NAME) {
    throw new Error(
      [
        'Refusing to run DEV seed against an unexpected database.',
        `Database name: ${databaseName || '(empty)'}.`,
        `Expected local database: ${EXPECTED_LOCAL_DATABASE_NAME}.`,
      ].join(' '),
    );
  }
}

async function hashPassword(password: string): Promise<string> {
  return argon2.hash(password, {
    type: argon2.argon2id,

    memoryCost: 19_456,

    timeCost: 2,

    parallelism: 1,
  });
}

async function main() {
  const connectionString = getConnectionString();

  assertDevSeedAllowed(connectionString);

  const adapter = new PrismaPg({
    connectionString,
  });

  const prisma = new PrismaClient({
    adapter,
  });

  try {
    const [ownerPasswordHash, workerPasswordHash] = await Promise.all([
      hashPassword(DEV_OWNER.password),

      hashPassword(DEV_WORKER.password),
    ]);

    await prisma.$transaction(async (tx) => {
      const organization = await tx.organization.upsert({
        where: {
          slug: 'demo-company',
        },

        update: {},

        create: {
          name: 'Demo Company',

          slug: 'demo-company',
        },
      });

      const owner = await tx.user.upsert({
        where: {
          email: DEV_OWNER.email,
        },

        update: {
          firstName: DEV_OWNER.firstName,

          lastName: DEV_OWNER.lastName,

          passwordHash: ownerPasswordHash,
        },

        create: {
          email: DEV_OWNER.email,

          firstName: DEV_OWNER.firstName,

          lastName: DEV_OWNER.lastName,

          passwordHash: ownerPasswordHash,
        },
      });

      await tx.membership.upsert({
        where: {
          userId_organizationId: {
            userId: owner.id,

            organizationId: organization.id,
          },
        },

        update: {
          role: MembershipRole.OWNER,
        },

        create: {
          userId: owner.id,

          organizationId: organization.id,

          role: MembershipRole.OWNER,
        },
      });

      const worker = await tx.user.upsert({
        where: {
          email: DEV_WORKER.email,
        },

        update: {
          firstName: DEV_WORKER.firstName,

          lastName: DEV_WORKER.lastName,

          passwordHash: workerPasswordHash,
        },

        create: {
          email: DEV_WORKER.email,

          firstName: DEV_WORKER.firstName,

          lastName: DEV_WORKER.lastName,

          passwordHash: workerPasswordHash,
        },
      });

      await tx.membership.upsert({
        where: {
          userId_organizationId: {
            userId: worker.id,

            organizationId: organization.id,
          },
        },

        update: {
          role: MembershipRole.WORKER,
        },

        create: {
          userId: worker.id,

          organizationId: organization.id,

          role: MembershipRole.WORKER,
        },
      });

      const category = await tx.category.upsert({
        where: {
          organizationId_name: {
            organizationId: organization.id,

            name: 'Electronics',
          },
        },

        update: {},

        create: {
          organizationId: organization.id,

          name: 'Electronics',
        },
      });

      const warehouse = await tx.warehouse.upsert({
        where: {
          organizationId_code: {
            organizationId: organization.id,

            code: 'KRK-01',
          },
        },

        update: {},

        create: {
          organizationId: organization.id,

          name: 'Kraków Main Warehouse',

          code: 'KRK-01',

          address: 'Kraków, Poland',
        },
      });

      const product = await tx.product.upsert({
        where: {
          organizationId_sku: {
            organizationId: organization.id,

            sku: 'IPHONE-17-BLK-256',
          },
        },

        update: {},

        create: {
          organizationId: organization.id,

          categoryId: category.id,

          sku: 'IPHONE-17-BLK-256',

          name: 'iPhone 17 256GB Black',

          description: 'Demo inventory product',
        },
      });

      await tx.inventory.upsert({
        where: {
          warehouseId_productId: {
            warehouseId: warehouse.id,

            productId: product.id,
          },
        },

        update: {},

        create: {
          warehouseId: warehouse.id,

          productId: product.id,

          quantity: 25,

          reorderPoint: 10,
        },
      });
    });

    console.log('Local DEV seed completed.');

    console.log(`DEV OWNER: ${DEV_OWNER.email}`);

    console.log(`DEV WORKER: ${DEV_WORKER.email}`);

    console.log(
      'These accounts are local development fixtures only and must never be used by a public deployment.',
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error('\nDEV seed failed:\n');

  console.error(error);

  process.exitCode = 1;
});
