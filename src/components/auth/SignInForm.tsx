"use client";

import Link from "next/link";
import { Code2, Loader2, LogIn, X } from "lucide-react";
import { signIn } from "next-auth/react";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  getRegistrationSuccessToastMessage,
  getSignInErrorMessage,
  validateSignInForm,
  type SignInFormErrors,
} from "@/lib/auth/form-validation";

export function SignInForm({
  callbackUrl = "/dashboard",
  initialError,
  registered = false,
}: {
  callbackUrl?: string;
  initialError?: string | null;
  registered?: boolean;
}) {
  const [errors, setErrors] = useState<SignInFormErrors>({});
  const [formError, setFormError] = useState<string | null>(
    getSignInErrorMessage(initialError),
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(
    getRegistrationSuccessToastMessage(registered),
  );

  useEffect(() => {
    if (!toastMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setToastMessage(null), 7000);

    return () => window.clearTimeout(timeout);
  }, [toastMessage]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const validation = validateSignInForm({
      email: formData.get("email"),
      password: formData.get("password"),
    });

    if (!validation.ok) {
      setErrors(validation.errors);
      setFormError(null);
      return;
    }

    setErrors({});
    setFormError(null);
    setIsSubmitting(true);

    try {
      await signIn("credentials", {
        email: validation.data.email,
        password: validation.data.password,
        callbackUrl,
        redirect: true,
      });
    } catch {
      setIsSubmitting(false);
      setFormError("Unable to sign in. Try again.");
    }
  }

  return (
    <>
      {toastMessage ? (
        <div
          aria-live="polite"
          className="fixed left-4 right-4 top-4 z-50 rounded-lg border border-emerald-400/30 bg-[#092018] px-4 py-3 text-sm text-emerald-100 shadow-2xl shadow-black/30 sm:left-auto sm:w-96"
          role="status"
        >
          <div className="flex items-start gap-3">
            <p className="min-w-0 flex-1">{toastMessage}</p>
            <button
              aria-label="Dismiss notification"
              className="rounded-md p-1 text-emerald-100/80 transition hover:bg-white/10 hover:text-emerald-50"
              onClick={() => setToastMessage(null)}
              type="button"
            >
              <X aria-hidden="true" className="size-4" />
            </button>
          </div>
        </div>
      ) : null}

      <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-white">Sign in</h2>
        <p className="text-sm text-muted-foreground">
          Use your DevStash account or continue with GitHub.
        </p>
      </div>

      {formError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">
          {formError}
        </p>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-200" htmlFor="email">
          Email
        </label>
        <Input
          aria-invalid={Boolean(errors.email)}
          autoComplete="email"
          className="h-11 border-devstash-line bg-white/[0.04]"
          id="email"
          name="email"
          type="email"
        />
        {errors.email ? (
          <p className="text-sm text-red-200">{errors.email}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-200" htmlFor="password">
          Password
        </label>
        <Input
          aria-invalid={Boolean(errors.password)}
          autoComplete="current-password"
          className="h-11 border-devstash-line bg-white/[0.04]"
          id="password"
          name="password"
          type="password"
        />
        {errors.password ? (
          <p className="text-sm text-red-200">{errors.password}</p>
        ) : null}
      </div>

      <Button
        className="h-11 w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <LogIn aria-hidden="true" className="size-4" />
        )}
        Sign in
      </Button>

      <Button
        className="h-11 w-full gap-2 border-devstash-line bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
        onClick={() => signIn("github", { callbackUrl })}
        type="button"
        variant="outline"
      >
        <Code2 aria-hidden="true" className="size-4" />
        Sign in with GitHub
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        New to DevStash?{" "}
        <Link
          className="font-medium text-emerald-300 hover:text-emerald-200"
          href={`/register?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        >
          Create an account
        </Link>
      </p>
      </form>
    </>
  );
}
