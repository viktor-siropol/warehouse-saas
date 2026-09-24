import { Module } from '@nestjs/common';

import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller.js';

import { AppService } from './app.service.js';

import { AuthModule } from './auth/auth.module.js';

import { CategoriesModule } from './categories/categories.module.js';

import { CustomersModule } from './customers/customers.module.js';

import { InventoryModule } from './inventory/inventory.module.js';

import { PrismaModule } from './prisma/prisma.module.js';

import { ProductsModule } from './products/products.module.js';

import { PurchaseOrdersModule } from './purchase-orders/purchase-orders.module.js';

import { SalesOrdersModule } from './sales-orders/sales-orders.module.js';

import { StockMovementsModule } from './stock-movements/stock-movements.module.js';

import { SuppliersModule } from './suppliers/suppliers.module.js';

import { WarehousesModule } from './warehouses/warehouses.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
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
  ],

  controllers: [AppController],

  providers: [AppService],
})
export class AppModule {}
