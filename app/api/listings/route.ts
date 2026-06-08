import { APIError, Listing } from "../../../types";
import { NextRequest, NextResponse } from "next/server";

import listingsData from "../../../data/listings.json";

const listings = listingsData as Listing[];
const listingsById = new Map(listings.map((listing) => [listing.id, listing]));

const DEFAULT_LIMIT = 24;
const MAX_LIMIT = 100;
const MAX_IDS = 100;

const apiError = (status: number, message: string) =>
  NextResponse.json({ status, message } satisfies APIError, { status });

// Accept only canonical non-negative decimal integers, so coerced inputs like
// "", "1e2", "0x10", or whitespace can't slip past validation via Number().
const parseInteger = (value: string): number | null => {
  if (!/^\d+$/.test(value)) return null;
  const number = Number(value);
  return Number.isSafeInteger(number) ? number : null;
};

// Missing param falls back to the default; a present-but-invalid param returns
// null so the caller can reject it with 400 rather than silently coercing.
const parseOffset = (value: string | null): number | null => {
  if (value === null) return 0;
  return parseInteger(value);
};

const parseLimit = (value: string | null): number | null => {
  if (value === null) return DEFAULT_LIMIT;
  const number = parseInteger(value);
  if (number === null || number < 1 || number > MAX_LIMIT) return null;
  return number;
};

export function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // Lookup-by-ids: fetch a bounded, explicit set of listings (e.g. the user's
    // favorites) in one request, independent of pagination. Order follows the
    // requested ids; duplicates are collapsed, unknown ids are skipped, and the
    // count is capped to bound the response size.
    const idsParam = searchParams.get("ids");
    if (idsParam !== null) {
      const ids = Array.from(
        new Set(
          idsParam
            .split(",")
            .map((id) => id.trim())
            .filter(Boolean),
        ),
      );
      if (ids.length > MAX_IDS) {
        return apiError(400, "Too many ids");
      }
      const data = ids
        .map((id) => listingsById.get(id))
        .filter((listing): listing is Listing => listing !== undefined);
      return NextResponse.json({ data, nextOffset: null }, { status: 200 });
    }

    const offset = parseOffset(searchParams.get("offset"));
    const limit = parseLimit(searchParams.get("limit"));
    if (offset === null || limit === null) {
      return apiError(400, "Invalid pagination parameters");
    }

    const page = listings.slice(offset, offset + limit);
    const next = offset + limit;
    const nextOffset = next < listings.length ? next : null;

    return NextResponse.json({ data: page, nextOffset }, { status: 200 });
  } catch {
    return apiError(500, "Failed to fetch data");
  }
}
