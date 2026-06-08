import { describe, it, expect } from "vitest";
import type { NextRequest } from "next/server";

import { GET } from "../app/api/listings/route";
import listingsData from "../data/listings.json";
import type { Listing } from "../types";

const listings = listingsData as Listing[];

// Ids used to exercise the "unknown id" paths; tests assume they match nothing.
const UNKNOWN_IDS = ["does-not-exist", "nope"];

// Fixture guards: the route reads the real dataset, so fail loudly if the
// assumptions these tests rely on stop holding.
if (listings.length < 101) {
  throw new Error("listings.route.test.ts requires at least 101 listings");
}
const idSet = new Set(listings.map((l) => l.id));
if (idSet.size !== listings.length) {
  throw new Error("listings.route.test.ts requires unique listing ids");
}
if (UNKNOWN_IDS.some((id) => idSet.has(id))) {
  throw new Error("listings.route.test.ts requires UNKNOWN_IDS to be absent");
}

// The route handler only reads `request.url`, so a plain Request is enough.
const get = async (query: string): Promise<{ status: number; body: unknown }> => {
  const res = await GET(
    new Request(`http://localhost/api/listings${query}`) as unknown as NextRequest,
  );
  return { status: res.status, body: await res.json() };
};

const idsQuery = (items: Listing[]) =>
  `?ids=${items.map((l) => l.id).join(",")}`;

const expectPaginationError = async (query: string) => {
  const { status, body } = await get(query);

  expect(status).toBe(400);
  expect(body).toEqual({ status: 400, message: "Invalid pagination parameters" });
};

describe("GET /api/listings?ids= (lookup by id)", () => {
  it("returns the listings for the requested ids with nextOffset null", async () => {
    const wanted = [listings[2], listings[5]];
    const { status, body } = await get(idsQuery(wanted));

    expect(status).toBe(200);
    expect(body).toEqual({ data: wanted, nextOffset: null });
  });

  it("preserves the requested id order, not the dataset order", async () => {
    const wanted = [listings[5], listings[0], listings[3]];
    const { status, body } = await get(idsQuery(wanted));

    expect(status).toBe(200);
    expect(body).toEqual({ data: wanted, nextOffset: null });
  });

  it("skips unknown ids instead of erroring", async () => {
    const known = listings[1];
    const { status, body } = await get(
      `?ids=${UNKNOWN_IDS[0]},${known.id},${UNKNOWN_IDS[1]}`,
    );

    expect(status).toBe(200);
    expect(body).toEqual({ data: [known], nextOffset: null });
  });

  it("returns an empty list for an empty ids param", async () => {
    const { status, body } = await get("?ids=");

    expect(status).toBe(200);
    expect(body).toEqual({ data: [], nextOffset: null });
  });

  it("ignores blank segments and whitespace from stray commas", async () => {
    const known = listings[4];
    const { status, body } = await get(`?ids=,, ${known.id} ,,`);

    expect(status).toBe(200);
    expect(body).toEqual({ data: [known], nextOffset: null });
  });

  it("ignores pagination params, even invalid ones", async () => {
    const wanted = listings.slice(0, 3);
    const { status, body } = await get(`${idsQuery(wanted)}&offset=abc&limit=0`);

    expect(status).toBe(200);
    expect(body).toEqual({ data: wanted, nextOffset: null });
  });

  it("collapses duplicate ids to a single listing", async () => {
    const known = listings[7];
    const { status, body } = await get(`?ids=${known.id},${known.id},${known.id}`);

    expect(status).toBe(200);
    expect(body).toEqual({ data: [known], nextOffset: null });
  });

  it("accepts exactly 100 ids (the cap boundary) and returns them", async () => {
    const wanted = listings.slice(0, 100);
    const { status, body } = await get(idsQuery(wanted));

    expect(status).toBe(200);
    expect(body).toEqual({ data: wanted, nextOffset: null });
  });

  it("applies the ids cap after deduping, not on raw count", async () => {
    // 100 distinct ids + 1 duplicate = 101 raw segments, but 100 distinct.
    // Reversed so this also guards requested-order preservation at the boundary.
    const wanted = listings.slice(0, 100).reverse();
    const { status, body } = await get(`${idsQuery(wanted)},${wanted[0].id}`);

    expect(status).toBe(200);
    expect(body).toEqual({ data: wanted, nextOffset: null });
  });

  it("rejects more than 100 distinct ids with 400", async () => {
    const { status, body } = await get(idsQuery(listings.slice(0, 101)));

    expect(status).toBe(400);
    expect(body).toEqual({ status: 400, message: "Too many ids" });
  });

  it("uses the paginated branch when no ids param is present", async () => {
    const { status, body } = await get("?offset=0&limit=2");

    expect(status).toBe(200);
    expect(body).toEqual({ data: listings.slice(0, 2), nextOffset: 2 });
  });
});

describe("GET /api/listings pagination", () => {
  it("defaults to offset 0 and limit 24 when params are missing", async () => {
    const { status, body } = await get("");

    expect(status).toBe(200);
    expect(body).toEqual({ data: listings.slice(0, 24), nextOffset: 24 });
  });

  it("returns the requested slice for a non-zero offset", async () => {
    const { status, body } = await get("?offset=5&limit=3");

    expect(status).toBe(200);
    expect(body).toEqual({ data: listings.slice(5, 8), nextOffset: 8 });
  });

  it("accepts the maximum limit of 100", async () => {
    const { status, body } = await get("?limit=100");

    expect(status).toBe(200);
    expect(body).toEqual({ data: listings.slice(0, 100), nextOffset: 100 });
  });

  it("returns an empty result when offset equals the dataset length", async () => {
    const { status, body } = await get(`?offset=${listings.length}&limit=5`);

    expect(status).toBe(200);
    expect(body).toEqual({ data: [], nextOffset: null });
  });

  it.each([
    "?limit=0",
    "?limit=101",
    "?offset=-5&limit=2",
    "?offset=1.9&limit=2",
    "?offset=0&limit=2.7",
    "?offset=abc&limit=xyz",
    "?offset=&limit=2",
    "?offset=%20%20&limit=2",
    "?offset=1e2&limit=2",
    "?offset=0x10&limit=2",
    "?limit=1e2",
  ])("rejects invalid pagination params: %s", async (query) => {
    await expectPaginationError(query);
  });
});
