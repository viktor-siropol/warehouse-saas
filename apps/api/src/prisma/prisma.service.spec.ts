import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaService } from './prisma.service.js';

describe('PrismaService', () => {
  let service: PrismaService;

  const getOrThrowMock = vi.fn();

  beforeEach(async () => {
    getOrThrowMock.mockReset();

    getOrThrowMock.mockReturnValue(
      'postgresql://warehouse:warehouse_password@localhost:5432/warehouse_db',
    );

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrismaService,
        {
          provide: ConfigService,
          useValue: {
            getOrThrow: getOrThrowMock,
          },
        },
      ],
    }).compile();

    service = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should read DATABASE_URL from ConfigService', () => {
    expect(getOrThrowMock).toHaveBeenCalledWith('DATABASE_URL');
  });
});
