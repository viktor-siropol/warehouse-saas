import { IsString, Matches } from 'class-validator';

import { UNSIGNED_STOCK_DECIMAL_PATTERN } from './decimal-patterns.js';

export class SetReorderPointDto {
  @IsString()
  @Matches(UNSIGNED_STOCK_DECIMAL_PATTERN, {
    message:
      'reorderPoint must be a decimal with up to 15 integer digits and 3 decimal places',
  })
  reorderPoint!: string;
}
