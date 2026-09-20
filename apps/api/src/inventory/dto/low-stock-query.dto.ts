import { Type } from 'class-transformer';

import { IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class LowStockQueryDto {
  @IsOptional()
  @IsUUID()
  warehouseId?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
