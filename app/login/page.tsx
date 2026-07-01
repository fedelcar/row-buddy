import { Suspense } from "react";
import { LoginForm } from "./login-form";

export const metadata = { title: "Sign in — Row Buddy" };

export default function LoginPage() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm">
        <div className="text-center">
          <span className="text-4xl" aria-hidden>
            🚣
          </span>
          <h1 className="mt-3 text-2xl font-bold text-ink">Row Buddy</h1>
          <p className="mt-1 text-sm text-ink-secondary">
            The team logbook. Welcome back, coach.
          </p>
        </div>
        <Suspense>
          <LoginForm />
        </Suspense>
      </div>
    </main>
  );
}
