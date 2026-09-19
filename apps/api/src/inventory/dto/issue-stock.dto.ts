import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

import { UNSIGNED_STOCK_DECIMAL_PATTERN } from './decimal-patterns.js';

export class IssueStockDto {
  @IsUUID()
  productId!: string;

  @IsString()
  @Matches(UNSIGNED_STOCK_DECIMAL_PATTERN, {
    message:
      'quantity must be a decimal with up to 15 integer digits and 3 decimal places',
  })
  quantity!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  note?: string;
}
