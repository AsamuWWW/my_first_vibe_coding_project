export interface PricePoint {
  timestamp: number;
  normalPrice: number;
  salePrice: number;
  discount: number;
}

export interface WishlistGame {
  id: string; // CheapShark gameID
  steamAppID?: string;
  title: string;
  thumbnail: string;
  addedAt: number;
  purchased: boolean;
  purchasedPrice?: number;
  purchasedAt?: number;
  priceHistory: PricePoint[];
}

export interface CheapSharkSearchResult {
  gameID: string;
  steamAppID: string;
  thumb: string;
  cheapest: string;
  cheapestDealID: string;
  external: string;
  internalName: string;
}

export interface CheapSharkGameInfo {
  info: {
    title: string;
    steamAppID: string;
    thumb: string;
  };
  cheapestPriceEver: {
    price: string;
    date: number;
  };
  deals: CheapSharkDeal[];
}

export interface CheapSharkDeal {
  storeID: string;
  dealID: string;
  salePrice: string;
  normalPrice: string;
  savings: string; // "0" to "100"
  metacriticScore: string;
  steamRatingText: string;
  steamRatingPercent: string;
  steamRatingCount: string;
  dealRating: string;
  isDuplicate: boolean;
}

export type TrendDirection = "up" | "down" | "flat" | "none";

export interface DiscountTrend {
  current: number; // current discount %
  previous: number; // previous discount %
  direction: TrendDirection;
  isAtLow: boolean; // near all-time low price
}
