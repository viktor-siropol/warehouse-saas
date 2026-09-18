"use server";

import { redirect } from "next/navigation";

import {
  clearAuthCookies,
  getRefreshToken,
  setAuthCookies,
} from "@/lib/auth/session";

import { ApiError, publicApiFetch } from "@/lib/api/server-api";

import type { AuthActionState, AuthResponse } from "./types";

export async function loginAction(
  _previousState: AuthActionState,

  formData: FormData,
): Promise<AuthActionState> {
  const email = String(formData.get("email") ?? "");

  const password = String(formData.get("password") ?? "");

  let response: AuthResponse;

  try {
    response = await publicApiFetch<AuthResponse>("/auth/login", {
      method: "POST",

      body: JSON.stringify({
        email,
        password,
      }),
    });
  } catch (error) {
    return {
      error:
        error instanceof ApiError ? error.message : "Unexpected login error",
    };
  }

  await setAuthCookies(response.tokens);

  redirect("/organizations");
}

export async function registerAction(
  _previousState: AuthActionState,

  formData: FormData,
): Promise<AuthActionState> {
  const firstName = String(formData.get("firstName") ?? "");

  const lastName = String(formData.get("lastName") ?? "");

  const email = String(formData.get("email") ?? "");

  const password = String(formData.get("password") ?? "");

  const organizationName = String(formData.get("organizationName") ?? "");

  const organizationSlug = String(formData.get("organizationSlug") ?? "");

  let response: AuthResponse;

  try {
    response = await publicApiFetch<AuthResponse>("/auth/register", {
      method: "POST",

      body: JSON.stringify({
        firstName,
        lastName,
        email,
        password,
        organizationName,
        organizationSlug,
      }),
    });
  } catch (error) {
    return {
      error:
        error instanceof ApiError
          ? error.message
          : "Unexpected registration error",
    };
  }

  await setAuthCookies(response.tokens);

  redirect("/organizations");
}

export async function logoutAction(): Promise<void> {
  const refreshToken = await getRefreshToken();

  if (refreshToken) {
    try {
      await publicApiFetch<void>("/auth/logout", {
        method: "POST",

        body: JSON.stringify({
          refreshToken,
        }),
      });
    } catch {
    }
  }

  await clearAuthCookies();

  redirect("/login");
}
