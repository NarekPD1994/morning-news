// Loading the public feed and unlocking a person's private folders.
import { gcm } from '@noble/ciphers/aes.js';

export const SITE =
  (process.env.EXPO_PUBLIC_SITE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://narekpd1994.github.io/morning-news';

export type Item = {
  id: string;
  date: string;
  topic: string;
  title: string;
  summary?: string;
  why?: string;
  source?: string;
  url?: string;
  mins?: number;
  rank?: number;
  must?: boolean;
  backfill?: boolean;
  skill?: string;
};
export type Category = {
  id: string;
  key?: string;
  name: string;
  color?: string;
  icon?: string;
  visibility?: 'everyone' | 'private' | 'some';
};
export type Digest = { id: string; date?: string; headline?: string; lede?: string };
export type Week = { id: string; headline?: string; lede?: string };
export type Source = { id: string; name: string; url?: string; topic?: string; who?: string; why?: string };
export type Feed = {
  items: Item[];
  digests: Digest[];
  weeks: Week[];
  sources: Source[];
  categories: Category[];
  meta: { id: string; name?: string; avatar?: string; avatarBg?: string }[];
};
export type Access = { id: string; key: string; name: string; topics: string[]; items: Item[] };

const B64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
export function b64decode(input: string): Uint8Array {
  const s = input.replace(/-/g, '+').replace(/_/g, '/').replace(/[^A-Za-z0-9+/]/g, '');
  const out: number[] = [];
  let buf = 0, bits = 0;
  for (const ch of s) {
    buf = (buf << 6) | B64.indexOf(ch);
    bits += 6;
    if (bits >= 8) {
      bits -= 8;
      out.push((buf >> bits) & 0xff);
    }
  }
  return Uint8Array.from(out);
}

/** Accepts a full personal link (…#k=id.key) or just "id.key". */
export function parseInvite(text: string): { id: string; key: string } | null {
  const t = text.trim();
  const m = /(?:k=)?([0-9a-f]{6,20})\.([A-Za-z0-9_-]{40,50})/.exec(t);
  return m ? { id: m[1], key: m[2] } : null;
}

export async function fetchFeed(): Promise<Feed> {
  const r = await fetch(`${SITE}/feed.json?v=${Date.now()}`, { cache: 'no-store' });
  if (!r.ok) throw new Error(`feed ${r.status}`);
  const f = await r.json();
  return {
    items: f.items || [],
    digests: f.digests || [],
    weeks: f.weeks || [],
    sources: f.sources || [],
    categories: f.categories || [],
    meta: f.meta || [],
  };
}

export type UnlockResult = { ok: true; access: Access } | { ok: false; reason: 'not-found' | 'bad-key' | 'network' };

export async function unlock(id: string, key: string): Promise<UnlockResult> {
  let enc: { iv: string; ct: string };
  try {
    const r = await fetch(`${SITE}/p/${id}.json?v=${Date.now()}`, { cache: 'no-store' });
    if (r.status === 404) return { ok: false, reason: 'not-found' };
    if (!r.ok) return { ok: false, reason: 'network' };
    enc = await r.json();
  } catch {
    return { ok: false, reason: 'network' };
  }
  try {
    const plain = gcm(b64decode(key), b64decode(enc.iv)).decrypt(b64decode(enc.ct));
    const d = JSON.parse(new TextDecoder().decode(plain));
    return { ok: true, access: { id, key, name: d.name || '', topics: d.topics || [], items: d.items || [] } };
  } catch {
    return { ok: false, reason: 'bad-key' };
  }
}
