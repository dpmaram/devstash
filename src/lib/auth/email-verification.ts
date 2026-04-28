const disabledEmailVerificationValues = new Set([
  "0",
  "false",
  "no",
  "off",
]);

export function isEmailVerificationEnabled(
  value = process.env.EMAIL_VERIFICATION_ENABLED,
) {
  if (value === undefined) {
    return true;
  }

  return !disabledEmailVerificationValues.has(value.trim().toLowerCase());
}
