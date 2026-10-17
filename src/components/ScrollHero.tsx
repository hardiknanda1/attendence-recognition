"use client";

import Link from "next/link";
import { motion, useMotionValueEvent, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import { siteConfig } from "@/config/site";
import { Arrow, buttonClass } from "@/components/ui";
import { drawFrame, FRAME_COUNT, FrameSequence, pickFrameSet, STAGE_BACKGROUND } from "@/lib/frame-sequence";

/**
 * Story beats, expressed as frame indices of the supplied sequence:
 *   0–~50    first man is verified and exits
 *   ~50–150  the woman steps up, is verified and exits
 *   ~150–214 the final man steps up, is verified and exits
 *   214–239  the scanner stands alone
 */
const OPENING_END = 22;
const EMPTY_SCANNER = 214;

/** Small holds at both ends of the scroll range so the first and last frames get dwell time. */
const START_HOLD = 0.03;
const END_HOLD = 0.1;

const HEADLINES = [
  "Attendance, Reimagined.",
  "One Face. One Seamless Check-In.",
  "Make Your Institution Smarter.",
] as const;

function progressToFrame(p: number) {
  const t = Math.min(1, Math.max(0, (p - START_HOLD) / (1 - START_HOLD - END_HOLD)));
  return t * (FRAME_COUNT - 1);
}

function frameToPhase(frame: number) {
  if (frame < OPENING_END) return 0;
  if (frame >= EMPTY_SCANNER) return 2;
  return 1;
}

export function ScrollHero() {
  const sectionRef = useRef<HTMLElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sequenceRef = useRef<FrameSequence | null>(null);
  const sizeRef = useRef({ w: 0, h: 0 });
  const targetRef = useRef(0);
  const currentRef = useRef(0);
  const drawnRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const reduceMotion = useReducedMotion();
  const [phase, setPhase] = useState(0);
  const [painted, setPainted] = useState(false);

  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ["start start", "end end"] });
  // Function transform (not a range map) keeps this off framer's native ScrollTimeline path,
  // which doesn't honour the section-relative offsets above.
  const cueOpacity = useTransform(scrollYProgress, (p) => Math.max(0, 1 - p / 0.04));

  const paint = useCallback((force = false) => {
    const canvas = canvasRef.current;
    const sequence = sequenceRef.current;
    if (!canvas || !sequence) return;
    const img = sequence.nearest(Math.round(currentRef.current));
    if (!img || (!force && img === drawnRef.current)) return;
    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;
    ctx.imageSmoothingQuality = "high";
    drawFrame(ctx, img, canvas.width, canvas.height);
    drawnRef.current = img;
    setPainted(true);
  }, []);

  // Ease the displayed frame toward the scroll target. Only runs while moving.
  const tick = useCallback(() => {
    const target = targetRef.current;
    const delta = target - currentRef.current;
    currentRef.current = Math.abs(delta) < 0.05 ? target : currentRef.current + delta * 0.22;
    paint();
    rafRef.current = currentRef.current === target ? null : requestAnimationFrame(tick);
  }, [paint]);

  const schedule = useCallback(() => {
    if (rafRef.current == null) rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const setTargetFromProgress = useCallback(
    (p: number) => {
      const frame = progressToFrame(p);
      targetRef.current = frame;
      const next = frameToPhase(frame);
      setPhase((prev) => (prev === next ? prev : next));
      schedule();
    },
    [schedule],
  );

  useMotionValueEvent(scrollYProgress, "change", (p) => {
    if (!reduceMotion) setTargetFromProgress(p);
  });

  // Load frames. With reduced motion only the opening frame is needed.
  useEffect(() => {
    if (reduceMotion === null) return; // wait until the preference is known
    const sequence = new FrameSequence(pickFrameSet(), (index) => {
      // Repaint only if this frame is now the closest available to the current position.
      if (Math.abs(index - Math.round(currentRef.current)) < 48 || !drawnRef.current) paint();
    });
    sequenceRef.current = sequence;
    drawnRef.current = null;

    if (reduceMotion) {
      targetRef.current = currentRef.current = 0;
      setPhase(0);
      sequence.start({ only: [0], concurrency: 1 });
    } else {
      const p = scrollYProgress.get();
      targetRef.current = currentRef.current = progressToFrame(p);
      setPhase(frameToPhase(currentRef.current));
      sequence.start();
    }
    return () => {
      sequence.dispose();
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    };
  }, [reduceMotion, paint, scrollYProgress]);

  // Keep the backing store matched to the element size and device pixel ratio.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.max(1, Math.round(rect.width * dpr));
      const h = Math.max(1, Math.round(rect.height * dpr));
      if (w === sizeRef.current.w && h === sizeRef.current.h) return;
      sizeRef.current = { w, h };
      canvas.width = w;
      canvas.height = h;
      paint(true);
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    return () => observer.disconnect();
  }, [paint]);

  const isFinal = phase === 2;

  return (
    <section
      id="home"
      ref={sectionRef}
      aria-label="Introduction"
      className="relative h-[350vh] motion-reduce:h-svh"
    >
      <div className="sticky top-0 h-svh w-full overflow-hidden" style={{ backgroundColor: STAGE_BACKGROUND }}>
        {/* Static first frame: shown before the canvas paints and when scripting is unavailable. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/frames/poster-start.jpg"
          alt=""
          aria-hidden="true"
          fetchPriority="high"
          className={`absolute inset-0 h-full w-full object-cover object-[72%_50%] transition-opacity duration-500 ${
            painted ? "opacity-0" : "opacity-100"
          }`}
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
          role="img"
          aria-label="Three professionals take turns at a facial-recognition attendance scanner, each checking in and walking on until the scanner stands ready and empty."
        />

        {/* Legibility shading, kept off the subjects. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(18,20,24,0.55)_0%,rgba(18,20,24,0.15)_32%,transparent_45%)] wide:bg-[linear-gradient(90deg,rgba(18,20,24,0.6)_0%,rgba(18,20,24,0.25)_35%,transparent_58%)]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-b from-transparent to-charcoal/90 wide:h-28"
        />

        <div className="container-page relative flex h-full flex-col justify-between pb-8 pt-24 wide:justify-center wide:gap-10 wide:pb-0 wide:pt-16">
          <div className="max-w-[36rem] xl:max-w-[40rem]">
            <h1 className="sr-only">
              {siteConfig.name}: {HEADLINES[0]} {siteConfig.description}
            </h1>
            <div aria-hidden="true" className="grid">
              {HEADLINES.map((text, i) => (
                <motion.p
                  key={text}
                  className="col-start-1 row-start-1 font-display text-[2.6rem] leading-[1.02] tracking-[-0.01em] text-white sm:text-6xl wide:text-6xl lg:wide:text-7xl xl:wide:text-[5.4rem] [@media(max-height:520px)]:!text-4xl"
                  initial={false}
                  animate={{
                    opacity: phase === i ? 1 : 0,
                    y: phase === i ? 0 : phase > i ? -18 : 18,
                    filter: phase === i ? "blur(0px)" : "blur(6px)",
                  }}
                  transition={{ duration: reduceMotion ? 0 : 0.7, ease: [0.22, 1, 0.36, 1] }}
                >
                  {text}
                </motion.p>
              ))}
            </div>
            <p className="mt-5 max-w-sm text-base leading-relaxed text-paper/80 md:text-lg wide:mt-7">
              Simplify attendance with intelligent facial recognition.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-3">
            <Link
              href={siteConfig.contactHref}
              className={buttonClass(
                "primary",
                `transition-shadow ${isFinal ? "shadow-[0_0_0_6px_rgba(122,166,220,0.22)]" : ""}`,
              )}
            >
              Get in Touch
              <Arrow />
            </Link>
            <Link href="/#how-it-works" className={buttonClass("ghost", "underline-offset-[6px] hover:underline")}>
              Discover How It Works
            </Link>
          </div>
        </div>

        {/* Scroll cue and progress */}
        {!reduceMotion && (
          <>
            <motion.div
              aria-hidden="true"
              style={{ opacity: cueOpacity }}
              className="pointer-events-none absolute bottom-8 right-6 hidden items-center gap-3 text-paper/70 wide:flex md:right-12 xl:right-20"
            >
              <span className="eyebrow">Scroll</span>
              <span className="relative h-10 w-px overflow-hidden bg-paper/25">
                <span className="absolute inset-x-0 top-0 h-1/2 animate-[cue_1.8s_ease-in-out_infinite] bg-paper" />
              </span>
            </motion.div>
            <motion.div
              aria-hidden="true"
              style={{ scaleX: scrollYProgress }}
              className="absolute inset-x-0 bottom-0 h-px origin-left bg-accent/80"
            />
          </>
        )}
      </div>
    </section>
  );
}
