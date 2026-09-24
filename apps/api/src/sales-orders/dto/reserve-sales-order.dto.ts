import { Type } from 'class-transformer';

import {
  ArrayMinSize,
  IsArray,
  IsString,
  IsUUID,
  Matches,
  ValidateNested,
} from 'class-validator';

import { UNSIGNED_STOCK_DECIMAL_PATTERN } from '../../inventory/dto/decimal-patterns.js';

export class ReserveSalesOrderLineDto {
  @IsUUID()
  salesOrderItemId!: string;

  @IsString()
  @Matches(UNSIGNED_STOCK_DECIMAL_PATTERN)
  quantity!: string;
}

export class ReserveSalesOrderDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({
    each: true,
  })
  @Type(() => ReserveSalesOrderLineDto)
  items!: ReserveSalesOrderLineDto[];
}
