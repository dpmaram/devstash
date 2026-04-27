import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
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
  it("returns the toast message after successful registration", () => {
    assert.equal(
      getRegistrationSuccessToastMessage(true),
      "Account created. You can now log in.",
    );
  });

  it("does not show a toast when registration did not just complete", () => {
    assert.equal(getRegistrationSuccessToastMessage(false), null);
  });
});
