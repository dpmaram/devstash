"use client";

import Link from "next/link";
import { ArrowLeft, Loader2, Mail } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  validateForgotPasswordForm,
  type ForgotPasswordFormErrors,
} from "@/lib/auth/form-validation";

type ForgotPasswordResponse = {
  success: boolean;
  error?: string;
  message?: string;
};

export function ForgotPasswordForm() {
  const [errors, setErrors] = useState<ForgotPasswordFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const validation = validateForgotPasswordForm({
      email: formData.get("email"),
    });

    if (!validation.ok) {
      setErrors(validation.errors);
      setFormError(null);
      setSuccessMessage(null);
      return;
    }

    setErrors({});
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validation.data),
      });
      const body = (await response.json()) as ForgotPasswordResponse;

      if (!response.ok || !body.success) {
        setFormError(body.error ?? "Unable to send password reset email.");
        setIsSubmitting(false);
        return;
      }

      setSuccessMessage(
        body.message ??
          "If an account exists for that email, we'll send password reset instructions.",
      );
      setIsSubmitting(false);
    } catch {
      setFormError("Unable to send password reset email.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-white">Reset password</h2>
        <p className="text-sm text-muted-foreground">
          Enter your account email and we&apos;ll send reset instructions.
        </p>
      </div>

      {formError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">
          {formError}
        </p>
      ) : null}

      {successMessage ? (
        <p className="rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
          {successMessage}
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

      <Button
        className="h-11 w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
        disabled={isSubmitting}
        type="submit"
      >
        {isSubmitting ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Mail aria-hidden="true" className="size-4" />
        )}
        Send reset link
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
