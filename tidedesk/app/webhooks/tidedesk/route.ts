import { NextRequest } from "next/server";

/**
 * Receives outbound webhook payloads from TideDesk (booking.created, payment.succeeded).
 * Configure this URL in Settings → API → Webhooks:
 *   https://www.tidedesk.co.nz/webhooks/tidedesk
 *
 * Logs payloads to the server console. Extend this handler to process events
 * (e.g. sync to CRM, send to external systems). Verify X-TideDesk-Signature
 * using the signing secret from Settings before trusting the payload.
 */
export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get("x-tidedesk-signature");
  const event = req.headers.get("x-tidedesk-event");

  const payload = (() => {
    try {
      return JSON.parse(body);
    } catch {
      return body;
    }
  })();

  console.log("\n---------- TIDEDESK WEBHOOK RECEIVED ----------");
  console.log("Event:", event);
  console.log("Signature:", signature);
  console.log("Payload:", JSON.stringify(payload, null, 2));
  console.log("------------------------------------------------\n");

  return new Response("OK", { status: 200 });
}
