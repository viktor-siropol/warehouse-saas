import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';

import { AppService } from './app.service.js';

import { AuditModule } from './audit/audit.module.js';

import { AuthModule } from './auth/auth.module.js';

import { BackgroundJobsModule } from './background-jobs/background-jobs.module.js';

import { CategoriesModule } from './categories/categories.module.js';

import { CustomersModule } from './customers/customers.module.js';

import { DataJobsModule } from './data-jobs/data-jobs.module.js';

import { HealthModule } from './health/health.module.js';

import { InventoryModule } from './inventory/inventory.module.js';

import { NotificationsModule } from './notifications/notifications.module.js';

import { ObservabilityModule } from './observability/observability.module.js';

import { OperationsModule } from './operations/operations.module.js';

import { OutboxModule } from './outbox/outbox.module.js';

import { PrismaModule } from './prisma/prisma.module.js';

import { ProductsModule } from './products/products.module.js';

import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module.js';

import { ReportsModule } from './reports/reports.module.js';

import { SalesOrdersModule } from './sales-orders/sales-orders.module.js';

import { StockMovementsModule } from './stock-movements/stock-movements.module.js';

import { SuppliersModule } from './suppliers/suppliers.module.js';

import { WarehousesModule } from './warehouses/warehouses.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    ObservabilityModule,

    PrismaModule,

    HealthModule,

    AuthModule,

    ProductsModule,

    CategoriesModule,

    WarehousesModule,

    InventoryModule,

    StockMovementsModule,

    SuppliersModule,

    PurchaseOrdersModule,

    CustomersModule,

    SalesOrdersModule,

    AuditModule,

    ReportsModule,

    NotificationsModule,

    BackgroundJobsModule,

    OutboxModule,

    DataJobsModule,

    OperationsModule,
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
