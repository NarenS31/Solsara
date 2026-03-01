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
        background: "linear-gradient(180deg, #d8e8ff 0%, #e8f0ff 40%, #f0f5ff 100%)",
      }}
    >
      {/* Cloud 1 — large */}
      <div
        className="cloud cloud-1"
        style={{
          width: "200px",
          height: "100px",
          top: "8%",
          left: "5%",
        }}
      />
      {/* Cloud 2 — medium */}
      <div
        className="cloud cloud-2"
        style={{
          width: "160px",
          height: "70px",
          top: "30%",
          right: "8%",
        }}
      />
      {/* Cloud 3 — small */}
      <div
        className="cloud cloud-3"
        style={{
          width: "140px",
          height: "55px",
          top: "50%",
          left: "20%",
        }}
      />
      {/* Cloud 4 — large */}
      <div
        className="cloud cloud-4"
        style={{
          width: "180px",
          height: "80px",
          top: "70%",
          right: "15%",
        }}
      />
      {/* Cloud 5 — medium */}
      <div
        className="cloud cloud-5"
        style={{
          width: "150px",
          height: "60px",
          top: "20%",
          right: "35%",
        }}
      />
    </div>
  );
}
