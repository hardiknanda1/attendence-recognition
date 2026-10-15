"use client";

/** Rendered on the client so statically generated pages never show a stale year. */
export function CurrentYear() {
  return <span suppressHydrationWarning>{new Date().getFullYear()}</span>;
}
