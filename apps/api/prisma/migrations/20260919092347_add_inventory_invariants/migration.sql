-- AlterTable
ALTER TABLE "StockMovement" ADD COLUMN     "operationId" UUID;

-- CreateIndex
CREATE INDEX "StockMovement_operationId_idx" ON "StockMovement"("operationId");

ALTER TABLE "Inventory"
ADD CONSTRAINT "Inventory_quantity_nonnegative"
CHECK ("quantity" >= 0);

ALTER TABLE "Inventory"
ADD CONSTRAINT "Inventory_reorderPoint_nonnegative"
CHECK ("reorderPoint" >= 0);

ALTER TABLE "StockMovement"
ADD CONSTRAINT "StockMovement_delta_nonzero"
CHECK ("delta" <> 0);
