import { describe, it, expect, beforeEach, vi } from "vitest";

import listingsData from "../data/listings.json";
import type { Listing } from "../types";

// Mock the LowDB factory so the route writes to an in-memory store, not the
// real data/db.json file. devdb() returns one shared instance the route reads.
vi.mock("../lib/db", async () => {
  const { LowSync, MemorySync } = await import("lowdb");
  const instance = new LowSync<string[]>(new MemorySync<string[]>(), []);
  return { devdb: () => instance };
});

import { GET, POST } from "../app/api/favorites/route";
import { devdb } from "../lib/db";

const listings = listingsData as Listing[];
const KNOWN_ID = listings[0].id;
const UNKNOWN_ID = "does-not-exist";

if (new Set(listings.map((l) => l.id)).has(UNKNOWN_ID)) {
  throw new Error("favorites.route.test.ts requires UNKNOWN_ID to be absent");
}

const post = async (
  body: unknown,
  { raw }: { raw?: string } = {},
): Promise<{ status: number; body: unknown }> => {
  const res = await POST(
    new Request("http://localhost/api/favorites", {
      method: "POST",
      body: raw ?? JSON.stringify(body),
    }),
  );
  return { status: res.status, body: await res.json() };
};

beforeEach(() => {
  const db = devdb();
  db.data = [];
  db.write();
});

describe("GET /api/favorites", () => {
  it("returns the stored favorites", async () => {
    const db = devdb();
    db.data = [KNOWN_ID];
    db.write();

    const res = await GET();
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual([KNOWN_ID]);
  });
});

describe("POST /api/favorites", () => {
  it("creates a favorite for a known listing id (201)", async () => {
    const { status, body } = await post({ id: KNOWN_ID });
    expect(status).toBe(201);
    expect(body).toEqual([KNOWN_ID]);
  });

  it("is idempotent for an already-favorited id (200)", async () => {
    await post({ id: KNOWN_ID });
    const { status, body } = await post({ id: KNOWN_ID });
    expect(status).toBe(200);
    expect(body).toEqual([KNOWN_ID]);
  });

  it("rejects an unknown listing id with 404 and stores nothing", async () => {
    const { status, body } = await post({ id: UNKNOWN_ID });
    expect(status).toBe(404);
    expect(body).toEqual({ status: 404, message: "Unknown listing id" });
    expect(devdb().data).toEqual([]);
  });

  it("treats a whitespace-wrapped known id as unknown (exact match, 404)", async () => {
    const { status } = await post({ id: ` ${KNOWN_ID} ` });
    expect(status).toBe(404);
    expect(devdb().data).toEqual([]);
  });

  it("rejects a blank or whitespace id with 400", async () => {
    expect((await post({ id: "" })).status).toBe(400);
    expect((await post({ id: "   " })).status).toBe(400);
  });

  it("rejects a non-string id with 400", async () => {
    expect((await post({ id: 42 })).status).toBe(400);
    expect((await post({})).status).toBe(400);
  });

  it("rejects an invalid JSON body with 400", async () => {
    const { status, body } = await post(null, { raw: "not json" });
    expect(status).toBe(400);
    expect(body).toEqual({ status: 400, message: "Invalid JSON body" });
  });
});
