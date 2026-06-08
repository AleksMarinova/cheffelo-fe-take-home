import React from "react";

import { Listing } from "../types";
import {
  useFavoriteListingMutation,
  useUnfavoriteListingMutation,
} from "../store/services/favorites";

interface ListingProps {
  listing: Listing;
  isFavorite: boolean;
}

const ListingCardComponent = ({ listing, isFavorite }: ListingProps) => {
  const [favoriteListing, addState] = useFavoriteListingMutation();
  const [unfavoriteListing, removeState] = useUnfavoriteListingMutation();

  const pending = addState.isLoading || removeState.isLoading;
  const error = addState.error || removeState.error;

  const handleAddToFavorites = () => favoriteListing(listing.id);
  const handleRemoveFromFavorites = () => unfavoriteListing(listing.id);

  const handleToggle = () => {
    if (pending) return;
    if (isFavorite) {
      handleRemoveFromFavorites();
    } else {
      handleAddToFavorites();
    }
  };

  return (
    <li className="listing-card">
      <article className="listing-card-body">
        <h2 className="font-bold">{listing.car}</h2>
        <p className="grow">
          {listing.title} {listing.name}
        </p>
        <p>
          <a href={`tel:${listing.phone}`}>{listing.phone}</a>
        </p>
        <button
          type="button"
          aria-pressed={isFavorite}
          aria-busy={pending}
          onClick={handleToggle}
          className="btn-primary"
        >
          {isFavorite ? "Remove from favorites" : "Add to favorites 🌟"}
        </button>
        {error && (
          <p role="alert" className="field-error">
            Could not update favorite. Please try again.
          </p>
        )}
      </article>
    </li>
  );
};

export const ListingCard = React.memo(ListingCardComponent);
