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

export function getSignInErrorMessage(error?: string | null) {
  if (!error) {
    return null;
  }

  if (error === "CredentialsSignin") {
    return "The email or password you entered is incorrect.";
  }

  return "Unable to sign in. Try again.";
}

export function getRegistrationSuccessToastMessage(registered: boolean) {
  return registered ? "Account created. You can now log in." : null;
}
