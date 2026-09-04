import { useEffect, useRef } from "react";

export function PolarBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Respect prefers-reduced-motion safely
    if (typeof window === "undefined" || !window.matchMedia) return;
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mediaQuery.matches) return;

    let animationFrameId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", handleResize);

    // Particle Setup: Sparse & elegant count (~50-60 particles)
    const particleCount = Math.min(55, Math.floor(width / 28));
    const particles = Array.from({ length: particleCount }, () => {
      const rand = Math.random();
      let radius: number;
      let opacity: number;
      let speedY: number;
      let speedX: number;
      let isForeground = false;

      if (rand < 0.60) {
        // ~60% Tiny background particles (1–2px diameter, slowest)
        radius = Math.random() * 0.5 + 0.5; // 0.5px–1.0px radius
        opacity = Math.random() * 0.14 + 0.08; // 0.08–0.22 opacity
        speedY = Math.random() * 0.40 + 0.50; // ~50% faster base speed
        speedX = Math.random() * 0.30 + 0.35; // diagonal wind drift ↘
      } else if (rand < 0.90) {
        // ~30% Medium midground flakes (2–4px diameter, medium speed)
        radius = Math.random() * 1.0 + 1.0; // 1.0px–2.0px radius
        opacity = Math.random() * 0.20 + 0.18; // 0.18–0.38 opacity
        speedY = Math.random() * 0.50 + 0.85;
        speedX = Math.random() * 0.40 + 0.55;
      } else {
        // ~10% Larger foreground depth flakes (4–6px diameter, slightly faster)
        radius = Math.random() * 1.0 + 2.0; // 2.0px–3.0px radius
        opacity = Math.random() * 0.15 + 0.12; // 0.12–0.27 soft foreground opacity
        speedY = Math.random() * 0.60 + 1.30;
        speedX = Math.random() * 0.45 + 0.85;
        isForeground = true;
      }

      return {
        x: Math.random() * (width + 200) - 100,
        y: Math.random() * height,
        radius,
        speedY,
        speedX,
        baseOpacity: opacity,
        isForeground,
        wobblePhase: Math.random() * Math.PI * 2,
        wobbleSpeed: Math.random() * 0.015 + 0.005,
      };
    });

    let t = 0;

    const render = () => {
      ctx.clearRect(0, 0, width, height);
      t += 0.01;

      particles.forEach((p) => {
        // Diagonal wind drift movement ↘ with subtle micro-wobble
        p.y += p.speedY;
        p.x += p.speedX + Math.sin(t * p.wobbleSpeed + p.wobblePhase) * 0.12;

        // Wrap around boundaries for continuous diagonal wind stream
        if (p.y > height + 20) {
          p.y = -20;
          p.x = Math.random() * (width + 200) - 100;
        }
        if (p.x > width + 20) {
          p.x = -20;
          p.y = Math.random() * (height + 200) - 100;
        }

        // Subtle per-particle ambient shimmer
        const currentOpacity =
          p.baseOpacity + Math.sin(t * 1.5 + p.wobblePhase) * 0.04;
        const clampedOpacity = Math.max(0.04, Math.min(0.45, currentOpacity));

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);

        if (p.isForeground) {
          // Soft subtle glow for foreground depth particles
          ctx.fillStyle = `rgba(241, 245, 249, ${clampedOpacity})`;
        } else {
          ctx.fillStyle = `rgba(226, 232, 240, ${clampedOpacity})`;
        }

        ctx.fill();
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden select-none">
      {/* Dark Polar Night Surface */}
      <div className="absolute inset-0 bg-[#060b14]" />

      {/* Atmospheric Aurora Soft Gradients */}
      <div
        className="absolute -top-40 left-1/2 -z-10 h-[650px] w-[1000px] -translate-x-1/2 rounded-full opacity-20 blur-[150px]"
        style={{
          background:
            "radial-gradient(ellipse at center, rgba(14, 165, 233, 0.25), rgba(20, 184, 166, 0.15), rgba(6, 11, 20, 0))",
        }}
      />
      <div
        className="absolute top-1/3 -right-40 -z-10 h-[500px] w-[700px] rounded-full opacity-15 blur-[140px]"
        style={{
          background:
            "radial-gradient(circle, rgba(56, 189, 248, 0.2), rgba(6, 11, 20, 0))",
        }}
      />

      {/* Particle Canvas */}
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full opacity-80" />
    </div>
  );
}

