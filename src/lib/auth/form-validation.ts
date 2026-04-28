type StringRecord = Record<string, unknown>;

export type SignInFormData = {
  email: string;
  password: string;
};

export type RegisterFormData = {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
};

export type ForgotPasswordFormData = {
  email: string;
};

export type ResetPasswordFormData = {
  password: string;
  confirmPassword: string;
};

export type ChangePasswordFormData = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

export type DeleteAccountFormData = {
  confirmationEmail: string;
};

export type FormValidationResult<TData, TErrors> =
  | {
      ok: true;
      data: TData;
    }
  | {
      ok: false;
      errors: TErrors;
    };

export type SignInFormErrors = Partial<Record<keyof SignInFormData, string>>;
export type RegisterFormErrors = Partial<Record<keyof RegisterFormData, string>>;
export type ForgotPasswordFormErrors = Partial<
  Record<keyof ForgotPasswordFormData, string>
>;
export type ResetPasswordFormErrors = Partial<
  Record<keyof ResetPasswordFormData, string>
>;
export type ChangePasswordFormErrors = Partial<
  Record<keyof ChangePasswordFormData, string>
>;
export type DeleteAccountFormErrors = Partial<
  Record<keyof DeleteAccountFormData, string>
>;

function getString(value: unknown) {
  return typeof value === "string" ? value : "";
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function hasErrors(errors: Record<string, string | undefined>) {
  return Object.values(errors).some(Boolean);
}

export function validateSignInForm(
  input: StringRecord,
): FormValidationResult<SignInFormData, SignInFormErrors> {
  const email = normalizeEmail(getString(input.email));
  const password = getString(input.password);
  const errors: SignInFormErrors = {};

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter your password.";
  }

  if (hasErrors(errors)) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    data: {
      email,
      password,
    },
  };
}

export function validateRegisterForm(
  input: StringRecord,
): FormValidationResult<RegisterFormData, RegisterFormErrors> {
  const name = getString(input.name).trim();
  const email = normalizeEmail(getString(input.email));
  const password = getString(input.password);
  const confirmPassword = getString(input.confirmPassword);
  const errors: RegisterFormErrors = {};

  if (!name) {
    errors.name = "Enter your name.";
  }

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (!password) {
    errors.password = "Enter a password.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (password && password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (hasErrors(errors)) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    data: {
      name,
      email,
      password,
      confirmPassword,
    },
  };
}

export function validateForgotPasswordForm(
  input: StringRecord,
): FormValidationResult<ForgotPasswordFormData, ForgotPasswordFormErrors> {
  const email = normalizeEmail(getString(input.email));
  const errors: ForgotPasswordFormErrors = {};

  if (!isValidEmail(email)) {
    errors.email = "Enter a valid email address.";
  }

  if (hasErrors(errors)) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    data: {
      email,
    },
  };
}

export function validateResetPasswordForm(
  input: StringRecord,
): FormValidationResult<ResetPasswordFormData, ResetPasswordFormErrors> {
  const password = getString(input.password);
  const confirmPassword = getString(input.confirmPassword);
  const errors: ResetPasswordFormErrors = {};

  if (!password) {
    errors.password = "Enter a password.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your password.";
  } else if (password && password !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (hasErrors(errors)) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    data: {
      password,
      confirmPassword,
    },
  };
}

export function validateChangePasswordForm(
  input: StringRecord,
): FormValidationResult<ChangePasswordFormData, ChangePasswordFormErrors> {
  const currentPassword = getString(input.currentPassword);
  const newPassword = getString(input.newPassword);
  const confirmPassword = getString(input.confirmPassword);
  const errors: ChangePasswordFormErrors = {};

  if (!currentPassword) {
    errors.currentPassword = "Enter your current password.";
  }

  if (!newPassword) {
    errors.newPassword = "Enter a new password.";
  }

  if (!confirmPassword) {
    errors.confirmPassword = "Confirm your new password.";
  } else if (newPassword && newPassword !== confirmPassword) {
    errors.confirmPassword = "Passwords do not match.";
  }

  if (hasErrors(errors)) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    data: {
      currentPassword,
      newPassword,
      confirmPassword,
    },
  };
}

export function validateDeleteAccountForm(
  input: StringRecord,
): FormValidationResult<DeleteAccountFormData, DeleteAccountFormErrors> {
  const confirmationEmail = normalizeEmail(getString(input.confirmationEmail));
  const errors: DeleteAccountFormErrors = {};

  if (!confirmationEmail) {
    errors.confirmationEmail = "Type your account email to confirm deletion.";
  }

  if (hasErrors(errors)) {
    return {
      ok: false,
      errors,
    };
  }

  return {
    ok: true,
    data: {
      confirmationEmail,
    },
  };
}

export function getSignInErrorMessage(error?: string | null) {
  if (!error) {
    return null;
  }

  if (error === "CredentialsSignin") {
    return "The email or password you entered is incorrect.";
  }

  return "Unable to sign in. Try again.";
}

export function getRegistrationSuccessToastMessage(
  registered: boolean,
  emailVerificationRequired = true,
) {
  if (!registered) {
    return null;
  }

  return emailVerificationRequired
    ? "Check your email to verify your account before signing in."
    : "Account created. You can now sign in.";
}

export function getPasswordResetToastMessage(status?: string | null) {
  return status === "success" ? "Password reset. You can now sign in." : null;
}

export type EmailVerificationToastStatus = "success" | "expired" | "invalid";

export function getEmailVerificationToastMessage(
  status?: string | null,
): string | null {
  if (status === "success") {
    return "Email verified. You can now sign in.";
  }

  if (status === "expired") {
    return "That verification link expired. Create a new account or request another link.";
  }

  if (status === "invalid") {
    return "That verification link is invalid. Check your email and try again.";
  }

  return null;
}
