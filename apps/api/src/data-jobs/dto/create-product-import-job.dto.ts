import { IsString, Matches, MaxLength } from 'class-validator';

import { MAX_PRODUCT_IMPORT_CHARACTERS } from '../data-job.constants.js';

export class CreateProductImportJobDto {
  @IsString()
  @MaxLength(255)
  @Matches(/\.csv$/i, {
    message: 'fileName must end with .csv',
  })
  fileName!: string;

  @IsString()
  @MaxLength(MAX_PRODUCT_IMPORT_CHARACTERS)
  csv!: string;
}
