"use client";

import { useEffect, useRef, useCallback } from "react";

const HERO_ID = "hero";

/**
 * Vanta clouds — only hides when hero section is completely scrolled off.
 * Stays visible while you're in the hero, disappears when you scroll past it.
 */
export default function VantaBackground() {
  const ref = useRef<HTMLDivElement>(null);
  const effectRef = useRef<{ destroy: () => void } | null>(null);
  const rafRef = useRef<number | null>(null);

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
        skyColor: 0x87CEEB,
        cloudColor: 0xffffff,
        cloudShadowColor: 0x82a9db,
        sunColor: 0xfffcf5,
        sunGlareColor: 0xfffcf5,
        sunlightColor: 0xfffcf5,
        speed: 0.3,
        scale: 8,
        scaleMobile: 14,
      }) as { destroy: () => void };
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    const checkHero = () => {
      if (!mounted) return;

      const hero = document.getElementById(HERO_ID);
      if (!hero) return;

      const rect = hero.getBoundingClientRect();
      const heroBottom = rect.bottom;
      const threshold = 50;

      // Hero completely off top of viewport → destroy
      if (heroBottom < -threshold) {
        if (effectRef.current) destroy();
      }
      // Hero in view → init (if not already)
      else if (heroBottom > threshold) {
        if (!effectRef.current) init();
      }
    };

    const onScroll = () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        rafRef.current = null;
        checkHero();
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    checkHero();

    return () => {
      mounted = false;
      window.removeEventListener("scroll", onScroll);
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
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
