import { Type } from 'class-transformer';

import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

import { DataJobStatus, DataJobType } from '../../generated/prisma/client.js';

export class DataJobQueryDto {
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 50;

  @IsOptional()
  @IsUUID()
  cursor?: string;

  @IsOptional()
  @IsEnum(DataJobStatus)
  status?: DataJobStatus;

  @IsOptional()
  @IsEnum(DataJobType)
  type?: DataJobType;
}
