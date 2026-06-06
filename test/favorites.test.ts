import { describe, it, expect } from "vitest";
import { LowSync, MemorySync } from "lowdb";

import { addFavorite, getFavorites, removeFavorite } from "../lib/favorites";

const makeDb = (initial: string[] = []) =>
  new LowSync<string[]>(new MemorySync<string[]>(), initial);

describe("getFavorites", () => {
  it("returns [] for an empty db", () => {
    const db = makeDb();
    expect(getFavorites(db)).toEqual([]);
  });

  it("does not expose mutable internal state", () => {
    const db = makeDb(["abc"]);
    const favorites = getFavorites(db);
    favorites.push("mutated");
    expect(getFavorites(db)).toEqual(["abc"]);
  });
});

describe("addFavorite", () => {
  it("appends an id to the end and returns the new list", () => {
    const db = makeDb(["abc"]);
    expect(addFavorite(db, "def")).toEqual(["abc", "def"]);
    expect(getFavorites(db)).toEqual(["abc", "def"]);
  });

  it("is idempotent for an already-favorited id", () => {
    const db = makeDb(["abc"]);
    expect(addFavorite(db, "abc")).toEqual(["abc"]);
    expect(getFavorites(db)).toEqual(["abc"]);
  });

  it("throws TypeError for an empty or non-string id", () => {
    const db = makeDb();
    expect(() => addFavorite(db, "")).toThrow(TypeError);
    expect(() => addFavorite(db, 42)).toThrow(TypeError);
    expect(getFavorites(db)).toEqual([]);
  });

  it("persists across LowSync instances over the same adapter", () => {
    const adapter = new MemorySync<string[]>();
    const writer = new LowSync<string[]>(adapter, []);
    addFavorite(writer, "abc");
    const reader = new LowSync<string[]>(adapter, []);
    expect(getFavorites(reader)).toEqual(["abc"]);
  });
});

describe("removeFavorite", () => {
  it("removes a present id and returns the new list", () => {
    const db = makeDb(["abc", "def"]);
    expect(removeFavorite(db, "abc")).toEqual(["def"]);
    expect(getFavorites(db)).toEqual(["def"]);
  });

  it("is a no-op for an absent id", () => {
    const db = makeDb(["abc"]);
    expect(removeFavorite(db, "nope")).toEqual(["abc"]);
    expect(getFavorites(db)).toEqual(["abc"]);
  });

  it("throws TypeError for an empty or non-string id", () => {
    const db = makeDb(["abc"]);
    expect(() => removeFavorite(db, "")).toThrow(TypeError);
    expect(() => removeFavorite(db, 42)).toThrow(TypeError);
    expect(getFavorites(db)).toEqual(["abc"]);
  });
});
