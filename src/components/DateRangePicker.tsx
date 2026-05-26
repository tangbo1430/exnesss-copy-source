import { useMemo, useState, type MouseEvent } from "react";
import { Button, IconButton, Popover, Typography } from "@mui/material";
import { Calendar, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import { usePA } from "../state/paStore";
import { translateText } from "../i18n";
import {
  DateRangeValue,
  formatPickerDateNumeric,
  formatPickerDay,
  formatPickerMonthYear,
  getCalendarCells,
  isAfterDay,
  isBeforeDay,
  isSameDay,
  startOfDay,
} from "../utils/dateRange";

const weekdayLabels = ["S", "M", "T", "W", "T", "F", "S"];

function cloneRange(value: DateRangeValue): DateRangeValue {
  return {
    start: value.start ? new Date(value.start) : null,
    end: value.end ? new Date(value.end) : null,
  };
}

function formatRangeLabel(range: DateRangeValue, endLabel: string) {
  if (!range.start) return "All time";
  const startLabel = formatPickerDateNumeric(range.start);
  if (!range.end) return `${startLabel} - ${endLabel}`;
  return `${startLabel} - ${formatPickerDateNumeric(range.end)}`;
}

function formatDraftHeading(range: DateRangeValue, endLabel: string, allTimeLabel: string) {
  if (!range.start) return allTimeLabel;
  const startLabel = formatPickerDay(range.start);
  if (!range.end) return `${startLabel} – ${endLabel}`;
  return `${startLabel} – ${formatPickerDay(range.end)}`;
}

export function DateRangePicker({
  value,
  onChange,
}: {
  value: DateRangeValue;
  onChange: (value: DateRangeValue) => void;
}) {
  const { state } = usePA();
  const language = state.settings.language;
  const t = (text: string) => translateText(text, language);
  const endLabel = t("End");
  const allTimeLabel = t("All time");

  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const [draft, setDraft] = useState<DateRangeValue>(() => cloneRange(value));
  const [visibleMonth, setVisibleMonth] = useState(() => startOfDay(value.start ?? new Date()));
  const open = Boolean(anchor);
  const today = useMemo(() => startOfDay(new Date()), []);

  const cells = useMemo(
    () => getCalendarCells(visibleMonth.getFullYear(), visibleMonth.getMonth()),
    [visibleMonth],
  );

  function openPicker(event: MouseEvent<HTMLElement>) {
    setDraft(cloneRange(value));
    setVisibleMonth(startOfDay(value.start ?? new Date()));
    setAnchor(event.currentTarget);
  }

  function closePicker() {
    setAnchor(null);
  }

  function clearRange(event: MouseEvent) {
    event.preventDefault();
    event.stopPropagation();
    onChange({ start: null, end: null });
    setDraft({ start: null, end: null });
    closePicker();
  }

  function selectDay(date: Date) {
    if (isAfterDay(date, today)) return;

    setDraft((current) => {
      if (!current.start || (current.start && current.end)) {
        return { start: startOfDay(date), end: null };
      }

      if (isSameDay(date, current.start)) {
        return { start: startOfDay(date), end: null };
      }

      if (isBeforeDay(date, current.start)) {
        return { start: startOfDay(date), end: startOfDay(current.start) };
      }

      return { start: current.start, end: startOfDay(date) };
    });
  }

  function applyRange() {
    onChange(cloneRange(draft));
    closePicker();
  }

  function cancelRange() {
    setDraft(cloneRange(value));
    closePicker();
  }

  function shiftMonth(delta: number) {
    setVisibleMonth((current) => new Date(current.getFullYear(), current.getMonth() + delta, 1));
  }

  function dayClassName(date: Date, inMonth: boolean) {
    const classes = ["date-range-day"];
    if (!inMonth) classes.push("is-outside");
    if (isAfterDay(date, today)) classes.push("is-disabled");

    const { start, end } = draft;
    if (start && end) {
      const inRange = !isBeforeDay(date, start) && !isAfterDay(date, end);
      if (isSameDay(date, start) && isSameDay(date, end)) {
        classes.push("is-range-start", "is-range-end");
      } else if (inRange && isSameDay(date, start)) {
        classes.push("is-range-start");
      } else if (inRange && isSameDay(date, end)) {
        classes.push("is-range-end");
      } else if (inRange) {
        classes.push("is-in-range");
      }
    } else if (start && isSameDay(date, start)) {
      classes.push("is-range-start");
    }

    if (isSameDay(date, today)) classes.push("is-today");
    return classes.join(" ");
  }

  const triggerLabel = formatRangeLabel(value, endLabel);

  return (
    <>
      <Button
        className="date-range-trigger"
        variant="outlined"
        color="inherit"
        onClick={openPicker}
        startIcon={<Calendar size={16} />}
        endIcon={
          value.start ? (
            <span
              className="date-range-clear"
              role="button"
              tabIndex={0}
              aria-label={t("Clear date range")}
              onClick={clearRange}
              onMouseDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  clearRange(event as unknown as MouseEvent);
                }
              }}
            >
              <X size={16} />
            </span>
          ) : (
            <ChevronDown size={16} className={`chevron ${open ? "is-open" : ""}`} />
          )
        }
      >
        {triggerLabel}
      </Button>
      <Popover
        open={open}
        anchorEl={anchor}
        onClose={cancelRange}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
        slotProps={{ paper: { className: "date-range-popover" } }}
      >
        <div className="date-range-panel" data-no-i18n>
          <div className="date-range-header">
            <Typography className="date-range-caption" variant="body2" color="text.secondary">
              {t("Please select date range")}
            </Typography>
            <Typography className="date-range-heading" variant="h6">
              {formatDraftHeading(draft, endLabel, allTimeLabel)}
            </Typography>
          </div>

          <div className="date-range-month-bar">
            <button className="date-range-month-label" type="button">
              {formatPickerMonthYear(visibleMonth)}
              <ChevronDown size={14} />
            </button>
            <div className="date-range-month-actions">
              <IconButton size="small" aria-label="Previous month" onClick={() => shiftMonth(-1)}>
                <ChevronLeft size={16} />
              </IconButton>
              <IconButton size="small" aria-label="Next month" onClick={() => shiftMonth(1)}>
                <ChevronRight size={16} />
              </IconButton>
            </div>
          </div>

          <div className="date-range-weekdays">
            {weekdayLabels.map((label, index) => (
              <span key={`${label}-${index}`}>{label}</span>
            ))}
          </div>

          <div className="date-range-grid">
            {cells.map(({ date, inMonth }) => {
              const disabled = isAfterDay(date, today);
              return (
                <button
                  key={date.toISOString()}
                  type="button"
                  className={dayClassName(date, inMonth)}
                  disabled={disabled}
                  onClick={() => selectDay(date)}
                >
                  <span>{date.getDate()}</span>
                </button>
              );
            })}
          </div>

          <div className="date-range-actions">
            <Button className="date-range-cancel" variant="contained" color="inherit" onClick={cancelRange}>
              {t("Cancel")}
            </Button>
            <Button className="date-range-apply" variant="contained" onClick={applyRange}>
              {t("Apply")}
            </Button>
          </div>
        </div>
      </Popover>
    </>
  );
}

export function filterByDateRange<T extends { closedAt?: string; openedAt: string }>(
  items: T[],
  range: DateRangeValue,
) {
  if (!range.start) return items;

  const from = startOfDay(range.start).getTime();
  const to = range.end ? startOfDay(range.end).getTime() + 86400000 - 1 : Date.now();

  return items.filter((item) => {
    const raw = item.closedAt ?? item.openedAt;
    const time = new Date(raw).getTime();
    return time >= from && time <= to;
  });
}
