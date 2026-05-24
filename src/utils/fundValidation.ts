import type { PaymentMethod } from "../types";

/** 出金/入金金额校验；通过返回 null，否则返回错误文案。 */
export function validateFundAmount(
  flow: "deposit" | "withdrawal",
  amount: number,
  availableBalance: number,
  method?: PaymentMethod,
): string | null {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "请输入有效金额";
  }
  if (method) {
    if (amount < method.min) {
      return `金额不能低于 ${method.min}`;
    }
    if (amount > method.max) {
      return `金额不能高于 ${method.max}`;
    }
  }
  return null;
}

export function clampWithdrawAmount(amount: number, availableBalance: number, method?: PaymentMethod): number {
  if (!Number.isFinite(amount) || amount < 0) {
    return 0;
  }
  let max = Math.max(0, availableBalance);
  if (method) {
    max = Math.min(max, method.max);
  }
  return Math.min(amount, max);
}
