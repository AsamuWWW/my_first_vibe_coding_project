import type { PricePoint, WishlistGame, DiscountTrend, TrendDirection } from "../types";

const STORAGE_KEY = "steam_discount_hunter_wishlist";

export function loadWishlist(): WishlistGame[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as WishlistGame[];
  } catch {
    return [];
  }
}

export function saveWishlist(games: WishlistGame[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(games));
}

export function addPricePoint(game: WishlistGame, point: PricePoint): WishlistGame {
  const history = [...game.priceHistory, point];
  // Keep at most 90 data points
  const trimmed = history.length > 90 ? history.slice(history.length - 90) : history;
  return { ...game, priceHistory: trimmed };
}

/**
 * Compute the discount trend for a game.
 * "no red unless you buy" - red direction only applies after the game is purchased.
 */
export function computeTrend(game: WishlistGame): DiscountTrend {
  const history = game.priceHistory;
  if (history.length === 0) {
    return { current: 0, previous: 0, direction: "none", isAtLow: false };
  }

  const latest = history[history.length - 1];
  const current = latest.discount;

  let previous = current;
  if (history.length >= 2) {
    previous = history[history.length - 2].discount;
  }

  // Determine trend direction
  let direction: TrendDirection = "flat";
  if (current > previous + 1) {
    direction = "down"; // price went down = discount increased = good (green)
  } else if (current < previous - 1) {
    // Discount decreased (price went up) - only show as "up" (red) if purchased
    direction = game.purchased ? "up" : "flat";
  }

  // Check if near cheapest price ever
  const allPrices = history.map((p) => p.salePrice).filter((p) => p > 0);
  const historicalLow = allPrices.length > 0 ? Math.min(...allPrices) : Infinity;
  const isAtLow = latest.salePrice > 0 && latest.salePrice <= historicalLow * 1.05;

  return { current, previous, direction, isAtLow };
}

/**
 * Calculate discount percentage from prices.
 */
export function calcDiscount(normalPrice: number, salePrice: number): number {
  if (normalPrice <= 0) return 0;
  const pct = ((normalPrice - salePrice) / normalPrice) * 100;
  return Math.round(Math.max(0, Math.min(100, pct)));
}

/**
 * Determine the CSS color class based on discount and purchase status.
 * Green shades for discounts; red only after purchase when discount decreased.
 */
export function getDiscountColorClass(
  discount: number,
  trend: DiscountTrend,
  purchased: boolean
): string {
  if (discount === 0) return "neutral";

  // Red only after purchase when trend is "up" (discount shrinking)
  if (purchased && trend.direction === "up") return "red";

  // Green intensity based on discount depth
  if (discount >= 75) return "green-intense";
  if (discount >= 50) return "green-strong";
  if (discount >= 25) return "green-medium";
  return "green-light";
}
