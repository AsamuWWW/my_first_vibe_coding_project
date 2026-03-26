import { describe, it, expect } from "vitest";
import type { WishlistGame } from "../types";
import {
  calcDiscount,
  computeTrend,
  getDiscountColorClass,
  addPricePoint,
} from "../services/wishlistStorage";

function makeGame(overrides: Partial<WishlistGame> = {}): WishlistGame {
  return {
    id: "test-1",
    title: "Test Game",
    thumbnail: "",
    addedAt: Date.now(),
    purchased: false,
    priceHistory: [],
    ...overrides,
  };
}

describe("calcDiscount", () => {
  it("returns 0 when there is no discount", () => {
    expect(calcDiscount(29.99, 29.99)).toBe(0);
  });

  it("calculates 50% discount correctly", () => {
    expect(calcDiscount(20.0, 10.0)).toBe(50);
  });

  it("calculates 75% discount correctly", () => {
    expect(calcDiscount(40.0, 10.0)).toBe(75);
  });

  it("rounds to nearest integer", () => {
    expect(calcDiscount(30.0, 20.0)).toBe(33);
  });

  it("returns 0 for free games (both 0)", () => {
    expect(calcDiscount(0, 0)).toBe(0);
  });

  it("returns 100 when price is free but normal price exists", () => {
    expect(calcDiscount(10.0, 0)).toBe(100);
  });

  it("never returns more than 100", () => {
    expect(calcDiscount(10, -5)).toBe(100);
  });

  it("never returns less than 0", () => {
    expect(calcDiscount(10, 20)).toBe(0);
  });
});

describe("computeTrend", () => {
  it("returns 'none' direction when no history", () => {
    const game = makeGame();
    const trend = computeTrend(game);
    expect(trend.direction).toBe("none");
    expect(trend.current).toBe(0);
  });

  it("returns 'flat' when only one data point", () => {
    const game = makeGame({
      priceHistory: [{ timestamp: 1, normalPrice: 20, salePrice: 10, discount: 50 }],
    });
    const trend = computeTrend(game);
    expect(trend.direction).toBe("flat");
    expect(trend.current).toBe(50);
  });

  it("returns 'down' (green) when discount increased", () => {
    const game = makeGame({
      priceHistory: [
        { timestamp: 1, normalPrice: 20, salePrice: 15, discount: 25 },
        { timestamp: 2, normalPrice: 20, salePrice: 10, discount: 50 },
      ],
    });
    const trend = computeTrend(game);
    expect(trend.direction).toBe("down");
    expect(trend.current).toBe(50);
    expect(trend.previous).toBe(25);
  });

  it("returns 'flat' (NOT red) when discount decreased and game is NOT purchased", () => {
    const game = makeGame({
      purchased: false,
      priceHistory: [
        { timestamp: 1, normalPrice: 20, salePrice: 10, discount: 50 },
        { timestamp: 2, normalPrice: 20, salePrice: 15, discount: 25 },
      ],
    });
    const trend = computeTrend(game);
    // "no red unless you buy" — direction should NOT be "up"
    expect(trend.direction).not.toBe("up");
    expect(trend.direction).toBe("flat");
  });

  it("returns 'up' (red) when discount decreased and game IS purchased", () => {
    const game = makeGame({
      purchased: true,
      priceHistory: [
        { timestamp: 1, normalPrice: 20, salePrice: 10, discount: 50 },
        { timestamp: 2, normalPrice: 20, salePrice: 15, discount: 25 },
      ],
    });
    const trend = computeTrend(game);
    expect(trend.direction).toBe("up");
  });

  it("marks isAtLow when price is at historical minimum", () => {
    const game = makeGame({
      priceHistory: [
        { timestamp: 1, normalPrice: 20, salePrice: 10, discount: 50 },
        { timestamp: 2, normalPrice: 20, salePrice: 8, discount: 60 },
        { timestamp: 3, normalPrice: 20, salePrice: 8, discount: 60 },
      ],
    });
    const trend = computeTrend(game);
    expect(trend.isAtLow).toBe(true);
  });

  it("does NOT mark isAtLow when price is above historical minimum", () => {
    const game = makeGame({
      priceHistory: [
        { timestamp: 1, normalPrice: 20, salePrice: 8, discount: 60 },
        { timestamp: 2, normalPrice: 20, salePrice: 15, discount: 25 },
      ],
    });
    const trend = computeTrend(game);
    expect(trend.isAtLow).toBe(false);
  });
});

describe("getDiscountColorClass", () => {
  it("returns 'neutral' for 0% discount", () => {
    const trend = { current: 0, previous: 0, direction: "flat" as const, isAtLow: false };
    expect(getDiscountColorClass(0, trend, false)).toBe("neutral");
  });

  it("returns 'green-light' for small discounts (1–24%)", () => {
    const trend = { current: 15, previous: 15, direction: "flat" as const, isAtLow: false };
    expect(getDiscountColorClass(15, trend, false)).toBe("green-light");
  });

  it("returns 'green-medium' for 25–49% discounts", () => {
    const trend = { current: 30, previous: 30, direction: "flat" as const, isAtLow: false };
    expect(getDiscountColorClass(30, trend, false)).toBe("green-medium");
  });

  it("returns 'green-strong' for 50–74% discounts", () => {
    const trend = { current: 60, previous: 60, direction: "flat" as const, isAtLow: false };
    expect(getDiscountColorClass(60, trend, false)).toBe("green-strong");
  });

  it("returns 'green-intense' for 75%+ discounts", () => {
    const trend = { current: 80, previous: 80, direction: "flat" as const, isAtLow: false };
    expect(getDiscountColorClass(80, trend, false)).toBe("green-intense");
  });

  it("returns 'red' only when purchased AND trend is 'up'", () => {
    const trend = { current: 25, previous: 50, direction: "up" as const, isAtLow: false };
    expect(getDiscountColorClass(25, trend, true)).toBe("red");
  });

  it("does NOT return 'red' when trend is 'up' but game is NOT purchased", () => {
    const trend = { current: 25, previous: 50, direction: "up" as const, isAtLow: false };
    const result = getDiscountColorClass(25, trend, false);
    expect(result).not.toBe("red");
  });
});

describe("addPricePoint", () => {
  it("appends a new price point to history", () => {
    const game = makeGame({ priceHistory: [] });
    const point = { timestamp: 1, normalPrice: 20, salePrice: 10, discount: 50 };
    const updated = addPricePoint(game, point);
    expect(updated.priceHistory).toHaveLength(1);
    expect(updated.priceHistory[0]).toEqual(point);
  });

  it("trims history to max 90 points", () => {
    const existing = Array.from({ length: 90 }, (_, i) => ({
      timestamp: i,
      normalPrice: 20,
      salePrice: 10,
      discount: 50,
    }));
    const game = makeGame({ priceHistory: existing });
    const newPoint = { timestamp: 100, normalPrice: 20, salePrice: 8, discount: 60 };
    const updated = addPricePoint(game, newPoint);
    expect(updated.priceHistory).toHaveLength(90);
    expect(updated.priceHistory[89]).toEqual(newPoint);
  });

  it("does not mutate the original game object", () => {
    const game = makeGame({ priceHistory: [] });
    const point = { timestamp: 1, normalPrice: 20, salePrice: 10, discount: 50 };
    addPricePoint(game, point);
    expect(game.priceHistory).toHaveLength(0);
  });
});
