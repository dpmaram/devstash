"use client";

import Link from "next/link";
import { Code2, Loader2, UserPlus } from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  validateRegisterForm,
  type RegisterFormErrors,
} from "@/lib/auth/form-validation";

type RegisterResponse = {
  success: boolean;
  error?: string;
  emailVerificationRequired?: boolean;
};

export function RegisterForm({
  callbackUrl = "/dashboard",
}: {
  callbackUrl?: string;
}) {
  const router = useRouter();
  const [errors, setErrors] = useState<RegisterFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSigningInWithGitHub, setIsSigningInWithGitHub] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const validation = validateRegisterForm({
      name: formData.get("name"),
      email: formData.get("email"),
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
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validation.data),
      });
      const body = (await response.json()) as RegisterResponse;

      if (!response.ok || !body.success) {
        setFormError(body.error ?? "Unable to create account. Try again.");
        setIsSubmitting(false);
        return;
      }

      const emailVerificationRequired =
        body.emailVerificationRequired === undefined
          ? true
          : body.emailVerificationRequired;
      const emailVerificationParam = emailVerificationRequired ? "1" : "0";

      router.push(
        `/sign-in?registered=1&emailVerificationRequired=${emailVerificationParam}&callbackUrl=${encodeURIComponent(callbackUrl)}`,
      );
    } catch {
      setFormError("Unable to create account. Try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-1">
        <h2 className="text-2xl font-semibold text-white">Create account</h2>
        <p className="text-sm text-muted-foreground">
          Save your developer knowledge in one workspace.
        </p>
      </div>

      {formError ? (
        <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">
          {formError}
        </p>
      ) : null}

      <div className="space-y-2">
        <label className="text-sm font-medium text-zinc-200" htmlFor="name">
          Name
        </label>
        <Input
          aria-invalid={Boolean(errors.name)}
          autoComplete="name"
          className="h-11 border-devstash-line bg-white/[0.04]"
          id="name"
          name="name"
          type="text"
        />
        {errors.name ? <p className="text-sm text-red-200">{errors.name}</p> : null}
      </div>

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

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="text-sm font-medium text-zinc-200" htmlFor="password">
            Password
          </label>
          <Input
            aria-invalid={Boolean(errors.password)}
            autoComplete="new-password"
            className="h-11 border-devstash-line bg-white/[0.04]"
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
            id="confirmPassword"
            name="confirmPassword"
            type="password"
          />
          {errors.confirmPassword ? (
            <p className="text-sm text-red-200">{errors.confirmPassword}</p>
          ) : null}
        </div>
      </div>

      <Button
        className="h-11 w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
        disabled={isSubmitting || isSigningInWithGitHub}
        type="submit"
      >
        {isSubmitting ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <UserPlus aria-hidden="true" className="size-4" />
        )}
        Create account
      </Button>

      <Button
        className="h-11 w-full gap-2 border-devstash-line bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
        disabled={isSubmitting || isSigningInWithGitHub}
        onClick={() => {
          setIsSigningInWithGitHub(true);
          signIn("github", { callbackUrl });
        }}
        type="button"
        variant="outline"
      >
        {isSigningInWithGitHub ? (
          <Loader2 aria-hidden="true" className="size-4 animate-spin" />
        ) : (
          <Code2 aria-hidden="true" className="size-4" />
        )}
        Sign up with GitHub
      </Button>

      <p className="text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          className="font-medium text-emerald-300 hover:text-emerald-200"
          href={`/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`}
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
