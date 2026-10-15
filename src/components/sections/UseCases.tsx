import { Reveal } from "@/components/Reveal";
import { Eyebrow } from "@/components/ui";

const CASES = [
  {
    name: "Schools",
    body: "Register students as they arrive, give teachers back the minutes spent on roll call, and keep a dependable record of who is on site.",
    contexts: ["Morning registration", "Staff sign-in", "Exam halls"],
  },
  {
    name: "Universities",
    body: "Track lecture and lab attendance across large cohorts and multiple buildings without paper sheets or easily shared QR codes.",
    contexts: ["Lecture theatres", "Laboratories", "Examinations"],
  },
  {
    name: "Government Organisations",
    body: "Maintain accurate, auditable attendance for staff across departments and sites, replacing registers and card systems prone to misuse.",
    contexts: ["Departmental offices", "Field sites", "Training centres"],
  },
  {
    name: "Corporate Offices",
    body: "Record time and attendance as employees enter, feeding consistent data to HR and payroll without badges to lose or share.",
    contexts: ["Reception & entry", "Shift work", "Multi-site teams"],
  },
];

export function UseCases() {
  return (
    <section aria-labelledby="usecases-heading" className="bg-charcoal py-28 md:py-40">
      <div className="container-page">
        <Reveal className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Eyebrow className="text-accent">Institutional use cases</Eyebrow>
          </div>
          <h2 id="usecases-heading" className="font-display text-4xl leading-[1.06] text-paper md:text-6xl lg:col-span-8">
            One check-in, wherever attendance matters.
          </h2>
        </Reveal>

        <ul className="mt-20 border-b border-white/12 md:mt-28">
          {CASES.map((c, i) => (
            <Reveal
              as="li"
              key={c.name}
              delay={0.05 * i}
              className="group relative grid gap-5 border-t border-white/12 py-10 md:grid-cols-12 md:gap-10 md:py-12"
            >
              <span
                aria-hidden="true"
                className="absolute left-0 top-[-1px] h-px w-0 bg-accent transition-[width] duration-700 ease-out-soft group-hover:w-full"
              />
              <p className="font-mono text-xs tracking-widest text-mist md:col-span-1 md:pt-3">0{i + 1}</p>
              <h3 className="font-display text-3xl text-paper md:col-span-4 md:text-4xl">{c.name}</h3>
              <p className="leading-relaxed text-paper/65 md:col-span-4">{c.body}</p>
              <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-mist md:col-span-3 md:flex-col md:items-end md:text-right">
                {c.contexts.map((ctx) => (
                  <li key={ctx}>{ctx}</li>
                ))}
              </ul>
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
