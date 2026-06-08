import { describe, it, expect } from "vitest";

import { getVisibleListings } from "../hooks/useListings";
import { Listing } from "../types";

const listing = (id: string): Listing => ({
  id,
  name: `name-${id}`,
  phone: "555",
  title: "title",
  car: "car",
});

const a = listing("a");
const b = listing("b");

describe("getVisibleListings", () => {
  // Removing the last favorite skips the favorites query, which retains its stale
  // last page; favorites mode must still drop the no-longer-favorited card.
  it("hides a listing that is no longer favorited (single-item bug)", () => {
    expect(getVisibleListings([a], true, new Set())).toEqual([]);
  });

  it("keeps only still-favorited listings in favorites mode", () => {
    expect(getVisibleListings([a, b], true, new Set(["b"]))).toEqual([b]);
  });

  it("leaves the all-listings view unfiltered", () => {
    expect(getVisibleListings([a, b], false, new Set(["b"]))).toEqual([a, b]);
  });
});
