import { NextResponse } from "next/server";

import { APIError } from "../../../../types";
import { removeFavorite } from "../../../../lib/favorites";
import { devdb } from "../../../../lib/db";

const db = devdb();

export const DELETE = async (
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) => {
  const { id } = await params;

  try {
    const favorites = removeFavorite(db, id);
    return NextResponse.json(favorites);
  } catch (error) {
    if (error instanceof TypeError) {
      return NextResponse.json(
        { status: 400, message: error.message } satisfies APIError,
        { status: 400 },
      );
    }
    throw error;
  }
};
