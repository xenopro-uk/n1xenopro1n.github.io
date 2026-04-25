import { useEffect, useRef, useState } from "react";

export function DotCursor() {
  const dotRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);
  const [hover, setHover] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let rx = 0, ry = 0, dx = 0, dy = 0;
    let raf = 0;
    const onMove = (e: MouseEvent) => {
      dx = e.clientX; dy = e.clientY;
      if (!visible) setVisible(true);
      if (dotRef.current) {
        dotRef.current.style.transform = `translate3d(${dx - 4}px, ${dy - 4}px, 0)`;
      }
      const target = e.target as HTMLElement | null;
      const isInteractive =
        !!target?.closest("button, a, input, textarea, [role='button'], [data-cursor='hover']");
      setHover(isInteractive);
    };
    const tick = () => {
      rx += (dx - rx) * 0.18;
      ry += (dy - ry) * 0.18;
      if (ringRef.current) {
        ringRef.current.style.transform = `translate3d(${rx - 16}px, ${ry - 16}px, 0)`;
      }
      raf = requestAnimationFrame(tick);
    };
    window.addEventListener("mousemove", onMove);
    raf = requestAnimationFrame(tick);
    return () => { window.removeEventListener("mousemove", onMove); cancelAnimationFrame(raf); };
  }, [visible]);

  return (
    <>
      <div
        ref={dotRef}
        className="pointer-events-none fixed left-0 top-0 z-[100] h-2 w-2 rounded-full bg-primary mix-blend-difference"
        style={{ opacity: visible ? 1 : 0, transition: "opacity .2s" }}
      />
      <div
        ref={ringRef}
        className="pointer-events-none fixed left-0 top-0 z-[99] h-8 w-8 rounded-full border border-primary/60"
        style={{
          opacity: visible ? 1 : 0,
          transform: "translate3d(-100px,-100px,0)",
          transition: "opacity .2s, width .15s, height .15s, background-color .15s",
          backgroundColor: hover ? "oklch(0.78 0.18 200 / 0.18)" : "transparent",
          scale: hover ? "1.5" : "1",
        }}
      />
    </>
  );
}
