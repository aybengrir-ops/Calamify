"use client";

import { useEffect, useRef } from "react";
import { getFrequencyData } from "@/lib/visualizer";

/** Frequency-bar visualizer driven by the Web Audio AnalyserNode. */
export function Visualizer({ bars = 48, className = "", circular = false, height = 60 }: { bars?: number; className?: string; circular?: boolean; height?: number }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf = 0;
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = canvas.clientWidth * dpr;
      canvas.height = canvas.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const fake = Array.from({ length: bars }, () => Math.random() * 0.3 + 0.05);
    const draw = () => {
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      ctx.clearRect(0, 0, w, h);
      const data = getFrequencyData();
      if (circular) {
        const cx = w / 2;
        const cy = h / 2;
        const radius = Math.min(w, h) * 0.3;
        for (let i = 0; i < bars; i++) {
          const v = data ? data[Math.floor((i / bars) * (data.length * 0.7))] / 255 : fake[i] * (0.6 + 0.4 * Math.sin(Date.now() / 500 + i));
          const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
          const len = 8 + v * Math.min(w, h) * 0.18;
          const grad = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
          grad.addColorStop(0, "#00d4ff");
          grad.addColorStop(0.5, "#7b2ff7");
          grad.addColorStop(1, "#ff2e97");
          ctx.strokeStyle = grad;
          ctx.lineWidth = 3;
          ctx.lineCap = "round";
          ctx.beginPath();
          ctx.moveTo(cx + Math.cos(angle) * radius, cy + Math.sin(angle) * radius);
          ctx.lineTo(cx + Math.cos(angle) * (radius + len), cy + Math.sin(angle) * (radius + len));
          ctx.stroke();
        }
      } else {
        const bw = w / bars;
        for (let i = 0; i < bars; i++) {
          const v = data ? data[Math.floor((i / bars) * (data.length * 0.75))] / 255 : fake[i] * (0.55 + 0.45 * Math.sin(Date.now() / 420 + i * 0.6));
          const bh = Math.max(2, v * h);
          const grad = ctx.createLinearGradient(0, h, 0, h - bh);
          grad.addColorStop(0, "rgba(0,212,255,0.95)");
          grad.addColorStop(0.55, "rgba(123,47,247,0.9)");
          grad.addColorStop(1, "rgba(255,46,151,0.85)");
          ctx.fillStyle = grad;
          const x = i * bw + bw * 0.22;
          ctx.beginPath();
          ctx.roundRect(x, h - bh, bw * 0.56, bh, bw * 0.28);
          ctx.fill();
        }
      }
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
    };
  }, [bars, circular]);

  return <canvas ref={canvasRef} style={{ height }} className={className} aria-hidden />;
}
