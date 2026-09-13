import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
import * as argon2 from 'argon2';

import { PrismaClient } from '../src/generated/prisma/client.js';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const adapter = new PrismaPg({
  connectionString,
});

const prisma = new PrismaClient({
  adapter,
});

const DEMO_PASSWORD = 'warehouse-demo-password-2026';

async function main() {
  const passwordHash = await argon2.hash(DEMO_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 19_456,
    timeCost: 2,
    parallelism: 1,
  });

  const organization = await prisma.organization.upsert({
    where: {
      slug: 'demo-company',
    },

    update: {},

    create: {
      name: 'Demo Company',
      slug: 'demo-company',
    },
  });

  const user = await prisma.user.upsert({
    where: {
      email: 'admin@warehouse.local',
    },

    update: {
      passwordHash,
    },

    create: {
      email: 'admin@warehouse.local',
      firstName: 'Demo',
      lastName: 'Admin',
      passwordHash,
    },
  });

  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: user.id,
        organizationId: organization.id,
      },
    },

    update: {
      role: 'OWNER',
    },

    create: {
      userId: user.id,
      organizationId: organization.id,
      role: 'OWNER',
    },
  });

  const category = await prisma.category.upsert({
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

  const warehouse = await prisma.warehouse.upsert({
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

  const product = await prisma.product.upsert({
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

  await prisma.inventory.upsert({
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

  console.log('Seed completed');

  console.log(`Demo login: admin@warehouse.local / ${DEMO_PASSWORD}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
