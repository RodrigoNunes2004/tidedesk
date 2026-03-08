/**
 * Twilio integration – SMS sending.
 * Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER in env.
 */

async function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  if (!accountSid || !authToken) return null;

  const { Twilio } = await import("twilio");
  return new Twilio(accountSid, authToken);
}

export async function sendSms(to: string, body: string): Promise<boolean> {
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!from) {
    console.warn("Twilio: TWILIO_PHONE_NUMBER not set");
    return false;
  }

  const client = await getTwilioClient();
  if (!client) {
    console.warn("Twilio: credentials not configured");
    return false;
  }

  try {
    await client.messages.create({ to, from, body });
    return true;
  } catch (err) {
    console.error("Twilio SMS error:", err);
    return false;
  }
}
