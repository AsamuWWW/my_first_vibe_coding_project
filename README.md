# 🎮 Steam Deep Discount Hunter — Monitor Board

> Add your wishlist games; only displays their discount intensity in green/red trends — **no red unless you buy**.

A React + TypeScript web app that monitors Steam game prices and visualizes discount trends.

## Features

- **Wishlist Management** — Search and add Steam games by title
- **Live Price Data** — Fetches real prices via the [CheapShark API](https://www.cheapshark.com/) (Steam store)
- **Discount Intensity Display** — Color-coded cards:
  - 🟢 **Green shades** — active discount (25% = light green → 75%+ = intense green)
  - 🔴 **Red** — price went up _after you marked the game as purchased_ (**no red unless you buy**)
- **Sparkline Trend Charts** — Per-game price history visualized as a mini sparkline
- **Historical Low Detection** — 🔥 badge when a game is near its all-time low price
- **Filter Views** — All / On Sale / Owned
- **localStorage Persistence** — Your wishlist is saved locally in the browser

## Tech Stack

- React 19 + TypeScript
- Vite 8
- CheapShark API (free, CORS-friendly, Steam data)
- Vitest for unit tests

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Production build |
| `npm test` | Run unit tests |
| `npm run lint` | Lint the codebase |

## How It Works

1. **Add a game**: Click "+ Add Game", search by title, click the game
2. **Monitor prices**: The board auto-fetches current Steam prices on load
3. **Discount trends**: Green cards/sparklines show active discounts
4. **"Bought" tracking**: Click "🛒 Bought" after purchasing — only then will red color appear if the discount later shrinks (so you know the price went back up after your purchase)

## Price Comparison Logic

Prices are fetched from the CheapShark API (`storeID=1` = Steam). The app tracks up to 90 historical price points per game in localStorage. Discount intensity is calculated as:

```
discount% = (normalPrice - salePrice) / normalPrice × 100
```

Color thresholds:
- 75%+ → intense green
- 50–74% → strong green  
- 25–49% → medium green
- 1–24% → light green
- 0% → neutral (no discount)
- Trend UP + purchased → red
