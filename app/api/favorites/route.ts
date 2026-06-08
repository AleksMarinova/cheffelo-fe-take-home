import { NextResponse } from "next/server";

import { APIError } from "../../../types";
import { addFavorite, getFavorites } from "../../../lib/favorites";
import { isKnownListing } from "../../../lib/listings";
import { devdb } from "../../../lib/db";

const db = devdb();

const apiError = (status: number, message: string) =>
  NextResponse.json({ status, message } satisfies APIError, { status });

export const GET = async () => {
  return NextResponse.json(getFavorites(db));
};

export const POST = async (req: Request) => {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return apiError(400, "Invalid JSON body");
  }

  const id = (body as { id?: unknown })?.id;

  if (typeof id !== "string" || id.trim().length === 0) {
    return apiError(400, "id must be a non-empty string");
  }
  // Only persist ids that reference a real listing, so the favorites store can't
  // accumulate garbage from stale or malicious clients.
  if (!isKnownListing(id)) {
    return apiError(404, "Unknown listing id");
  }

  const before = getFavorites(db);
  const after = addFavorite(db, id);
  const created = after.length > before.length;
  return NextResponse.json(after, { status: created ? 201 : 200 });
};
