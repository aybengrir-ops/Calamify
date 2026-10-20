"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import type { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from "react";
import { cn } from "@/lib/cn";

/* ---------------- card ---------------- */
export function GlassCard({
  children,
  className,
  hover = true,
  strong = false,
  onClick,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
  strong?: boolean;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(strong ? "glass-strong" : "glass", hover && "glass-card", onClick && "cursor-pointer", className)}
    >
      {children}
    </div>
  );
}

/* ---------------- button ---------------- */
type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "primary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  icon?: ReactNode;
};

export function GlassButton({ children, className, variant = "default", size = "md", icon, ...rest }: ButtonProps) {
  return (
    <button
      {...rest}
      className={cn(
        "glass-btn inline-flex items-center justify-center gap-2 font-medium text-white disabled:opacity-50 disabled:cursor-not-allowed",
        variant === "primary" && "glass-btn-primary",
        variant === "ghost" && "bg-transparent border-transparent shadow-none hover:bg-white/10",
        variant === "danger" && "border-pink-400/50 text-pink-100",
        size === "sm" && "px-3 py-1.5 text-xs rounded-xl",
        size === "md" && "px-4 py-2.5 text-sm",
        size === "lg" && "px-6 py-3.5 text-base rounded-2xl",
        className
      )}
    >
      {icon}
      {children}
    </button>
  );
}

export function GlassLink({ href, children, className, variant = "default" }: { href: string; children: ReactNode; className?: string; variant?: "default" | "primary" }) {
  return (
    <Link href={href} className={cn("glass-btn inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium", variant === "primary" && "glass-btn-primary", className)}>
      {children}
    </Link>
  );
}

export function IconButton({
  children,
  className,
  label,
  active,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; active?: boolean }) {
  return (
    <button
      {...rest}
      aria-label={label}
      title={label}
      className={cn(
        "glass-btn inline-flex h-10 w-10 items-center justify-center rounded-full !px-0 !py-0",
        active && "border-cyan-300/70 text-cyan-200 shadow-[0_0_20px_-4px_rgba(0,212,255,0.8)]",
        className
      )}
    >
      {children}
    </button>
  );
}

/* ---------------- input ---------------- */
export function GlassInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input {...rest} className={cn("glass-input w-full px-4 py-2.5 text-sm", className)} />;
}

/* ---------------- badge ---------------- */
export function GlassBadge({ children, className, tone = "default" }: { children: ReactNode; className?: string; tone?: "default" | "cyan" | "purple" | "pink" | "gold" }) {
  const tones: Record<string, string> = {
    default: "text-white/75 border-white/15",
    cyan: "text-cyan-200 border-cyan-300/40 bg-cyan-400/10",
    purple: "text-violet-200 border-violet-300/40 bg-violet-400/10",
    pink: "text-pink-200 border-pink-300/40 bg-pink-400/10",
    gold: "text-amber-200 border-amber-300/40 bg-amber-400/10",
  };
  return <span className={cn("glass-badge inline-flex items-center gap-1 px-2.5 py-1 uppercase", tones[tone], className)}>{children}</span>;
}

/* ---------------- toggle ---------------- */
export function GlassToggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative h-7 w-13 shrink-0 rounded-full border transition-all duration-300",
        checked ? "border-cyan-300/60 bg-gradient-to-r from-violet-500/70 to-cyan-400/70 shadow-[0_0_18px_-4px_rgba(0,212,255,0.9)]" : "border-white/15 bg-white/10"
      )}
      style={{ width: 52 }}
    >
      <motion.span
        layout
        transition={{ type: "spring", stiffness: 500, damping: 32 }}
        className={cn("absolute top-0.5 h-5.5 w-5.5 rounded-full bg-white shadow-lg")}
        style={{ height: 22, width: 22, left: checked ? 27 : 3 }}
      />
    </button>
  );
}

/* ---------------- slider ---------------- */
export function GlassSlider({
  value,
  min = 0,
  max = 1,
  step = 0.01,
  onChange,
  className,
  label,
}: {
  value: number;
  min?: number;
  max?: number;
  step?: number;
  onChange: (v: number) => void;
  className?: string;
  label: string;
}) {
  return (
    <input
      type="range"
      aria-label={label}
      className={cn("glass-slider w-full", className)}
      min={min}
      max={max}
      step={step}
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
    />
  );
}

/* ---------------- section title ---------------- */
export function SectionTitle({ eyebrow, title, subtitle, action }: { eyebrow?: string; title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
      <div>
        {eyebrow && <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.35em] text-cyan-300/80">{eyebrow}</p>}
        <h2 className="font-display text-2xl font-bold text-white sm:text-3xl md:text-4xl">{title}</h2>
        {subtitle && <p className="mt-2 max-w-2xl text-sm text-white/60">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---------------- skeleton ---------------- */
export function Skeleton({ className }: { className?: string }) {
  return <div className={cn("skeleton", className)} />;
}

export function SongRowSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-soft flex items-center gap-4 p-3">
          <Skeleton className="h-12 w-12 rounded-xl" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-3 w-1/3" />
            <Skeleton className="h-3 w-1/5" />
          </div>
          <Skeleton className="h-3 w-10" />
        </div>
      ))}
    </div>
  );
}

/* ---------------- reveal on scroll ---------------- */
export function Reveal({ children, delay = 0, className }: { children: ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
}
