/**
 * Central site configuration. The brand name can be changed here or via the
 * NEXT_PUBLIC_BRAND_NAME environment variable (inlined at build time).
 */
export const siteConfig = {
  name: process.env.NEXT_PUBLIC_BRAND_NAME?.trim() || "Lumen Attend",
  tagline: "Attendance, Reimagined.",
  description:
    "AI-powered facial attendance for schools, universities, government organisations and corporate offices. Simplify attendance with intelligent facial recognition.",
  url: process.env.NEXT_PUBLIC_SITE_URL?.trim() || "http://localhost:3000",
  nav: [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/#about" },
    { label: "How It Works", href: "/#how-it-works" },
    { label: "Contact", href: "/contact" },
  ],
  contactHref: "/contact",
  privacyHref: "/privacy",
} as const;

export type NavItem = (typeof siteConfig.nav)[number];
