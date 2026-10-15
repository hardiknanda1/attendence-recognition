import { NextResponse } from "next/server";
import { contactSchema, flattenErrors, type ContactResponse } from "@/lib/contact-schema";
import { deliverContact } from "@/lib/contact-delivery";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Best-effort, per-instance rate limit. Use a shared store (e.g. Redis) for multi-instance deployments.
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(key: string) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < WINDOW_MS);
  recent.push(now);
  hits.set(key, recent);
  if (hits.size > 5000) {
    for (const [k, v] of hits) if (v.every((t) => now - t >= WINDOW_MS)) hits.delete(k);
  }
  return recent.length > MAX_PER_WINDOW;
}

function json(body: ContactResponse, status: number) {
  return NextResponse.json(body, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: Request) {
  if (!request.headers.get("content-type")?.includes("application/json")) {
    return json({ ok: false, code: "bad_request", error: "Unsupported request format." }, 415);
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return json({ ok: false, code: "bad_request", error: "The request could not be read." }, 400);
  }

  // Honeypot: real users never fill this hidden field. Reject without revealing why.
  if (payload && typeof payload === "object" && "website" in payload && (payload as { website?: unknown }).website) {
    return json({ ok: false, code: "bad_request", error: "Your message could not be accepted." }, 400);
  }

  const parsed = contactSchema.safeParse(payload);
  if (!parsed.success) {
    return json(
      {
        ok: false,
        code: "validation",
        error: "Please correct the highlighted fields.",
        fieldErrors: flattenErrors(parsed.error),
      },
      422,
    );
  }

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (rateLimited(ip)) {
    return json(
      { ok: false, code: "rate_limited", error: "Too many submissions. Please wait a few minutes and try again." },
      429,
    );
  }

  const result = await deliverContact(parsed.data);

  if (result.status === "sent") return json({ ok: true }, 200);

  if (result.status === "not_configured") {
    console.error("[contact] No delivery service configured. Set RESEND_* or CONTACT_WEBHOOK_URL (see .env.example).");
    return json(
      {
        ok: false,
        code: "not_configured",
        error: "Our contact service is not available right now, so your message was not sent. Please try again later.",
      },
      503,
    );
  }

  console.error("[contact] Delivery failed:", result.detail);
  return json(
    {
      ok: false,
      code: "delivery_failed",
      error: "We couldn't send your message due to a temporary problem. Please try again shortly.",
    },
    502,
  );
}
