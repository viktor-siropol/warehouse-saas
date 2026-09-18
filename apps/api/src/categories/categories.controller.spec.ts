import { Test, type TestingModule } from '@nestjs/testing';

import { beforeEach, describe, expect, it, vi } from 'vitest';

import { OrganizationMembershipGuard } from '../auth/guards/organization-membership.guard.js';

import { CategoriesController } from './categories.controller.js';

import { CategoriesService } from './categories.service.js';

describe('CategoriesController', () => {
  let controller: CategoriesController;

  const findAllMock = vi.fn();

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategoriesController],

      providers: [
        {
          provide: CategoriesService,

          useValue: {
            findAll: findAllMock,
          },
        },
      ],
    })
      .overrideGuard(OrganizationMembershipGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    controller = module.get<CategoriesController>(CategoriesController);
  });

  describe('findAll', () => {
    it('should pass organizationId to CategoriesService', () => {
      const organizationId = '550e8400-e29b-41d4-a716-446655440000';

      controller.findAll(organizationId);

      expect(findAllMock).toHaveBeenCalledTimes(1);

      expect(findAllMock).toHaveBeenCalledWith(organizationId);
    });
  });
});
