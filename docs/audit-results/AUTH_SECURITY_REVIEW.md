# Authentication Security Audit

**Last Audit Date**: 2026-04-28
**Auditor**: Auth Security Agent

## Executive Summary

DevStash has several strong foundations in place: credentials passwords are hashed with bcrypt, verification/reset tokens are generated with cryptographic randomness and stored hashed, and profile account mutations derive the user id from the active session. The main risks are around trust boundaries outside those token helpers: email link origins trust the request origin, protected dashboard data is not scoped to the signed-in user, public auth endpoints have no rate limiting, password policy is effectively "non-empty", and JWT sessions remain valid after password resets or password changes.

## Findings

### Critical Issues

None found.

### High Severity

#### Password Reset And Verification Links Trust The Request Origin

**Severity**: High
**File**: `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/register/route.ts`, `src/lib/auth/password-reset.ts`, `src/lib/auth/registration.ts`
**Line(s)**: `src/app/api/auth/forgot-password/route.ts:25-30`, `src/app/api/auth/register/route.ts:22-27`, `src/lib/auth/password-reset.ts:202-215`, `src/lib/auth/registration.ts:187-200`

**Vulnerable Code**:
```typescript
createRequestPasswordResetDeps({
  baseUrl: new URL(request.url).origin,
});

const configuredBaseUrl =
  baseUrl ?? process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL;
```

**Problem**: Password reset and email verification URLs prefer `new URL(request.url).origin` over configured application origins. In many deployments, `request.url` is derived from forwarded host/proto headers. If those headers are attacker-controlled or incorrectly trusted by the platform/proxy, generated security emails can point at an attacker-controlled origin.

**Attack Scenario**: An attacker submits a forgot-password request for a victim while forcing the request host/origin to `https://evil.example`. The victim receives a legitimate Resend email containing a reset token on the attacker's domain. If the victim clicks it, the raw token is exposed to the attacker-controlled site.

**Fix**:
```typescript
function getConfiguredAppBaseUrl() {
  const configuredBaseUrl =
    process.env.APP_URL ?? process.env.NEXT_PUBLIC_APP_URL ?? process.env.AUTH_URL;

  if (!configuredBaseUrl) {
    throw new Error("APP_URL or AUTH_URL is required for auth email links.");
  }

  return configuredBaseUrl.replace(/\/+$/, "");
}

// Do not pass request.url into email-link dependencies.
createRequestPasswordResetDeps({ baseUrl: getConfiguredAppBaseUrl() });
createRegisterUserDeps({ baseUrl: getConfiguredAppBaseUrl() });
```

Also add tests proving a malicious request origin does not affect reset or verification links when `APP_URL` is configured.

#### Protected Dashboard Data Is Not Scoped To The Signed-In User

**Severity**: High
**File**: `src/components/dashboard/DashboardShell.tsx`, `src/lib/db/dashboard-user.ts`
**Line(s)**: `src/components/dashboard/DashboardShell.tsx:25-38`, `src/lib/db/dashboard-user.ts:12-34`

**Vulnerable Code**:
```typescript
const [session, dashboardUser] = await Promise.all([auth(), getDashboardUser()]);

// getDashboardUser falls back to demo@devstash.io or the most recently updated user.
const defaultDashboardUserEmail = "demo@devstash.io";
```

**Problem**: `/dashboard` is protected by the proxy, but the data queries are scoped to `getDashboardUser()` instead of `session.user.id`. That helper returns `demo@devstash.io` or the latest user, so any authenticated user can see another account's items, collections, stats, and sidebar counts.

**Attack Scenario**: A newly registered user signs in and visits `/dashboard`. The UI displays that user's name from the session, but the item and collection data comes from the demo account or another user selected by fallback. If non-demo users have private content, this becomes cross-account data disclosure.

**Fix**:
```typescript
export async function DashboardShell() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in?callbackUrl=%2Fdashboard");
  }

  const dashboardUser = { id: session.user.id };
  const currentUser = toCurrentUser(session.user, mockDashboardData.currentUser);

  // Existing dashboard queries can keep using { user: dashboardUser }.
}
```

Remove or restrict the demo fallback to seed scripts, tests, or an explicit development-only demo mode. Add tests that a session user id is passed to dashboard collection/item queries.

#### Public Auth Endpoints Have No Rate Limiting Or Abuse Controls

**Severity**: High
**File**: `src/lib/auth/credentials.ts`, `src/app/api/auth/register/route.ts`, `src/app/api/auth/forgot-password/route.ts`, `src/app/api/auth/reset-password/route.ts`, `src/app/api/profile/change-password/route.ts`
**Line(s)**: `src/lib/auth/credentials.ts:76-107`, `src/app/api/auth/register/route.ts:5-51`, `src/app/api/auth/forgot-password/route.ts:8-53`, `src/app/api/auth/reset-password/route.ts:5-43`, `src/app/api/profile/change-password/route.ts:8-60`

**Vulnerable Code**:
```typescript
export async function POST(request: Request) {
  // request body is parsed and the auth action executes directly.
  const result = await requestPasswordReset(body, createRequestPasswordResetDeps(...));
}
```

**Problem**: Login, registration, forgot-password, reset-password, and change-password flows execute without any IP/account/email/session throttling. This enables brute-force attempts against credentials, reset-token guessing pressure, registration spam, Resend email bombing, and repeated current-password guessing for signed-in accounts.

**Attack Scenario**: An attacker scripts repeated credential sign-in attempts for a known email or floods `/api/auth/forgot-password` for many addresses. The app performs bcrypt comparisons and/or sends third-party email requests without local throttling, increasing account takeover risk and operational cost.

**Fix**:
```typescript
const limiterKey = `forgot-password:${clientIp}:${normalizedEmail}`;
const allowed = await rateLimiter.consume(limiterKey, {
  limit: 5,
  windowMs: 15 * 60 * 1000,
});

if (!allowed) {
  return Response.json(
    { success: false, error: "Too many attempts. Try again later." },
    { status: 429 },
  );
}
```

Apply rate limits before expensive work or email sends. Use a shared store such as Redis/Upstash/Neon-backed counters so limits work across server instances. Add per-IP and per-account/email buckets for login, registration, forgot-password, reset-password, and profile password changes.

### Medium Severity

#### Password Resets And Changes Do Not Invalidate Existing JWT Sessions

**Severity**: Medium
**File**: `src/auth.ts`, `src/lib/auth/password-reset.ts`, `src/lib/auth/account-actions.ts`
**Line(s)**: `src/auth.ts:27-29`, `src/lib/auth/password-reset.ts:422-426`, `src/lib/auth/account-actions.ts:253-255`

**Vulnerable Code**:
```typescript
session: {
  strategy: "jwt",
}

await deps.updateUserPassword(parsedInput.value.email, passwordHash);
await deps.deleteResetToken(hashedResetToken);
```

**Problem**: Password reset and password change update `passwordHash`, but do not invalidate existing sessions. Because Auth.js is configured with JWT sessions, deleting database `Session` rows would not revoke already-issued JWT cookies. A stolen or shared session can remain valid after the user resets or changes their password.

**Attack Scenario**: An attacker with an existing session cookie keeps access after the victim completes a password reset. The reset protects future credential sign-ins but not the already-issued JWT session.

**Fix**:
```typescript
// Add a field such as sessionVersion or credentialsChangedAt to User.
await prisma.user.update({
  where: { email },
  data: {
    passwordHash,
    credentialsChangedAt: new Date(),
  },
});

// Include it in the JWT at sign-in and reject/refresh sessions when stale.
callbacks: {
  async jwt({ token, user }) {
    if (user) token.credentialsChangedAt = user.credentialsChangedAt?.toISOString();
    return token;
  },
  async session({ session, token }) {
    // Compare token version/timestamp with current user row, or switch to DB sessions.
    return session;
  },
}
```

Alternatively switch to database-backed sessions and delete all sessions for the user on reset/change.

#### Server-Side Password Policy Only Requires Non-Empty Passwords

**Severity**: Medium
**File**: `src/lib/auth/registration.ts`, `src/lib/auth/password-reset.ts`, `src/lib/auth/account-actions.ts`
**Line(s)**: `src/lib/auth/registration.ts:94-123`, `src/lib/auth/password-reset.ts:132-153`, `src/lib/auth/account-actions.ts:83-102`

**Vulnerable Code**:
```typescript
if (!name || !email || !password || !confirmPassword) {
  return { ok: false, status: 400, error: "..." };
}

if (password !== confirmPassword) {
  return { ok: false, status: 400, error: "Passwords do not match." };
}
```

**Problem**: Registration, password reset, and password change only require a non-empty password and a matching confirmation. There is no minimum length, maximum length, or shared server-side policy. This allows weak one-character passwords and unbounded password inputs. With bcrypt, very long inputs also create operational risk and may run into bcrypt's effective input-length behavior.

**Attack Scenario**: Users can register or reset to trivial passwords such as `a`, making credential stuffing and guessing much easier. Attackers can also submit very large passwords repeatedly to amplify CPU work on bcrypt paths.

**Fix**:
```typescript
const minPasswordLength = 12;
const maxPasswordLength = 72;

export function validatePasswordPolicy(password: string) {
  if (password.length < minPasswordLength) {
    return "Use at least 12 characters.";
  }

  if (password.length > maxPasswordLength) {
    return "Use 72 characters or fewer.";
  }

  return null;
}
```

Call the same server-side helper from registration, password reset, and password change before hashing. Mirror the same rules in client validation for UX, but treat server validation as authoritative.

### Low Severity

None found.

## Passed Checks

- Credentials passwords are hashed with bcrypt at cost factor 12 in `src/lib/auth/registration.ts`, `src/lib/auth/password-reset.ts`, `src/lib/auth/account-actions.ts`, and `prisma/seed.ts`.
- Credentials sign-in uses `bcrypt.compare` and returns only public user fields.
- Email verification can be disabled by env flag for local/domain setup, and credentials sign-in enforces `emailVerified` when the flag is enabled.
- Verification and password reset tokens are generated with `randomBytes(32)` and stored as SHA-256 hashes.
- Verification tokens expire and are deleted after use.
- Password reset tokens expire, are namespaced with `password-reset:`, and are deleted after successful use.
- Forgot-password responses are generic for unknown accounts and OAuth-only accounts.
- Profile password change and account deletion API routes derive `userId` from `auth()` session data, not from client JSON.
- Password change requires the current password before updating the hash.
- Account deletion confirms the normalized account email before deleting the current user.
- Prisma relations cascade deletion from the current `User` to accounts, sessions, items, collections, item types, and tags.
- The proxy protects `/dashboard/:path*` and `/profile/:path*`.
- Auth redirect callback rejects off-origin callback URLs.
- GitHub dangerous email account linking is only enabled in `development`.
- Resend API key values are not logged or returned in responses.

## Recommendations Summary

1. Stop using `request.url` as the source of auth email link origins. Prefer configured `APP_URL`/`AUTH_URL` and fail closed if absent.
2. Scope dashboard data to `session.user.id`; remove the demo/latest-user fallback from authenticated dashboard rendering.
3. Add shared rate limiting for credential sign-in, registration, forgot-password, reset-password, and profile password-change attempts.
4. Add session invalidation for password reset/change, either with database sessions or a JWT-compatible session version/timestamp strategy.
5. Add a shared server-side password policy with minimum and maximum length, and reuse it across registration, reset, and change-password flows.

## Documentation Checked

- `context/project-overview.md`
- `context/code-structure.md`
- `context/coding-standards.md`
- `context/current-feature.md`
- `context/features/auth-phase-1-spec.md`
- `context/features/auth-phase-2-spec.md`
- `context/features/auth-phase-3-spec.md`
- `context/features/profile-spec.md`
- `.codex/agents/auth-auditor.toml`

## Commands Run

- Static auth search with `rg --files` and `rg -n` across auth routes, auth helpers, profile routes, Prisma schema, and auth tests.
- Line-number review with `nl -ba` for each reported finding.
- `node --import tsx --test $(rg --files -g '*test.ts')` - passed, 127 tests / 47 suites, 0 failures.
- `npx tsc --noEmit` - passed.
- `npm run lint` - passed.

## Pre-Report Checklist

- [x] Every issue has been confirmed by reading actual code.
- [x] No findings duplicate protections handled automatically by NextAuth.
- [x] Every issue has an actionable fix.
- [x] Passed checks are backed by code.
- [x] The report contains no secret values from `.env` or local environment files.
- [x] The report directory exists.
