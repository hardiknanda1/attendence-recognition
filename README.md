# Lumen Attend — facial attendance website

Marketing site for an AI-powered facial attendance system for schools, universities, government organisations and corporate offices.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS v4 · Framer Motion · HTML Canvas · Zod

## Getting started

```bash
npm install
cp .env.example .env.local   # optional: brand name + contact delivery
npm run dev                  # http://localhost:3000
npm run build && npm start   # production
```

## Configuration

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_BRAND_NAME` | Brand name in navbar, footer, metadata (default `Lumen Attend`). Also editable in `src/config/site.ts`. |
| `NEXT_PUBLIC_SITE_URL` | Absolute site URL for metadata. |
| `GMAIL_USER`, `GMAIL_APP_PASSWORD` | Send each submission to you from your Gmail, plus a confirmation email to the submitter. Optional: `CONTACT_TO_EMAIL` (defaults to `GMAIL_USER`), `CONTACT_SEND_CONFIRMATION=false`, `CONTACT_CONFIRMATION_MESSAGE`. |
| `RESEND_API_KEY`, `CONTACT_TO_EMAIL`, `CONTACT_FROM_EMAIL` | Or send contact submissions to you by email via Resend. |
| `CONTACT_WEBHOOK_URL`, `CONTACT_WEBHOOK_TOKEN` | Or POST submissions as JSON to any webhook. |

If several are configured, Gmail is used first, then Resend, then the webhook. If no delivery service is configured, `/api/contact` still validates input but responds `503` and the form tells the user the message was **not** sent. It never reports success unless the provider accepted the message. To add another provider, extend `src/lib/contact-delivery.ts`.

## Scroll-controlled hero

- `public/frames/lg` (1280×720) and `public/frames/sm` (768×432) hold all 240 frames from the supplied sequence, in order (`0001`–`0240`), re-encoded to WebP without other changes. `poster-start.jpg` / `poster-end.jpg` are the untouched first and last frames.
- `src/lib/frame-sequence.ts` loads frames coarse-to-fine (every 32nd frame first, down to every frame), decodes each with `img.decode()` before drawing, and falls back to the nearest loaded frame while loading.
- `src/components/ScrollHero.tsx` pins the canvas for 350vh. Scroll progress maps to the frame index with a short hold at both ends, and the displayed frame eases toward the target in a `requestAnimationFrame` loop that runs only while moving. Scrolling up plays the sequence in reverse.
- Headlines change with the frame: *Attendance, Reimagined.* (opening) → *One Face. One Seamless Check-In.* → *Make Your Institution Smarter.* (from frame 214, empty scanner).
- On wide screens the frame covers the viewport with the subjects kept right of centre. On portrait screens the right part of the frame is shown in the lower viewport, and its own top and bottom pixel rows extend the grey backdrop and floor.
- `prefers-reduced-motion`: the hero is a single static viewport showing the first frame (only that frame is downloaded). Before the canvas paints, a plain `<img>` poster is shown.

## Structure

```
src/app/            layout, home, /contact, /privacy, /api/contact
src/components/     Navbar, Footer, ScrollHero, ContactForm, sections/*
src/lib/            frame loader + drawing, contact schema (shared client/server), delivery
src/config/site.ts  brand name, navigation, links
```

The Privacy Policy page is a starting template; review it before publishing.
