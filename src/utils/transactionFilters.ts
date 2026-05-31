import type { DateRangeValue } from "./dateRange";
import { startOfDay } from "./dateRange";
import type { Transaction, TransactionStatus } from "../types";

export type TransactionDatePreset = "3d" | "7d" | "30d" | "3m" | "custom";

export type TransactionTypeFilter =
  | "all"
  | "deposit"
  | "withdrawal"
  | "transfer"
  | "refund"
  | "reward"
  | "invite_reward"
  | "rebate"
  | "investment"
  | "profit_commission"
  | "agent_commission";

export type TransactionStatusFilter = "all" | TransactionStatus;

export interface TransactionHistoryFilters {
  datePreset: TransactionDatePreset;
  customRange: DateRangeValue;
  type: TransactionTypeFilter;
  status: TransactionStatusFilter;
  accountId: string;
}

export const defaultTransactionHistoryFilters: TransactionHistoryFilters = {
  datePreset: "7d",
  customRange: { start: null, end: null },
  type: "all",
  status: "all",
  accountId: "all",
};

function presetToFromDate(preset: Exclude<TransactionDatePreset, "custom">) {
  const now = new Date();
  const from = new Date(now);
  if (preset === "3m") {
    from.setMonth(from.getMonth() - 3);
  } else {
    const days = preset === "3d" ? 3 : preset === "7d" ? 7 : 30;
    from.setDate(from.getDate() - days);
  }
  return startOfDay(from).getTime();
}

export function filterTransactions(transactions: Transaction[], filters: TransactionHistoryFilters) {
  return transactions.filter((item) => {
    const createdAt = new Date(item.createdAt).getTime();

    if (filters.datePreset === "custom") {
      if (filters.customRange.start) {
        const from = startOfDay(filters.customRange.start).getTime();
        const to = filters.customRange.end
          ? startOfDay(filters.customRange.end).getTime() + 86400000 - 1
          : Date.now();
        if (createdAt < from || createdAt > to) return false;
      }
    } else if (createdAt < presetToFromDate(filters.datePreset)) {
      return false;
    }

    if (filters.type !== "all" && item.type !== filters.type) return false;
    if (filters.status !== "all" && item.status !== filters.status) return false;
    if (filters.accountId !== "all" && item.accountId !== filters.accountId) return false;

    return true;
  });
}

export const transactionDatePresetLabels: Record<TransactionDatePreset, string> = {
  "3d": "Past 3 days",
  "7d": "Past 7 days",
  "30d": "Past 30 days",
  "3m": "Past 3 months",
  custom: "Custom time",
};

export const transactionTypeFilterLabels: Record<TransactionTypeFilter, string> = {
  all: "All transaction types",
  deposit: "Deposit",
  withdrawal: "Withdrawal",
  transfer: "Transfer",
  refund: "Refund",
  reward: "Reward",
  invite_reward: "Invite friend reward",
  rebate: "Commission rebate",
  investment: "Investment funds",
  profit_commission: "Profit commission",
  agent_commission: "Agent commission",
};

export const transactionStatusFilterLabels: Record<TransactionStatusFilter, string> = {
  all: "All statuses",
  Pending: "Processing",
  Completed: "Completed",
  Rejected: "Rejected",
};
