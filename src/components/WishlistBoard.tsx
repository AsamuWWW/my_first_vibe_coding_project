import { useState, useEffect, useCallback } from "react";
import { GameCard } from "./GameCard";
import { AddGameModal } from "./AddGameModal";
import { useWishlist } from "../hooks/useWishlist";

export function WishlistBoard() {
  const { games, refreshing, addGame, removeGame, markPurchased, refreshGame, refreshAll } =
    useWishlist();
  const [showModal, setShowModal] = useState(false);
  const [lastRefreshed, setLastRefreshed] = useState<Date | null>(null);
  const [filter, setFilter] = useState<"all" | "discounted" | "owned">("all");

  const existingIDs = new Set(games.map((g) => g.id));

  const handleRefreshAll = useCallback(async () => {
    await refreshAll(games.map((g) => g.id));
    setLastRefreshed(new Date());
  }, [games, refreshAll]);

  // Auto-refresh on mount
  useEffect(() => {
    if (games.length > 0) {
      handleRefreshAll();
    }
    // Only run once on mount; subsequent refreshes are triggered manually
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = games.filter((g) => {
    if (filter === "discounted") {
      const latest = g.priceHistory[g.priceHistory.length - 1];
      return latest && latest.discount > 0;
    }
    if (filter === "owned") return g.purchased;
    return true;
  });

  const activeDiscounts = games.filter((g) => {
    const latest = g.priceHistory[g.priceHistory.length - 1];
    return latest && latest.discount > 0;
  }).length;

  return (
    <div className="wishlist-board">
      <header className="board-header">
        <div className="board-title-row">
          <div>
            <h1 className="board-title">
              <span className="board-icon">🎮</span> Steam Deep Discount Hunter
            </h1>
            <p className="board-subtitle">
              Monitor Board — track your wishlist deals &amp; discount trends
            </p>
          </div>
          <div className="board-stats">
            <div className="stat-item">
              <span className="stat-value">{games.length}</span>
              <span className="stat-label">Tracked</span>
            </div>
            <div className="stat-item stat-green">
              <span className="stat-value">{activeDiscounts}</span>
              <span className="stat-label">On Sale</span>
            </div>
            <div className="stat-item stat-owned">
              <span className="stat-value">{games.filter((g) => g.purchased).length}</span>
              <span className="stat-label">Owned</span>
            </div>
          </div>
        </div>

        <div className="board-controls">
          <div className="filter-tabs" role="group" aria-label="Filter games">
            {(["all", "discounted", "owned"] as const).map((f) => (
              <button
                key={f}
                className={`filter-tab ${filter === f ? "active" : ""}`}
                onClick={() => setFilter(f)}
                aria-pressed={filter === f}
              >
                {f === "all" ? "All" : f === "discounted" ? "On Sale" : "Owned"}
              </button>
            ))}
          </div>

          <div className="action-buttons">
            {lastRefreshed && (
              <span className="last-refreshed" aria-live="polite">
                Updated {lastRefreshed.toLocaleTimeString()}
              </span>
            )}
            <button
              className="btn btn-refresh-all"
              onClick={handleRefreshAll}
              disabled={games.length === 0 || refreshing.size > 0}
              title="Refresh all prices"
            >
              {refreshing.size > 0 ? "⟳ Refreshing…" : "↻ Refresh All"}
            </button>
            <button
              className="btn btn-add"
              onClick={() => setShowModal(true)}
              aria-label="Add game to wishlist"
            >
              + Add Game
            </button>
          </div>
        </div>
      </header>

      <main className="board-main">
        {games.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🎯</div>
            <h2>Your wishlist is empty</h2>
            <p>Add games to start monitoring their discount trends.</p>
            <p className="empty-hint">
              💡 Green = discount active &nbsp;|&nbsp; Red = price went up <em>(only after you buy)</em>
            </p>
            <button className="btn btn-add btn-add-large" onClick={() => setShowModal(true)}>
              + Add Your First Game
            </button>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <p>No games match the current filter.</p>
          </div>
        ) : (
          <div className="games-grid">
            {filtered.map((game) => (
              <GameCard
                key={game.id}
                game={game}
                isRefreshing={refreshing.has(game.id)}
                onRemove={removeGame}
                onRefresh={refreshGame}
                onMarkPurchased={markPurchased}
              />
            ))}
          </div>
        )}
      </main>

      {showModal && (
        <AddGameModal
          onAdd={addGame}
          onClose={() => setShowModal(false)}
          existingIDs={existingIDs}
        />
      )}
    </div>
  );
}
