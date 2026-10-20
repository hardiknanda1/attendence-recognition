import "server-only";
import type { ContactSubmission } from "@/lib/contact-schema";
import { siteConfig } from "@/config/site";

/**
 * Integration point for contact form delivery.
 *
 * Supported out of the box (configure via environment variables, see .env.example):
 *   1. Resend email API  — RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL
 *   2. Generic webhook   — CONTACT_WEBHOOK_URL (+ optional CONTACT_WEBHOOK_TOKEN)
 *
 * To use another provider (SMTP, SendGrid, a CRM...), add a branch here that
 * returns `{ status: "sent" }` only once the provider has accepted the message.
 */
export type DeliveryResult = { status: "sent" } | { status: "not_configured" } | { status: "failed"; detail: string };

const LABELS: Record<keyof ContactSubmission, string> = {
  fullName: "Full name",
  email: "Official email",
  institutionName: "Institution",
  institutionType: "Institution type",
  phone: "Phone",
  userCount: "Approx. users",
  message: "Message",
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}

function rows(data: ContactSubmission) {
  return (Object.keys(LABELS) as (keyof ContactSubmission)[]).map((key) => [LABELS[key], data[key] ?? "—"] as const);
}

function renderText(data: ContactSubmission) {
  return rows(data)
    .map(([label, value]) => `${label}: ${value}`)
    .join("\n");
}

function renderHtml(data: ContactSubmission) {
  const body = rows(data)
    .map(
      ([label, value]) =>
        `<tr><td style="padding:6px 16px 6px 0;color:#666;vertical-align:top;white-space:nowrap">${escapeHtml(label)}</td><td style="padding:6px 0;white-space:pre-wrap">${escapeHtml(String(value))}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:system-ui,sans-serif;font-size:14px;color:#111"><h2 style="font-weight:600">New enquiry via ${escapeHtml(siteConfig.name)}</h2><table>${body}</table></div>`;
}

/** Read an env var, tolerating whitespace and quotes pasted into a hosting dashboard. */
function env(name: string) {
  const value = process.env[name]?.trim();
  if (!value) return undefined;
  return value.replace(/^(["'])(.*)\1$/, "$2").trim() || undefined;
}

async function withTimeout(input: string, init: RequestInit, ms = 10_000) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await fetch(input, { ...init, signal: controller.signal, cache: "no-store" });
  } finally {
    clearTimeout(timer);
  }
}

export async function deliverContact(data: ContactSubmission): Promise<DeliveryResult> {
  const resendKey = env("RESEND_API_KEY");
  const to = env("CONTACT_TO_EMAIL");
  const from = env("CONTACT_FROM_EMAIL");
  const webhook = env("CONTACT_WEBHOOK_URL");

  try {
    if (resendKey && to && from) {
      const res = await withTimeout("https://api.resend.com/emails", {
        method: "POST",
        headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          from,
          to: to.split(",").map((s) => s.trim()).filter(Boolean),
          reply_to: data.email,
          subject: `New enquiry: ${data.institutionName} (${data.institutionType})`,
          text: renderText(data),
          html: renderHtml(data),
        }),
      });
      if (!res.ok) return { status: "failed", detail: `Resend responded ${res.status}: ${await res.text()}` };
      return { status: "sent" };
    }

    if (webhook) {
      const token = env("CONTACT_WEBHOOK_TOKEN");
      const res = await withTimeout(webhook, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ source: siteConfig.name, submittedAt: new Date().toISOString(), ...data }),
      });
      if (!res.ok) return { status: "failed", detail: `Webhook responded ${res.status}` };
      return { status: "sent" };
    }
  } catch (err) {
    return { status: "failed", detail: err instanceof Error ? err.message : String(err) };
  }

  return { status: "not_configured" };
}
