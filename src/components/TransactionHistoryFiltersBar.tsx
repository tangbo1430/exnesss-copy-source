import { useMemo, useRef, useState } from "react";
import { Calendar } from "lucide-react";
import { usePA } from "../state/paStore";
import { translateText } from "../i18n";
import { DateRangePicker } from "./DateRangePicker";
import { PillFilter } from "./PillFilter";
import { formatPickerDateNumeric } from "../utils/dateRange";
import type { Account } from "../types";
import { formatAccountFilterLabel } from "../utils/accountLabel";
import {
  transactionDatePresetLabels,
  transactionStatusFilterLabels,
  transactionTypeFilterLabels,
  type TransactionDatePreset,
  type TransactionHistoryFilters,
  type TransactionStatusFilter,
  type TransactionTypeFilter,
} from "../utils/transactionFilters";

function formatCustomRangeLabel(filters: TransactionHistoryFilters, endLabel: string, allTimeLabel: string) {
  const { start, end } = filters.customRange;
  if (!start) return allTimeLabel;
  const startLabel = formatPickerDateNumeric(start);
  if (!end) return `${startLabel} - ${endLabel}`;
  return `${startLabel} - ${formatPickerDateNumeric(end)}`;
}

export function TransactionHistoryFiltersBar({
  value,
  onChange,
  accounts,
}: {
  value: TransactionHistoryFilters;
  onChange: (value: TransactionHistoryFilters) => void;
  accounts: Account[];
}) {
  const { state } = usePA();
  const t = (text: string) => translateText(text, state.settings.language);
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const dateFilterRef = useRef<HTMLDivElement>(null);

  const dateLabel = useMemo(() => {
    if (value.datePreset === "custom") {
      return formatCustomRangeLabel(value, t("End"), t("Custom time"));
    }
    return t(transactionDatePresetLabels[value.datePreset]);
  }, [value, t]);

  const dateOptions = useMemo(
    () =>
      (Object.keys(transactionDatePresetLabels) as TransactionDatePreset[]).map((preset) => ({
        value: preset,
        label: t(transactionDatePresetLabels[preset]),
        trailingIcon: preset === "custom" ? ("chevron-right" as const) : undefined,
      })),
    [t],
  );

  const typeOptions = useMemo(
    () =>
      (Object.keys(transactionTypeFilterLabels) as TransactionTypeFilter[]).map((type) => ({
        value: type,
        label: t(transactionTypeFilterLabels[type]),
      })),
    [t],
  );

  const statusOptions = useMemo(
    () =>
      (Object.keys(transactionStatusFilterLabels) as TransactionStatusFilter[]).map((status) => ({
        value: status,
        label: t(transactionStatusFilterLabels[status]),
      })),
    [t],
  );

  const accountOptions = useMemo(
    () => [
      { value: "all", label: t("All accounts") },
      ...accounts
        .filter((account) => account.status === "Active")
        .map((account) => ({
          value: account.id,
          label: formatAccountFilterLabel(account),
        })),
    ],
    [accounts, t],
  );

  function handleDateOptionClick(preset: TransactionDatePreset) {
    if (preset === "custom") {
      onChange({ ...value, datePreset: "custom" });
      setShowCustomPicker(true);
      return;
    }
    setShowCustomPicker(false);
    onChange({ ...value, datePreset: preset, customRange: { start: null, end: null } });
  }

  return (
    <div className="transaction-history-filters" data-no-i18n>
      <div className="transaction-history-date-filter" ref={dateFilterRef}>
        <PillFilter
          label={dateLabel}
          value={value.datePreset}
          options={dateOptions}
          onChange={handleDateOptionClick}
          active
          startIcon={<Calendar size={16} />}
          onOptionClick={handleDateOptionClick}
        />
        {value.datePreset === "custom" ? (
          <DateRangePicker
            hideTrigger
            open={showCustomPicker}
            anchorEl={dateFilterRef.current}
            onClose={() => setShowCustomPicker(false)}
            anchorOrigin={{ vertical: "top", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "left" }}
            value={value.customRange}
            onChange={(customRange) => onChange({ ...value, datePreset: "custom", customRange })}
          />
        ) : null}
      </div>

      <PillFilter
        label={t(transactionTypeFilterLabels[value.type])}
        value={value.type}
        options={typeOptions}
        onChange={(type) => onChange({ ...value, type })}
      />

      <PillFilter
        label={t(transactionStatusFilterLabels[value.status])}
        value={value.status}
        options={statusOptions}
        onChange={(status) => onChange({ ...value, status })}
      />

      <PillFilter
        label={
          value.accountId === "all"
            ? t("All accounts")
            : accountOptions.find((option) => option.value === value.accountId)?.label ?? t("All accounts")
        }
        value={value.accountId}
        options={accountOptions}
        onChange={(accountId) => onChange({ ...value, accountId })}
      />
    </div>
  );
}
