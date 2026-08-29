import { Test, TestingModule } from '@nestjs/testing';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { AppController } from './app.controller.js';
import { PrismaService } from './prisma/prisma.service.js';

describe('AppController', () => {
  let controller: AppController;

  const prismaMock = {
    user: {
      count: vi.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
      providers: [
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
      ],
    }).compile();

    controller = module.get<AppController>(AppController);

    vi.clearAllMocks();
  });

  it('should report a healthy database connection', async () => {
    prismaMock.user.count.mockResolvedValue(0);

    const result = await controller.databaseHealth();

    expect(prismaMock.user.count).toHaveBeenCalledOnce();

    expect(result).toEqual({
      status: 'ok',
      database: 'connected',
      users: 0,
    });
  });
});
