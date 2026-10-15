"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { ButtonLink } from "@/components/ui";

export function BrandMark({ className = "" }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5" fill="none">
        <rect x="9.5" y="2" width="5" height="20" rx="1.2" stroke="currentColor" strokeWidth="1.4" />
        <circle cx="12" cy="6.5" r="1.1" fill="var(--color-accent)" />
      </svg>
      <span className="text-[0.95rem] font-medium tracking-tight">{siteConfig.name}</span>
    </span>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const toggleRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu on navigation.
  useEffect(() => setOpen(false), [pathname]);

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panelRef.current?.querySelector<HTMLElement>("a")?.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        toggleRef.current?.focus();
      }
      if (e.key === "Tab" && panelRef.current) {
        const focusables = [
          toggleRef.current,
          ...panelRef.current.querySelectorAll<HTMLElement>("a, button"),
        ].filter(Boolean) as HTMLElement[];
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = scrolled || open;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 border-b transition-[background-color,border-color,backdrop-filter] duration-500 ease-out-soft ${
        solid
          ? "border-white/10 bg-ink/75 backdrop-blur-md"
          : "border-transparent bg-transparent"
      }`}
    >
      <nav aria-label="Primary" className="container-page flex h-16 items-center justify-between md:h-20">
        <Link href="/" className="text-paper" aria-label={`${siteConfig.name} — home`}>
          <BrandMark />
        </Link>

        <ul className="hidden items-center gap-9 md:flex">
          {siteConfig.nav.map((item) => {
            const active = item.href === pathname;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={`relative text-sm tracking-wide transition-colors duration-300 hover:text-paper ${
                    active ? "text-paper" : "text-paper/70"
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden md:block">
          <ButtonLink href={siteConfig.contactHref} className="!px-5 !py-2.5">
            Get in Touch
          </ButtonLink>
        </div>

        <button
          ref={toggleRef}
          type="button"
          className="relative -mr-2 flex h-11 w-11 items-center justify-center text-paper md:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Close menu" : "Open menu"}
          onClick={() => setOpen((v) => !v)}
        >
          <span
            aria-hidden="true"
            className={`absolute h-px w-5 bg-current transition-transform duration-300 ease-out-soft ${
              open ? "rotate-45" : "-translate-y-1"
            }`}
          />
          <span
            aria-hidden="true"
            className={`absolute h-px w-5 bg-current transition-transform duration-300 ease-out-soft ${
              open ? "-rotate-45" : "translate-y-1"
            }`}
          />
        </button>
      </nav>

      <AnimatePresence>
        {open && (
          <motion.div
            id="mobile-menu"
            ref={panelRef}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            // Absolute (not fixed): the header's backdrop-filter makes it the containing block.
            className="absolute inset-x-0 top-full h-[calc(100dvh-4rem)] border-t border-white/10 bg-ink md:hidden"
          >
            <div className="container-page flex h-full flex-col justify-between pb-10 pt-10">
              <ul className="space-y-1">
                {siteConfig.nav.map((item, i) => (
                  <motion.li
                    key={item.href}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * i, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setOpen(false)}
                      aria-current={item.href === pathname ? "page" : undefined}
                      className="block border-b border-white/10 py-4 font-display text-4xl text-paper"
                    >
                      {item.label}
                    </Link>
                  </motion.li>
                ))}
              </ul>
              <ButtonLink href={siteConfig.contactHref} onClick={() => setOpen(false)} className="w-full">
                Get in Touch
              </ButtonLink>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
