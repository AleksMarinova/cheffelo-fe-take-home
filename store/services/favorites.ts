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
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          favoritesApi.util.updateQueryData(
            "getFavorites",
            undefined,
            (draft) => {
              if (!draft.includes(id)) {
                draft.push(id);
              }
            },
          ),
        );
        try {
          // Reconcile cache against the server's authoritative response so
          // overlapping mutations converge on real state instead of drifting.
          const { data: server } = await queryFulfilled;
          dispatch(
            favoritesApi.util.upsertQueryData("getFavorites", undefined, server),
          );
        } catch {
          patch.undo();
          // If our optimistic guess was wrong but a concurrent mutation already
          // succeeded, `undo()` may have rewritten valid state. Forcing a
          // refetch guarantees convergence.
          dispatch(favoritesApi.util.invalidateTags(["Favorites"]));
        }
      },
    }),
    unfavoriteListing: builder.mutation<string[], string>({
      query: (id) => ({
        url: `favorites/${id}`,
        method: "DELETE",
      }),
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          favoritesApi.util.updateQueryData(
            "getFavorites",
            undefined,
            (draft) => {
              const index = draft.indexOf(id);
              if (index >= 0) {
                draft.splice(index, 1);
              }
            },
          ),
        );
        try {
          const { data: server } = await queryFulfilled;
          dispatch(
            favoritesApi.util.upsertQueryData("getFavorites", undefined, server),
          );
        } catch {
          patch.undo();
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
