import { Type } from 'class-transformer';

import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class StockMovementsQueryDto {
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @IsUUID()
  productId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
