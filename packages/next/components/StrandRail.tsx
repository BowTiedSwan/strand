"use client";
import { useEffect, useRef, useState } from "react";

/**
 * The signature element: a luminous rail beside the article whose lit height
 * tracks reading progress. Structural anchors (passed as ratios 0–1) render as
 * nodes the light reaches as you read. Honors prefers-reduced-motion via CSS.
 */
export default function StrandRail({ anchors = [] as number[] }) {
  const [progress, setProgress] = useState(0);
  const ticking = useRef(false);

  useEffect(() => {
    const onScroll = () => {
      if (ticking.current) return;
      ticking.current = true;
      requestAnimationFrame(() => {
        const doc = document.documentElement;
        const max = doc.scrollHeight - doc.clientHeight;
        setProgress(max > 0 ? Math.min(1, doc.scrollTop / max) : 0);
        ticking.current = false;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return (
    <div className="rail" aria-hidden>
      <div className="rail__track">
        <div className="rail__lit" style={{ ["--progress" as string]: `${progress * 100}%` }} />
        {anchors.map((a, i) => (
          <span key={i} className="rail__node" style={{ top: `${a * 100}%` }} />
        ))}
      </div>
    </div>
  );
}
