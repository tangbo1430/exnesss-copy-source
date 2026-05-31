import { useMemo } from "react";
import { usePA } from "../state/paStore";
import { translateText } from "../i18n";
import { DateRangePicker } from "./DateRangePicker";
import { PillFilter } from "./PillFilter";
import type { DateRangeValue } from "../utils/dateRange";
import type { Account, OrderStatus } from "../types";

type StatusFilter = OrderStatus | "All";

const statusOptions: StatusFilter[] = ["Closed", "Open", "All"];

const statusLabels: Record<StatusFilter, string> = {
  Closed: "Closed orders",
  Open: "Open orders",
  All: "All",
};

export function OrdersHistoryFiltersBar({
  status,
  onStatusChange,
  accountId,
  onAccountIdChange,
  dateRange,
  onDateRangeChange,
  accounts,
}: {
  status: StatusFilter;
  onStatusChange: (status: StatusFilter) => void;
  accountId: string;
  onAccountIdChange: (accountId: string) => void;
  dateRange: DateRangeValue;
  onDateRangeChange: (value: DateRangeValue) => void;
  accounts: Account[];
}) {
  const { state } = usePA();
  const t = (text: string) => translateText(text, state.settings.language);

  const accountFilterOptions = useMemo(
    () => [
      { value: "all", label: t("All accounts") },
      ...accounts.map((account) => ({
        value: account.id,
        label: account.nickname ? `${account.nickname} #${account.login}` : `#${account.login}`,
      })),
    ],
    [accounts, t],
  );

  const accountLabel =
    accountId === "all"
      ? t("All accounts")
      : accountFilterOptions.find((option) => option.value === accountId)?.label ?? t("All accounts");

  return (
    <div className="orders-history-filters" data-no-i18n>
      <div className="orders-history-status-toggle" role="tablist" aria-label={t("History of orders")}>
        {statusOptions.map((option) => (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={status === option}
            className={status === option ? "is-active" : ""}
            onClick={() => onStatusChange(option)}
          >
            {t(statusLabels[option])}
          </button>
        ))}
      </div>

      <PillFilter
        label={accountLabel}
        value={accountId}
        options={accountFilterOptions}
        onChange={onAccountIdChange}
      />

      <DateRangePicker value={dateRange} onChange={onDateRangeChange} />
    </div>
  );
}
