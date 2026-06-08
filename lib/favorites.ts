import type { LowSync } from "lowdb";

export type FavoritesDb = LowSync<string[]>;

const snapshot = (db: FavoritesDb): string[] => [...db.data];

function assertFavoriteId(id: unknown): asserts id is string {
  if (typeof id !== "string" || id.trim().length === 0) {
    throw new TypeError("id must be a non-empty string");
  }
}

export function getFavorites(db: FavoritesDb): string[] {
  db.read();
  return snapshot(db);
}

export function addFavorite(db: FavoritesDb, id: unknown): string[] {
  assertFavoriteId(id);
  db.read();
  if (!db.data.includes(id)) {
    db.data.push(id);
    db.write();
  }
  return snapshot(db);
}

export function removeFavorite(db: FavoritesDb, id: unknown): string[] {
  assertFavoriteId(id);
  db.read();
  const next = db.data.filter((existing) => existing !== id);
  if (next.length !== db.data.length) {
    db.data = next;
    db.write();
  }
  return snapshot(db);
}
