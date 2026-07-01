"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import { login, type LoginState } from "@/app/actions/auth";

const inputClass =
  "w-full rounded-lg border border-hairline bg-surface-1 px-3 py-3 text-base text-ink " +
  "placeholder:text-ink-muted focus:outline-none focus:ring-2 focus:ring-accent";

export function LoginForm() {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, {});
  const from = useSearchParams().get("from") ?? "";

  return (
    <form action={action} className="mt-8 space-y-4">
      <input type="hidden" name="from" value={from} />
      <label className="block">
        <span className="mb-1 block text-sm text-ink-secondary">Username</span>
        <input
          name="username"
          defaultValue={state.username}
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          className={inputClass}
          required
        />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm text-ink-secondary">Password</span>
        <input
          name="password"
          type="password"
          autoComplete="current-password"
          className={inputClass}
          required
        />
      </label>
      {state.error && (
        <p role="alert" className="text-sm text-delta-bad">
          {state.error}
        </p>
      )}
      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-accent px-4 py-3 text-base font-medium text-accent-ink hover:opacity-90 disabled:opacity-60"
      >
        {pending ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
