"use client";

import { useState, type FormEvent } from "react";
import { CheckCircle2, KeyRound, Loader2, Trash2, X } from "lucide-react";
import { signOut } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  validateChangePasswordForm,
  validateDeleteAccountForm,
  type ChangePasswordFormErrors,
  type DeleteAccountFormErrors,
} from "@/lib/auth/form-validation";

type ActionResponse = {
  success: boolean;
  error?: string;
  message?: string;
};

export function ProfileActions({
  canChangePassword,
  email,
}: {
  canChangePassword: boolean;
  email: string | null;
}) {
  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {canChangePassword ? <ChangePasswordPanel /> : null}
      <DeleteAccountPanel email={email} />
    </section>
  );
}

function ChangePasswordPanel() {
  const [errors, setErrors] = useState<ChangePasswordFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const validation = validateChangePasswordForm({
      currentPassword: formData.get("currentPassword"),
      newPassword: formData.get("newPassword"),
      confirmPassword: formData.get("confirmPassword"),
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
      const response = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validation.data),
      });
      const body = (await response.json()) as ActionResponse;

      if (!response.ok || !body.success) {
        setFormError(body.error ?? "Unable to update password.");
        setIsSubmitting(false);
        return;
      }

      form.reset();
      setSuccessMessage(body.message ?? "Password updated.");
      setIsSubmitting(false);
    } catch {
      setFormError("Unable to update password.");
      setIsSubmitting(false);
    }
  }

  return (
    <article className="rounded-lg border border-devstash-line bg-white/[0.035] p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-emerald-400/10 text-emerald-200">
          <KeyRound aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-white">Change password</h2>
          <p className="text-sm text-muted-foreground">Email account security</p>
        </div>
      </div>

      <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
        {formError ? (
          <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">
            {formError}
          </p>
        ) : null}

        {successMessage ? (
          <p className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2 text-sm text-emerald-100">
            <CheckCircle2 aria-hidden="true" className="size-4" />
            {successMessage}
          </p>
        ) : null}

        <PasswordField
          autoComplete="current-password"
          error={errors.currentPassword}
          id="currentPassword"
          label="Current password"
          name="currentPassword"
        />
        <PasswordField
          autoComplete="new-password"
          error={errors.newPassword}
          id="newPassword"
          label="New password"
          name="newPassword"
        />
        <PasswordField
          autoComplete="new-password"
          error={errors.confirmPassword}
          id="confirmPassword"
          label="Confirm new password"
          name="confirmPassword"
        />

        <Button
          className="h-11 w-full gap-2 bg-foreground text-background hover:bg-foreground/90"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? (
            <Loader2 aria-hidden="true" className="size-4 animate-spin" />
          ) : (
            <KeyRound aria-hidden="true" className="size-4" />
          )}
          Update password
        </Button>
      </form>
    </article>
  );
}

function PasswordField({
  autoComplete,
  error,
  id,
  label,
  name,
}: {
  autoComplete: string;
  error?: string;
  id: string;
  label: string;
  name: string;
}) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-zinc-200" htmlFor={id}>
        {label}
      </label>
      <Input
        aria-invalid={Boolean(error)}
        autoComplete={autoComplete}
        className="h-11 border-devstash-line bg-white/[0.04]"
        id={id}
        name={name}
        type="password"
      />
      {error ? <p className="text-sm text-red-200">{error}</p> : null}
    </div>
  );
}

function DeleteAccountPanel({ email }: { email: string | null }) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [errors, setErrors] = useState<DeleteAccountFormErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function closeDialog() {
    if (isSubmitting) {
      return;
    }

    setIsDialogOpen(false);
    setErrors({});
    setFormError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const validation = validateDeleteAccountForm({
      confirmationEmail: formData.get("confirmationEmail"),
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
      const response = await fetch("/api/profile/delete-account", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(validation.data),
      });
      const body = (await response.json()) as ActionResponse;

      if (!response.ok || !body.success) {
        setFormError(body.error ?? "Unable to delete account.");
        setIsSubmitting(false);
        return;
      }

      await signOut({ callbackUrl: "/sign-in" });
    } catch {
      setFormError("Unable to delete account.");
      setIsSubmitting(false);
    }
  }

  return (
    <article className="rounded-lg border border-devstash-line bg-white/[0.035] p-5">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-lg bg-red-400/10 text-red-200">
          <Trash2 aria-hidden="true" className="size-5" />
        </span>
        <div>
          <h2 className="text-xl font-semibold text-white">Delete account</h2>
          <p className="text-sm text-muted-foreground">
            Remove account and content
          </p>
        </div>
      </div>

      <div className="mt-5">
        <Button
          className="h-11 gap-2 bg-red-500/15 text-red-100 hover:bg-red-500/25"
          disabled={!email}
          onClick={() => setIsDialogOpen(true)}
          type="button"
          variant="destructive"
        >
          <Trash2 aria-hidden="true" className="size-4" />
          Delete account
        </Button>
      </div>

      {isDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div
            aria-labelledby="delete-account-title"
            aria-modal="true"
            className="w-full max-w-md rounded-lg border border-devstash-line bg-[#111318] p-5 shadow-2xl shadow-black/40"
            role="dialog"
          >
            <div className="flex items-start gap-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-red-400/10 text-red-200">
                <Trash2 aria-hidden="true" className="size-5" />
              </span>
              <div className="min-w-0 flex-1">
                <h3
                  className="text-lg font-semibold text-white"
                  id="delete-account-title"
                >
                  Delete account
                </h3>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Type {email} to confirm deletion.
                </p>
              </div>
              <button
                aria-label="Close delete account dialog"
                className="rounded-md p-1 text-muted-foreground transition hover:bg-white/10 hover:text-white"
                disabled={isSubmitting}
                onClick={closeDialog}
                type="button"
              >
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>

            <form className="mt-5 space-y-4" onSubmit={handleSubmit}>
              {formError ? (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-red-200">
                  {formError}
                </p>
              ) : null}

              <div className="space-y-2">
                <label
                  className="text-sm font-medium text-zinc-200"
                  htmlFor="confirmationEmail"
                >
                  Account email
                </label>
                <Input
                  aria-invalid={Boolean(errors.confirmationEmail)}
                  autoComplete="off"
                  className="h-11 border-devstash-line bg-white/[0.04]"
                  id="confirmationEmail"
                  name="confirmationEmail"
                  type="email"
                />
                {errors.confirmationEmail ? (
                  <p className="text-sm text-red-200">
                    {errors.confirmationEmail}
                  </p>
                ) : null}
              </div>

              <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
                <Button
                  className="h-10 border-devstash-line bg-white/[0.04] text-foreground hover:bg-white/[0.08]"
                  disabled={isSubmitting}
                  onClick={closeDialog}
                  type="button"
                  variant="outline"
                >
                  Cancel
                </Button>
                <Button
                  className="h-10 gap-2 bg-red-500/15 text-red-100 hover:bg-red-500/25"
                  disabled={isSubmitting}
                  type="submit"
                  variant="destructive"
                >
                  {isSubmitting ? (
                    <Loader2
                      aria-hidden="true"
                      className="size-4 animate-spin"
                    />
                  ) : (
                    <Trash2 aria-hidden="true" className="size-4" />
                  )}
                  Delete account
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </article>
  );
}
