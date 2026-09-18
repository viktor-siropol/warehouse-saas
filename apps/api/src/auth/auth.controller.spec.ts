import { Test, type TestingModule } from '@nestjs/testing';

import { AuthController } from './auth.controller.js';

import { AuthService } from './auth.service.js';

describe('AuthController', () => {
  let controller: AuthController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],

      providers: [
        {
          provide: AuthService,

          useValue: {
            register: () => undefined,

            login: () => undefined,

            refresh: () => undefined,

            logout: () => undefined,

            getMe: () => undefined,
          },
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
