import type { AccountKind } from "../types";

/** Demo 模拟账户充提免 KYC；Real 需 KYC 通过 */
export function canFundAccount(kind: AccountKind, kycStatus: number): boolean {
  if (kind === "Demo") return true;
  return kycStatus === 2;
}

export function isDemoFundFlow(kind: AccountKind): boolean {
  return kind === "Demo";
}
