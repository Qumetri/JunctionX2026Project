/**
 * Small key-value cache with a TTL. The browser store keeps entries in localStorage under
 * `lm:cache:`; a future server can pass its own store with the same interface.
 */

export interface CacheStore {
  get<T>(key: string): T | undefined;
  set<T>(key: string, value: T, ttlMs: number): void;
}

type Entry = { value: unknown; expires: number };

export function createBrowserCache(prefix = 'lm:cache:'): CacheStore {
  // Used when localStorage is blocked (private mode, sandboxed previews).
  const memory = new Map<string, Entry>();

  const read = (key: string): Entry | undefined => {
    try {
      const raw = localStorage.getItem(prefix + key);
      if (raw !== null) return JSON.parse(raw) as Entry;
    } catch {
      // Fall through to memory.
    }
    return memory.get(key);
  };

  return {
    get<T>(key: string) {
      const entry = read(key);
      if (!entry || entry.expires < Date.now()) return undefined;
      return entry.value as T;
    },
    set<T>(key: string, value: T, ttlMs: number) {
      const entry: Entry = { value, expires: Date.now() + ttlMs };
      memory.set(key, entry);
      try {
        localStorage.setItem(prefix + key, JSON.stringify(entry));
      } catch {
        // Quota or blocked storage: the memory copy is enough for this visit.
      }
    },
  };
}

export const hours = (n: number) => n * 3_600_000;
export const days = (n: number) => n * 86_400_000;
