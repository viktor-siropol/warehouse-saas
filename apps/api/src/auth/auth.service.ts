import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';

import { ConfigService } from '@nestjs/config';

import { JwtService } from '@nestjs/jwt';

import * as argon2 from 'argon2';

import { createHash, randomBytes, randomUUID } from 'node:crypto';

import { MembershipRole, Prisma } from '../generated/prisma/client.js';

import { PrismaService } from '../prisma/prisma.service.js';

import type { LoginDto } from './dto/login.dto.js';

import type { RegisterDto } from './dto/register.dto.js';

import type { AuthResponse, AuthTokens, AuthUser } from './types/auth.type.js';

const PASSWORD_HASH_OPTIONS = {
  type: argon2.argon2id,
  memoryCost: 19_456,
  timeCost: 2,
  parallelism: 1,
} as const;

/*
 * Bardzo krótki okres, w którym ponowne
 * przedstawienie właśnie obróconego tokenu
 * nie powoduje automatycznego revoke całej
 * rodziny.
 *
 * Chroni nas przed fałszywym "token theft"
 * przy równoległych requestach/retry.
 */
const REFRESH_REUSE_GRACE_MS = 10_000;

@Injectable()
export class AuthService {
  private readonly accessTokenTtlSeconds: number;

  private readonly refreshSessionTtlDays: number;

  constructor(
    private readonly prisma: PrismaService,

    private readonly jwtService: JwtService,

    private readonly configService: ConfigService,
  ) {
    this.accessTokenTtlSeconds = this.readPositiveInteger(
      'JWT_ACCESS_TTL_SECONDS',
    );

    this.refreshSessionTtlDays = this.readPositiveInteger(
      'REFRESH_SESSION_TTL_DAYS',
    );
  }

  async register(dto: RegisterDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const firstName = dto.firstName.trim();

    const lastName = dto.lastName.trim();

    const organizationName = dto.organizationName.trim();

    const organizationSlug = dto.organizationSlug.trim().toLowerCase();

    const passwordHash = await this.hashPassword(dto.password);

    let userId: string;

    try {
      const result = await this.prisma.$transaction(async (transaction) => {
        const user = await transaction.user.create({
          data: {
            email,
            firstName,
            lastName,
            passwordHash,
          },

          select: {
            id: true,
          },
        });

        const organization = await transaction.organization.create({
          data: {
            name: organizationName,

            slug: organizationSlug,
          },

          select: {
            id: true,
          },
        });

        await transaction.membership.create({
          data: {
            userId: user.id,

            organizationId: organization.id,

            role: MembershipRole.OWNER,
          },
        });

        return {
          userId: user.id,
        };
      });

      userId = result.userId;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'An account or organization with these identifiers already exists',
        );
      }

      throw error;
    }

    const tokens = await this.createFreshSession(userId);

    const user = await this.getMe(userId);

    return {
      user,
      tokens,
    };
  }

  async login(dto: LoginDto): Promise<AuthResponse> {
    const email = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: {
        email,
      },

      select: {
        id: true,
        passwordHash: true,
      },
    });

    if (!user) {
      await this.consumePasswordHashingTime(dto.password);

      throw this.invalidCredentials();
    }

    const passwordMatches = await argon2.verify(
      user.passwordHash,
      dto.password,
    );

    if (!passwordMatches) {
      throw this.invalidCredentials();
    }

    const tokens = await this.createFreshSession(user.id);

    const authUser = await this.getMe(user.id);

    return {
      user: authUser,
      tokens,
    };
  }

  async refresh(rawRefreshToken: string): Promise<AuthTokens> {
    const tokenHash = this.hashRefreshToken(rawRefreshToken);

    const session = await this.prisma.refreshSession.findUnique({
      where: {
        tokenHash,
      },

      select: {
        id: true,
        userId: true,
        familyId: true,
        expiresAt: true,
        revokedAt: true,
      },
    });

    if (!session) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const now = new Date();

    /*
     * Token już wcześniej obrócono.
     *
     * Bardzo świeży replay może być
     * skutkiem równoległego requestu
     * albo retry po utraconej odpowiedzi.
     *
     * Odrzucamy request, ale w krótkim
     * grace window nie niszczymy jeszcze
     * całej rodziny.
     */
    if (session.revokedAt) {
      const millisecondsSinceRevocation =
        now.getTime() - session.revokedAt.getTime();

      if (millisecondsSinceRevocation > REFRESH_REUSE_GRACE_MS) {
        await this.revokeFamily(session.familyId);
      }

      throw new UnauthorizedException('Invalid refresh token');
    }

    if (session.expiresAt <= now) {
      await this.prisma.refreshSession.updateMany({
        where: {
          id: session.id,
          revokedAt: null,
        },

        data: {
          revokedAt: now,
        },
      });

      throw new UnauthorizedException('Refresh token expired');
    }

    const nextRefreshToken = this.generateRefreshToken();

    const nextRefreshTokenHash = this.hashRefreshToken(nextRefreshToken);

    /*
     * Ważne:
     *
     * nie tworzymy:
     * "teraz + kolejne 30 dni".
     *
     * Nowy token dziedziczy absolutny
     * koniec całej sesji.
     */
    const nextRefreshExpiresAt = session.expiresAt;

    const accessToken = await this.signAccessToken(session.userId);

    const rotated = await this.prisma.$transaction(async (transaction) => {
      /*
       * Compare-and-set:
       *
       * tylko nadal aktywny token
       * może zostać zużyty.
       */
      const revokeResult = await transaction.refreshSession.updateMany({
        where: {
          id: session.id,

          revokedAt: null,

          expiresAt: {
            gt: now,
          },
        },

        data: {
          revokedAt: now,
        },
      });

      if (revokeResult.count !== 1) {
        return false;
      }

      await transaction.refreshSession.create({
        data: {
          userId: session.userId,

          familyId: session.familyId,

          tokenHash: nextRefreshTokenHash,

          expiresAt: nextRefreshExpiresAt,
        },
      });

      return true;
    });

    /*
     * Ktoś inny właśnie zdążył
     * zużyć dokładnie ten sam token.
     *
     * Nie tworzymy drugiej gałęzi
     * refresh-token family.
     *
     * Nie revoke'ujemy też od razu
     * całej rodziny, bo mógł to być
     * zwykły concurrent request.
     */
    if (!rotated) {
      throw new UnauthorizedException('Refresh token already used');
    }

    return {
      accessToken,

      refreshToken: nextRefreshToken,

      accessTokenExpiresInSeconds: this.accessTokenTtlSeconds,

      refreshTokenExpiresInSeconds: this.secondsUntil(nextRefreshExpiresAt),
    };
  }

  async logout(rawRefreshToken: string): Promise<void> {
    const tokenHash = this.hashRefreshToken(rawRefreshToken);

    await this.prisma.refreshSession.updateMany({
      where: {
        tokenHash,
        revokedAt: null,
      },

      data: {
        revokedAt: new Date(),
      },
    });
  }

  async getMe(userId: string): Promise<AuthUser> {
    const user = await this.prisma.user.findUnique({
      where: {
        id: userId,
      },

      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,

        memberships: {
          orderBy: {
            createdAt: 'asc',
          },

          select: {
            id: true,
            role: true,

            organization: {
              select: {
                id: true,
                name: true,
                slug: true,
              },
            },
          },
        },
      },
    });

    if (!user) {
      throw new UnauthorizedException('User no longer exists');
    }

    return user;
  }

  private async createFreshSession(userId: string): Promise<AuthTokens> {
    const familyId = randomUUID();

    const refreshToken = this.generateRefreshToken();

    const tokenHash = this.hashRefreshToken(refreshToken);

    const expiresAt = this.createRefreshExpiration();

    const accessToken = await this.signAccessToken(userId);

    await this.prisma.refreshSession.create({
      data: {
        userId,
        familyId,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken,

      accessTokenExpiresInSeconds: this.accessTokenTtlSeconds,

      refreshTokenExpiresInSeconds: this.secondsUntil(expiresAt),
    };
  }

  private signAccessToken(userId: string): Promise<string> {
    return this.jwtService.signAsync({
      sub: userId,
      type: 'access',
    });
  }

  private hashPassword(password: string): Promise<string> {
    return argon2.hash(password, PASSWORD_HASH_OPTIONS);
  }

  private async consumePasswordHashingTime(password: string): Promise<void> {
    await argon2.hash(password, PASSWORD_HASH_OPTIONS);
  }

  private generateRefreshToken(): string {
    return randomBytes(32).toString('base64url');
  }

  private hashRefreshToken(rawRefreshToken: string): string {
    return createHash('sha256').update(rawRefreshToken).digest('hex');
  }

  private createRefreshExpiration(): Date {
    return new Date(
      Date.now() + this.refreshSessionTtlDays * 24 * 60 * 60 * 1000,
    );
  }

  private secondsUntil(date: Date): number {
    return Math.max(1, Math.ceil((date.getTime() - Date.now()) / 1000));
  }

  private async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshSession.updateMany({
      where: {
        familyId,
        revokedAt: null,
      },

      data: {
        revokedAt: new Date(),
      },
    });
  }

  private invalidCredentials(): UnauthorizedException {
    return new UnauthorizedException('Invalid email or password');
  }

  private readPositiveInteger(key: string): number {
    const rawValue = this.configService.getOrThrow<string>(key);

    const value = Number(rawValue);

    if (!Number.isInteger(value) || value <= 0) {
      throw new Error(`${key} must be a positive integer`);
    }

    return value;
  }
}
