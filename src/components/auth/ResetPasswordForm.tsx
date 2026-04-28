"use client";

import Link from "next/link";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  validateResetPasswordForm,
  type ResetPasswordFormErrors,
} from "@/lib/auth/form-validation";

type ResetPasswordResponse = {
  success: boolean;
  error?: string;
  message?: string;
  resetStatus?: string;
};

export function ResetPasswordForm({
  email,
  token,
}: {
  email?: string;
  token?: string;
}) {
  const router = useRouter();
  const resetLinkIsValid = Boolean(email && token);
  const [errors, setErrors] = useState<ResetPasswordFormErrors>({});
  const [formError, setFormError] = useState<string | null>(
    resetLinkIsValid ? null : "Password reset link is invalid.",
  );
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!resetLinkIsValid) {
      setFormError("Password reset link is invalid.");
      return;
    }

    const formData = new FormData(event.currentTarget);
    const validation = validateResetPasswordForm({
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
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
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          token,
          ...validation.data,
        }),
      });
      const body = (await response.json()) as ResetPasswordResponse;

      if (!response.ok || !body.success) {
        setFormError(body.error ?? "Unable to reset password.");
        setIsSubmitting(false);
        return;
      }

      router.push("/sign-in?passwordReset=success");
    } catch {
      setFormError("Unable to reset password.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-white">Choose a password</h2>
        <p className="text-sm text-muted-foreground">
          Use a new password for your DevStash account.
        </p>
      </div>

      {formError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">
          {formError}
        </p>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-200" htmlFor="password">
          New password
        </label>
        <Input
          aria-invalid={Boolean(errors.password)}
          autoComplete="new-password"
          className="h-11 border-devstash-line bg-white/[0.04]"
          disabled={!resetLinkIsValid}
          id="password"
          name="password"
          type="password"
        />
        {errors.password ? (
          <p className="text-sm text-red-200">{errors.password}</p>
        ) : null}
      </div>

      <div className="space-y-2">
        <label
          className="text-sm font-medium text-zinc-200"
          htmlFor="confirmPassword"
        >
          Confirm password
        </label>
        <Input
          aria-invalid={Boolean(errors.confirmPassword)}
          autoComplete="new-password"
          className="h-11 border-devstash-line bg-white/[0.04]"
          disabled={!resetLinkIsValid}
          id="confirmPassword"
          name="confirmPassword"
          type="password"
        />
        {errors.confirmPassword ? (
          <p className="text-sm text-red-200">{errors.confirmPassword}</p>
        ) : null}
      </div>

      <Button
        className="h-11 w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
        disabled={isSubmitting || !resetLinkIsValid}
        type="submit"
      >
        {isSubmitting ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <KeyRound aria-hidden="true" className="size-4" />
        )}
        Reset password
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        <Link
          className="inline-flex items-center gap-2 font-medium text-emerald-300 hover:text-emerald-200"
          href="/sign-in"
        >
          <ArrowLeft aria-hidden="true" className="size-4" />
          Back to sign in
        </Link>
      </p>
    </form>
  );
}
