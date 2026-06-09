import { useMemo, useState } from "react";
import { Chip } from "@mui/material";
import { ChevronDown, ChevronRight, History } from "lucide-react";
import { usePA } from "../state/paStore";
import { translateText } from "../i18n";
import type { Order } from "../types";
import { getInstrumentIcons } from "../utils/instrumentIcons";

type SortKey = "closedAt" | "openedAt";
type SortDirection = "asc" | "desc";

function formatOrderDateTime(iso: string, language: string) {
  const date = new Date(iso);
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hours = String(date.getUTCHours()).padStart(2, "0");
  const minutes = String(date.getUTCMinutes()).padStart(2, "0");
  const seconds = String(date.getUTCSeconds()).padStart(2, "0");
  const month =
    language === "简体中文"
      ? `${date.getUTCMonth() + 1}月`
      : date.toLocaleString("en-US", { month: "short", timeZone: "UTC" });
  return `${day} ${month} ${hours}:${minutes}:${seconds}`;
}

function formatOrderPrice(value: number) {
  if (value >= 1000) {
    return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  return String(value);
}

function formatProfit(value: number) {
  return value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function InstrumentIcon({ icon, className }: { icon: NonNullable<ReturnType<typeof getInstrumentIcons>["base"]>; className: string }) {
  if (icon.kind === "metal") {
    return (
      <span className={`${className} order-metal-icon ${icon.label === "Gold" ? "is-gold" : "is-silver"}`} aria-hidden>
        {icon.label === "Gold" ? "Au" : "Ag"}
      </span>
    );
  }

  return <img className={className} src={icon.src} alt="" loading="lazy" decoding="async" />;
}

function InstrumentCell({ symbol }: { symbol: string }) {
  const icons = getInstrumentIcons(symbol);

  return (
    <span className="order-instrument">
      <span className="order-instrument-icons" aria-hidden>
        {icons.base && <InstrumentIcon icon={icons.base} className="order-flag order-flag-base" />}
        {icons.quote && <InstrumentIcon icon={icons.quote} className="order-flag order-flag-quote" />}
      </span>
      <span>{symbol}</span>
    </span>
  );
}

function sortOrders(orders: Order[], sortKey: SortKey, direction: SortDirection) {
  return [...orders].sort((a, b) => {
    const left = sortKey === "closedAt" ? a.closedAt ?? a.openedAt : a.openedAt;
    const right = sortKey === "closedAt" ? b.closedAt ?? b.openedAt : b.openedAt;
    const delta = new Date(left).getTime() - new Date(right).getTime();
    return direction === "asc" ? delta : -delta;
  });
}

export function OrdersHistoryTable({ orders, empty }: { orders: Order[]; empty: string }) {
  const { state } = usePA();
  const language = state.settings.language;
  const t = (text: string) => translateText(text, language);
  const [sortKey, setSortKey] = useState<SortKey>("closedAt");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");

  const columns = [
    "Instrument",
    "Type",
    "Opening time (UTC)",
    "Closing time (UTC)",
    "Lots",
    "Open price",
    "Close price",
    "Profit, USD",
  ] as const;

  const sortedOrders = useMemo(
    () => sortOrders(orders, sortKey, sortDirection),
    [orders, sortKey, sortDirection],
  );

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === "desc" ? "asc" : "desc"));
      return;
    }
    setSortKey(key);
    setSortDirection("desc");
  }

  if (sortedOrders.length === 0) {
    return (
      <div className="orders-history-empty">
        <History size={28} />
        <strong>{t(empty)}</strong>
        <span>{t("Change the filter or create local sample activity.")}</span>
      </div>
    );
  }

  return (
    <div className="table-wrap orders-history-table">
      <table>
        <thead>
          <tr>
            {columns.map((column) => {
              const isClosingTime = column === "Closing time (UTC)";
              return (
                <th key={column}>
                  {isClosingTime ? (
                    <button
                      type="button"
                      className={`orders-history-sort ${sortKey === "closedAt" ? "is-active" : ""}`}
                      onClick={() => toggleSort("closedAt")}
                    >
                      <span>{t(column)}</span>
                      <ChevronDown
                        size={14}
                        className={`orders-history-sort-icon ${sortDirection === "asc" ? "is-asc" : ""}`}
                      />
                    </button>
                  ) : (
                    t(column)
                  )}
                </th>
              );
            })}
            <th aria-hidden />
          </tr>
        </thead>
        <tbody>
          {sortedOrders.map((order) => (
            <tr key={order.id} className="orders-history-row">
              <td>
                <InstrumentCell symbol={order.symbol} />
              </td>
              <td>
                <span className="order-type-cell">
                  <Chip
                    size="small"
                    label={order.side}
                    className={`order-side-chip ${order.side === "Buy" ? "is-buy" : "is-sell"}`}
                  />
                  {order.tradeType === 1 && <span className="order-strategy-badge">{t("Strategy")}</span>}
                </span>
              </td>
              <td>{formatOrderDateTime(order.openedAt, language)}</td>
              <td>{order.closedAt ? formatOrderDateTime(order.closedAt, language) : "—"}</td>
              <td>{order.volume.toFixed(2)}</td>
              <td>{formatOrderPrice(order.openPrice)}</td>
              <td>{order.closePrice != null ? formatOrderPrice(order.closePrice) : "—"}</td>
              <td className={order.pnl < 0 ? "order-profit-negative" : order.pnl > 0 ? "order-profit-positive" : ""}>
                {formatProfit(order.pnl)}
              </td>
              <td className="orders-history-action">
                <ChevronRight size={16} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
