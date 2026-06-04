import { useMemo, useState, type ReactNode } from "react";
import { Menu, MenuItem } from "@mui/material";
import { ChevronDown, Info } from "lucide-react";
import { translateText } from "../i18n";
import { usePA } from "../state/paStore";
import { formatAccountShortLabel } from "../utils/accountLabel";
import type { Account, Order } from "../types";

type Period = "7d" | "30d" | "90d" | "365d";
type ChartMetric = "netProfit" | "closedOrders" | "volume" | "equity";

const CHART_PLOT_HEIGHT_PX = 260;

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

function periodStart(period: Period) {
  const days = period === "7d" ? 7 : period === "30d" ? 30 : period === "90d" ? 90 : 365;
  const start = new Date();
  start.setUTCDate(start.getUTCDate() - days);
  start.setUTCHours(0, 0, 0, 0);
  return start;
}

function isClosedOrder(order: Order) {
  return order.status === "Closed" && Boolean(order.closedAt?.trim());
}

function inPeriod(order: Order, start: Date) {
  const stamp = order.closedAt ?? order.openedAt;
  const time = new Date(stamp).getTime();
  return Number.isFinite(time) && time >= start.getTime();
}

type MonthSeriesPoint = {
  key: string;
  label: string;
  inRange: boolean;
  profit: number;
  loss: number;
  closedCount: number;
  profitable: number;
  nonProfitable: number;
  volume: number;
  equity: number;
};

function monthRange(): { keys: string[]; labels: string[] } {
  const keys: string[] = [];
  const labels: string[] = [];
  const now = new Date();
  for (let index = 12; index >= 0; index -= 1) {
    const date = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - index, 1));
    keys.push(`${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`);
    labels.push(`${date.getUTCMonth() + 1}月`);
  }
  return { keys, labels };
}

function endOfMonthUtc(monthKey: string) {
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0, 23, 59, 59, 999));
}

function orderMonthKey(order: Order) {
  const stamp = (order.closedAt ?? order.openedAt)?.trim();
  if (!stamp) return null;
  if (stamp.length >= 7 && /^\d{4}-\d{2}/.test(stamp)) {
    return stamp.slice(0, 7);
  }
  const time = Date.parse(stamp);
  if (!Number.isFinite(time)) return null;
  const date = new Date(time);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}`;
}

function monthOverlapsPeriod(monthKey: string, start: Date) {
  return endOfMonthUtc(monthKey).getTime() >= start.getTime();
}

function chartAxisMax(values: number[]) {
  const max = Math.max(...values, 0);
  if (max <= 0) return 1;
  const magnitude = 10 ** Math.floor(Math.log10(max));
  const normalized = max / magnitude;
  const nice =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 2.5 ? 2.5 : normalized <= 5 ? 5 : 10;
  return nice * magnitude;
}

function buildYAxisTicks(maxValue: number, format: (value: number) => string) {
  const max = chartAxisMax([maxValue]);
  const step = max / 4;
  return [4, 3, 2, 1, 0].map((index) => format(step * index));
}

function buildRangedYAxisTicks(axisMin: number, axisMax: number, format: (value: number) => string) {
  const span = Math.max(axisMax - axisMin, 1);
  const step = span / 4;
  return [4, 3, 2, 1, 0].map((index) => format(axisMin + step * index));
}

function equityAxisRange(values: number[]) {
  const positive = values.filter((value) => value > 0);
  if (positive.length === 0) {
    return { axisMin: 0, axisMax: 1 };
  }
  const min = Math.min(...positive);
  const max = Math.max(...positive);
  const span = Math.max(max - min, max * 0.02, 1);
  const padding = span * 0.08;
  return {
    axisMin: Math.max(0, min - padding),
    axisMax: max + padding,
  };
}

function buildCountYAxisTicks(maxValue: number) {
  const max = Math.max(Math.ceil(chartAxisMax([maxValue])), 1);
  return [4, 3, 2, 1, 0].map((index) => String(Math.round((max * index) / 4)));
}

function formatAxisUsd(value: number) {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000) return `${Math.round(value / 1_000)}K`;
  return value % 1 === 0 ? String(Math.round(value)) : value.toFixed(1);
}

function formatAxisCount(value: number) {
  return String(Math.round(value));
}

function buildMonthSeries({
  orders,
  accounts,
  accountId,
  period,
}: {
  orders: Order[];
  accounts: Account[];
  accountId: string;
  period: Period;
}): MonthSeriesPoint[] {
  const { keys, labels } = monthRange();
  const start = periodStart(period);
  const scoped = orders.filter((order) => accountId === "all" || order.accountId === accountId);
  const closed = scoped.filter(isClosedOrder);
  const closedInPeriod = closed.filter((order) => inPeriod(order, start));
  const selectedAccounts =
    accountId === "all" ? accounts : accounts.filter((account) => account.id === accountId);
  const currentEquity = selectedAccounts.reduce((total, account) => total + account.equity, 0);
  const lifetimePnl = closed.reduce((total, order) => total + order.pnl, 0);
  const equityBaseline = currentEquity - lifetimePnl;

  return keys.map((key, index) => {
    const inRange = monthOverlapsPeriod(key, start);
    const monthOrders = closedInPeriod.filter((order) => orderMonthKey(order) === key);
    const profit = monthOrders.filter((order) => order.pnl > 0).reduce((total, order) => total + order.pnl, 0);
    const loss = monthOrders
      .filter((order) => order.pnl < 0)
      .reduce((total, order) => total + Math.abs(order.pnl), 0);
    const profitable = monthOrders.filter((order) => order.pnl > 0).length;
    const nonProfitable = monthOrders.filter((order) => order.pnl <= 0).length;
    const volume = monthOrders.reduce((total, order) => total + order.volume * order.openPrice, 0);
    const monthEnd = endOfMonthUtc(key);
    const pnlThroughMonth = closed
      .filter((order) => new Date(order.closedAt!).getTime() <= monthEnd.getTime())
      .reduce((total, order) => total + order.pnl, 0);

    return {
      key,
      label: labels[index],
      inRange,
      profit,
      loss,
      closedCount: monthOrders.length,
      profitable,
      nonProfitable,
      volume: inRange ? volume : 0,
      equity: equityBaseline + pnlThroughMonth,
    };
  });
}

function stackedSegmentHeightPx(value: number, axisMax: number) {
  if (value <= 0 || axisMax <= 0) return 0;
  return Math.max(0, Math.min(CHART_PLOT_HEIGHT_PX - 4, (value / axisMax) * CHART_PLOT_HEIGHT_PX));
}

function StackedBarColumn({
  bottomValue,
  topValue,
  axisMax,
}: {
  bottomValue: number;
  topValue: number;
  axisMax: number;
}) {
  const bottomHeight = stackedSegmentHeightPx(bottomValue, axisMax);
  const topHeight = stackedSegmentHeightPx(topValue, axisMax);
  if (bottomHeight <= 0 && topHeight <= 0) {
    return <div className="performance-chart-column" />;
  }
  return (
    <div className="performance-chart-column">
      <div className="performance-chart-bar-stack">
        {bottomHeight > 0 ? (
          <span
            className="is-loss"
            style={{
              height: `${bottomHeight}px`,
              borderRadius: topHeight > 0 ? 0 : "3px 3px 0 0",
            }}
          />
        ) : null}
        {topHeight > 0 ? <span className="is-profit" style={{ height: `${topHeight}px` }} /> : null}
      </div>
    </div>
  );
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
        label: formatAccountShortLabel(account),
      })),
    ],
    [state.accounts],
  );

  const stats = useMemo(() => {
    const start = periodStart(period);
    const scoped = state.orders.filter(
      (order) => (accountId === "all" || order.accountId === accountId) && inPeriod(order, start),
    );
    const closed = scoped.filter(isClosedOrder);
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

  const monthSeries = useMemo(
    () =>
      buildMonthSeries({
        orders: state.orders,
        accounts: state.accounts,
        accountId,
        period,
      }),
    [accountId, period, state.accounts, state.orders],
  );

  const labels = useMemo(() => monthSeries.map((point) => point.label), [monthSeries]);

  const chartScale = useMemo(() => {
    if (chartMetric === "netProfit") {
      const totals = monthSeries.map((point) => point.profit + point.loss);
      const maxValue = chartAxisMax(totals);
      return { maxValue, axisMin: 0, yTicks: buildYAxisTicks(maxValue, formatAxisUsd) };
    }

    if (chartMetric === "closedOrders") {
      const totals = monthSeries.map((point) => point.profitable + point.nonProfitable);
      const maxValue = Math.max(chartAxisMax(totals), 1);
      return { maxValue, axisMin: 0, yTicks: buildCountYAxisTicks(maxValue) };
    }

    if (chartMetric === "equity") {
      const { axisMin, axisMax } = equityAxisRange(
        monthSeries.filter((point) => point.inRange).map((point) => point.equity),
      );
      return {
        maxValue: axisMax,
        axisMin,
        yTicks: buildRangedYAxisTicks(axisMin, axisMax, formatAxisUsd),
      };
    }

    const maxValue = chartAxisMax(monthSeries.map((point) => point.volume));
    return { maxValue, axisMin: 0, yTicks: buildYAxisTicks(maxValue, formatAxisUsd) };
  }, [chartMetric, monthSeries]);

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
              {chartScale.yTicks.map((tick, index) => (
                <span key={`${tick}-${index}`}>{tick}</span>
              ))}
            </div>
            <div className="performance-chart-main">
              <div className="performance-chart-plot">
                <div className="performance-chart-grid">
                  {chartScale.yTicks.map((tick, index) => (
                    <span key={`${tick}-${index}`} className="performance-chart-grid-line" />
                  ))}
                </div>
                <div className="performance-chart-bands">
                  {labels.map((label, index) => (
                    <span key={`${label}-${index}`} className={index % 2 === 0 ? "is-shaded" : ""} />
                  ))}
                </div>
                <div className="performance-chart-bars" aria-hidden="true">
                {monthSeries.map((point) => {
                  const { maxValue, axisMin = 0 } = chartScale;

                  if (chartMetric === "netProfit") {
                    if (!point.inRange && point.profit <= 0 && point.loss <= 0) {
                      return <div key={point.key} className="performance-chart-column" />;
                    }
                    return (
                      <StackedBarColumn
                        key={point.key}
                        bottomValue={point.loss}
                        topValue={point.profit}
                        axisMax={maxValue}
                      />
                    );
                  }

                  if (chartMetric === "closedOrders") {
                    if (!point.inRange && point.profitable <= 0 && point.nonProfitable <= 0) {
                      return <div key={point.key} className="performance-chart-column" />;
                    }
                    return (
                      <StackedBarColumn
                        key={point.key}
                        bottomValue={point.nonProfitable}
                        topValue={point.profitable}
                        axisMax={maxValue}
                      />
                    );
                  }

                  const singleValue = chartMetric === "volume" ? point.volume : point.equity;
                  if (!point.inRange || singleValue <= 0) {
                    return <div key={point.key} className="performance-chart-column" />;
                  }
                  const singleHeight = stackedSegmentHeightPx(
                    chartMetric === "equity" ? singleValue - axisMin : singleValue,
                    chartMetric === "equity" ? maxValue - axisMin : maxValue,
                  );
                  return (
                    <div key={point.key} className="performance-chart-column">
                      <div className="performance-chart-bar-stack">
                        {singleHeight > 0 ? (
                          <span className="is-single" style={{ height: `${singleHeight}px` }} />
                        ) : null}
                      </div>
                    </div>
                  );
                })}
                </div>
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
          {chartMetric === "closedOrders" ? (
            <div className="performance-chart-legend">
              <span>
                <i className="is-profit" /> {t("Profitable")}
              </span>
              <span>
                <i className="is-loss" /> {t("Non-profitable")}
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
