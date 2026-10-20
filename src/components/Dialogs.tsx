"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Plus, X, Mail, Lock, User as UserIcon, Sparkles, Globe2, Smartphone } from "lucide-react";
import { useUi } from "@/store/ui";
import { useSession } from "@/store/session";
import { GlassButton, GlassInput, GlassToggle } from "@/components/ui/Glass";
import { GENRES } from "@/lib/catalog";
import { cn } from "@/lib/cn";
import { usePlayer } from "@/store/player";

function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden>
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.7 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 13 4 4 13 4 24s9 20 20 20 20-9 20-20c0-1.3-.1-2.6-.4-3.9z" />
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 15.1 19 12 24 12c3.1 0 5.9 1.2 8 3l5.7-5.7C34.3 6.1 29.4 4 24 4 16.3 4 9.7 8.3 6.3 14.7z" />
      <path fill="#4CAF50" d="M24 44c5.2 0 9.9-2 13.4-5.2l-6.2-5.2C29.2 35.1 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8l-6.5 5C9.5 39.6 16.2 44 24 44z" />
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.2-2.2 4.1-4.1 5.6l6.2 5.2C41.4 34.9 44 30 44 24c0-1.3-.1-2.6-.4-3.9z" />
    </svg>
  );
}

function GitHubIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden fill="currentColor">
      <path d="M12 .5C5.7.5.5 5.7.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.2.8-.6v-2c-3.2.7-3.9-1.4-3.9-1.4-.5-1.3-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 1.8 2.7 1.3 3.4 1 .1-.8.4-1.3.7-1.6-2.6-.3-5.3-1.3-5.3-5.7 0-1.3.5-2.3 1.2-3.1-.1-.3-.5-1.5.1-3.1 0 0 1-.3 3.3 1.2 1-.3 2-.4 3-.4s2 .1 3 .4c2.3-1.5 3.3-1.2 3.3-1.2.6 1.6.2 2.8.1 3.1.8.8 1.2 1.8 1.2 3.1 0 4.4-2.7 5.4-5.3 5.7.4.4.8 1.1.8 2.2v3.3c0 .4.2.7.8.6 4.6-1.5 7.9-5.8 7.9-10.9C23.5 5.7 18.3.5 12 .5z" />
    </svg>
  );
}

const COVER_PRESETS = [
  { seed: "nebula", from: "#7b2ff7", to: "#00d4ff" },
  { seed: "solar", from: "#ffd700", to: "#ff2e97" },
  { seed: "void", from: "#0d1b2a", to: "#7b2ff7" },
  { seed: "aurora", from: "#22c55e", to: "#00d4ff" },
  { seed: "plasma", from: "#ff2e97", to: "#a78bfa" },
  { seed: "eclipse", from: "#111827", to: "#f97316" },
];

function Modal({ children, onClose, wide = false }: { children: React.ReactNode; onClose: () => void; wide?: boolean }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);
  return (
    <>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="fixed inset-0 z-[80] bg-black/70 backdrop-blur-md" />
      <div className="pointer-events-none fixed inset-0 z-[81] flex items-start justify-center overflow-y-auto p-4 sm:items-center">
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.97 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className={cn("glass-strong pointer-events-auto my-8 w-full p-5 sm:p-6", wide ? "max-w-2xl" : "max-w-md")}
        >
          {children}
        </motion.div>
      </div>
    </>
  );
}

/* ------------------------------ auth ------------------------------ */
export function AuthModal() {
  const { authOpen, authMode, setAuthOpen, toast } = useUi();
  const { login, signup, social } = useSession();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [picked, setPicked] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState<Record<string, boolean>>({});

  useEffect(() => {
    fetch("/api/auth/providers")
      .then((r) => r.json())
      .then((d) => setProviders(Object.fromEntries((d.providers || []).map((p: { provider: string; configured: boolean }) => [p.provider, p.configured]))))
      .catch(() => undefined);
  }, []);

  const startOAuth = async (provider: "google" | "github") => {
    if (providers[provider]) {
      // real authorization-code flow -> {APP_URL}/api/auth/callback/{provider}
      window.location.href = `/api/auth/${provider}`;
      return;
    }
    setBusy(true);
    try {
      await social(provider);
      setAuthOpen(false);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Social sign-in failed", "error");
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!authOpen) {
      setError("");
      setBusy(false);
    }
  }, [authOpen]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (authMode === "login") await login(email, password);
      else await signup(email, password, displayName, picked);
      setAuthOpen(false);
      setEmail("");
      setPassword("");
      setDisplayName("");
      setPicked([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {authOpen && (
        <Modal onClose={() => setAuthOpen(false)}>
          <div className="mb-5 flex items-start justify-between">
            <div>
              <h2 className="font-display text-2xl font-bold text-white">{authMode === "login" ? "Welcome back, explorer" : "Join the universe"}</h2>
              <p className="mt-1 text-sm text-white/55">
                {authMode === "login" ? "Sign in to sync your library across every device." : "Create an account for liked songs, playlists and listening stats."}
              </p>
            </div>
            <button onClick={() => setAuthOpen(false)} aria-label="Close" className="glass-btn flex h-9 w-9 items-center justify-center rounded-full !px-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {authMode === "signup" && (
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                <GlassInput value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Display name" className="pl-10" />
              </div>
            )}
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <GlassInput type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@galaxy.com" className="pl-10" autoComplete="email" />
            </div>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
              <GlassInput type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (min 6 characters)" className="pl-10" autoComplete={authMode === "login" ? "current-password" : "new-password"} />
            </div>

            {authMode === "signup" && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-cyan-200/80">
                  <Sparkles className="h-3.5 w-3.5" /> Pick up to 3 favorite genres
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {GENRES.slice(0, 18).map((g) => {
                    const active = picked.includes(g.name);
                    return (
                      <button
                        type="button"
                        key={g.slug}
                        onClick={() => setPicked((p) => (active ? p.filter((x) => x !== g.name) : p.length >= 3 ? p : [...p, g.name]))}
                        className={cn("glass-badge px-3 py-1.5 transition", active ? "border-cyan-300/70 bg-cyan-400/20 text-cyan-100" : "text-white/60 hover:text-white")}
                      >
                        {g.icon} {g.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {error && <p className="glass-soft border-pink-300/40 px-3 py-2 text-[12.5px] text-pink-200">{error}</p>}

            <GlassButton type="submit" variant="primary" size="lg" className="w-full" disabled={busy}>
              {busy ? "Launching…" : authMode === "login" ? "Sign in" : "Create account"}
            </GlassButton>
          </form>

          <div className="my-4 flex items-center gap-3">
            <span className="divider-planet flex-1" />
            <span className="text-[10px] uppercase tracking-[0.25em] text-white/35">or continue with</span>
            <span className="divider-planet flex-1" />
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <button onClick={() => void startOAuth("google")} disabled={busy} className="glass-btn flex items-center justify-center gap-2.5 py-3 text-[13px] font-medium">
              <GoogleIcon className="h-4 w-4" /> Continue with Google
              {!providers.google && <span className="glass-badge px-1.5 py-[1px] text-[8.5px] text-white/50">sandbox</span>}
            </button>
            <button onClick={() => void startOAuth("github")} disabled={busy} className="glass-btn flex items-center justify-center gap-2.5 py-3 text-[13px] font-medium">
              <GitHubIcon className="h-4 w-4" /> Continue with GitHub
              {!providers.github && <span className="glass-badge px-1.5 py-[1px] text-[8.5px] text-white/50">sandbox</span>}
            </button>
          </div>

          <p className="mt-4 text-center text-[12px] text-white/50">
            {authMode === "login" ? "New to Calamify?" : "Already orbiting with us?"}{" "}
            <button onClick={() => setAuthOpen(true, authMode === "login" ? "signup" : "login")} className="font-semibold text-cyan-200 hover:text-white">
              {authMode === "login" ? "Create an account" : "Sign in instead"}
            </button>
          </p>
        </Modal>
      )}
    </AnimatePresence>
  );
}

/* ------------------------- add to playlist ------------------------- */
export function AddToPlaylistDialog() {
  const { addToPlaylistSong, setAddToPlaylistSong, setCreatePlaylistOpen, toast } = useUi();
  const { playlists, addSongsToPlaylist, user } = useSession();
  const song = addToPlaylistSong;

  return (
    <AnimatePresence>
      {song && (
        <Modal onClose={() => setAddToPlaylistSong(null)}>
          <div className="mb-4 flex items-start justify-between gap-3">
            <div>
              <h3 className="font-display text-xl font-bold text-white">Add to playlist</h3>
              <p className="mt-1 truncate text-sm text-white/55">{song.title} · {song.artist}</p>
            </div>
            <button onClick={() => setAddToPlaylistSong(null)} aria-label="Close" className="glass-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-full !px-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          {!user && (
            <p className="glass-soft mb-3 px-3 py-2 text-[12.5px] text-white/60">Sign in to save playlists to your account — your likes still work offline on this device.</p>
          )}

          <div className="max-h-64 space-y-2 overflow-y-auto pr-1">
            {playlists.length === 0 && <p className="py-6 text-center text-sm text-white/40">No playlists yet. Create your first cosmic collection below.</p>}
            {playlists.map((p) => (
              <button
                key={p.id}
                onClick={async () => {
                  await addSongsToPlaylist(p.id, [song]);
                  setAddToPlaylistSong(null);
                }}
                className="glass-soft flex w-full items-center gap-3 p-2.5 text-left transition hover:border-cyan-300/40 hover:bg-white/10"
              >
                <span className="h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-white/10" style={{ background: "linear-gradient(135deg,#7b2ff7,#00d4ff)" }} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[13px] font-medium text-white">{p.name}</span>
                  <span className="block text-[11px] text-white/45">{p.songCount} tracks · {p.isPublic ? "Public" : "Private"}</span>
                </span>
                <Plus className="h-4 w-4 text-cyan-200" />
              </button>
            ))}
          </div>

          <GlassButton
            variant="primary"
            className="mt-4 w-full"
            onClick={() => {
              setAddToPlaylistSong(null);
              setCreatePlaylistOpen(true);
              if (!user) toast("Sign in to create playlists", "error");
            }}
            icon={<Plus className="h-4 w-4" />}
          >
            New playlist
          </GlassButton>
        </Modal>
      )}
    </AnimatePresence>
  );
}

/* --------------------------- create playlist --------------------------- */
export function CreatePlaylistDialog() {
  const { createPlaylistOpen, setCreatePlaylistOpen } = useUi();
  const { createPlaylist, addSongsToPlaylist } = useSession();
  const { addToPlaylistSong, setAddToPlaylistSong } = useUi();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isPublic, setIsPublic] = useState(true);
  const [seed, setSeed] = useState(COVER_PRESETS[0].seed);
  const [busy, setBusy] = useState(false);
  const current = usePlayer((s) => s.current);

  useEffect(() => {
    if (createPlaylistOpen && !name) {
      const n = Math.floor(Math.random() * 900 + 100);
      setName(`My Mix #${n}`);
    }
  }, [createPlaylistOpen, name]);

  return (
    <AnimatePresence>
      {createPlaylistOpen && (
        <Modal onClose={() => setCreatePlaylistOpen(false)}>
          <div className="mb-4 flex items-center justify-between">
            <h3 className="font-display text-xl font-bold text-white">Create playlist</h3>
            <button onClick={() => setCreatePlaylistOpen(false)} aria-label="Close" className="glass-btn flex h-9 w-9 items-center justify-center rounded-full !px-0">
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex gap-2">
              {COVER_PRESETS.map((c) => (
                <button
                  key={c.seed}
                  onClick={() => setSeed(c.seed)}
                  aria-label={`Cover ${c.seed}`}
                  className={cn("h-10 w-10 rounded-xl border-2 transition", seed === c.seed ? "scale-110 border-white" : "border-white/15")}
                  style={{ background: `linear-gradient(135deg, ${c.from}, ${c.to})` }}
                />
              ))}
            </div>
            <GlassInput value={name} onChange={(e) => setName(e.target.value)} placeholder="Playlist name" maxLength={60} />
            <GlassInput value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description (optional)" maxLength={140} />
            <label className="glass-soft flex items-center justify-between gap-3 px-3 py-2.5">
              <span className="text-[13px] text-white/75">Public playlist</span>
              <GlassToggle checked={isPublic} onChange={setIsPublic} label="Public playlist" />
            </label>
            <GlassButton
              variant="primary"
              className="w-full"
              disabled={busy || !name.trim()}
              onClick={async () => {
                setBusy(true);
                const id = await createPlaylist(name.trim(), description.trim(), isPublic);
                setBusy(false);
                if (id) {
                  setCreatePlaylistOpen(false);
                  const pending = addToPlaylistSong || (current ? current : null);
                  if (pending) {
                    await addSongsToPlaylist(id, [pending]);
                    setAddToPlaylistSong(null);
                  }
                  setName("");
                  setDescription("");
                }
              }}
            >
              {busy ? "Creating…" : "Create playlist"}
            </GlassButton>
          </div>
        </Modal>
      )}
    </AnimatePresence>
  );
}
