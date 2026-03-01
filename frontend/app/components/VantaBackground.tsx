"use client";

import { useEffect, useRef } from "react";

export default function VantaBackground() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current || typeof window === "undefined") return;

    let effect: { destroy: () => void } | null = null;

    const init = async () => {
      const three = await import("three");
      const win = window as Window & { THREE?: unknown; VANTA?: Record<string, (opts: Record<string, unknown>) => unknown> };
      win.THREE = (three as { default?: unknown }).default ?? three;
      win.VANTA = win.VANTA || {};

      await import("vanta/dist/vanta.clouds.min");

      if (ref.current && win.VANTA?.CLOUDS) {
        effect = win.VANTA.CLOUDS({
          el: ref.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          backgroundColor: 0xf5f8ff, // Very light sky white/blue
          skyColor: 0x98b8fd,      // Soft Sky Blue
          cloudColor: 0xffffff,    // Pure White Clouds
          cloudShadowColor: 0x82a9db, // Subtle Cloud Shadows
          sunColor: 0xfffcf5,
          sunGlareColor: 0xfffcf5,
          sunlightColor: 0xfffcf5,
          speed: 0.25,            // Reduced for scroll performance
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
      id="vanta-sky"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        zIndex: 0,
        minHeight: "100vh",
        opacity: 1,
      }}
    />
  );
}
