"use client";

import { useEffect, useRef } from "react";

export default function VantaCloudsBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || typeof window === "undefined") return;

    let effect: { destroy: () => void } | null = null;

    const init = async () => {
      const three = await import("three");
      const win = window as Window & { THREE?: unknown; VANTA?: Record<string, (opts: { el: HTMLElement }) => unknown> };
      win.THREE = (three as { default?: unknown }).default ?? three;
      win.VANTA = win.VANTA || {};

      await import("vanta/dist/vanta.clouds.min");
      if (ref.current && win.VANTA?.CLOUDS) {
        effect = win.VANTA.CLOUDS({
          el: ref.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200,
          minWidth: 200,
        }) as { destroy: () => void };
      }
    };

    init();

    return () => {
      if (effect?.destroy) effect.destroy();
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{
        position: "absolute",
        inset: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
      }}
    />
  );
}
