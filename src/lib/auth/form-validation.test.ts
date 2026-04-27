import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  getEmailVerificationToastMessage,
  getRegistrationSuccessToastMessage,
  validateRegisterForm,
  validateSignInForm,
} from "./form-validation";

describe("validateSignInForm", () => {
  it("requires a valid email and a password", () => {
    assert.deepEqual(
      validateSignInForm({
        email: "not-an-email",
        password: "",
      }),
      {
        ok: false,
        errors: {
          email: "Enter a valid email address.",
          password: "Enter your password.",
        },
      },
    );
  });

  it("accepts valid credentials and trims the email", () => {
    assert.deepEqual(
      validateSignInForm({
        email: " ADA@Example.COM ",
        password: "password123",
      }),
      {
        ok: true,
        data: {
          email: "ada@example.com",
          password: "password123",
        },
      },
    );
  });
});

describe("validateRegisterForm", () => {
  it("requires name, a valid email, and matching passwords", () => {
    assert.deepEqual(
      validateRegisterForm({
        name: "",
        email: "bad-email",
        password: "password123",
        confirmPassword: "different-password",
      }),
      {
        ok: false,
        errors: {
          name: "Enter your name.",
          email: "Enter a valid email address.",
          confirmPassword: "Passwords do not match.",
        },
      },
    );
  });

  it("accepts valid registration input and normalizes the user fields", () => {
    assert.deepEqual(
      validateRegisterForm({
        name: " Ada Lovelace ",
        email: " ADA@Example.COM ",
        password: "password123",
        confirmPassword: "password123",
      }),
      {
        ok: true,
        data: {
          name: "Ada Lovelace",
          email: "ada@example.com",
          password: "password123",
          confirmPassword: "password123",
        },
      },
    );
  });
});

describe("getRegistrationSuccessToastMessage", () => {
  it("returns the check-email toast message after successful registration", () => {
    assert.equal(
      getRegistrationSuccessToastMessage(true),
      "Check your email to verify your account before signing in.",
    );
  });

  it("does not show a toast when registration did not just complete", () => {
    assert.equal(getRegistrationSuccessToastMessage(false), null);
  });
});

describe("getEmailVerificationToastMessage", () => {
  it("returns a success toast after email verification", () => {
    assert.equal(
      getEmailVerificationToastMessage("success"),
      "Email verified. You can now sign in.",
    );
  });

  it("returns an expired-link toast", () => {
    assert.equal(
      getEmailVerificationToastMessage("expired"),
      "That verification link expired. Create a new account or request another link.",
    );
  });

  it("returns an invalid-link toast", () => {
    assert.equal(
      getEmailVerificationToastMessage("invalid"),
      "That verification link is invalid. Check your email and try again.",
    );
  });

  it("does not show a toast for unknown status", () => {
    assert.equal(getEmailVerificationToastMessage(undefined), null);
  });
});
