import type { WishlistGame } from "../types";
import { computeTrend, getDiscountColorClass } from "../services/wishlistStorage";
import { getSteamStoreURL } from "../services/steamApi";
import { SparklineChart } from "./SparklineChart";

interface Props {
  game: WishlistGame;
  isRefreshing: boolean;
  onRemove: (id: string) => void;
  onRefresh: (id: string) => void;
  onMarkPurchased: (id: string) => void;
}

export function GameCard({ game, isRefreshing, onRemove, onRefresh, onMarkPurchased }: Props) {
  const trend = computeTrend(game);
  const colorClass = getDiscountColorClass(trend.current, trend, game.purchased);
  const latest = game.priceHistory[game.priceHistory.length - 1];

  const normalPrice = latest ? latest.normalPrice.toFixed(2) : "—";
  const salePrice = latest ? latest.salePrice.toFixed(2) : "—";
  const isFree = latest && latest.salePrice === 0;

  const trendArrow =
    trend.direction === "down"
      ? "▼"
      : trend.direction === "up"
      ? "▲"
      : "—";

  const trendTitle =
    trend.direction === "down"
      ? "Discount increased"
      : trend.direction === "up"
      ? "Discount decreased (price went up)"
      : "Stable";

  const steamURL = game.steamAppID ? getSteamStoreURL(game.steamAppID) : undefined;

  return (
    <article className={`game-card discount-${colorClass}`} aria-label={game.title}>
      <div className="game-card-header">
        <img
          src={game.thumbnail}
          alt={game.title}
          className="game-thumb"
          loading="lazy"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://cdn.akamai.steamstatic.com/steam/apps/0/header.jpg";
          }}
        />
        <div className="game-card-title-row">
          <h3 className="game-title">
            {steamURL ? (
              <a href={steamURL} target="_blank" rel="noopener noreferrer">
                {game.title}
              </a>
            ) : (
              game.title
            )}
          </h3>
          {game.purchased && (
            <span className="badge-purchased" title="You own this game">
              ✓ Owned
            </span>
          )}
          {trend.isAtLow && (
            <span className="badge-low" title="Near historical low price!">
              🔥 Low
            </span>
          )}
        </div>
      </div>

      <div className="game-card-body">
        <div className={`discount-block discount-${colorClass}`}>
          {trend.current > 0 ? (
            <>
              <span className="discount-pct">-{trend.current}%</span>
              <span
                className={`trend-arrow trend-${trend.direction}`}
                title={trendTitle}
                aria-label={trendTitle}
              >
                {trendArrow}
              </span>
            </>
          ) : (
            <span className="no-discount">No discount</span>
          )}
        </div>

        <div className="price-info">
          {latest ? (
            <>
              <span className="price-sale">
                {isFree ? "FREE" : `$${salePrice}`}
              </span>
              {trend.current > 0 && (
                <span className="price-normal">${normalPrice}</span>
              )}
            </>
          ) : (
            <span className="price-unknown">Price unknown</span>
          )}
        </div>

        <div className="sparkline-container">
          <SparklineChart
            history={game.priceHistory}
            purchased={game.purchased}
            width={130}
            height={44}
          />
        </div>

        {game.purchased && game.purchasedPrice !== undefined && (
          <div className="purchased-info">
            Bought at <strong>${game.purchasedPrice.toFixed(2)}</strong>
            {latest && game.purchasedPrice > latest.salePrice && (
              <span className="price-drop-alert"> — now cheaper!</span>
            )}
          </div>
        )}
      </div>

      <div className="game-card-actions">
        {!game.purchased && (
          <button
            className="btn btn-buy"
            onClick={() => onMarkPurchased(game.id)}
            title="Mark as purchased to enable red trend tracking"
          >
            🛒 Bought
          </button>
        )}
        <button
          className="btn btn-refresh"
          onClick={() => onRefresh(game.id)}
          disabled={isRefreshing}
          title="Refresh price"
          aria-busy={isRefreshing}
        >
          {isRefreshing ? "⟳" : "↻"} Refresh
        </button>
        <button
          className="btn btn-remove"
          onClick={() => onRemove(game.id)}
          title="Remove from wishlist"
          aria-label={`Remove ${game.title} from wishlist`}
        >
          ✕
        </button>
      </div>
    </article>
  );
}
