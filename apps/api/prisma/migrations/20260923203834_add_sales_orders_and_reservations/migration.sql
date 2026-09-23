-- CreateEnum
CREATE TYPE "SalesOrderStatus" AS ENUM ('DRAFT', 'CONFIRMED', 'PARTIALLY_RESERVED', 'RESERVED', 'PARTIALLY_FULFILLED', 'FULFILLED', 'CANCELLED');

-- AlterTable
ALTER TABLE "Inventory" ADD COLUMN     "reservedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "salesFulfillmentId" UUID;

-- CreateTable
CREATE TABLE "Customer" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "contactName" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "shippingAddress" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrder" (
    "id" UUID NOT NULL,
    "organizationId" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "createdById" UUID,
    "number" TEXT NOT NULL,
    "status" "SalesOrderStatus" NOT NULL DEFAULT 'DRAFT',
    "currency" VARCHAR(3) NOT NULL,
    "note" TEXT,
    "customerNameSnapshot" TEXT NOT NULL,
    "shippingAddressSnapshot" TEXT,
    "confirmedAt" TIMESTAMP(3),
    "fulfilledAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrder_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesOrderItem" (
    "id" UUID NOT NULL,
    "salesOrderId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "orderedQuantity" DECIMAL(18,3) NOT NULL,
    "reservedQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "fulfilledQuantity" DECIMAL(18,3) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(18,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesOrderItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesFulfillment" (
    "id" UUID NOT NULL,
    "salesOrderId" UUID NOT NULL,
    "warehouseId" UUID NOT NULL,
    "fulfilledById" UUID,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesFulfillment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesFulfillmentItem" (
    "id" UUID NOT NULL,
    "fulfillmentId" UUID NOT NULL,
    "salesOrderItemId" UUID NOT NULL,
    "quantity" DECIMAL(18,3) NOT NULL,

    CONSTRAINT "SalesFulfillmentItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Customer_organizationId_isActive_idx" ON "Customer"("organizationId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_organizationId_code_key" ON "Customer"("organizationId", "code");

-- CreateIndex
CREATE INDEX "SalesOrder_organizationId_status_idx" ON "SalesOrder"("organizationId", "status");

-- CreateIndex
CREATE INDEX "SalesOrder_customerId_idx" ON "SalesOrder"("customerId");

-- CreateIndex
CREATE INDEX "SalesOrder_warehouseId_status_idx" ON "SalesOrder"("warehouseId", "status");

-- CreateIndex
CREATE INDEX "SalesOrder_createdById_idx" ON "SalesOrder"("createdById");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrder_organizationId_number_key" ON "SalesOrder"("organizationId", "number");

-- CreateIndex
CREATE INDEX "SalesOrderItem_productId_idx" ON "SalesOrderItem"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesOrderItem_salesOrderId_productId_key" ON "SalesOrderItem"("salesOrderId", "productId");

-- CreateIndex
CREATE INDEX "SalesFulfillment_salesOrderId_createdAt_idx" ON "SalesFulfillment"("salesOrderId", "createdAt");

-- CreateIndex
CREATE INDEX "SalesFulfillment_warehouseId_idx" ON "SalesFulfillment"("warehouseId");

-- CreateIndex
CREATE INDEX "SalesFulfillment_fulfilledById_idx" ON "SalesFulfillment"("fulfilledById");

-- CreateIndex
CREATE INDEX "SalesFulfillmentItem_salesOrderItemId_idx" ON "SalesFulfillmentItem"("salesOrderItemId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesFulfillmentItem_fulfillmentId_salesOrderItemId_key" ON "SalesFulfillmentItem"("fulfillmentId", "salesOrderItemId");

-- CreateIndex
CREATE INDEX "StockMovement_salesFulfillmentId_idx" ON "StockMovement"("salesFulfillmentId");

-- AddForeignKey
ALTER TABLE "StockMovement" ADD CONSTRAINT "StockMovement_salesFulfillmentId_fkey" FOREIGN KEY ("salesFulfillmentId") REFERENCES "SalesFulfillment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrder" ADD CONSTRAINT "SalesOrder_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesOrderItem" ADD CONSTRAINT "SalesOrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFulfillment" ADD CONSTRAINT "SalesFulfillment_salesOrderId_fkey" FOREIGN KEY ("salesOrderId") REFERENCES "SalesOrder"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFulfillment" ADD CONSTRAINT "SalesFulfillment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFulfillment" ADD CONSTRAINT "SalesFulfillment_fulfilledById_fkey" FOREIGN KEY ("fulfilledById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFulfillmentItem" ADD CONSTRAINT "SalesFulfillmentItem_fulfillmentId_fkey" FOREIGN KEY ("fulfillmentId") REFERENCES "SalesFulfillment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesFulfillmentItem" ADD CONSTRAINT "SalesFulfillmentItem_salesOrderItemId_fkey" FOREIGN KEY ("salesOrderItemId") REFERENCES "SalesOrderItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Inventory"
ADD CONSTRAINT "Inventory_reservedQuantity_nonnegative"
CHECK ("reservedQuantity" >= 0);

ALTER TABLE "Inventory"
ADD CONSTRAINT "Inventory_reserved_not_over_quantity"
CHECK ("reservedQuantity" <= "quantity");

ALTER TABLE "SalesOrderItem"
ADD CONSTRAINT "SalesOrderItem_orderedQuantity_positive"
CHECK ("orderedQuantity" > 0);

ALTER TABLE "SalesOrderItem"
ADD CONSTRAINT "SalesOrderItem_reservedQuantity_nonnegative"
CHECK ("reservedQuantity" >= 0);

ALTER TABLE "SalesOrderItem"
ADD CONSTRAINT "SalesOrderItem_fulfilledQuantity_nonnegative"
CHECK ("fulfilledQuantity" >= 0);

ALTER TABLE "SalesOrderItem"
ADD CONSTRAINT "SalesOrderItem_reserved_fulfilled_not_over_ordered"
CHECK (
  "reservedQuantity" + "fulfilledQuantity"
  <= "orderedQuantity"
);

ALTER TABLE "SalesOrderItem"
ADD CONSTRAINT "SalesOrderItem_unitPrice_nonnegative"
CHECK ("unitPrice" >= 0);

ALTER TABLE "SalesFulfillmentItem"
ADD CONSTRAINT "SalesFulfillmentItem_quantity_positive"
CHECK ("quantity" > 0);
