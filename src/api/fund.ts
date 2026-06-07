import type { Account, PaymentMethod, Transaction } from "../types";
import { apiRequest } from "./client";

type ListResponse<T> = {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
};

export type DepositOrderResponse = Transaction & {
  payAddress?: string;
  qrContent?: string;
  orderId?: number;
  expiresAt?: string;
  paidAmount?: number;
  txId?: string;
};

export type WithdrawOrderResponse = Transaction & {
  orderId?: number;
  toAddress?: string;
  txId?: string;
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

export type DepositChannel = "udun" | "manual";

export function createDeposit(body: {
  accountId: string;
  methodId: string;
  amount?: number;
  currency?: string;
  channel?: DepositChannel;
  voucherImage?: string;
}) {
  return apiRequest<DepositOrderResponse>("/fund/deposit", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function getDeposit(orderId: number | string) {
  return apiRequest<DepositOrderResponse>(`/fund/deposit/${orderId}`);
}

export function createWithdraw(body: {
  accountId: string;
  methodId: string;
  amount: number;
  currency?: string;
  toAddress: string;
}) {
  return apiRequest<WithdrawOrderResponse>("/fund/withdraw", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

/** 为 Demo 账户设置余额（非充提流程） */
export function setDemoAccountBalance(body: {
  accountId: string;
  amount: number;
  currency?: string;
}) {
  return apiRequest<Account>(`/user/accounts/${body.accountId}/demo-balance`, {
    method: "PUT",
    body: JSON.stringify({
      amount: body.amount,
      currency: body.currency ?? "USD",
    }),
  });
}
