// App state: the feed, this person's invite, their answers and their reads/saves.
// Everything personal is kept on the device only.
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { Access, Category, Feed, Item, fetchFeed, unlock } from './feed';
import { TOPICS, TOPIC_COLORS } from './theme';

export type Priority = 'high' | 'normal' | 'off';
export type Profile = {
  name: string;
  role: string;
  more: string;
  level: 'simple' | 'detailed';
  count: number; // 0 = all
  priority: Record<string, Priority>;
  done: boolean;
  avatar?: string; // "emoji:🦊" | "img:data:..." | ""
  avatarBg?: string;
  notify?: boolean;
};
export type Mark = { read?: boolean; saved?: boolean };

const K = { feed: 'mb.feed.v1', access: 'mb.access.v1', profile: 'mb.profile.v1', marks: 'mb.marks.v1' };
export const EMPTY_PROFILE: Profile = {
  name: '', role: '', more: '', level: 'simple', count: 0, priority: {}, done: false, avatar: '', avatarBg: '', notify: false,
};

type Ctx = {
  ready: boolean;
  loading: boolean;
  error: string | null;
  feed: Feed | null;
  access: Access | null;
  profile: Profile;
  marks: Record<string, Mark>;
  ownerName: string;
  topics: string[]; // folders this person may see, in display order
  topicName: (k: string) => string;
  topicColor: (k: string) => string;
  topicIcon: (k: string) => string;
  allItems: Item[]; // every item this person may see (no hidden folders)
  latestDate: string | null;
  sortItems: (a: Item[]) => Item[];
  today: () => Item[];
  refresh: () => Promise<void>;
  redeem: (id: string, key: string) => Promise<'ok' | 'not-found' | 'bad-key' | 'network'>;
  signOut: () => Promise<void>;
  saveProfile: (p: Partial<Profile>) => Promise<void>;
  setMark: (id: string, m: Mark) => Promise<void>;
};
const StoreCtx = createContext<Ctx | null>(null);

async function readJSON<T>(k: string): Promise<T | null> {
  try {
    const v = await AsyncStorage.getItem(k);
    return v ? (JSON.parse(v) as T) : null;
  } catch {
    return null;
  }
}
const writeJSON = (k: string, v: unknown) => AsyncStorage.setItem(k, JSON.stringify(v)).catch(() => {});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [ready, setReady] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feed, setFeed] = useState<Feed | null>(null);
  const [access, setAccess] = useState<Access | null>(null);
  const [profile, setProfile] = useState<Profile>(EMPTY_PROFILE);
  const [marks, setMarks] = useState<Record<string, Mark>>({});

  const refresh = useCallback(async (acc?: Access | null) => {
    setLoading(true);
    try {
      const f = await fetchFeed();
      setFeed(f);
      writeJSON(K.feed, f);
      setError(null);
      const a = acc === undefined ? access : acc;
      if (a) {
        const r = await unlock(a.id, a.key);
        if (r.ok) {
          setAccess(r.access);
          writeJSON(K.access, r.access);
        } else if (r.reason === 'not-found') {
          // The invite was removed: lock the app again.
          setAccess(null);
          AsyncStorage.removeItem(K.access).catch(() => {});
        }
      }
    } catch {
      setError("Couldn't load today's stories. Check your connection and pull to refresh.");
    } finally {
      setLoading(false);
    }
  }, [access]);

  useEffect(() => {
    (async () => {
      const [f, a, p, m] = await Promise.all([
        readJSON<Feed>(K.feed), readJSON<Access>(K.access), readJSON<Profile>(K.profile), readJSON<Record<string, Mark>>(K.marks),
      ]);
      if (f) setFeed(f);
      if (a) setAccess(a);
      if (p) setProfile({ ...EMPTY_PROFILE, ...p });
      if (m) setMarks(m);
      setReady(true);
      if (a) refresh(a);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const redeem = useCallback(async (id: string, key: string) => {
    const r = await unlock(id, key);
    if (!r.ok) return r.reason;
    setAccess(r.access);
    await writeJSON(K.access, r.access);
    setProfile(p => {
      const next = p.name ? p : { ...p, name: r.access.name };
      writeJSON(K.profile, next);
      return next;
    });
    refresh(r.access);
    return 'ok' as const;
  }, [refresh]);

  const signOut = useCallback(async () => {
    setAccess(null);
    setProfile(EMPTY_PROFILE);
    setMarks({});
    await AsyncStorage.multiRemove([K.access, K.profile, K.marks]).catch(() => {});
  }, []);

  const saveProfile = useCallback(async (patch: Partial<Profile>) => {
    setProfile(p => {
      const next = { ...p, ...patch };
      writeJSON(K.profile, next);
      return next;
    });
  }, []);

  const setMark = useCallback(async (id: string, m: Mark) => {
    setMarks(prev => {
      const next = { ...prev, [id]: { ...prev[id], ...m } };
      writeJSON(K.marks, next);
      return next;
    });
  }, []);

  const value = useMemo<Ctx>(() => {
    const cats: Category[] = feed?.categories || [];
    const catOf = (k: string) => cats.find(c => (c.key || c.id) === k);
    const topicName = (k: string) => catOf(k)?.name || TOPICS[k] || k;
    const topicColor = (k: string) => catOf(k)?.color || TOPIC_COLORS[k] || '#7d8796';
    const topicIcon = (k: string) => catOf(k)?.icon || k;
    const shared = new Set(access?.topics || []);
    const canSee = (k: string) => {
      const v = catOf(k)?.visibility || 'everyone';
      return v === 'everyone' || shared.has(k);
    };
    const pr = profile.priority || {};
    const visible = (k: string) => canSee(k) && pr[k] !== 'off';

    const merged = new Map<string, Item>();
    (feed?.items || []).forEach(i => merged.set(i.id, i));
    (access?.items || []).forEach(i => merged.set(i.id, i));
    const allItems = [...merged.values()].filter(i => visible(i.topic));

    const keys = new Set<string>([...Object.keys(TOPICS), ...cats.map(c => c.key || c.id), ...allItems.map(i => i.topic)]);
    const weight = (k: string) => (pr[k] === 'high' ? 0 : 1);
    const topics = [...keys].filter(visible).sort((a, b) => weight(a) - weight(b));

    const sortItems = (a: Item[]) =>
      [...a].sort((x, y) =>
        x.date < y.date ? 1 : x.date > y.date ? -1 :
          weight(x.topic) - weight(y.topic) || (y.must ? 1 : 0) - (x.must ? 1 : 0) || (x.rank || 99) - (y.rank || 99));

    const latestDate = allItems.filter(i => !i.backfill).reduce<string | null>((m, i) => (!m || i.date > m ? i.date : m), null);
    const today = () => {
      const t = sortItems(allItems.filter(i => i.date === latestDate && !i.backfill));
      return profile.count ? t.slice(0, profile.count) : t;
    };
    const owner = feed?.meta.find(m => m.id === 'owner');
    return {
      ready, loading, error, feed, access, profile, marks,
      ownerName: owner?.name || 'Narek',
      topics, topicName, topicColor, topicIcon, allItems, latestDate, sortItems, today,
      refresh: () => refresh(), redeem, signOut, saveProfile, setMark,
    };
  }, [ready, loading, error, feed, access, profile, marks, refresh, redeem, signOut, saveProfile, setMark]);

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore() {
  const c = useContext(StoreCtx);
  if (!c) throw new Error('useStore outside StoreProvider');
  return c;
}

/** Monday (YYYY-MM-DD) of the week a date falls in. */
export function weekOf(date: string) {
  const d = new Date(date + 'T00:00:00');
  const day = (d.getDay() + 6) % 7;
  d.setDate(d.getDate() - day);
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}
export function fmtDay(date: string) {
  return new Date(date + 'T00:00:00').toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
}
export function initials(n: string) {
  const p = n.trim().split(/\s+/).filter(Boolean);
  return ((p[0]?.[0] || '') + (p[1]?.[0] || '')).toUpperCase();
}
