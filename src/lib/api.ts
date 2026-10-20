"use client";

import type { Song } from "./types";

export class ApiError extends Error {}

export async function api<T = any>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: { "Content-Type": "application/json", ...(init?.headers || {}) },
    credentials: "same-origin",
  });
  const text = await res.text();
  let data: any = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }
  if (!res.ok) throw new ApiError(data?.error || `Request failed (${res.status})`);
  return data as T;
}

export interface SearchResponse {
  results: Song[];
  suggestions: string[];
  history: string[];
  counts: { youtube: number; audius: number };
}

export async function searchApi(q: string, limit = 24): Promise<SearchResponse> {
  return api<SearchResponse>(`/api/search?q=${encodeURIComponent(q)}&limit=${limit}`);
}

export async function trendingApi(params: { query?: string; genre?: string; limit?: number } = {}): Promise<{ results: Song[] }> {
  const qs = new URLSearchParams();
  if (params.query) qs.set("query", params.query);
  if (params.genre) qs.set("genre", params.genre);
  if (params.limit) qs.set("limit", String(params.limit));
  return api(`/api/trending?${qs.toString()}`);
}

export async function radioApi(seed: { title?: string; artist?: string; genre?: string; exclude?: string[] }): Promise<{ results: Song[] }> {
  const qs = new URLSearchParams();
  if (seed.title) qs.set("title", seed.title);
  if (seed.artist) qs.set("artist", seed.artist);
  if (seed.genre) qs.set("genre", seed.genre);
  if (seed.exclude?.length) qs.set("exclude", seed.exclude.join(","));
  return api(`/api/radio?${qs.toString()}`);
}

export interface LyricWord {
  text: string;
  start: number;
  end: number;
}

export interface LyricLine {
  time: number;
  text: string;
  words?: LyricWord[];
  wordsAreExact?: boolean;
}

export async function lyricsApi(title: string, artist: string): Promise<{ lyrics: LyricLine[]; plain: string; source: string }> {
  return api(`/api/lyrics?title=${encodeURIComponent(title)}&artist=${encodeURIComponent(artist)}`);
}

export async function artistApi(name: string) {
  return api(`/api/artist?name=${encodeURIComponent(name)}`);
}
