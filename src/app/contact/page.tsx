import type { Metadata } from "next";
import { ContactForm } from "@/components/ContactForm";
import { Eyebrow } from "@/components/ui";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Contact",
  description: `Talk to the ${siteConfig.name} team about facial-recognition attendance for your institution.`,
};

const EXPECT = [
  "A reply from our team to the email address you provide.",
  "A conversation about how attendance is taken at your institution today.",
  "An honest view of whether the platform suits your needs.",
];

export default function ContactPage() {
  return (
    <section aria-labelledby="contact-heading" className="relative overflow-hidden bg-charcoal pb-28 pt-36 md:pb-40 md:pt-48">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-40 -top-40 h-[36rem] w-[36rem] rounded-full bg-accent/10 blur-3xl"
      />
      <div className="container-page relative grid gap-16 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-5">
          <Eyebrow className="text-accent">Contact</Eyebrow>
          <h1 id="contact-heading" className="mt-6 font-display text-5xl leading-[1.02] text-paper md:text-7xl">
            Let&rsquo;s talk about <span className="italic text-paper/60">your institution.</span>
          </h1>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-paper/70">
            Share a few details and our team will be in touch to discuss how facial-recognition attendance could work
            for you.
          </p>

          <div className="mt-14 border-t border-white/12 pt-8">
            <p className="eyebrow text-mist">What to expect</p>
            <ul className="mt-6 space-y-4">
              {EXPECT.map((item) => (
                <li key={item} className="flex gap-4 leading-relaxed text-paper/70">
                  <span aria-hidden="true" className="mt-2.5 h-1.5 w-1.5 shrink-0 rounded-full bg-accent" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <ContactForm />
        </div>
      </div>
    </section>
  );
}
