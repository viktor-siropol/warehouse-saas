"use client";

import { useActionState } from "react";

import { registerAction } from "../actions";

import type { AuthActionState } from "../types";

const initialState: AuthActionState = {
  error: null,
};

export function RegisterForm() {
  const [state, action, isPending] = useActionState(
    registerAction,
    initialState,
  );

  return (
    <form action={action}>
      <h1>Create account</h1>

      <div>
        <label htmlFor="firstName">First name</label>

        <input id="firstName" name="firstName" required maxLength={100} />
      </div>

      <div>
        <label htmlFor="lastName">Last name</label>

        <input id="lastName" name="lastName" required maxLength={100} />
      </div>

      <div>
        <label htmlFor="email">Email</label>

        <input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
        />
      </div>

      <div>
        <label htmlFor="password">Password</label>

        <input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          minLength={15}
          maxLength={128}
          required
        />
      </div>

      <div>
        <label htmlFor="organizationName">Organization name</label>

        <input
          id="organizationName"
          name="organizationName"
          minLength={2}
          maxLength={200}
          required
        />
      </div>

      <div>
        <label htmlFor="organizationSlug">Organization slug</label>

        <input
          id="organizationSlug"
          name="organizationSlug"
          minLength={3}
          maxLength={63}
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          placeholder="example-company"
          required
        />
      </div>

      {state.error && <p role="alert">{state.error}</p>}

      <button type="submit" disabled={isPending}>
        {isPending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}
