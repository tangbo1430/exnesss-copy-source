import type { Route } from "../types";

export const DEFAULT_PA_ROUTE: Route = "/pa/trading/accounts";

const PA_ROUTES: readonly Route[] = [
  "/pa/trading/accounts",
  "/pa/trading/open-account",
  "/pa/trading/orderSummary",
  "/pa/trading/ordersHistory",
  "/pa/payments-and-wallet/deposit",
  "/pa/payments-and-wallet/withdrawal",
  "/pa/payments-and-wallet/history",
  "/pa/payments-and-wallet/crypto-wallet",
  "/pa/analytics/analystViews",
  "/pa/analytics/fxnews",
  "/pa/exness-benefits/swapfree",
  "/pa/exness-benefits/savings",
  "/pa/exness-benefits/vps",
  "/pa/socialtrading",
  "/pa/support_hub/help_center",
  "/pa/settings/profile",
  "/pa/settings/security",
  "/pa/settings/terminal-settings",
];

export function isPaRoute(path: string): path is Route {
  return PA_ROUTES.includes(path as Route);
}

export function readPathname(): string {
  const raw = window.location.pathname || "/";
  if (raw.length > 1 && raw.endsWith("/")) {
    return raw.slice(0, -1);
  }
  return raw;
}

export function resolvePaRoute(path = readPathname()): Route {
  return isPaRoute(path) ? path : DEFAULT_PA_ROUTE;
}

/** 将当前 SPA 路径写入地址栏（支持浏览器前进/后退） */
export function writePaPath(path: Route, replace = false) {
  const url = `${path}${window.location.search}${window.location.hash}`;
  if (replace) {
    window.history.replaceState(window.history.state, "", url);
    return;
  }
  if (readPathname() !== path) {
    window.history.pushState(window.history.state, "", url);
  }
}

export function writeAppRoot(replace = true) {
  const url = `/${window.location.search}${window.location.hash}`;
  if (replace) {
    window.history.replaceState(window.history.state, "", url);
  } else {
    window.history.pushState(window.history.state, "", url);
  }
}
