import type { MarketNewsItem } from "../types";

export const marketNewsFilterTags = [
  "EURUSD",
  "GBPUSD",
  "USDJPY",
  "AUDUSD",
  "USDCAD",
  "DollarIndex",
] as const;

export type MarketNewsFilterTag = (typeof marketNewsFilterTags)[number];

const monthNames = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export function formatMarketNewsDate(value: string) {
  const date = new Date(value);
  const month = monthNames[date.getUTCMonth()];
  const day = date.getUTCDate();
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  return `${month} ${day}, ${hours}:${minutes} GMT`;
}

export function filterMarketNews(items: MarketNewsItem[], tag: MarketNewsFilterTag | null) {
  if (!tag) return items;
  const normalized = tag.toLowerCase();
  return items.filter((item) =>
    item.tags.some((entry) => entry.name.replace(/\s+/g, "").toLowerCase() === normalized),
  );
}

export function formatMarketNewsTag(name: string) {
  return name.replace(/\s+/g, "").toUpperCase();
}
