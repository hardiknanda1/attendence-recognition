import { z } from "zod";

export const INSTITUTION_TYPES = [
  "School",
  "College or University",
  "Government Organisation",
  "Corporate Office",
  "Other",
] as const;

export const USER_COUNT_RANGES = ["Under 250", "250 – 1,000", "1,000 – 5,000", "5,000 – 20,000", "More than 20,000"] as const;

const optionalText = (schema: z.ZodString) =>
  z.preprocess((v) => (typeof v === "string" && v.trim() === "" ? undefined : v), schema.optional());

/** Shared by the client form and the API route, so both validate identically. */
export const contactSchema = z.object({
  fullName: z
    .string({ error: "Please enter your full name." })
    .trim()
    .min(2, "Please enter your full name.")
    .max(120, "Name is too long."),
  email: z
    .string({ error: "Please enter your official email address." })
    .trim()
    .max(254, "Email address is too long.")
    .pipe(z.email("Please enter a valid email address.")),
  institutionName: z
    .string({ error: "Please enter your institution's name." })
    .trim()
    .min(2, "Please enter your institution's name.")
    .max(160, "Institution name is too long."),
  institutionType: z.enum(INSTITUTION_TYPES, { error: "Please select your institution type." }),
  phone: optionalText(
    z
      .string()
      .trim()
      .max(25, "Phone number is too long.")
      .regex(/^\+?[0-9()\-.\s]{7,25}$/, "Please enter a valid phone number."),
  ),
  userCount: z.preprocess(
    (v) => (v === "" ? undefined : v),
    z.enum(USER_COUNT_RANGES, { error: "Please choose a range from the list." }).optional(),
  ),
  message: z
    .string({ error: "Please include a short message." })
    .trim()
    .min(10, "Please tell us a little more (at least 10 characters).")
    .max(4000, "Message is too long (4,000 characters maximum)."),
});

export type ContactInput = z.input<typeof contactSchema>;
export type ContactSubmission = z.output<typeof contactSchema>;
export type ContactField = keyof ContactSubmission;

export type ContactResponse =
  | { ok: true; confirmationSent?: boolean }
  | {
      ok: false;
      error: string;
      code: "validation" | "not_configured" | "delivery_failed" | "rate_limited" | "bad_request";
      fieldErrors?: Partial<Record<ContactField, string>>;
    };

export function flattenErrors(error: z.ZodError): Partial<Record<ContactField, string>> {
  const out: Partial<Record<ContactField, string>> = {};
  for (const issue of error.issues) {
    const key = issue.path[0] as ContactField | undefined;
    if (key && !out[key]) out[key] = issue.message;
  }
  return out;
}
