// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { ListingsResponse } from "../../types";

// Must stay <= the /api/listings id cap (MAX_IDS) for favorites chunks.
const PAGE_SIZE = 24;

export const listingsApi = createApi({
  reducerPath: "listingsApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
  endpoints: (builder) => ({
    getListings: builder.infiniteQuery<ListingsResponse, void, number>({
      infiniteQueryOptions: {
        initialPageParam: 0,
        getNextPageParam: (lastPage) => lastPage.nextOffset ?? undefined,
      },
      query: ({ pageParam }) => `listings?offset=${pageParam}&limit=${PAGE_SIZE}`,
    }),
    // Favorites view: page through the favorite ids in chunks. Arg is the full id
    // list; page param is the offset into it. Each request stays under the route's
    // id cap, so the view scales past a single bounded request.
    getFavoriteListings: builder.infiniteQuery<ListingsResponse, string[], number>(
      {
        infiniteQueryOptions: {
          initialPageParam: 0,
          // Page off the requested id count, not the response length (unknown
          // ids are dropped from the response).
          getNextPageParam: (_lastPage, _allPages, lastPageParam, _params, ids) => {
            const next = lastPageParam + PAGE_SIZE;
            return next < ids.length ? next : undefined;
          },
        },
        query: ({ queryArg: ids, pageParam }) => {
          const chunk = ids.slice(pageParam, pageParam + PAGE_SIZE);
          const params = new URLSearchParams({ ids: chunk.join(",") });
          return `listings?${params}`;
        },
      },
    ),
  }),
});

export const {
  useGetListingsInfiniteQuery,
  useGetFavoriteListingsInfiniteQuery,
} = listingsApi;
