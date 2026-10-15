import type { Metadata } from "next";
import Link from "next/link";
import { Eyebrow } from "@/components/ui";
import { siteConfig } from "@/config/site";

export const metadata: Metadata = {
  title: "Privacy Policy",
  description: `How ${siteConfig.name} handles information submitted through this website.`,
};

export default function PrivacyPage() {
  return (
    <section aria-labelledby="privacy-heading" className="bg-charcoal pb-28 pt-36 md:pb-40 md:pt-48">
      <div className="container-page">
        <div className="max-w-3xl">
          <Eyebrow className="text-accent">Legal</Eyebrow>
          <h1 id="privacy-heading" className="mt-6 font-display text-5xl leading-[1.04] text-paper md:text-6xl">
            Privacy Policy
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-paper/70">
            This page explains how information submitted through this website is handled. It should be reviewed and
            completed by {siteConfig.name} before publication to reflect the organisation&rsquo;s legal entity,
            jurisdiction and data-protection contacts.
          </p>

          <div className="mt-16 space-y-12 leading-relaxed text-paper/70 [&_h2]:mb-4 [&_h2]:text-xl [&_h2]:font-medium [&_h2]:text-paper">
            <div>
              <h2>Information we collect</h2>
              <p>
                When you use the <Link href="/contact" className="underline underline-offset-4">contact form</Link>, we
                collect the details you choose to provide: your name, official email address, institution name and
                type, and optionally a phone number, an approximate number of users and your message.
              </p>
            </div>
            <div>
              <h2>How we use it</h2>
              <p>
                We use this information only to respond to your enquiry and to discuss our services with you. We do
                not sell it, and we do not use it for unrelated marketing without your consent.
              </p>
            </div>
            <div>
              <h2>Facial data</h2>
              <p>
                This website does not collect facial images or biometric data. Facial data processed by the attendance
                platform at an institution is governed by that institution&rsquo;s own agreements and policies.
              </p>
            </div>
            <div>
              <h2>Retention and your rights</h2>
              <p>
                Enquiries are kept only as long as needed to respond and follow up. You may ask us to access, correct
                or delete the information you have submitted by contacting us through the contact page.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
