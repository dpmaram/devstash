type SendResendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text: string;
  idempotencyKey?: string;
};

type SendResendEmailDeps = {
  apiKey?: string;
  fetch: typeof fetch;
  from?: string;
};

const resendEmailsUrl = "https://api.resend.com/emails";
const defaultFromEmail = "DevStash <onboarding@resend.dev>";

function getResendApiKey() {
  return process.env.RESEND_API_KEY;
}

function getResendFromEmail() {
  return process.env.RESEND_FROM_EMAIL ?? defaultFromEmail;
}

function createDefaultDeps(): SendResendEmailDeps {
  return {
    apiKey: getResendApiKey(),
    fetch,
    from: getResendFromEmail(),
  };
}

export async function sendResendEmail(
  input: SendResendEmailInput,
  deps: SendResendEmailDeps = createDefaultDeps(),
) {
  if (!deps.apiKey) {
    throw new Error("RESEND_API_KEY is required to send email.");
  }

  const headers: Record<string, string> = {
    Authorization: `Bearer ${deps.apiKey}`,
    "Content-Type": "application/json",
  };

  if (input.idempotencyKey) {
    headers["Idempotency-Key"] = input.idempotencyKey;
  }

  const response = await deps.fetch(resendEmailsUrl, {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: deps.from ?? defaultFromEmail,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });

  if (!response.ok) {
    throw new Error(`Resend email send failed with status ${response.status}.`);
  }
}
