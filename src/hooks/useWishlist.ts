import { useState, useEffect, useCallback } from "react";
import type { WishlistGame, PricePoint } from "../types";
import { loadWishlist, saveWishlist, addPricePoint } from "../services/wishlistStorage";
import { getGameInfo } from "../services/steamApi";

export function useWishlist() {
  const [games, setGames] = useState<WishlistGame[]>([]);
  const [refreshing, setRefreshing] = useState<Set<string>>(new Set());

  useEffect(() => {
    setGames(loadWishlist());
  }, []);

  const persist = useCallback((updated: WishlistGame[]) => {
    setGames(updated);
    saveWishlist(updated);
  }, []);

  const addGame = useCallback(
    (game: WishlistGame) => {
      setGames((prev) => {
        if (prev.some((g) => g.id === game.id)) return prev;
        const updated = [game, ...prev];
        saveWishlist(updated);
        return updated;
      });
    },
    []
  );

  const removeGame = useCallback(
    (gameID: string) => {
      setGames((prev) => {
        const updated = prev.filter((g) => g.id !== gameID);
        saveWishlist(updated);
        return updated;
      });
    },
    []
  );

  const markPurchased = useCallback(
    (gameID: string) => {
      setGames((prev) => {
        const updated = prev.map((g) => {
          if (g.id !== gameID) return g;
          const latest = g.priceHistory[g.priceHistory.length - 1];
          return {
            ...g,
            purchased: true,
            purchasedPrice: latest ? latest.salePrice : undefined,
            purchasedAt: Date.now(),
          };
        });
        saveWishlist(updated);
        return updated;
      });
    },
    []
  );

  const refreshGame = useCallback(
    async (gameID: string) => {
      setRefreshing((prev) => new Set(prev).add(gameID));
      try {
        const info = await getGameInfo(gameID);
        const steamDeal = info.deals.find((d) => d.storeID === "1");
        if (!steamDeal) return;

        const point: PricePoint = {
          timestamp: Date.now(),
          normalPrice: parseFloat(steamDeal.normalPrice),
          salePrice: parseFloat(steamDeal.salePrice),
          discount: Math.round(parseFloat(steamDeal.savings)),
        };

        setGames((prev) => {
          const updated = prev.map((g) => {
            if (g.id !== gameID) return g;
            return addPricePoint(g, point);
          });
          saveWishlist(updated);
          return updated;
        });
      } finally {
        setRefreshing((prev) => {
          const next = new Set(prev);
          next.delete(gameID);
          return next;
        });
      }
    },
    []
  );

  const refreshAll = useCallback(async (gameIDs: string[]) => {
    await Promise.allSettled(gameIDs.map((id) => refreshGame(id)));
  }, [refreshGame]);

  return {
    games,
    refreshing,
    addGame,
    removeGame,
    markPurchased,
    refreshGame,
    refreshAll,
    persist,
  };
}
