import { Reveal } from "@/components/Reveal";
import { Eyebrow } from "@/components/ui";

const PILLARS = [
  {
    title: "Automated verification",
    body: "Each check-in is matched against an enrolled facial profile the moment a person reaches the scanner, replacing roll calls, sign-in sheets and the proxy attendance they invite.",
  },
  {
    title: "Effortless attendance",
    body: "People simply walk up and face the scanner. No cards to carry, no registers to sign and no shared devices to touch — attendance is captured as part of arriving.",
  },
  {
    title: "Centralised records",
    body: "Every verified entry flows into a single, consistent record that administrators can review, filter and export, instead of reconciling paper and spreadsheets.",
  },
];

export function Introduction() {
  return (
    <section aria-labelledby="intro-heading" className="bg-charcoal py-28 md:py-40">
      <div className="container-page">
        <div className="grid gap-12 lg:grid-cols-12">
          <Reveal className="lg:col-span-4">
            <Eyebrow className="text-accent">The platform</Eyebrow>
          </Reveal>
          <Reveal className="lg:col-span-8" delay={0.05}>
            <h2
              id="intro-heading"
              className="font-display text-4xl leading-[1.08] text-paper md:text-6xl"
            >
              Attendance that records itself, <span className="italic text-paper/60">so people can get on with their day.</span>
            </h2>
          </Reveal>
        </div>

        <ul className="mt-20 grid gap-y-12 md:mt-28 md:grid-cols-3 md:gap-x-10 lg:gap-x-16">
          {PILLARS.map((pillar, i) => (
            <Reveal as="li" key={pillar.title} delay={0.08 * i} className="border-t border-white/15 pt-7">
              <p className="font-mono text-xs tracking-widest text-mist">0{i + 1}</p>
              <h3 className="mt-6 text-xl font-medium tracking-tight text-paper">{pillar.title}</h3>
              <p className="mt-4 leading-relaxed text-paper/65">{pillar.body}</p>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
