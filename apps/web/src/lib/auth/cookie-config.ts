export const ACCESS_COOKIE_NAME = "warehouse_access";

export const REFRESH_COOKIE_NAME = "warehouse_refresh";

const ACCESS_COOKIE_SAFETY_SECONDS = 5;

function baseCookieOptions(maxAgeSeconds: number) {
  return {
    httpOnly: true,

    secure: process.env.NODE_ENV === "production",

    sameSite: "lax" as const,

    path: "/",

    maxAge: maxAgeSeconds,

    priority: "high" as const,
  };
}

export function accessCookieOptions(accessTokenTtlSeconds: number) {
  return baseCookieOptions(
    Math.max(1, accessTokenTtlSeconds - ACCESS_COOKIE_SAFETY_SECONDS),
  );
}

export function refreshCookieOptions(refreshTokenTtlSeconds: number) {
  return baseCookieOptions(refreshTokenTtlSeconds);
}
