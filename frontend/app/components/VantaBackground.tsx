"use client";

import { useEffect, useRef, useCallback } from "react";

/**
 * Vanta clouds — pauses when scrolling (smooth scroll), resumes when idle.
 * GPU-accelerated WebGL when visible, zero cost when scrolling.
 */
export default function VantaBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const effectRef = useRef<{ destroy: () => void } | null>(null);
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isScrollingRef = useRef(false);

  const destroy = useCallback(() => {
    if (effectRef.current?.destroy) {
      effectRef.current.destroy();
      effectRef.current = null;
    }
  }, []);

  const init = useCallback(async () => {
    if (!ref.current || typeof window === "undefined") return;

    const three = await import("three");
    const win = window as Window & {
      THREE?: unknown;
      VANTA?: Record<string, (opts: Record<string, unknown>) => unknown>;
    };
    win.THREE = (three as { default?: unknown }).default ?? three;
    win.VANTA = win.VANTA || {};

    await import("vanta/dist/vanta.clouds.min");

    if (ref.current && win.VANTA?.CLOUDS) {
      effectRef.current = win.VANTA.CLOUDS({
        el: ref.current,
        mouseControls: false,
        touchControls: false,
        gyroControls: false,
        minHeight: 200,
        minWidth: 200,
        backgroundColor: 0xf5f8ff,
        skyColor: 0x98b8fd,
        cloudColor: 0xffffff,
        cloudShadowColor: 0x82a9db,
        sunColor: 0xfffcf5,
        sunGlareColor: 0xfffcf5,
        sunlightColor: 0xfffcf5,
        speed: 0.4,
      }) as { destroy: () => void };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const onScroll = () => {
      if (!mounted) return;

      if (!isScrollingRef.current) {
        isScrollingRef.current = true;
        destroy();
      }

      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }

      scrollTimeoutRef.current = setTimeout(() => {
        if (!mounted) return;
        isScrollingRef.current = false;
        scrollTimeoutRef.current = null;
        init();
      }, 600);
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    init();

    return () => {
      mounted = false;
      window.removeEventListener("scroll", onScroll);
      if (scrollTimeoutRef.current) clearTimeout(scrollTimeoutRef.current);
      destroy();
    };
  }, [init, destroy]);

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
        background: "linear-gradient(180deg, #e8f0ff 0%, #f0f5ff 100%)",
      }}
    />
  );
}
