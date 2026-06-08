import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const favoritesApi = createApi({
  reducerPath: "favoritesApi",
  baseQuery: fetchBaseQuery({ baseUrl: "/api/" }),
  tagTypes: ["Favorites"],
  endpoints: (builder) => ({
    getFavorites: builder.query<string[], void>({
      query: () => "favorites",
      providesTags: ["Favorites"],
    }),
    favoriteListing: builder.mutation<string[], string>({
      query: (id) => ({
        url: `favorites`,
        method: "POST",
        body: { id },
      }),
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const previous =
          favoritesApi.endpoints.getFavorites.select()(getState()).data;
        const hadData = previous !== undefined;

        // Patch the cached list surgically when it exists; if the favorites GET
        // failed there's no array to patch, so seed an entry instead — the
        // toggle stays optimistic even in that degraded state.
        let undo: (() => void) | undefined;
        if (hadData) {
          undo = dispatch(
            favoritesApi.util.updateQueryData("getFavorites", undefined, (draft) => {
              if (!draft.includes(id)) draft.push(id);
            }),
          ).undo;
        } else {
          dispatch(
            favoritesApi.util.upsertQueryData("getFavorites", undefined, [id]),
          );
        }

        try {
          // Reconcile against the server's authoritative response so overlapping
          // mutations converge on real state instead of drifting.
          const { data: server } = await queryFulfilled;
          dispatch(
            favoritesApi.util.upsertQueryData("getFavorites", undefined, server),
          );
        } catch {
          if (undo) undo();
          else
            dispatch(
              favoritesApi.util.upsertQueryData("getFavorites", undefined, []),
            );
          // A concurrent mutation may have rewritten state; refetch to converge.
          dispatch(favoritesApi.util.invalidateTags(["Favorites"]));
        }
      },
    }),
    unfavoriteListing: builder.mutation<string[], string>({
      query: (id) => ({
        url: `favorites/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, getState, queryFulfilled }) {
        const previous =
          favoritesApi.endpoints.getFavorites.select()(getState()).data;

        // Only patch when there's a cached list — if the favorites GET failed
        // there's nothing to remove, so the optimistic state is already correct.
        const undo =
          previous !== undefined
            ? dispatch(
                favoritesApi.util.updateQueryData(
                  "getFavorites",
                  undefined,
                  (draft) => {
                    const index = draft.indexOf(id);
                    if (index >= 0) draft.splice(index, 1);
                  },
                ),
              ).undo
            : undefined;

        try {
          const { data: server } = await queryFulfilled;
          dispatch(
            favoritesApi.util.upsertQueryData("getFavorites", undefined, server),
          );
        } catch {
          undo?.();
          // A concurrent mutation may have rewritten state; refetch to converge.
          dispatch(favoritesApi.util.invalidateTags(["Favorites"]));
        }
      },
    }),
  }),
});

export const {
  useGetFavoritesQuery,
  useFavoriteListingMutation,
  useUnfavoriteListingMutation,
} = favoritesApi;
