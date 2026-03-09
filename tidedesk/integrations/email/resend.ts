/**
 * Resend integration – email sending.
 * Set RESEND_API_KEY in env. From address uses RESEND_FROM or defaults to onboarding@resend.dev.
 */

export type SendEmailOptions = {
  to: string | string[];
  subject: string;
  html: string;
};

export type SendEmailResult = {
  success: boolean;
  id?: string;
  error?: string;
};

export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn("Resend: RESEND_API_KEY not set");
    return { success: false, error: "Email not configured" };
  }

  const from = process.env.RESEND_FROM ?? "TideDesk <onboarding@resend.dev>";
  const to = Array.isArray(options.to) ? options.to : [options.to];

  if (to.length === 0 || !to.every((e) => typeof e === "string" && e.trim().length > 0)) {
    return { success: false, error: "Invalid recipient" };
  }

  try {
    const { Resend } = await import("resend");
    const resend = new Resend(apiKey);

    const { data, error } = await resend.emails.send({
      from,
      to,
      subject: options.subject,
      html: options.html,
    });

    if (error) {
      console.error("Resend error:", error);
      return { success: false, error: error.message };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Resend send error:", message);
    return { success: false, error: message };
  }
}
