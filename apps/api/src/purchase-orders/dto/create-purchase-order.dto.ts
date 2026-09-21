import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreatePurchaseOrderDto {
  @IsUUID()
  supplierId!: string;

  @IsUUID()
  warehouseId!: string;

  @IsString()
  @Matches(/^[A-Za-z]{3}$/, {
    message: 'currency must contain exactly 3 letters',
  })
  currency!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  note?: string;
}
