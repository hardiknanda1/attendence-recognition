import { Reveal } from "@/components/Reveal";
import { Eyebrow } from "@/components/ui";

const STEPS = [
  {
    title: "Face Capture",
    body: "A person steps up to the scanner. The camera locates their face and captures a clear image in a moment — no posing, buttons or cards required.",
    icon: (
      <>
        <path d="M4 9V6a2 2 0 0 1 2-2h3M23 4h3a2 2 0 0 1 2 2v3M28 23v3a2 2 0 0 1-2 2h-3M9 28H6a2 2 0 0 1-2-2v-3" />
        <circle cx="16" cy="14" r="4.5" />
        <path d="M9.5 24c1.4-2.9 3.8-4.4 6.5-4.4s5.1 1.5 6.5 4.4" />
      </>
    ),
  },
  {
    title: "Identity Verification",
    body: "The captured face is compared against the institution's enrolled profiles. A confident match confirms who has arrived; anything uncertain is not recorded.",
    icon: (
      <>
        <circle cx="16" cy="16" r="11" />
        <path d="M11.5 16.2l3 3 6-6.4" />
      </>
    ),
  },
  {
    title: "Attendance Recorded",
    body: "The verified check-in is written to the attendance record with a timestamp, ready for administrators to review and report on.",
    icon: (
      <>
        <rect x="6" y="4" width="20" height="24" rx="2" />
        <path d="M11 11h10M11 16h10M11 21h6" />
      </>
    ),
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" aria-labelledby="how-heading" className="bg-paper py-28 text-ink md:py-40">
      <div className="container-page">
        <div className="flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <Reveal>
            <Eyebrow className="text-accent-strong">How it works</Eyebrow>
            <h2 id="how-heading" className="mt-6 max-w-2xl font-display text-4xl leading-[1.05] md:text-6xl">
              Three steps. One natural moment.
            </h2>
          </Reveal>
          <Reveal delay={0.1}>
            <p className="max-w-sm leading-relaxed text-ink/65">
              From the moment someone reaches the scanner to the instant their attendance is recorded, the process asks
              nothing more of them than to arrive.
            </p>
          </Reveal>
        </div>

        <ol className="relative mt-20 grid gap-14 md:mt-28 md:grid-cols-3 md:gap-0">
          {STEPS.map((step, i) => (
            <Reveal as="li" key={step.title} delay={0.12 * i} className="relative md:pr-10 lg:pr-14">
              <div className="flex items-center gap-4">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-ink/15 bg-white text-ink">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 32 32"
                    className="h-7 w-7"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    {step.icon}
                  </svg>
                </span>
                {i < STEPS.length - 1 && (
                  <span aria-hidden="true" className="hidden h-px flex-1 items-center bg-ink/15 md:flex">
                    <span className="ml-auto h-1.5 w-1.5 -translate-y-px rotate-45 border-r border-t border-ink/40" />
                  </span>
                )}
              </div>
              <p className="mt-8 font-mono text-xs tracking-widest text-accent-deep">STEP 0{i + 1}</p>
              <h3 className="mt-3 text-2xl font-medium tracking-tight">{step.title}</h3>
              <p className="mt-4 max-w-sm leading-relaxed text-ink/65">{step.body}</p>
            </Reveal>
          ))}
        </ol>
      </div>
    </section>
  );
}
