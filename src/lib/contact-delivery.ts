import "server-only";
import nodemailer from "nodemailer";
import type { ContactSubmission } from "@/lib/contact-schema";
import { siteConfig } from "@/config/site";

/**
 * Integration point for contact form delivery.
 *
 * Supported out of the box (configure via environment variables, see .env.example).
 * The first one configured is used:
 *   1. Gmail (SMTP)      — GMAIL_USER, GMAIL_APP_PASSWORD (+ optional CONTACT_TO_EMAIL).
 *                          Also emails the submitter a confirmation from your Gmail.
 *   2. Resend email API  — RESEND_API_KEY, CONTACT_TO_EMAIL, CONTACT_FROM_EMAIL
 *   3. Generic webhook   — CONTACT_WEBHOOK_URL (+ optional CONTACT_WEBHOOK_TOKEN)
 *
 * To use another provider (SMTP, SendGrid, a CRM...), add a branch here that
 * returns `{ status: "sent" }` only once the provider has accepted the message.
 */
export type DeliveryResult =
  | { status: "sent"; confirmationSent?: boolean }
  | { status: "not_configured" }
  | { status: "failed"; detail: string };

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

// At most one confirmation per recipient in this window, so the form can't be used to flood an inbox
// from your Gmail. Best-effort and per-instance, like the route's rate limit.
const CONFIRMATION_WINDOW_MS = 30 * 60 * 1000;
const lastConfirmation = new Map<string, number>();

function claimConfirmationSlot(email: string) {
  const now = Date.now();
  const key = email.toLowerCase();
  const last = lastConfirmation.get(key);
  if (last && now - last < CONFIRMATION_WINDOW_MS) return false;
  lastConfirmation.set(key, now);
  if (lastConfirmation.size > 5000) {
    for (const [k, t] of lastConfirmation) if (now - t >= CONFIRMATION_WINDOW_MS) lastConfirmation.delete(k);
  }
  return true;
}

/**
 * Auto-reply to the submitter. It deliberately repeats none of their message or
 * other free text (only a shortened first name), so it can't be abused to send
 * arbitrary content from your address.
 */
function renderConfirmation(data: ContactSubmission, replyTo: string) {
  const firstName = data.fullName.split(/\s+/)[0].slice(0, 40);
  const custom = env("CONTACT_CONFIRMATION_MESSAGE");
  const paragraphs = [
    `Hi ${firstName},`,
    custom ??
      `Thank you for contacting ${siteConfig.name}. We've received your enquiry and a member of our team will get back to you at this email address soon.`,
    `If you have anything to add, simply reply to this email.`,
    `If you didn't submit this enquiry, you can safely ignore this message.`,
    `— The ${siteConfig.name} team`,
  ];
  return {
    subject: `We've received your enquiry — ${siteConfig.name}`,
    text: paragraphs.join("\n\n"),
    html: `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.6;color:#111;max-width:560px">${paragraphs
      .map((p) => `<p style="margin:0 0 16px">${escapeHtml(p)}</p>`)
      .join("")}</div>`,
    replyTo,
  };
}

async function deliverViaGmail(
  data: ContactSubmission,
  user: string,
  appPassword: string,
  recipients: string[],
): Promise<DeliveryResult> {
  const transport = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true,
    auth: { user, pass: appPassword },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });

  try {
    // 1. The enquiry, to you. Replying to it answers the submitter directly.
    await transport.sendMail({
      from: { name: `${siteConfig.name} Website`, address: user },
      to: recipients,
      replyTo: { name: data.fullName, address: data.email },
      subject: `New enquiry: ${data.institutionName} (${data.institutionType})`,
      text: renderText(data),
      html: renderHtml(data),
    });

    // 2. Confirmation to the submitter. Failure here doesn't fail the submission: you already have it.
    let confirmationSent = false;
    if (env("CONTACT_SEND_CONFIRMATION")?.toLowerCase() !== "false" && claimConfirmationSlot(data.email)) {
      const confirmation = renderConfirmation(data, recipients[0]);
      try {
        await transport.sendMail({
          from: { name: siteConfig.name, address: user },
          to: { name: data.fullName, address: data.email },
          ...confirmation,
        });
        confirmationSent = true;
      } catch (err) {
        console.error("[contact] Confirmation email failed:", err instanceof Error ? err.message : err);
      }
    }
    return { status: "sent", confirmationSent };
  } finally {
    transport.close();
  }
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
  const gmailUser = env("GMAIL_USER");
  // Google shows app passwords in groups of four; spaces are not part of the password.
  const gmailPassword = env("GMAIL_APP_PASSWORD")?.replace(/\s+/g, "");

  try {
    if (gmailUser && gmailPassword) {
      const recipients = (to ?? gmailUser).split(",").map((s) => s.trim()).filter(Boolean);
      return await deliverViaGmail(data, gmailUser, gmailPassword, recipients);
    }

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
