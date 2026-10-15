import Link from "next/link";
import { siteConfig } from "@/config/site";
import { BrandMark } from "@/components/Navbar";
import { CurrentYear } from "@/components/CurrentYear";

export function Footer() {
  return (
    <footer className="border-t border-white/10 bg-ink text-paper">
      <div className="container-page flex flex-col gap-12 py-16 md:flex-row md:items-start md:justify-between">
        <div className="max-w-xs">
          <Link href="/" aria-label={`${siteConfig.name} — home`}>
            <BrandMark />
          </Link>
          <p className="mt-4 text-sm leading-relaxed text-paper/55">
            Simplify attendance with intelligent facial recognition.
          </p>
        </div>
        <nav aria-label="Footer">
          <ul className="grid grid-cols-2 gap-x-12 gap-y-3 text-sm sm:flex sm:gap-10">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <Link href={item.href} className="text-paper/70 transition-colors hover:text-paper">
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="container-page flex flex-col gap-3 border-t border-white/10 py-6 text-xs text-paper/45 sm:flex-row sm:items-center sm:justify-between">
        <p>
          © <CurrentYear /> {siteConfig.name}. All rights reserved.
        </p>
        <Link href={siteConfig.privacyHref} className="transition-colors hover:text-paper">
          Privacy Policy
        </Link>
      </div>
    </footer>
  );
}
