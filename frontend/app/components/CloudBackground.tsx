"use client";

/**
 * CSS-only floating clouds — no WebGL, no JS at runtime.
 * GPU-accelerated via transform. Smooth scroll guaranteed.
 */
export default function CloudBackground() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-[1] overflow-hidden"
      style={{
        background: "linear-gradient(180deg, #e8f0ff 0%, #f0f5ff 50%, #f5f8ff 100%)",
      }}
    >
      {/* Cloud 1 — large, slow drift right */}
      <div
        className="cloud cloud-1"
        style={{
          width: "280px",
          height: "120px",
          top: "12%",
          left: "-10%",
        }}
      />
      {/* Cloud 2 — medium, drift left */}
      <div
        className="cloud cloud-2"
        style={{
          width: "200px",
          height: "80px",
          top: "35%",
          right: "-5%",
        }}
      />
      {/* Cloud 3 — small, slow up-right */}
      <div
        className="cloud cloud-3"
        style={{
          width: "160px",
          height: "65px",
          top: "55%",
          left: "15%",
        }}
      />
      {/* Cloud 4 — large, drift left */}
      <div
        className="cloud cloud-4"
        style={{
          width: "240px",
          height: "100px",
          top: "75%",
          right: "10%",
        }}
      />
      {/* Cloud 5 — medium, slow right */}
      <div
        className="cloud cloud-5"
        style={{
          width: "180px",
          height: "70px",
          top: "25%",
          right: "25%",
        }}
      />
    </div>
  );
}
