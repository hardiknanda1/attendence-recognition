import { Reveal } from "@/components/Reveal";
import { Eyebrow } from "@/components/ui";
import { siteConfig } from "@/config/site";

const PRINCIPLES = [
  {
    title: "Accuracy first",
    body: "Attendance data informs funding, compliance, payroll and student welfare. It should be right the first time, without manual correction.",
  },
  {
    title: "Respect for people",
    body: "Facial data is personal. It should be collected with clear purpose, handled under the institution's control and used for attendance — nothing else.",
  },
  {
    title: "Simplicity at every step",
    body: "For the people checking in it should feel like walking through a door. For administrators, records should be clear without training manuals.",
  },
];

export function About() {
  return (
    <section id="about" aria-labelledby="about-heading" className="bg-paper-dim py-28 text-ink md:py-40">
      <div className="container-page grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-6">
          <Reveal>
            <Eyebrow className="text-accent-strong">About us</Eyebrow>
            <h2 id="about-heading" className="mt-6 font-display text-5xl leading-[1.02] md:text-7xl">
              Built for Institutions.
              <br />
              <span className="italic text-ink/55">Designed for People.</span>
            </h2>
          </Reveal>
        </div>

        <div className="space-y-6 text-lg leading-relaxed text-ink/75 lg:col-span-5 lg:col-start-8 lg:pt-16">
          <Reveal delay={0.05}>
            <p>
              Taking attendance is one of the most repeated tasks in any institution — and one of the least rewarding.
              Roll calls consume teaching time, sign-in sheets invite errors and proxies, and records end up scattered
              across registers and spreadsheets.
            </p>
          </Reveal>
          <Reveal delay={0.1}>
            <p>
              {siteConfig.name} exists to make that task disappear into the background. Using facial recognition at the
              point of entry, it verifies who has arrived and records it automatically, giving administrators reliable
              data and giving everyone else their time back.
            </p>
          </Reveal>
        </div>

        <ul className="grid gap-10 border-t border-ink/15 pt-12 md:grid-cols-3 lg:col-span-12 lg:mt-12">
          {PRINCIPLES.map((p, i) => (
            <Reveal as="li" key={p.title} delay={0.08 * i}>
              <h3 className="flex items-center gap-3 text-lg font-medium tracking-tight">
                <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-accent-strong" />
                {p.title}
              </h3>
              <p className="mt-3 leading-relaxed text-ink/65">{p.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
