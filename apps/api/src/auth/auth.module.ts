import { Module } from '@nestjs/common';

import { ConfigModule, ConfigService } from '@nestjs/config';

import { APP_GUARD } from '@nestjs/core';

import { JwtModule } from '@nestjs/jwt';

import { PrismaModule } from '../prisma/prisma.module.js';

import { AuthController } from './auth.controller.js';

import { AuthService } from './auth.service.js';

import { AuthGuard } from './guards/auth.guard.js';

import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard.js';

import { OrganizationMembershipGuard } from './guards/organization-membership.guard.js';

import { RolesGuard } from './guards/roles.guard.js';

@Module({
  imports: [
    PrismaModule,

    JwtModule.registerAsync({
      global: true,

      imports: [ConfigModule],

      inject: [ConfigService],

      useFactory: (configService: ConfigService) => ({
        secret: configService.getOrThrow<string>('JWT_ACCESS_SECRET'),

        signOptions: {
          algorithm: 'HS256',

          issuer: configService.getOrThrow<string>('JWT_ISSUER'),

          audience: configService.getOrThrow<string>('JWT_AUDIENCE'),

          expiresIn: Number(
            configService.getOrThrow<string>('JWT_ACCESS_TTL_SECONDS'),
          ),
        },
      }),
    }),
  ],

  controllers: [AuthController],

  providers: [
    AuthService,

    AuthRateLimitGuard,
    OrganizationMembershipGuard,
    RolesGuard,

    {
      provide: APP_GUARD,
      useClass: AuthGuard,
    },
  ],

  exports: [OrganizationMembershipGuard, RolesGuard],
})
export class AuthModule {}
