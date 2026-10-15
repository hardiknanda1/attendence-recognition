import { ScrollHero } from "@/components/ScrollHero";
import { Introduction } from "@/components/sections/Introduction";
import { HowItWorks } from "@/components/sections/HowItWorks";
import { About } from "@/components/sections/About";
import { UseCases } from "@/components/sections/UseCases";
import { FinalCta } from "@/components/sections/FinalCta";

export default function HomePage() {
  return (
    <>
      <ScrollHero />
      <Introduction />
      <HowItWorks />
      <About />
      <UseCases />
      <FinalCta />
    </>
  );
}
