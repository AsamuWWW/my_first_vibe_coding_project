import { useState, useCallback } from "react";
import type { WishlistGame } from "../types";
import { searchGames, getGameInfo, getSteamImageURL } from "../services/steamApi";
import { calcDiscount } from "../services/wishlistStorage";

interface Props {
  onAdd: (game: WishlistGame) => void;
  onClose: () => void;
  existingIDs: Set<string>;
}

export function AddGameModal({ onAdd, onClose, existingIDs }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { gameID: string; steamAppID: string; thumb: string; external: string; cheapest: string }[]
  >([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleSearch = useCallback(async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError("");
    try {
      const data = await searchGames(query);
      setResults(data.slice(0, 15));
      if (data.length === 0) setError("No games found. Try a different name.");
    } catch {
      setError("Search failed. Please check your connection.");
    } finally {
      setLoading(false);
    }
  }, [query]);

  const handleAdd = useCallback(
    async (gameID: string, steamAppID: string, title: string, thumb: string) => {
      if (existingIDs.has(gameID)) return;
      setAdding(gameID);
      try {
        let priceHistory: import("../types").PricePoint[] = [];
        try {
          const info = await getGameInfo(gameID);
          const steamDeal = info.deals.find((d) => d.storeID === "1");
          if (steamDeal) {
            const normalPrice = parseFloat(steamDeal.normalPrice);
            const salePrice = parseFloat(steamDeal.salePrice);
            priceHistory = [
              {
                timestamp: Date.now(),
                normalPrice,
                salePrice,
                discount: calcDiscount(normalPrice, salePrice),
              },
            ];
          }
        } catch {
          // continue without price data
        }

        const thumbnail =
          steamAppID ? getSteamImageURL(steamAppID) : thumb;

        const newGame: WishlistGame = {
          id: gameID,
          steamAppID: steamAppID || undefined,
          title,
          thumbnail,
          addedAt: Date.now(),
          purchased: false,
          priceHistory,
        };
        onAdd(newGame);
        onClose();
      } finally {
        setAdding(null);
      }
    },
    [existingIDs, onAdd, onClose]
  );

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Add game to wishlist"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="modal-box">
        <div className="modal-header">
          <h2>🔍 Search Steam Games</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="modal-search-row">
          <input
            className="modal-input"
            type="text"
            placeholder="Type a game name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            autoFocus
          />
          <button
            className="btn btn-search"
            onClick={handleSearch}
            disabled={loading || !query.trim()}
          >
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {error && <p className="modal-error">{error}</p>}

        <ul className="modal-results" role="list">
          {results.map((r) => {
            const alreadyAdded = existingIDs.has(r.gameID);
            return (
              <li key={r.gameID} className="modal-result-item">
                <img
                  src={r.thumb}
                  alt={r.external}
                  className="result-thumb"
                  loading="lazy"
                />
                <div className="result-info">
                  <span className="result-title">{r.external}</span>
                  {r.cheapest && (
                    <span className="result-price">from ${r.cheapest}</span>
                  )}
                </div>
                <button
                  className="btn btn-add-game"
                  disabled={alreadyAdded || adding === r.gameID}
                  onClick={() =>
                    handleAdd(r.gameID, r.steamAppID, r.external, r.thumb)
                  }
                  aria-label={
                    alreadyAdded
                      ? `${r.external} already in wishlist`
                      : `Add ${r.external} to wishlist`
                  }
                >
                  {alreadyAdded
                    ? "✓ Added"
                    : adding === r.gameID
                    ? "Adding…"
                    : "+ Add"}
                </button>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
