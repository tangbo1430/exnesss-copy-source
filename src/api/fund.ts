import type { Account, PaymentMethod, Transaction } from "../types";
import { apiRequest } from "./client";

type ListResponse<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
};

export function fetchAccounts() {
  return apiRequest<Account[]>("/user/accounts");
}

export function fetchPaymentMethods(flow: "deposit" | "withdrawal") {
  return apiRequest<PaymentMethod[]>(`/fund/payment-methods?flow=${flow}`);
}

export function fetchTransactions(page = 1, pageSize = 50) {
  return apiRequest<ListResponse<Transaction>>(`/fund/transactions?page=${page}&pageSize=${pageSize}`);
}

export function createDeposit(body: {
  accountId: string;
  methodId: string;
  amount: number;
  currency?: string;
  voucherImage?: string;
}) {
  return apiRequest<Transaction>("/fund/deposit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function createWithdraw(body: {
  accountId: string;
  methodId: string;
  amount: number;
  currency?: string;
  voucherImage?: string;
}) {
  return apiRequest<Transaction>("/fund/withdraw", {
    method: "POST",
    body: JSON.stringify(body),
  });
}
