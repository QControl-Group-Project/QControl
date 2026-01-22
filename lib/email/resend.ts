type SendEmailOptions = {
  to: string;
  subject: string;
  html?: string;
  text?: string;
};

type SendEmailResult = {
  id?: string;
  error?: string;
  skipped?: boolean;
};

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM_EMAIL;

  if (!apiKey) {
    console.warn("RESEND_API_KEY is missing, skipping email send.");
    return { skipped: true };
  }

  if (!from) {
    return { error: "RESEND_FROM_EMAIL is missing or not configured." };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      html,
      text,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    try {
      const json = JSON.parse(errorText);
      const message =
        json?.error?.message || json?.message || errorText || "Send failed";
      return { error: message };
    } catch {
      return { error: errorText || "Failed to send email" };
    }
  }

  return response.json();
}


