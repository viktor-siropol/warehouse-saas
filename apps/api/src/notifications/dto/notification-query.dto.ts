import { Type } from 'class-transformer';

import { IsIn, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export class NotificationQueryDto {
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
  @IsIn(['true', 'false'])
  unreadOnly?: 'true' | 'false';
}
