// Need to use the React-specific entry point to import createApi
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { Listing, ListingsResponse } from "../../types";

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
    // Fetch a bounded, explicit set of listings by id (the favorites view), so
    // it doesn't depend on how many paginated pages have been loaded.
    getListingsByIds: builder.query<Listing[], string[]>({
      query: (ids) => `listings?ids=${ids.join(",")}`,
      transformResponse: (response: ListingsResponse) => response.data,
    }),
  }),
});

export const { useGetListingsInfiniteQuery, useGetListingsByIdsQuery } =
  listingsApi;
