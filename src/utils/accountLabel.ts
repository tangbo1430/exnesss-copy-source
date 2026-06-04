import type { Account } from "../types";

export function accountTypeLabel(account: Account): string {
  if (account.type === "Standard") return "Standard account";
  return account.type;
}

/** Card / title: custom nickname, else localized account type label. */
export function accountDisplayName(account: Account): string {
  const name = account.nickname?.trim();
  if (name) return name;
  return accountTypeLabel(account);
}

/** Select / table / dialog: prefer nickname with login; fallback platform + type. */
export function formatAccountOptionLabel(account: Account): string {
  const name = account.nickname?.trim();
  if (name) return `${name} #${account.login}`;
  return `${account.platform} ${account.type} #${account.login}`;
}

/** Filter dropdown: nickname + login, or login-only fallback. */
export function formatAccountFilterLabel(account: Account): string {
  const name = account.nickname?.trim();
  if (name) return `${name} #${account.login}`;
  return `#${account.login}`;
}

export function formatAccountLabelById(accounts: Account[], accountId: string): string {
  if (accountId === "all") return "All accounts";
  const account = accounts.find((item) => item.id === accountId);
  if (!account) return "Unknown account";
  return formatAccountOptionLabel(account);
}

/** Chart / compact contexts: nickname or login. */
export function formatAccountShortLabel(account: Account): string {
  const name = account.nickname?.trim();
  if (name) return name;
  return account.login;
}

/** Account card header suffix: "# 900000028 My Name". */
export function formatAccountCardIdLine(account: Account): string {
  return `# ${account.login} ${accountDisplayName(account)}`;
}

export function formatAccountReadyMessage(account: Account): string {
  return `${formatAccountOptionLabel(account)} is ready.`;
}
