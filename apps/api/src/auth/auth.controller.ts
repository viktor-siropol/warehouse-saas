import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';

import { AuthRateLimit } from './decorators/auth-rate-limit.decorator.js';

import { CurrentUser } from './decorators/current-user.decorator.js';

import { Public } from './decorators/public.decorator.js';

import { LoginDto } from './dto/login.dto.js';

import { RefreshTokenDto } from './dto/refresh-token.dto.js';

import { RegisterDto } from './dto/register.dto.js';

import { AuthRateLimitGuard } from './guards/auth-rate-limit.guard.js';

import { AuthService } from './auth.service.js';

import type { AuthenticatedUser } from './types/auth.type.js';

@Controller('auth')
@UseGuards(AuthRateLimitGuard)
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @AuthRateLimit({
    name: 'register',
    limit: 3,
    durationSeconds: 60,
    keyBy: 'email',
  })
  register(
    @Body()
    dto: RegisterDto,
  ) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @AuthRateLimit({
    name: 'login',
    limit: 5,
    durationSeconds: 60,
    keyBy: 'email',
  })
  login(
    @Body()
    dto: LoginDto,
  ) {
    return this.authService.login(dto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  refresh(
    @Body()
    dto: RefreshTokenDto,
  ) {
    return this.authService.refresh(dto.refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  async logout(
    @Body()
    dto: RefreshTokenDto,
  ): Promise<void> {
    await this.authService.logout(dto.refreshToken);
  }

  @Get('me')
  me(
    @CurrentUser()
    user: AuthenticatedUser,
  ) {
    return this.authService.getMe(user.id);
  }
}
