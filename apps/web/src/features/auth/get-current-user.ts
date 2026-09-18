import "server-only";

import { cache } from "react";

import { redirect } from "next/navigation";

import { ApiError, authenticatedApiFetch } from "@/lib/api/server-api";

import type { AuthUser } from "./types";

export const getCurrentUser = cache(async (): Promise<AuthUser> => {
  try {
    return await authenticatedApiFetch<AuthUser>("/auth/me");
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      redirect("/login");
    }

    throw error;
  }
});
