import { useMemo, useState, type ReactNode } from "react";
import { Menu, MenuItem } from "@mui/material";
import { ChevronDown, Info } from "lucide-react";
import { translateText } from "../i18n";
import { usePA } from "../state/paStore";
import type { Account, Order } from "../types";

type Period = "7d" | "30d" | "90d" | "365d";
type ChartMetric = "netProfit" | "closedOrders" | "volume" | "equity";

const periodOptions: Array<{ value: Period; label: string }> = [
  { value: "7d", label: "Last 7 days" },
  { value: "30d", label: "Last 30 days" },
  { value: "90d", label: "Last 90 days" },
  { value: "365d", label: "Last 365 days" },
];

const chartTabs: Array<{ value: ChartMetric; label: string }> = [
  { value: "netProfit", label: "Net profit" },
  { value: "closedOrders", label: "Closed orders" },
  { value: "volume", label: "Volume" },
  { value: "equity", label: "Equity" },
];

function formatUsd(value: number) {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} USD`;
}

function formatUsdShort(value: number) {
  return `${value.toLocaleString("en-US", { maximumFractionDigits: 0 })} USD`;
}

function formatUpdateTime(date: Date, language: string) {
  const stamp = new Intl.DateTimeFormat("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "UTC",
  }).format(date);
  const suffix = translateText("(UTC).", language);
  return `${stamp} ${suffix}`;
}

function getAccountName(accounts: Account[], accountId: string) {
  if (accountId === "all") return "All accounts";
  const account = accounts.find((item) => item.id === accountId);
  return account ? `${account.nickname || account.login}` : accountId;
}

function periodStart(period: Period) {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function inPeriod(order: Order, start: Date) {
  const stamp = order.closedAt ?? order.openedAt;
  return new Date(stamp).getTime() >= start.getTime();
}

function monthLabels() {
  const labels: string[] = [];
  const now = new Date();
  for (let index = 12; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    labels.push(`${date.getUTCMonth() + 1}月`);
  }
  return labels;
}

function PerformanceSelect({
  label,
  value,
  options,
  onChange,
  duplicateValue = false,
}: {
  label?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onChange: (value: string) => void;
  duplicateValue?: boolean;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  const selected = options.find((option) => option.value === value) ?? options[0];

  return (
    <>
      <button type="button" className="performance-select" onClick={(event) => setAnchor(event.currentTarget)}>
        {label ? <span className="performance-select-label">{label}</span> : null}
        <span className="performance-select-value">
          <span>{selected.label}</span>
          {duplicateValue ? <span>{selected.label}</span> : null}
        </span>
        <ChevronDown size={16} className={`performance-select-chevron ${open ? "is-open" : ""}`} />
      </button>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { className: "performance-select-menu", sx: { minWidth: anchor?.offsetWidth ?? 220 } } }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={value === option.value}
            className={`performance-select-menu-item ${duplicateValue ? "is-dual" : ""}`}
            onClick={() => {
              onChange(option.value);
              setAnchor(null);
            }}
          >
            <span>{option.label}</span>
            {duplicateValue ? <span>{option.label}</span> : null}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function PerformanceInfoTooltip({ text }: { text: string }) {
  return (
    <span className="performance-info-wrap">
      <button type="button" className="performance-info-btn" aria-label="Info">
        <Info size={14} strokeWidth={1.75} />
      </button>
      <span className="performance-tooltip" role="tooltip">
        {text}
      </span>
    </span>
  );
}

function PerformanceMetric({
  title,
  value,
  tooltip,
  details,
}: {
  title: string;
  value: string;
  tooltip: string;
  details: ReactNode;
}) {
  return (
    <div className="performance-metric">
      <div className="performance-metric-head">
        <span>{title}</span>
        <PerformanceInfoTooltip text={tooltip} />
      </div>
      <strong className="performance-metric-value">{value}</strong>
      <div className="performance-metric-details">{details}</div>
    </div>
  );
}

export function PerformancePage() {
  const { state } = usePA();
  const language = state.settings.language;
  const t = (text: string) => translateText(text, language);
  const [accountId, setAccountId] = useState("all");
  const [period, setPeriod] = useState<Period>("365d");
  const [chartMetric, setChartMetric] = useState<ChartMetric>("netProfit");
  const updatedAt = useMemo(() => formatUpdateTime(new Date(), language), [language]);

  const accountOptions = useMemo(
    () => [
      { value: "all", label: "All accounts" },
      ...state.accounts.map((account) => ({
        value: account.id,
        label: getAccountName(state.accounts, account.id),
      })),
    ],
    [state.accounts],
  );

  const stats = useMemo(() => {
    const start = periodStart(period);
    const scoped = state.orders.filter(
      (order) => (accountId === "all" || order.accountId === accountId) && inPeriod(order, start),
    );
    const closed = scoped.filter((order) => order.status === "Closed");
    const open = state.orders.filter(
      (order) =>
        order.status === "Open" &&
        (accountId === "all" || order.accountId === accountId) &&
        inPeriod(order, start),
    );

    const profit = closed.filter((order) => order.pnl > 0).reduce((total, order) => total + order.pnl, 0);
    const loss = closed.filter((order) => order.pnl < 0).reduce((total, order) => total + Math.abs(order.pnl), 0);
    const unrealized = open.reduce((total, order) => total + order.pnl, 0);
    const netProfit = profit - loss;
    const volume = closed.reduce((total, order) => total + order.volume * order.openPrice, 0);
    const lifetimeVolume = state.orders
      .filter((order) => accountId === "all" || order.accountId === accountId)
      .reduce((total, order) => total + order.volume * order.openPrice, 0);
    const profitable = closed.filter((order) => order.pnl > 0).length;
    const nonProfitable = closed.filter((order) => order.pnl <= 0).length;

    const selectedAccounts =
      accountId === "all" ? state.accounts : state.accounts.filter((account) => account.id === accountId);
    const currentEquity = selectedAccounts.reduce((total, account) => total + account.equity, 0);

    return {
      netProfit,
      profit,
      loss,
      unrealized,
      closedCount: closed.length,
      profitable,
      nonProfitable,
      volume,
      lifetimeVolume,
      currentEquity,
      closed,
    };
  }, [accountId, period, state.accounts, state.orders]);

  const labels = monthLabels();
  const yTicks = [4, 3, 2, 1, 0];

  return (
    <div className="page performance-page">
      <section className="performance-section">
        <h2 className="performance-section-title">{t("Summary")}</h2>
        <div className="performance-filters">
          <PerformanceSelect
            label={t("Account")}
            value={accountId}
            options={accountOptions.map((option) => ({
              ...option,
              label: option.value === "all" ? t(option.label) : option.label,
            }))}
            onChange={setAccountId}
          />
          <PerformanceSelect
            value={period}
            duplicateValue
            options={periodOptions.map((option) => ({ ...option, label: t(option.label) }))}
            onChange={(value) => setPeriod(value as Period)}
          />
        </div>
        <div className="performance-metrics">
          <PerformanceMetric
            title={t("Net profit")}
            value={formatUsd(stats.netProfit)}
            tooltip={`${t("Profit after losses in the selected time period. Update time:")} ${updatedAt}`}
            details={
              <>
                <span>{t("Profit")} {formatUsdShort(stats.profit)}</span>
                <span>{t("Loss")} {formatUsdShort(stats.loss)}</span>
                <span>
                  {t("Unrealized P/L")} {formatUsdShort(stats.unrealized)}
                  <PerformanceInfoTooltip
                    text={`${t("Unrealized profit or loss from open orders in the selected time period. Update time:")} ${updatedAt}`}
                  />
                </span>
              </>
            }
          />
          <PerformanceMetric
            title={t("Closed orders")}
            value={String(stats.closedCount)}
            tooltip={`${t("Closed orders in the selected time period. Update time:")} ${updatedAt}`}
            details={
              <>
                <span>{t("Profitable")} {stats.profitable}</span>
                <span>{t("Non-profitable")} {stats.nonProfitable}</span>
              </>
            }
          />
          <PerformanceMetric
            title={t("Volume")}
            value={formatUsd(stats.volume)}
            tooltip={`${t("Total trading volume of traded assets in the selected time period. Update time:")} ${updatedAt}`}
            details={<span>{t("Lifetime")} {formatUsd(stats.lifetimeVolume)}</span>}
          />
          <PerformanceMetric
            title={t("Equity")}
            value={formatUsd(stats.currentEquity)}
            tooltip={`${t("Net value change in the selected time period. Update time:")} ${updatedAt}`}
            details={<span>{t("Current")} {formatUsd(stats.currentEquity)}</span>}
          />
        </div>
      </section>

      <section className="performance-section">
        <h2 className="performance-section-title">{t("Charts")}</h2>
        <div className="performance-tabs" role="tablist">
          {chartTabs.map((tab) => (
            <button
              key={tab.value}
              type="button"
              role="tab"
              aria-selected={chartMetric === tab.value}
              className={`performance-tab ${chartMetric === tab.value ? "is-active" : ""}`}
              onClick={() => setChartMetric(tab.value)}
            >
              {t(tab.label)}
            </button>
          ))}
        </div>
        <div className="performance-chart-panel">
          <div className="performance-chart">
            <div className="performance-chart-y">
              {yTicks.map((tick) => (
                <span key={tick}>{tick}</span>
              ))}
            </div>
            <div className="performance-chart-main">
              <div className="performance-chart-grid">
                {yTicks.map((tick) => (
                  <span key={tick} className="performance-chart-grid-line" />
                ))}
              </div>
              <div className="performance-chart-bands">
                {labels.map((label, index) => (
                  <span key={`${label}-${index}`} className={index % 2 === 0 ? "is-shaded" : ""} />
                ))}
              </div>
              <div className="performance-chart-x">
                {labels.map((label, index) => (
                  <span key={`${label}-${index}`}>{label}</span>
                ))}
              </div>
            </div>
          </div>
          {chartMetric === "netProfit" ? (
            <div className="performance-chart-legend">
              <span>
                <i className="is-profit" /> {t("Profit")}
              </span>
              <span>
                <i className="is-loss" /> {t("Loss")}
              </span>
            </div>
          ) : null}
        </div>
        <p className="performance-footnote">
          {t("Please note, only closed orders are included. Update time:")} {updatedAt}{" "}
          {t("To get real-time data, please go to the terminal.")}
        </p>
      </section>
    </div>
  );
}
