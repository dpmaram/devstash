import assert from "node:assert/strict";
import { describe, it } from "vitest";

import { sendResendEmail } from "./resend";

describe("sendResendEmail", () => {
  it("requires a Resend API key before calling fetch", async () => {
    let fetchCalls = 0;

    await assert.rejects(
      sendResendEmail(
        {
          to: "ada@example.com",
          subject: "Verify",
          html: "<p>Verify</p>",
          text: "Verify",
        },
        {
          apiKey: "",
          fetch: async () => {
            fetchCalls += 1;
            return new Response(null, { status: 200 });
          },
          from: "DevStash <onboarding@example.com>",
        },
      ),
      /RESEND_API_KEY is required/,
    );
    assert.equal(fetchCalls, 0);
  });

  it("posts a transactional email to Resend", async () => {
    let request:
      | {
          url: string;
          init?: RequestInit;
        }
      | undefined;

    await sendResendEmail(
      {
        to: "ada@example.com",
        subject: "Verify your email",
        html: "<p>Verify</p>",
        text: "Verify",
        idempotencyKey: "verify-email:token",
      },
      {
        apiKey: "re_test",
        fetch: async (url, init) => {
          request = {
            url: String(url),
            init,
          };

          return new Response(JSON.stringify({ id: "email_123" }), {
            status: 200,
          });
        },
        from: "DevStash <onboarding@example.com>",
      },
    );

    assert.equal(request?.url, "https://api.resend.com/emails");
    assert.deepEqual(request?.init?.headers, {
      Authorization: "Bearer re_test",
      "Content-Type": "application/json",
      "Idempotency-Key": "verify-email:token",
    });
    assert.deepEqual(JSON.parse(String(request?.init?.body)), {
      from: "DevStash <onboarding@example.com>",
      to: "ada@example.com",
      subject: "Verify your email",
      html: "<p>Verify</p>",
      text: "Verify",
    });
  });

  it("throws when Resend rejects the email", async () => {
    await assert.rejects(
      sendResendEmail(
        {
          to: "ada@example.com",
          subject: "Verify",
          html: "<p>Verify</p>",
          text: "Verify",
        },
        {
          apiKey: "re_test",
          fetch: async () => new Response(null, { status: 422 }),
          from: "DevStash <onboarding@example.com>",
        },
      ),
      /Resend email send failed with status 422/,
    );
  });
});
