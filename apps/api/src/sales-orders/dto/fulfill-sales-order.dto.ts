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

export class FulfillSalesOrderLineDto {
  @IsUUID()
  salesOrderItemId!: string;

  @IsString()
  @Matches(UNSIGNED_STOCK_DECIMAL_PATTERN)
  quantity!: string;
}

export class FulfillSalesOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(() => FulfillSalesOrderLineDto)
  items!: FulfillSalesOrderLineDto[];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
