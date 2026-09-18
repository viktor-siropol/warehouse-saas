import { Test, type TestingModule } from '@nestjs/testing';

import { ConfigService } from '@nestjs/config';

import { JwtService } from '@nestjs/jwt';

import { PrismaService } from '../prisma/prisma.service.js';

import { AuthService } from './auth.service.js';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,

        {
          provide: PrismaService,

          useValue: {},
        },

        {
          provide: JwtService,

          useValue: {
            signAsync: () => Promise.resolve('test-access-token'),
          },
        },

        {
          provide: ConfigService,

          useValue: {
            getOrThrow: (key: string) => {
              const values: Record<string, string> = {
                JWT_ACCESS_TTL_SECONDS: '900',

                REFRESH_SESSION_TTL_DAYS: '30',
              };

              const value = values[key];

              if (!value) {
                throw new Error(`Missing test config: ${key}`);
              }

              return value;
            },
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
