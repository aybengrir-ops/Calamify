"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Bell, Disc3, Download, Info, Moon, Shield, SlidersHorizontal, Sun, Trash2, User as UserIcon, Wifi } from "lucide-react";
import { api } from "@/lib/api";
import { GlassBadge, GlassButton, GlassInput, GlassSlider, GlassToggle } from "@/components/ui/Glass";
import { useSession } from "@/store/session";
import { useUi } from "@/store/ui";
import { cn } from "@/lib/cn";
import { setUiSounds, setAmbientDrone, getUiSounds, getAmbientDrone } from "@/components/SoundEffectsProvider";

const EQ_BANDS = [
  { key: "60", label: "60Hz" },
  { key: "170", label: "170" },
  { key: "350", label: "350" },
  { key: "1k", label: "1kHz" },
  { key: "3.5k", label: "3.5k" },
  { key: "10k", label: "10k" },
  { key: "16k", label: "16k" },
];

function Section({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <motion.section initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.45 }} className="glass p-5 sm:p-6">
      <div className="mb-4 flex items-center gap-3">
        <span className="glass-btn flex h-10 w-10 items-center justify-center rounded-xl !px-0 text-cyan-200">{icon}</span>
        <div>
          <h2 className="font-display text-base font-bold text-white">{title}</h2>
          {subtitle && <p className="text-[11.5px] text-white/45">{subtitle}</p>}
        </div>
      </div>
      <div className="space-y-3">{children}</div>
    </motion.section>
  );
}

function Row({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="glass-soft flex flex-wrap items-center justify-between gap-3 px-3.5 py-3">
      <div className="min-w-0">
        <p className="text-[13px] font-medium text-white/85">{label}</p>
        {hint && <p className="mt-0.5 text-[11px] leading-snug text-white/45">{hint}</p>}
      </div>
      {children}
    </div>
  );
}

export default function SettingsPage() {
  const { user, settings, updateSettings, logout } = useSession();
  const { setAuthOpen, toast } = useUi();
  const [local, setLocal] = useState<Record<string, any>>({});
  const [password, setPassword] = useState("");
  const [storage, setStorage] = useState<{ usage: number; quota: number } | null>(null);
  const [uiSounds, setUiSoundsState] = useState(true);
  const [ambient, setAmbientState] = useState(false);

  useEffect(() => {
    if (settings) setLocal({ ...settings });
    setUiSoundsState(getUiSounds());
    setAmbientState(getAmbientDrone());
  }, [settings]);

  useEffect(() => {
    if (!settings && !user) {
      api("/api/settings").then((d) => d.settings && setLocal(d.settings)).catch(() => undefined);
    }
    if (navigator.storage?.estimate) navigator.storage.estimate().then((e) => setStorage({ usage: e.usage || 0, quota: e.quota || 0 }));
  }, [settings, user]);

  const set = (key: string, value: unknown) => {
    setLocal((l) => ({ ...l, [key]: value }));
    void updateSettings({ [key]: value });
  };

  const s = local;
  const eq: Record<string, number> = s.equalizer || {};

  return (
    <div className="mx-auto w-full max-w-[1000px] space-y-6 px-4 pb-16 pt-8 sm:px-6">
      <motion.header initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="glass-strong relative overflow-hidden p-6 sm:p-8">
        <span className="animate-float absolute -right-10 -top-10 h-44 w-44 rounded-full bg-gradient-to-br from-violet-500/30 to-cyan-400/25 blur-3xl" />
        <GlassBadge tone="cyan">Settings</GlassBadge>
        <h1 className="mt-3 flex items-center gap-3 font-display text-3xl font-bold text-white sm:text-4xl">
          <SlidersHorizontal className="h-7 w-7 text-cyan-200" /> Mission control
        </h1>
        <p className="mt-2 max-w-xl text-sm text-white/60">Tune playback, downloads, notifications, privacy and display. Changes save instantly.</p>
      </motion.header>

      {!user && (
        <div className="glass-soft flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-[13px] text-white/65">You are in guest mode — settings are stored locally. Sign in to sync them to your account.</p>
          <div className="flex gap-2">
            <GlassButton size="sm" onClick={() => setAuthOpen(true, "login")}>Sign in</GlassButton>
            <GlassButton size="sm" variant="primary" onClick={() => setAuthOpen(true, "signup")}>Create account</GlassButton>
          </div>
        </div>
      )}

      <Section icon={<UserIcon className="h-5 w-5" />} title="Account" subtitle={user ? `${user.email} · @${user.username}` : "Not signed in"}>
        {user ? (
          <>
            <Row label="Display name" hint="Shown on your profile and playlists">
              <div className="w-52"><GlassInput value={user.displayName} onChange={(e) => set("displayName", e.target.value)} maxLength={40} /></div>
            </Row>
            <Row label="Change password" hint="Minimum 6 characters">
              <div className="flex w-64 gap-2">
                <GlassInput type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" />
                <GlassButton
                  size="sm"
                  onClick={async () => {
                    if (password.length < 6) return toast("Password must be at least 6 characters", "error");
                    await updateSettings({ newPassword: password });
                    setPassword("");
                    toast("Password updated", "success");
                  }}
                >
                  Set
                </GlassButton>
              </div>
            </Row>
            <Row label="Sign out" hint="Ends this session on this device">
              <GlassButton size="sm" onClick={() => void logout()}>Sign out</GlassButton>
            </Row>
            <Row label="Delete account" hint="Removes your profile, likes, playlists and history permanently">
              <GlassButton
                size="sm"
                variant="danger"
                icon={<Trash2 className="h-3.5 w-3.5" />}
                onClick={async () => {
                  if (!window.confirm("Delete your Calamify account forever?")) return;
                  try {
                    await api("/api/auth/me", { method: "DELETE" });
                    await logout();
                    toast("Account deleted", "info");
                  } catch {
                    toast("Could not delete account", "error");
                  }
                }}
              >
                Delete
              </GlassButton>
            </Row>
          </>
        ) : (
          <p className="text-[13px] text-white/55">Create an account to keep your library, playlists and settings across devices.</p>
        )}
      </Section>

      <Section icon={<SlidersHorizontal className="h-5 w-5" />} title="Playback" subtitle="Audio quality, crossfade and normalization">
        <Row label="Audio quality" hint="Higher quality uses more bandwidth">
          <div className="flex gap-1.5">
            {["low", "normal", "high"].map((q) => (
              <button key={q} onClick={() => set("audioQuality", q)} className={cn("glass-btn !rounded-full px-3.5 py-1.5 text-[11px] capitalize", s.audioQuality === q && "glass-btn-primary font-semibold")}>
                {q}
              </button>
            ))}
          </div>
        </Row>
        <Row label={`Crossfade: ${s.crossfade ?? 0}s`} hint="Blend the end of one track into the next">
          <div className="w-44"><GlassSlider value={s.crossfade ?? 0} min={0} max={12} step={1} onChange={(v) => set("crossfade", v)} label="Crossfade seconds" /></div>
        </Row>
        <Row label="Gapless playback" hint="Remove silence between tracks"><GlassToggle checked={Boolean(s.gapless)} onChange={(v) => set("gapless", v)} label="Gapless playback" /></Row>
        <Row label="Normalize volume" hint="Set the same level for every track"><GlassToggle checked={Boolean(s.normalizeVolume)} onChange={(v) => set("normalizeVolume", v)} label="Normalize volume" /></Row>
        <div className="glass-soft p-3.5">
          <p className="mb-3 text-[12px] font-semibold text-white/80">Equalizer</p>
          <div className="flex items-end justify-between gap-2">
            {EQ_BANDS.map((b) => (
              <div key={b.key} className="flex flex-1 flex-col items-center gap-2">
                <input
                  type="range"
                  min={-12}
                  max={12}
                  step={1}
                  value={eq[b.key] ?? 0}
                  onChange={(e) => set("equalizer", { ...eq, [b.key]: parseInt(e.target.value, 10) })}
                  aria-label={`Equalizer ${b.label}`}
                  className="glass-slider h-24 w-2"
                  style={{ writingMode: "vertical-lr", direction: "rtl" } as React.CSSProperties}
                />
                <span className="text-[9.5px] text-white/45">{b.label}</span>
                <span className="text-[9.5px] tabular-nums text-cyan-200/70">{eq[b.key] ?? 0}dB</span>
              </div>
            ))}
          </div>
          <GlassButton size="sm" className="mt-3" onClick={() => set("equalizer", {})}>Reset EQ</GlassButton>
        </div>
      </Section>

      <Section icon={<Download className="h-5 w-5" />} title="Downloads" subtitle="Offline caching via the service worker">
        <Row label="Download quality" hint="Applies to tracks saved for offline listening">
          <div className="flex gap-1.5">
            {["low", "normal", "high"].map((q) => (
              <button key={q} onClick={() => set("downloadQuality", q)} className={cn("glass-btn !rounded-full px-3.5 py-1.5 text-[11px] capitalize", s.downloadQuality === q && "glass-btn-primary font-semibold")}>{q}</button>
            ))}
          </div>
        </Row>
        <Row label="Storage used" hint={storage ? `${(storage.usage / 1048576).toFixed(1)} MB of ${(storage.quota / 1048576).toFixed(0)} MB available on this device` : "Estimate unavailable"}>
          <Link href="/downloads" className="glass-btn !rounded-full px-4 py-1.5 text-[11px]">Manage</Link>
        </Row>
      </Section>

      <Section icon={<Bell className="h-5 w-5" />} title="Notifications" subtitle="Choose what pings your bell">
        <Row label="New releases from followed artists"><GlassToggle checked={Boolean(s.notifyReleases ?? true)} onChange={(v) => set("notifyReleases", v)} label="New releases" /></Row>
        <Row label="Playlist updates"><GlassToggle checked={Boolean(s.notifyPlaylists ?? true)} onChange={(v) => set("notifyPlaylists", v)} label="Playlist updates" /></Row>
        <Row label="Weekly discovery mix ready"><GlassToggle checked={Boolean(s.notifyWeekly ?? true)} onChange={(v) => set("notifyWeekly", v)} label="Weekly mix" /></Row>
        <Row label="Friend activity"><GlassToggle checked={Boolean(s.notifyFriends ?? false)} onChange={(v) => set("notifyFriends", v)} label="Friend activity" /></Row>
      </Section>

      <Section icon={<Shield className="h-5 w-5" />} title="Privacy" subtitle="Who can see your orbit">
        <Row label="Public profile" hint="Let other explorers view your profile and public playlists"><GlassToggle checked={Boolean(s.isPublic ?? true)} onChange={(v) => set("isPublic", v)} label="Public profile" /></Row>
        <Row label="Share listening activity" hint="Include your plays in friend activity feeds"><GlassToggle checked={Boolean(s.notifyFriends ?? false)} onChange={(v) => set("notifyFriends", v)} label="Share activity" /></Row>
      </Section>

      <Section icon={<Sun className="h-5 w-5" />} title="Display" subtitle="Theme, motion and density">
        <Row label="Theme" hint="Space-dark by default; space-light keeps the cosmic feel">
          <div className="flex gap-1.5">
            {[{ key: "space-dark", icon: <Moon className="h-3.5 w-3.5" />, label: "Space dark" }, { key: "space-light", icon: <Sun className="h-3.5 w-3.5" />, label: "Space light" }].map((t) => (
              <button key={t.key} onClick={() => set("theme", t.key)} className={cn("glass-btn flex items-center gap-1.5 !rounded-full px-3.5 py-1.5 text-[11px]", s.theme === t.key && "glass-btn-primary font-semibold")}>
                {t.icon} {t.label}
              </button>
            ))}
          </div>
        </Row>
        <Row label="Reduced motion" hint="Disables parallax, twinkles and heavy animation"><GlassToggle checked={Boolean(s.reducedMotion)} onChange={(v) => set("reducedMotion", v)} label="Reduced motion" /></Row>
        <Row label="Layout density">
          <div className="flex gap-1.5">
            {["compact", "comfortable", "roomy"].map((d) => (
              <button key={d} onClick={() => set("density", d)} className={cn("glass-btn !rounded-full px-3.5 py-1.5 text-[11px] capitalize", s.density === d && "glass-btn-primary font-semibold")}>{d}</button>
            ))}
          </div>
        </Row>
        <Row label="Interface sounds" hint="Synthesized with the Web Audio API — hover sparkles, taps, swooshes, a bass drop on play and arpeggios on skip. No audio files.">
          <GlassToggle
            checked={uiSounds}
            onChange={(v) => {
              setUiSounds(v);
              setUiSoundsState(v);
              if (!v) setAmbientState(false);
            }}
            label="Interface sounds"
          />
        </Row>
        <Row label="Ambient space drone" hint="A barely-there 55 Hz / 82.5 Hz pad with a slow LFO while you browse (off by default)">
          <GlassToggle
            checked={ambient}
            onChange={(v) => {
              if (v && !uiSounds) {
                setUiSounds(true);
                setUiSoundsState(true);
              }
              setAmbientDrone(v);
              setAmbientState(v);
            }}
            label="Ambient space drone"
          />
        </Row>
        <Row label="Language">
          <select value={s.language || "en"} onChange={(e) => set("language", e.target.value)} aria-label="Language" className="glass-input !rounded-xl px-3 py-2 text-xs">
            {["en", "es", "fr", "de", "pt", "hi", "ja", "ko", "ar", "sw"].map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </Row>
      </Section>

      <Section icon={<Wifi className="h-5 w-5" />} title="Connected apps" subtitle="Scrobbling and integrations">
        <Row label="Last.fm username" hint="Enable scrobbling to log plays to your Last.fm profile">
          <div className="flex w-64 gap-2">
            <GlassInput value={s.lastfmUsername || ""} onChange={(e) => setLocal((l) => ({ ...l, lastfmUsername: e.target.value }))} placeholder="lastfm handle" />
            <GlassButton size="sm" onClick={() => { void updateSettings({ lastfmUsername: s.lastfmUsername, scrobble: true }); toast("Last.fm connected", "success"); }}>Connect</GlassButton>
          </div>
        </Row>
        <Row label="Scrobble plays"><GlassToggle checked={Boolean(s.scrobble)} onChange={(v) => set("scrobble", v)} label="Scrobble" /></Row>
      </Section>

      <Section icon={<Info className="h-5 w-5" />} title="About" subtitle="Version and credits">
        <Row label="Calamify" hint="Version 1.0.0 · build cosmos"><GlassBadge tone="purple">v1.0.0</GlassBadge></Row>
        <Row label="Audio engine" hint="youtubei.js (Innertube) primary · Audius open API full-length backbone · lrclib lyrics"><GlassBadge tone="cyan">Innertube</GlassBadge></Row>
        <Row label="Install as an app" hint="Add Calamify to your home screen or desktop">
          <Link href="/about" className="glass-btn flex items-center gap-1.5 !rounded-full px-4 py-1.5 text-[11px]"><Disc3 className="h-3.5 w-3.5" /> How it works</Link>
        </Row>
        <p className="pt-1 text-center text-[11.5px] text-white/35">Made with 💜 in the cosmos · © {new Date().getFullYear()} Calamify</p>
      </Section>
    </div>
  );
}
