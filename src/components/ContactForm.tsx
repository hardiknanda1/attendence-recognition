"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useId, useRef, useState, type FormEvent } from "react";
import {
  contactSchema,
  flattenErrors,
  INSTITUTION_TYPES,
  USER_COUNT_RANGES,
  type ContactField,
  type ContactResponse,
} from "@/lib/contact-schema";
import { Arrow } from "@/components/ui";

type Status = "idle" | "submitting" | "success" | "error";

const FIELD_ORDER: ContactField[] = [
  "fullName",
  "email",
  "institutionName",
  "institutionType",
  "phone",
  "userCount",
  "message",
];

const inputClass =
  "mt-2 block w-full rounded-none border-0 border-b bg-transparent px-0 py-3 text-base text-paper placeholder:text-paper/30 transition-colors focus:outline-none focus:ring-0 focus-visible:outline-none";

function Field({
  id,
  label,
  optional,
  error,
  children,
  className = "",
}: {
  id: string;
  label: string;
  optional?: boolean;
  error?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={id} className="flex items-baseline justify-between text-sm text-paper/75">
        <span>{label}</span>
        {optional && <span className="text-xs text-paper/40">Optional</span>}
      </label>
      {children}
      <p id={`${id}-error`} role={error ? "alert" : undefined} className="mt-2 min-h-5 text-sm text-[#f0a9a0]">
        {error}
      </p>
    </div>
  );
}

export function ContactForm() {
  const uid = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [formError, setFormError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Partial<Record<ContactField, string>>>({});
  // Address a confirmation email was sent to, if the server sent one.
  const [confirmedTo, setConfirmedTo] = useState<string | null>(null);

  const id = (name: string) => `${uid}-${name}`;
  const borderFor = (name: ContactField) =>
    errors[name] ? "border-[#f0a9a0]/80 focus:border-[#f0a9a0]" : "border-white/20 focus:border-accent";
  const describe = (name: ContactField) => (errors[name] ? `${id(name)}-error` : undefined);

  const focusFirstError = (fieldErrors: Partial<Record<ContactField, string>>) => {
    const first = FIELD_ORDER.find((f) => fieldErrors[f]);
    if (first) formRef.current?.querySelector<HTMLElement>(`[name="${first}"]`)?.focus();
  };

  // Re-validate a single field after it has been flagged, so errors clear as the user fixes them.
  const revalidate = (name: ContactField) => {
    if (!errors[name] || !formRef.current) return;
    const data = Object.fromEntries(new FormData(formRef.current));
    const result = contactSchema.safeParse(data);
    const next = result.success ? {} : flattenErrors(result.error);
    setErrors((prev) => ({ ...prev, [name]: next[name] }));
  };

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (status === "submitting") return;

    const data = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = contactSchema.safeParse(data);
    if (!parsed.success) {
      const fieldErrors = flattenErrors(parsed.error);
      setErrors(fieldErrors);
      setFormError("Please correct the highlighted fields.");
      setStatus("error");
      focusFirstError(fieldErrors);
      return;
    }

    setErrors({});
    setFormError(null);
    setStatus("submitting");

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...parsed.data, website: data.website ?? "" }),
      });
      const body = (await res.json().catch(() => null)) as ContactResponse | null;

      if (res.ok && body?.ok) {
        setConfirmedTo(body.confirmationSent ? parsed.data.email : null);
        setStatus("success");
        formRef.current?.reset();
        return;
      }

      const failure = body && !body.ok ? body : null;
      if (failure?.fieldErrors) {
        setErrors(failure.fieldErrors);
        focusFirstError(failure.fieldErrors);
      }
      setFormError(failure?.error ?? "Something went wrong and your message was not sent. Please try again.");
      setStatus("error");
    } catch {
      setFormError("We couldn't reach the server. Check your connection and try again — your message was not sent.");
      setStatus("error");
    }
  }

  if (status === "success") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        role="status"
        aria-live="polite"
        className="border-t border-white/15 pt-10"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-accent/60 text-accent">
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="1.6">
            <path d="M5 12.5l4.5 4.5L19 7.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <h2 className="mt-8 font-display text-4xl text-paper">Thank you — your message has been sent.</h2>
        <p className="mt-4 max-w-md leading-relaxed text-paper/70">
          A member of our team will reply to the email address you provided.
          {confirmedTo && (
            <>
              {" "}
              We&rsquo;ve also sent a confirmation to <span className="text-paper">{confirmedTo}</span>.
            </>
          )}
        </p>
        <button
          type="button"
          onClick={() => setStatus("idle")}
          className="mt-8 text-sm text-paper/70 underline underline-offset-[6px] hover:text-paper"
        >
          Send another message
        </button>
      </motion.div>
    );
  }

  const submitting = status === "submitting";

  return (
    <form ref={formRef} onSubmit={onSubmit} noValidate aria-describedby={formError ? id("form-error") : undefined}>
      <fieldset disabled={submitting} className="grid gap-x-10 gap-y-4 sm:grid-cols-2">
        <legend className="sr-only">Contact details</legend>

        <Field id={id("fullName")} label="Full name" error={errors.fullName}>
          <input
            id={id("fullName")}
            name="fullName"
            type="text"
            autoComplete="name"
            required
            aria-invalid={!!errors.fullName}
            aria-describedby={describe("fullName")}
            onBlur={() => revalidate("fullName")}
            onChange={() => revalidate("fullName")}
            className={`${inputClass} ${borderFor("fullName")}`}
          />
        </Field>

        <Field id={id("email")} label="Official email" error={errors.email}>
          <input
            id={id("email")}
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            placeholder="name@institution.edu"
            aria-invalid={!!errors.email}
            aria-describedby={describe("email")}
            onChange={() => revalidate("email")}
            className={`${inputClass} ${borderFor("email")}`}
          />
        </Field>

        <Field id={id("institutionName")} label="Institution name" error={errors.institutionName}>
          <input
            id={id("institutionName")}
            name="institutionName"
            type="text"
            autoComplete="organization"
            required
            aria-invalid={!!errors.institutionName}
            aria-describedby={describe("institutionName")}
            onChange={() => revalidate("institutionName")}
            className={`${inputClass} ${borderFor("institutionName")}`}
          />
        </Field>

        <Field id={id("institutionType")} label="Institution type" error={errors.institutionType}>
          <select
            id={id("institutionType")}
            name="institutionType"
            required
            defaultValue=""
            aria-invalid={!!errors.institutionType}
            aria-describedby={describe("institutionType")}
            onChange={() => revalidate("institutionType")}
            className={`${inputClass} ${borderFor("institutionType")} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%23c9ccd1%22 stroke-width=%221.5%22><path d=%22M4 6l4 4 4-4%22/></svg>')] bg-[length:14px] bg-[right_2px_center] bg-no-repeat pr-6`}
          >
            <option value="" disabled className="bg-graphite">
              Select…
            </option>
            {INSTITUTION_TYPES.map((t) => (
              <option key={t} value={t} className="bg-graphite">
                {t}
              </option>
            ))}
          </select>
        </Field>

        <Field id={id("phone")} label="Phone number" optional error={errors.phone}>
          <input
            id={id("phone")}
            name="phone"
            type="tel"
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={!!errors.phone}
            aria-describedby={describe("phone")}
            onChange={() => revalidate("phone")}
            className={`${inputClass} ${borderFor("phone")}`}
          />
        </Field>

        <Field id={id("userCount")} label="Approx. number of users" optional error={errors.userCount}>
          <select
            id={id("userCount")}
            name="userCount"
            defaultValue=""
            aria-invalid={!!errors.userCount}
            aria-describedby={describe("userCount")}
            className={`${inputClass} ${borderFor("userCount")} appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 16%22 fill=%22none%22 stroke=%22%23c9ccd1%22 stroke-width=%221.5%22><path d=%22M4 6l4 4 4-4%22/></svg>')] bg-[length:14px] bg-[right_2px_center] bg-no-repeat pr-6`}
          >
            <option value="" className="bg-graphite">
              Prefer not to say
            </option>
            {USER_COUNT_RANGES.map((r) => (
              <option key={r} value={r} className="bg-graphite">
                {r}
              </option>
            ))}
          </select>
        </Field>

        <Field id={id("message")} label="Message" error={errors.message} className="sm:col-span-2">
          <textarea
            id={id("message")}
            name="message"
            rows={5}
            required
            maxLength={4000}
            placeholder="Tell us about your institution and how attendance is taken today."
            aria-invalid={!!errors.message}
            aria-describedby={describe("message")}
            onChange={() => revalidate("message")}
            className={`${inputClass} ${borderFor("message")} resize-y`}
          />
        </Field>

        {/* Honeypot — hidden from people and assistive technology. */}
        <div aria-hidden="true" className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label htmlFor={id("website")}>Website</label>
          <input id={id("website")} name="website" type="text" tabIndex={-1} autoComplete="off" />
        </div>
      </fieldset>

      <AnimatePresence>
        {status === "error" && formError && (
          <motion.p
            id={id("form-error")}
            role="alert"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-6 border-l-2 border-[#f0a9a0] bg-[#f0a9a0]/10 px-4 py-3 text-sm text-paper/90"
          >
            {formError}
          </motion.p>
        )}
      </AnimatePresence>

      <div className="mt-8 flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="max-w-sm text-xs leading-relaxed text-paper/45">
          We use these details only to respond to your enquiry. See our{" "}
          <a href="/privacy" className="underline underline-offset-4 hover:text-paper">
            Privacy Policy
          </a>
          .
        </p>
        <button
          type="submit"
          disabled={submitting}
          aria-busy={submitting}
          className="group inline-flex min-w-44 shrink-0 items-center whitespace-nowrap justify-center gap-2 rounded-full bg-paper px-7 py-3.5 text-sm font-medium tracking-wide text-ink transition-colors hover:bg-white disabled:cursor-wait disabled:opacity-80"
        >
          {submitting ? (
            <>
              <span
                aria-hidden="true"
                className="h-4 w-4 animate-spin rounded-full border-2 border-ink/25 border-t-ink"
              />
              Sending…
            </>
          ) : (
            <>
              Send message
              <Arrow />
            </>
          )}
        </button>
      </div>
      <p className="sr-only" aria-live="polite">
        {submitting ? "Sending your message." : ""}
      </p>
    </form>
  );
}
