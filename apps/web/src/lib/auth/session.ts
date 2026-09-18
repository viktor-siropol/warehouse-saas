import "server-only";

import { cookies } from "next/headers";

import type { AuthTokens } from "@/features/auth/types";

import {
  ACCESS_COOKIE_NAME,
  accessCookieOptions,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from "./cookie-config";

export async function setAuthCookies(tokens: AuthTokens): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.set(
    ACCESS_COOKIE_NAME,
    tokens.accessToken,
    accessCookieOptions(tokens.accessTokenExpiresInSeconds),
  );

  cookieStore.set(
    REFRESH_COOKIE_NAME,
    tokens.refreshToken,
    refreshCookieOptions(tokens.refreshTokenExpiresInSeconds),
  );
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete(ACCESS_COOKIE_NAME);

  cookieStore.delete(REFRESH_COOKIE_NAME);
}

export async function getAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();

  return cookieStore.get(ACCESS_COOKIE_NAME)?.value;
}

export async function getRefreshToken(): Promise<string | undefined> {
  const cookieStore = await cookies();

  return cookieStore.get(REFRESH_COOKIE_NAME)?.value;
}
