import Image from "next/image";
import { Reveal } from "@/components/Reveal";
import { ButtonLink } from "@/components/ui";
import { siteConfig } from "@/config/site";
import emptyScanner from "../../../public/frames/poster-end.jpg";

export function FinalCta() {
  return (
    <section aria-labelledby="cta-heading" className="relative isolate overflow-hidden bg-[#5f646d]">
      {/* The empty scanner from the end of the hero sequence, carried through to the closing call to action. */}
      <Image
        src={emptyScanner}
        alt=""
        aria-hidden="true"
        fill
        sizes="100vw"
        placeholder="blur"
        className="-z-10 object-cover object-[78%_50%]"
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(18,20,24,0.78)_0%,rgba(18,20,24,0.45)_45%,rgba(18,20,24,0.05)_80%)]"
      />
      <div aria-hidden="true" className="absolute inset-x-0 top-0 -z-10 h-32 bg-gradient-to-b from-charcoal to-transparent" />

      <div className="container-page flex min-h-[80svh] flex-col justify-center py-32">
        <Reveal className="max-w-2xl">
          <h2 id="cta-heading" className="font-display text-5xl leading-[1.02] text-paper md:text-7xl">
            Make Your Institution Smarter.
          </h2>
          <p className="mt-6 max-w-md text-lg leading-relaxed text-paper/80">
            Tell us about your institution and how attendance works today. Our team will help you understand whether{" "}
            {siteConfig.name} is the right fit.
          </p>
          <ButtonLink href={siteConfig.contactHref} className="mt-10">
            Contact Our Team
          </ButtonLink>
        </Reveal>
      </div>
    </section>
  );
}
