import type { PaymentMethod } from "../types";

export const FUND_AMOUNT_DEFAULT_DEPOSIT = "50";

/** 规范化金额输入：最多两位小数，去掉多余前导 0 */
export function normalizeAmountInput(raw: string): string {
  let s = raw.replace(/[^\d.]/g, "");
  const dot = s.indexOf(".");
  if (dot >= 0) {
    const intPart = s.slice(0, dot);
    const dec = s.slice(dot + 1).replace(/\./g, "").slice(0, 2);
    s = `${intPart}.${dec}`;
  }
  if (s.startsWith(".")) {
    s = `0${s}`;
  }
  if (s.startsWith("0") && s.length > 1 && s[1] !== ".") {
    s = s.replace(/^0+/, "") || "0";
  }
  return s;
}

/** 从输入字符串解析金额（避免浮点误差，最多两位小数） */
export function parseFundAmount(text: string): number {
  const t = text.trim();
  if (!t || !/^\d+(\.\d{0,2})?$/.test(t)) {
    return NaN;
  }
  const [intPart, dec = ""] = t.split(".");
  const cents = Number(intPart) * 100 + Number((dec + "00").slice(0, 2));
  if (!Number.isFinite(cents)) {
    return NaN;
  }
  return cents / 100;
}

export function roundFundAmount(value: number): number {
  if (!Number.isFinite(value)) {
    return NaN;
  }
  return parseFundAmount(value.toFixed(2));
}

export function defaultAmountText(flow: "deposit" | "withdrawal"): string {
  return flow === "deposit" ? FUND_AMOUNT_DEFAULT_DEPOSIT : "";
}

/** 确认页展示与提交用同一套两位小数 */
export function formatFundAmountText(amount: number): string {
  if (!Number.isFinite(amount) || amount <= 0) {
    return "";
  }
  const rounded = roundFundAmount(amount);
  if (!Number.isFinite(rounded)) {
    return "";
  }
  return rounded.toFixed(2);
}

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
  if (flow === "withdrawal" && amount > availableBalance) {
    return "出金金额不能超过可用余额";
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
  const clamped = Math.min(amount, max);
  const rounded = roundFundAmount(clamped);
  return Number.isFinite(rounded) ? rounded : 0;
}
