"use client";

import { useEffect, useRef } from "react";

interface Star {
  x: number;
  y: number;
  r: number;
  depth: number;
  phase: number;
  speed: number;
  hue: string;
}

/** Canvas starfield: three parallax depth layers + drifting nebulae + shooting stars. */
export function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches || document.body.classList.contains("reduced-motion");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const hues = ["#ffffff", "#cfe8ff", "#e6d7ff", "#ffd9f2", "#d7fff6"];
    const stars: Star[] = [];
    const makeStars = () => {
      stars.length = 0;
      const count = Math.min(420, Math.floor((width * height) / 4200));
      for (let i = 0; i < count; i++) {
        stars.push({
          x: Math.random() * width,
          y: Math.random() * height,
          r: Math.random() * 1.6 + 0.3,
          depth: Math.random() * 0.9 + 0.1,
          phase: Math.random() * Math.PI * 2,
          speed: Math.random() * 0.9 + 0.25,
          hue: hues[Math.floor(Math.random() * hues.length)],
        });
      }
    };
    makeStars();

    let scrollY = window.scrollY;
    const onScroll = () => (scrollY = window.scrollY);
    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
      makeStars();
    };
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onScroll, { passive: true });

    let t = 0;
    const draw = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.save();
      ctx.scale(dpr / dpr, dpr / dpr);
      for (const s of stars) {
        const twinkle = reduced ? 0.75 : 0.55 + 0.45 * Math.sin(t * s.speed + s.phase);
        const y = (s.y - (scrollY * s.depth * 0.12) % height + height) % height;
        ctx.globalAlpha = Math.max(0.08, twinkle * s.depth);
        ctx.fillStyle = s.hue;
        ctx.beginPath();
        ctx.arc(s.x, y, s.r * (reduced ? 1 : 1 + 0.25 * twinkle), 0, Math.PI * 2);
        ctx.fill();
        if (s.r > 1.3) {
          ctx.globalAlpha = 0.12 * twinkle;
          ctx.beginPath();
          ctx.arc(s.x, y, s.r * 4, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.restore();
      t += 0.016;
      rafRef.current = requestAnimationFrame(draw);
    };
    if (reduced) {
      draw();
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    } else {
      draw();
    }

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      {/* nebulae */}
      <div className="nebula animate-float" style={{ width: 620, height: 620, left: "-8%", top: "4%", background: "radial-gradient(circle, rgba(123,47,247,0.55), transparent 70%)" }} />
      <div className="nebula animate-float" style={{ width: 520, height: 520, right: "-6%", top: "28%", background: "radial-gradient(circle, rgba(0,212,255,0.42), transparent 70%)", animationDelay: "2.5s" }} />
      <div className="nebula animate-float" style={{ width: 700, height: 700, left: "22%", bottom: "-18%", background: "radial-gradient(circle, rgba(255,46,151,0.32), transparent 72%)", animationDelay: "5s" }} />
      {/* shooting stars */}
      <span className="shooting-star" style={{ animationDelay: "3s" }} />
      <span className="shooting-star" style={{ animationDelay: "11s", top: "12vh" }} />
      <span className="shooting-star" style={{ animationDelay: "19s", top: "26vh" }} />
      <span className="shooting-star" style={{ animationDelay: "27s", top: "4vh" }} />
    </div>
  );
}
