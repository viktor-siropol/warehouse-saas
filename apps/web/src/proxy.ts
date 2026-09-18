import { NextResponse } from "next/server";

import type { NextRequest } from "next/server";

import type { AuthTokens } from "@/features/auth/types";

import {
  ACCESS_COOKIE_NAME,
  accessCookieOptions,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions,
} from "@/lib/auth/cookie-config";

function getApiUrl(): string | null {
  const apiUrl = process.env.API_URL;

  if (!apiUrl) {
    return null;
  }

  return apiUrl.replace(/\/+$/, "");
}

function redirectToLogin(request: NextRequest) {
  const response = NextResponse.redirect(new URL("/login", request.url));

  response.cookies.delete(ACCESS_COOKIE_NAME);

  response.cookies.delete(REFRESH_COOKIE_NAME);

  return response;
}

function isAuthTokens(value: unknown): value is AuthTokens {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  if (
    !("accessToken" in value) ||
    !("refreshToken" in value) ||
    !("accessTokenExpiresInSeconds" in value) ||
    !("refreshTokenExpiresInSeconds" in value)
  ) {
    return false;
  }

  return (
    typeof value.accessToken === "string" &&
    typeof value.refreshToken === "string" &&
    typeof value.accessTokenExpiresInSeconds === "number" &&
    typeof value.refreshTokenExpiresInSeconds === "number"
  );
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_COOKIE_NAME)?.value;

  if (accessToken) {
    return NextResponse.next();
  }

  const refreshToken = request.cookies.get(REFRESH_COOKIE_NAME)?.value;

  if (!refreshToken) {
    return redirectToLogin(request);
  }

  const apiUrl = getApiUrl();

  if (!apiUrl) {
    return new NextResponse("API_URL is not configured", {
      status: 500,
    });
  }

  let refreshResponse: Response;

  try {
    refreshResponse = await fetch(`${apiUrl}/auth/refresh`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Accept: "application/json",
      },

      body: JSON.stringify({
        refreshToken,
      }),

      cache: "no-store",
    });
  } catch {
    return new NextResponse("Authentication service unavailable", {
      status: 503,
    });
  }

  if (refreshResponse.status === 401 || refreshResponse.status === 403) {
    return redirectToLogin(request);
  }

  if (!refreshResponse.ok) {
    return new NextResponse("Authentication service unavailable", {
      status: 503,
    });
  }

  let body: unknown;

  try {
    body = await refreshResponse.json();
  } catch {
    return new NextResponse("Invalid authentication response", {
      status: 502,
    });
  }

  if (!isAuthTokens(body)) {
    return new NextResponse("Invalid authentication response", {
      status: 502,
    });
  }

  /*
   * Zmieniamy cookies bieżącego
   * requestu, aby Server Component /
   * Server Action dalej w pipeline
   * widziały nową parę tokenów.
   */
  request.cookies.set(ACCESS_COOKIE_NAME, body.accessToken);

  request.cookies.set(REFRESH_COOKIE_NAME, body.refreshToken);

  /*
   * Zapisujemy również cookies
   * w outgoing response, aby browser
   * zachował je dla kolejnych
   * requestów.
   */
  const response = NextResponse.next();

  response.cookies.set(
    ACCESS_COOKIE_NAME,
    body.accessToken,
    accessCookieOptions(body.accessTokenExpiresInSeconds),
  );

  response.cookies.set(
    REFRESH_COOKIE_NAME,
    body.refreshToken,
    refreshCookieOptions(body.refreshTokenExpiresInSeconds),
  );

  return response;
}

export const config = {
  matcher: ["/organizations/:path*"],
};
