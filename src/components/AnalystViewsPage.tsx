import { useMemo, useState } from "react";
import { InputAdornment, TextField } from "@mui/material";
import { Search } from "lucide-react";
import {
  analystViewCategories,
  analystViews,
  type AnalystViewCategory,
  type AnalystViewItem,
  type PriceLevelColor,
} from "../data/analystViewsData";

type DialogOpener = (dialog: { name: "external"; title: string; body: string }) => void;

const levelColors: Record<PriceLevelColor, { line: string; fill: string; text: string }> = {
  red: { line: "#e53935", fill: "#e53935", text: "#fff" },
  blue: { line: "#1e88e5", fill: "#1e88e5", text: "#fff" },
  black: { line: "#424242", fill: "#424242", text: "#fff" },
  green: { line: "#43a047", fill: "#43a047", text: "#fff" },
};

function parsePrice(value: string) {
  return Number(value.replace(/,/g, ""));
}

function hashSeed(value: string) {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash << 5) - hash + value.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function AnalystViewChart({ item }: { item: AnalystViewItem }) {
  const width = 360;
  const height = 180;
  const padLeft = 8;
  const padRight = 58;
  const padTop = 28;
  const padBottom = 22;
  const chartWidth = width - padLeft - padRight;
  const chartHeight = height - padTop - padBottom;

  const prices = item.priceLevels.map((level) => parsePrice(level.price));
  const minPrice = Math.min(...prices) * 0.998;
  const maxPrice = Math.max(...prices) * 1.002;

  const yForPrice = (price: number) =>
    padTop + ((maxPrice - price) / (maxPrice - minPrice)) * chartHeight;

  const seed = hashSeed(item.id);
  const candles = Array.from({ length: 28 }, (_, index) => {
    const wave = Math.sin((index + (seed % 7)) * 0.55) * 0.35;
    const drift = item.direction === "up" ? index * 0.012 : -index * 0.012;
    const close =
      minPrice +
      (maxPrice - minPrice) * (0.35 + wave + drift + ((seed + index * 17) % 11) / 100);
    const open = close + (((seed + index * 3) % 5) - 2) * (maxPrice - minPrice) * 0.008;
    const high = Math.max(open, close) + (maxPrice - minPrice) * 0.015;
    const low = Math.min(open, close) - (maxPrice - minPrice) * 0.015;
    return { open, close, high, low };
  });

  const ma20 = candles.map((_, index) => {
    const slice = candles.slice(Math.max(0, index - 4), index + 1);
    return slice.reduce((sum, candle) => sum + candle.close, 0) / slice.length;
  });

  const ma50 = candles.map((_, index) => {
    const slice = candles.slice(Math.max(0, index - 9), index + 1);
    return slice.reduce((sum, candle) => sum + candle.close, 0) / slice.length;
  });

  const candleStep = chartWidth / candles.length;
  const arrowColor = item.direction === "up" ? "#2563eb" : "#43a047";
  const arrowStartX = padLeft + chartWidth * 0.55;
  const arrowEndX = padLeft + chartWidth * 0.82;
  const arrowStartY = yForPrice(parsePrice(item.pivotLevel));
  const arrowEndY = yForPrice(parsePrice(item.targetLevel));

  return (
    <svg className="analyst-view-chart" viewBox={`0 0 ${width} ${height}`} aria-hidden>
      <rect x="0" y="0" width={width} height={height} fill="#fff" />
      <text x={padLeft} y="14" fill="#666" fontSize="9">
        <tspan fill="#e53935">—</tspan> MA 20 + BB
        <tspan dx="10" fill="#1e88e5">—</tspan> MA 50
      </text>
      <text x={width - padRight} y="14" fill="#999" fontSize="8" textAnchor="end">
        Research © 2026 Trading Central
      </text>

      {item.priceLevels.map((level) => {
        const y = yForPrice(parsePrice(level.price));
        const colors = levelColors[level.color];
        const labelWidth = Math.max(36, level.price.length * 5.5 + 8);
        return (
          <g key={`${level.price}-${level.color}`}>
            <line
              x1={padLeft}
              y1={y}
              x2={width - padRight}
              y2={y}
              stroke={colors.line}
              strokeWidth="1"
              strokeDasharray={level.color === "blue" ? "4 3" : undefined}
            />
            <rect
              x={width - padRight + 2}
              y={y - 8}
              width={labelWidth}
              height="16"
              rx="2"
              fill={colors.fill}
            />
            <text
              x={width - padRight + 6}
              y={y + 3}
              fill={colors.text}
              fontSize="8"
              fontWeight="600"
            >
              {level.price}
            </text>
          </g>
        );
      })}

      {candles.map((candle, index) => {
        const x = padLeft + index * candleStep + candleStep * 0.25;
        const bodyTop = yForPrice(Math.max(candle.open, candle.close));
        const bodyBottom = yForPrice(Math.min(candle.open, candle.close));
        const bodyHeight = Math.max(bodyBottom - bodyTop, 1.5);
        const bullish = candle.close >= candle.open;
        const color = bullish ? "#26a69a" : "#ef5350";
        return (
          <g key={index}>
            <line
              x1={x + candleStep * 0.25}
              y1={yForPrice(candle.high)}
              x2={x + candleStep * 0.25}
              y2={yForPrice(candle.low)}
              stroke={color}
              strokeWidth="1"
            />
            <rect
              x={x}
              y={bodyTop}
              width={candleStep * 0.5}
              height={bodyHeight}
              fill={color}
            />
          </g>
        );
      })}

      <polyline
        fill="none"
        stroke="#e53935"
        strokeWidth="1.2"
        points={ma20
          .map(
            (value, index) =>
              `${padLeft + index * candleStep + candleStep * 0.5},${yForPrice(value)}`,
          )
          .join(" ")}
      />
      <polyline
        fill="none"
        stroke="#1e88e5"
        strokeWidth="1.2"
        points={ma50
          .map(
            (value, index) =>
              `${padLeft + index * candleStep + candleStep * 0.5},${yForPrice(value)}`,
          )
          .join(" ")}
      />

      <defs>
        <marker
          id={`arrow-${item.id}`}
          markerWidth="8"
          markerHeight="8"
          refX="6"
          refY="4"
          orient="auto"
        >
          <path d="M0,0 L8,4 L0,8 Z" fill={arrowColor} />
        </marker>
      </defs>
      <line
        x1={arrowStartX}
        y1={arrowStartY}
        x2={arrowEndX}
        y2={arrowEndY}
        stroke={arrowColor}
        strokeWidth="3"
        markerEnd={`url(#arrow-${item.id})`}
      />

      {(item.chartMonths ?? ["Jun 1"]).map((label, index, labels) => (
        <text
          key={label}
          x={padLeft + (chartWidth / Math.max(labels.length - 1, 1)) * index}
          y={height - 4}
          fill="#888"
          fontSize="9"
          textAnchor={index === 0 ? "start" : index === labels.length - 1 ? "end" : "middle"}
        >
          {label}
        </text>
      ))}
    </svg>
  );
}

function AnalystViewCard({ item, onTrade }: { item: AnalystViewItem; onTrade: () => void }) {
  const trendColor = item.direction === "up" ? "#e53935" : "#43a047";
  const arrow = item.direction === "up" ? "↑" : "↓";
  const movementText =
    item.category === "forex"
      ? `${arrow} ${item.expectedMovement}`
      : `${arrow} ${item.expectedMovement}`;

  return (
    <article className="analyst-view-card">
      <div className="analyst-view-card-head">
        <div className="analyst-view-card-title">
          <strong>{item.name}</strong>
          <span className="analyst-view-timeframe">{item.timeframe}</span>
        </div>
        <span className="analyst-view-utc">{item.utc8Time}</span>
      </div>
      <p className="analyst-view-cet">{item.cetTimestamp}</p>
      <AnalystViewChart item={item} />
      <dl className="analyst-view-metrics">
        <div className="analyst-view-metric">
          <dt>预期动向</dt>
          <dd style={{ color: trendColor }}>{movementText}</dd>
        </div>
        <div className="analyst-view-metric">
          <dt>目标位</dt>
          <dd style={{ color: trendColor }}>{item.targetLevel}</dd>
        </div>
        <div className="analyst-view-metric">
          <dt>转折位</dt>
          <dd style={{ color: "#1e88e5" }}>{item.pivotLevel}</dd>
        </div>
      </dl>
      <button className="analyst-view-trade" type="button" onClick={onTrade}>
        交易
      </button>
    </article>
  );
}

function TradingCentralDisclaimer() {
  return (
    <div className="analyst-view-disclaimer">
      <p>
        © 2026 Trading Central公司。所有权利保留。 包含的信息：(1)是Trading Central和/或其内容供应商的财产；(2)不得被复制或分发；(3)没有被保证是准确的、完整的或及时的；和(4)不构成Exness、Trading Central或其内容供应商对金融工具投资的建议或推荐。Exness、Trading Central或其内容供应商都不对出自使用本信息造成的任何损害或损失承担责任。过去的业绩不能保证将来的结果。
      </p>
      <p>定价、历史图表数据和基本公司数据由晨星研究公司提供。</p>
      <p>Technical Event®为Trading Central的注册商标。</p>
      <p>
        Trading Central 产品和服务受到美国专利号 6,801,201; 7,469,226; 7,469,238; 7,835,966 和 7,853,506 以及相应外国专利的保护。
      </p>
    </div>
  );
}

export function AnalystViewsSearch({
  query,
  onChange,
}: {
  query: string;
  onChange: (value: string) => void;
}) {
  return (
    <TextField
      className="analyst-views-search"
      size="small"
      placeholder="输入代码或名称"
      value={query}
      onChange={(event) => onChange(event.target.value)}
      slotProps={{
        input: {
          startAdornment: (
            <InputAdornment position="start">
              <Search size={16} />
            </InputAdornment>
          ),
        },
      }}
    />
  );
}

export function AnalystViewsPage({
  query,
  openDialog,
}: {
  query: string;
  openDialog: DialogOpener;
}) {
  const [category, setCategory] = useState<AnalystViewCategory>("forex");

  const rows = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return analystViews.filter((item) => {
      if (item.category !== category) return false;
      if (!normalized) return true;
      return item.name.toLowerCase().includes(normalized);
    });
  }, [category, query]);

  return (
    <div className="analyst-views-page" data-no-i18n>
      <div className="analyst-views-tabs">
        {analystViewCategories.map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`analyst-views-tab ${category === tab.id ? "is-active" : ""}`}
            onClick={() => setCategory(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div className="analyst-views-grid">
        {rows.map((item) => (
          <AnalystViewCard
            key={item.id}
            item={item}
            onTrade={() =>
              openDialog({
                name: "external",
                title: "交易",
                body: `Exness Terminal would open ${item.name}.`,
              })
            }
          />
        ))}
      </div>
      <TradingCentralDisclaimer />
    </div>
  );
}

export function AnalystViewsRoute({ openDialog }: { openDialog: DialogOpener }) {
  const [query, setQuery] = useState("");

  return (
    <div className="analyst-views-route">
      <div className="analyst-views-route-head">
        <h1 className="analyst-views-title">分析观点</h1>
        <AnalystViewsSearch query={query} onChange={setQuery} />
      </div>
      <AnalystViewsPage query={query} openDialog={openDialog} />
    </div>
  );
}
