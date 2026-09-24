import { IsString, IsUUID, Matches } from 'class-validator';

import { UNSIGNED_STOCK_DECIMAL_PATTERN } from '../../inventory/dto/decimal-patterns.js';

import { UNSIGNED_MONEY_DECIMAL_PATTERN } from './money-patterns.js';

export class AddSalesOrderItemDto {
  @IsUUID()
  productId!: string;

  @IsString()
  @Matches(UNSIGNED_STOCK_DECIMAL_PATTERN)
  orderedQuantity!: string;

  @IsString()
  @Matches(UNSIGNED_MONEY_DECIMAL_PATTERN)
  unitPrice!: string;
}
