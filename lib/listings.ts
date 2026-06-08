import listingsData from "../data/listings.json";
import type { Listing } from "../types";

export const listings = listingsData as Listing[];

export const listingsById: ReadonlyMap<string, Listing> = new Map(
  listings.map((listing) => [listing.id, listing]),
);

export const isKnownListing = (id: string): boolean => listingsById.has(id);
