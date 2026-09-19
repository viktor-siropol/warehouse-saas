import { IsString, IsUUID, Length, Matches } from 'class-validator';

import { SIGNED_STOCK_DECIMAL_PATTERN } from './decimal-patterns.js';

export class AdjustStockDto {
  @IsUUID()
  productId!: string;

  @IsString()
  @Matches(SIGNED_STOCK_DECIMAL_PATTERN, {
    message:
      'delta must be a signed decimal with up to 15 integer digits and 3 decimal places',
  })
  delta!: string;

  @IsString()
  @Length(3, 500)
  note!: string;
}
