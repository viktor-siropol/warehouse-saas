import 'dotenv/config';

import { PrismaPg } from '@prisma/adapter-pg';
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

async function main() {
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

    update: {},

    create: {
      email: 'admin@warehouse.local',
      firstName: 'Demo',
      lastName: 'Admin',
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
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
