import {
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateSalesOrderDto {
  @IsUUID()
  customerId!: string;

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
