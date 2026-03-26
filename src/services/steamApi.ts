import type {
  CheapSharkSearchResult,
  CheapSharkGameInfo,
} from "../types";

const BASE_URL = "https://www.cheapshark.com/api/1.0";

export async function searchGames(
  query: string
): Promise<CheapSharkSearchResult[]> {
  const url = `${BASE_URL}/games?title=${encodeURIComponent(query)}&limit=20`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CheapShark search failed: ${res.status}`);
  return res.json();
}

export async function getGameInfo(gameID: string): Promise<CheapSharkGameInfo> {
  const url = `${BASE_URL}/games?id=${encodeURIComponent(gameID)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`CheapShark game info failed: ${res.status}`);
  return res.json();
}

export function getSteamStoreURL(steamAppID: string): string {
  return `https://store.steampowered.com/app/${steamAppID}/`;
}

export function getSteamImageURL(steamAppID: string): string {
  return `https://cdn.akamai.steamstatic.com/steam/apps/${steamAppID}/header.jpg`;
}
