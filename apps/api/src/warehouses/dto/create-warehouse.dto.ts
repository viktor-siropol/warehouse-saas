import {
  IsOptional,
  IsString,
  Length,
  Matches,
  MaxLength,
} from 'class-validator';

export class CreateWarehouseDto {
  @IsString()
  @Length(2, 100)
  name!: string;

  @IsString()
  @Length(2, 30)
  @Matches(/^[A-Za-z0-9]+(?:-[A-Za-z0-9]+)*$/, {
    message: 'code may contain letters, numbers and hyphens',
  })
  code!: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string;
}
