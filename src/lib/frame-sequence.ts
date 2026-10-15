/**
 * Progressive loader for the hero image sequence.
 *
 * Frames are requested coarse-to-fine (every 32nd frame, then every 16th, 8th,
 * ... down to every frame) so that a scrubbable approximation of the whole
 * sequence is available almost immediately, and each image is decoded off the
 * main thread via `HTMLImageElement.decode()` before it is ever drawn.
 */

export const FRAME_COUNT = 240;

export type FrameSet = "lg" | "sm";

export function frameUrl(set: FrameSet, index: number) {
  return `/frames/${set}/${String(index + 1).padStart(4, "0")}.webp`;
}

/** Choose the smaller set for small or data-constrained screens. */
export function pickFrameSet(): FrameSet {
  if (typeof window === "undefined") return "lg";
  const connection = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection;
  if (connection?.saveData) return "sm";
  const physicalWidth = Math.max(window.innerWidth, window.innerHeight * 0.6) * Math.min(window.devicePixelRatio || 1, 2);
  return physicalWidth <= 1000 ? "sm" : "lg";
}

function loadOrder(count: number): number[] {
  const order: number[] = [];
  const seen = new Set<number>();
  const push = (i: number) => {
    if (i >= 0 && i < count && !seen.has(i)) {
      seen.add(i);
      order.push(i);
    }
  };
  push(0);
  push(count - 1);
  for (let stride = 32; stride >= 1; stride /= 2) {
    for (let i = 0; i < count; i += stride) push(i);
  }
  return order;
}

export class FrameSequence {
  readonly images: (HTMLImageElement | null)[];
  private cancelled = false;

  constructor(
    private readonly set: FrameSet,
    private readonly onFrameReady: (index: number) => void,
    private readonly count = FRAME_COUNT,
  ) {
    this.images = new Array(count).fill(null);
  }

  /** Start loading. `only` restricts loading to the given indices (e.g. for reduced motion). */
  start({ concurrency = 6, only }: { concurrency?: number; only?: number[] } = {}) {
    const queue = only ? [...only] : loadOrder(this.count);
    const worker = async () => {
      while (!this.cancelled && queue.length) {
        const index = queue.shift()!;
        await this.loadOne(index);
      }
    };
    for (let i = 0; i < concurrency; i++) void worker();
  }

  private async loadOne(index: number) {
    const img = new Image();
    img.decoding = "async";
    if (index === 0) img.fetchPriority = "high";
    img.src = frameUrl(this.set, index);
    try {
      await img.decode();
    } catch {
      // decode() can reject for transient reasons; fall back to the load event.
      const ok = await new Promise<boolean>((resolve) => {
        if (img.complete) return resolve(img.naturalWidth > 0);
        img.onload = () => resolve(true);
        img.onerror = () => resolve(false);
      });
      if (!ok) return;
    }
    if (this.cancelled) return;
    this.images[index] = img;
    this.onFrameReady(index);
  }

  /** The requested frame if ready, otherwise the closest ready frame. */
  nearest(index: number): HTMLImageElement | null {
    const exact = this.images[index];
    if (exact) return exact;
    for (let d = 1; d < this.count; d++) {
      const before = this.images[index - d];
      if (before) return before;
      const after = this.images[index + d];
      if (after) return after;
    }
    return null;
  }

  dispose() {
    this.cancelled = true;
  }
}

/** Neutral grey sampled from the frames, used behind the canvas before paint. */
export const STAGE_BACKGROUND = "#5f646d";

/**
 * Draw a frame so the subjects (right-of-centre) stay in view at any aspect
 * ratio while the empty left side remains available for copy.
 *
 * - Landscape: "cover" with a focal point on the right.
 * - Portrait: fit the right ~56% of the frame to the width and extend the
 *   frame's own top/bottom pixel rows to fill the remaining height, which
 *   keeps the original grey backdrop and floor seamless.
 */
export function drawFrame(ctx: CanvasRenderingContext2D, img: HTMLImageElement, cw: number, ch: number) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  if (!iw || !ih) return;

  ctx.fillStyle = STAGE_BACKGROUND;
  ctx.fillRect(0, 0, cw, ch);

  if (cw / ch >= 1.15) {
    const scale = Math.max(cw / iw, ch / ih);
    const dw = iw * scale;
    const dh = ih * scale;
    const focalX = 0.7;
    const dx = Math.min(0, Math.max(cw - dw, cw / 2 - focalX * dw));
    const dy = Math.min(0, Math.max(ch - dh, (ch - dh) / 2));
    ctx.drawImage(img, dx, dy, dw, dh);
    return;
  }

  // Scale so the right ~56% of the frame spans the width, capped so the scene
  // never takes more than ~60% of the height; anchor the scanner (right edge).
  const scale = Math.max(cw / iw, Math.min(cw / (iw * 0.56), (ch * 0.6) / ih));
  const sw = Math.min(iw, cw / scale);
  const sx = iw - sw;
  const dh = ih * scale;
  // Sit the scene in the lower part of the viewport, leaving room for copy above.
  const dy = Math.round(Math.min(ch - dh, Math.max(ch * 0.66 - dh / 2, ch * 0.28)));

  ctx.drawImage(img, sx, 0, sw, ih, 0, dy, cw, dh);
  if (dy > 0) ctx.drawImage(img, sx, 0, sw, 1, 0, 0, cw, dy + 1);
  const bottom = dy + dh;
  if (bottom < ch) ctx.drawImage(img, sx, ih - 1, sw, 1, 0, bottom - 1, cw, ch - bottom + 1);
}
