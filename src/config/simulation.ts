import type { Account, AccountKind } from "../types";

/** KYC 已通过（status === 2）时 Real 账户才可入金/出金 */
export function kycAllowsRealFund(kycStatus: number): boolean {
  return kycStatus === 2;
}

/** Real 充提需 KYC 通过；Demo 使用「设置余额」不走充提 */
export function canFundAccount(kind: AccountKind, kycStatus: number): boolean {
  if (kind === "Demo") return false;
  return kycAllowsRealFund(kycStatus);
}

/** Demo 账户走设置余额流程（无充提步骤） */
export function isDemoFundFlow(kind: AccountKind): boolean {
  return kind === "Demo";
}

/** 默认选中第一个可充提 Real 账户 */
export function pickDefaultFundAccountId(accounts: Account[], kycStatus: number): string {
  const active = accounts.filter((account) => account.status === "Active");
  const fundable = active.filter((account) => canFundAccount(account.kind, kycStatus));
  return fundable[0]?.id ?? active.find((a) => a.kind === "Real")?.id ?? active[0]?.id ?? "";
}
