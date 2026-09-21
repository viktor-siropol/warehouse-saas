import { Type } from 'class-transformer';

import {
  ArrayMinSize,
  IsArray,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { UNSIGNED_STOCK_DECIMAL_PATTERN } from '../../inventory/dto/decimal-patterns.js';

export class ReceivePurchaseOrderLineDto {
  @IsUUID()
  purchaseOrderItemId!: string;

  @IsString()
  @Matches(UNSIGNED_STOCK_DECIMAL_PATTERN)
  quantity!: string;
}

export class ReceivePurchaseOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(() => ReceivePurchaseOrderLineDto)
  items!: ReceivePurchaseOrderLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
