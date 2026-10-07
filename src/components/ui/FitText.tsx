"use client";

import { useLayoutEffect, useRef, type ReactNode } from "react";

/** The smallest share of the base font size the text may shrink to before it is cut off. */
const minimumScale = 0.3;

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
      // The box shrinks to the text once it fits, so compare the text's layout height with it;
      // the scroll height would also count letters reaching below a tight line height.
      const fits = (scale: number) => {
        content.style.fontSize = `${scale}em`;
        return content.offsetHeight <= box.clientHeight + 0.5;
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
    // The box takes the height of its text once that fits, so watch the space around it too:
    // otherwise the text never grows back when more room appears.
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    if (box.parentElement) observer.observe(box.parentElement);
    // Web fonts change the text's size once they load.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) fit();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [children]);

  return (
    <div ref={boxRef} className={`min-h-0 overflow-hidden ${className}`}>
      {/* The padding keeps descenders of the last line inside the clipped box. */}
      <div ref={contentRef} className="pb-[0.15em]">{children}</div>
    </div>
  );
}
