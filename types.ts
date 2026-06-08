export interface Listing {
  id: string;
  name: string;
  phone: string;
  title: string;
  car: string;
}

export interface APIError {
  status: number;
  message: string;
}

export interface ListingsResponse {
  data: Listing[];
  /** Offset to request the next page, or `null` when the list is exhausted. */
  nextOffset: number | null;
}
