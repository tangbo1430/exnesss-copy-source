import type { Account, AccountKind } from "../types";

/** Demo 模拟账户充提免 KYC；Real 需 KYC 通过 */
export function canFundAccount(kind: AccountKind, kycStatus: number): boolean {
  if (kind === "Demo") return true;
  return kycStatus === 2;
}

export function isDemoFundFlow(kind: AccountKind): boolean {
  return kind === "Demo";
}

/** 默认选中第一个可充提账户（未 KYC 时通常为 Demo） */
export function pickDefaultFundAccountId(accounts: Account[], kycStatus: number): string {
  const active = accounts.filter((account) => account.status === "Active");
  const fundable = active.filter((account) => canFundAccount(account.kind, kycStatus));
  return fundable[0]?.id ?? active[0]?.id ?? "";
}
