"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** The smallest share of the base font size the text may shrink to before it is cut off. */
const minimumScale = 0.4;

/**
 * Shows its children at the font size set by `className`, scaled down just enough to fit the
 * height the layout gives it. Give it a bounded height, for example as a shrinking flex child;
 * anything still too long at the smallest size is clipped rather than spilling out.
 */
export function FitText({ className = "", children }: { className?: string; children: ReactNode }) {
  const boxRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const box = boxRef.current;
    const content = contentRef.current;
    if (!box || !content) return;

    const fit = () => {
      const fits = (scale: number) => {
        content.style.fontSize = `${scale}em`;
        return content.scrollHeight <= box.clientHeight + 0.5;
      };
      if (fits(1)) return;
      // Search for the largest scale that still fits.
      let low = minimumScale;
      let high = 1;
      for (let step = 0; step < 8; step += 1) {
        const middle = (low + high) / 2;
        if (fits(middle)) low = middle;
        else high = middle;
      }
      fits(low);
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [children]);

  return (
    <div ref={boxRef} className={`min-h-0 overflow-hidden ${className}`}>
      <div ref={contentRef}>{children}</div>
    </div>
  );
}
