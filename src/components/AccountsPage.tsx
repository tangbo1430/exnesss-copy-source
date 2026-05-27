import { ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Button,
  IconButton,
  Menu,
  MenuItem,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import {
  ArrowDownCircle,
  ArrowDownToLine,
  ArrowLeftRight,
  ArrowUpCircle,
  ArrowUpToLine,
  CandlestickChart,
  ChevronDown,
  CircleHelp,
  Copy,
  LayoutGrid,
  List,
  MoreVertical,
  Pencil,
  Plus,
  Smartphone,
  Users,
} from "lucide-react";
import { usePA } from "../state/paStore";
import { AccountSortSelect, sortAccounts, type AccountSort } from "./AccountSortSelect";
import { kycAllowsRealFund } from "../config/simulation";
import type { Account, AccountKind, Route } from "../types";

type Toast = (message: string) => void;

type AccountDialog =
  | { name: "setBalance"; accountId: string }
  | { name: "refer" }
  | { name: "leverage"; accountId: string }
  | { name: "rename"; accountId: string }
  | { name: "accountInfo"; accountId: string };

type DialogOpener = (dialog: AccountDialog) => void;

type AccountsPageProps = {
  navigate: (route: Route) => void;
  openDialog: DialogOpener;
  toast: Toast;
  kycStatus: number;
  onRequireKycForRealFund: () => void;
  onTrade: (accountId: string) => void;
  onDeposit: (accountId: string) => void;
  onWithdraw: (accountId: string) => void;
  onTransfer: (accountId: string) => void;
};

function formatMoney(value: number, currency = "USD") {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function splitMoney(value: number, currency = "USD") {
  const formatted = formatMoney(value, currency);
  const dot = formatted.lastIndexOf(".");
  if (dot === -1) return { main: formatted, suffix: "" };
  return { main: formatted.slice(0, dot), suffix: formatted.slice(dot) };
}

async function copyToClipboard(value: string, toast: Toast) {
  try {
    await navigator.clipboard.writeText(value);
    toast("Copied to clipboard.");
  } catch {
    toast(value);
  }
}

function formatArchivedAt(value: string) {
  const date = new Date(value);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const hour = String(date.getHours()).padStart(2, "0");
  const minute = String(date.getMinutes()).padStart(2, "0");
  return `${day} ${month}月 ${year} ${hour}:${minute} (UTC+8)`;
}

function accountTypeLabel(account: Account) {
  if (account.type === "Standard") return "Standard account";
  return account.type;
}

function floatingPl(account: Account) {
  return Number((account.equity - account.balance).toFixed(2));
}

function PageShell({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="page accounts-page">
      <div className="page-head">
        <Typography variant="h1">{title}</Typography>
        {actions}
      </div>
      {children}
    </div>
  );
}

function AccountKindTag({ kind }: { kind: AccountKind }) {
  return <span className={`account-kind-tag ${kind === "Demo" ? "is-demo" : ""}`}>{kind}</span>;
}

function MetaTag({ children }: { children: ReactNode }) {
  return <span className="account-meta-tag">{children}</span>;
}

function CopyButton({ value, toast, label }: { value: string; toast: Toast; label: string }) {
  return (
    <button type="button" className="account-copy-btn" aria-label={label} onClick={() => void copyToClipboard(value, toast)}>
      <Copy size={14} />
    </button>
  );
}

function MetricsPanel({ account }: { account: Account }) {
  const left = [
    { label: "Actual leverage", value: account.leverage },
    { label: "Adjusted leverage", value: account.leverage },
    { label: "Floating profit/loss", value: formatMoney(floatingPl(account), account.currency) },
  ];
  const right = [
    { label: "Available margin", value: formatMoney(account.freeMargin, account.currency) },
    { label: "Equity", value: formatMoney(account.equity, account.currency) },
    { label: "Platform", value: account.platform },
  ];

  return (
    <div className="account-metrics">
      <div className="account-metrics-col">
        {left.map((row) => (
          <div key={row.label} className="account-metric-row">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
      <div className="account-metrics-col">
        {right.map((row) => (
          <div key={row.label} className="account-metric-row">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function AccountActions({
  account,
  kycStatus,
  onRequireKycForRealFund,
  openDialog,
  onTrade,
  onDeposit,
  onWithdraw,
  onTransfer,
  onMore,
}: {
  account: Account;
  kycStatus: number;
  onRequireKycForRealFund: () => void;
  openDialog: DialogOpener;
  onTrade: (accountId: string) => void;
  onDeposit: (accountId: string) => void;
  onWithdraw: (accountId: string) => void;
  onTransfer: (accountId: string) => void;
  onMore: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const realFundBlocked = account.kind === "Real" && !kycAllowsRealFund(kycStatus);

  function tryDeposit() {
    if (realFundBlocked) {
      onRequireKycForRealFund();
      return;
    }
    onDeposit(account.id);
  }

  function tryWithdraw() {
    if (realFundBlocked) {
      onRequireKycForRealFund();
      return;
    }
    onWithdraw(account.id);
  }

  return (
    <div className="account-actions">
      <button type="button" className="account-action is-primary" onClick={() => onTrade(account.id)}>
        <CandlestickChart size={16} />
        Trade
      </button>
      {account.kind === "Demo" ? (
        <button
          type="button"
          className="account-action"
          onClick={() => openDialog({ name: "setBalance", accountId: account.id })}
        >
          <ArrowDownCircle size={16} />
          Set balance
        </button>
      ) : (
        <>
          <button
            type="button"
            className="account-action"
            disabled={realFundBlocked}
            aria-disabled={realFundBlocked}
            onClick={tryDeposit}
          >
            <ArrowDownCircle size={16} />
            Deposit
          </button>
          <button
            type="button"
            className="account-action"
            disabled={realFundBlocked}
            aria-disabled={realFundBlocked}
            onClick={tryWithdraw}
          >
            <ArrowUpCircle size={16} />
            Withdraw
          </button>
          <button type="button" className="account-action" onClick={() => onTransfer(account.id)}>
            <ArrowLeftRight size={16} />
            Transfer
          </button>
        </>
      )}
      <button type="button" className="account-action is-icon" aria-label="Account actions" onClick={onMore}>
        <MoreVertical size={18} />
      </button>
    </div>
  );
}

function AccountCardList({
  account,
  expanded,
  onToggle,
  toast,
  kycStatus,
  onRequireKycForRealFund,
  openDialog,
  onTrade,
  onDeposit,
  onWithdraw,
  onTransfer,
  onMore,
}: {
  account: Account;
  expanded: boolean;
  onToggle: () => void;
  toast: Toast;
  kycStatus: number;
  onRequireKycForRealFund: () => void;
  openDialog: DialogOpener;
  onTrade: (accountId: string) => void;
  onDeposit: (accountId: string) => void;
  onWithdraw: (accountId: string) => void;
  onTransfer: (accountId: string) => void;
  onMore: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const money = splitMoney(account.balance, account.currency);

  return (
    <article className={`account-card-ex ${expanded ? "is-expanded" : "is-collapsed"}`}>
      <div className="account-card-ex-head">
        <div className="account-card-ex-tags">
          <AccountKindTag kind={account.kind} />
          <MetaTag>{account.platform}</MetaTag>
          <MetaTag>{account.type}</MetaTag>
          <span className="account-card-ex-id">
            # {account.login} {accountTypeLabel(account)}
          </span>
        </div>
        <button type="button" className="account-expand-btn" aria-label="Toggle account details" onClick={onToggle}>
          <ChevronDown size={18} className={expanded ? "is-open" : ""} />
        </button>
      </div>

      <div className="account-card-ex-main">
        <div className="account-balance-display">
          <span className="account-balance-main">{money.main}</span>
          <span className="account-balance-suffix">{money.suffix}</span>
        </div>
        <AccountActions
          account={account}
          kycStatus={kycStatus}
          onRequireKycForRealFund={onRequireKycForRealFund}
          openDialog={openDialog}
          onTrade={onTrade}
          onDeposit={onDeposit}
          onWithdraw={onWithdraw}
          onTransfer={onTransfer}
          onMore={onMore}
        />
      </div>

      {expanded && (
        <>
          <MetricsPanel account={account} />
          <div className="account-card-ex-footer">
            <div className="account-footer-item">
              <span>Server</span>
              <strong>{account.server}</strong>
              <CopyButton value={account.server} toast={toast} label="Copy server" />
            </div>
            <div className="account-footer-item">
              <span>MT5 login</span>
              <strong>{account.login}</strong>
              <CopyButton value={account.login} toast={toast} label="Copy login" />
            </div>
            <button
              type="button"
              className="account-footer-link"
              onClick={() => toast("Trading password updated.")}
            >
              <Pencil size={14} />
              Change trading password
            </button>
          </div>
        </>
      )}
    </article>
  );
}

function AccountCardGrid({
  account,
  onMore,
}: {
  account: Account;
  onMore: (event: React.MouseEvent<HTMLButtonElement>) => void;
}) {
  const rows = [
    { label: "Account number", value: `# ${account.login}` },
    { label: "Platform", value: account.platform },
    { label: "Account type", value: accountTypeLabel(account) },
    { label: "Server", value: account.server },
    { label: "Available margin", value: formatMoney(account.freeMargin, account.currency) },
    { label: "Actual leverage", value: account.leverage },
    { label: "Adjusted leverage", value: account.leverage },
  ];

  return (
    <article className="account-card-grid">
      <div className="account-card-grid-head">
        <div>
          <AccountKindTag kind={account.kind} />
          <strong>{accountTypeLabel(account)}</strong>
        </div>
        <button type="button" className="account-action is-icon" aria-label="Account actions" onClick={onMore}>
          <MoreVertical size={18} />
        </button>
      </div>
      <div className="account-card-grid-rows">
        {rows.map((row) => (
          <div key={row.label} className="account-grid-row">
            <span>{row.label}</span>
            <strong>{row.value}</strong>
          </div>
        ))}
      </div>
    </article>
  );
}

function ArchivedAccountCard({
  account,
  view,
  toast,
  onRestore,
}: {
  account: Account;
  view: "list" | "grid";
  toast: Toast;
  onRestore: () => void;
}) {
  const archivedText = account.archivedAt
    ? `Balance not visible · This account was automatically archived on ${formatArchivedAt(account.archivedAt)}`
    : "Balance not visible · This account was automatically archived.";

  if (view === "grid") {
    const rows = [
      { label: "Account number", value: `# ${account.login}` },
      { label: "Platform", value: account.platform },
      { label: "Account type", value: accountTypeLabel(account) },
      { label: "Server", value: account.server },
      { label: "Available margin", value: "—" },
      { label: "Actual leverage", value: account.leverage },
      { label: "Adjusted leverage", value: account.leverage },
    ];

    return (
      <article className="account-card-grid is-archived">
        <div className="account-card-grid-head">
          <div>
            <AccountKindTag kind={account.kind} />
            <strong>{account.type}</strong>
          </div>
        </div>
        <div className="account-card-grid-rows">
          {rows.map((row) => (
            <div key={row.label} className="account-grid-row">
              <span>{row.label}</span>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
        <div className="account-archived-footer">
          <p>{archivedText}</p>
          <div className="account-archived-actions">
            <button type="button" className="account-action" onClick={onRestore}>
              <ArrowUpToLine size={16} />
              Restore
            </button>
            <button type="button" className="account-action" onClick={() => toast("Statement ready.")}>
              <ArrowDownToLine size={16} />
              Manage statements
            </button>
          </div>
        </div>
      </article>
    );
  }

  return (
    <article className="account-card-archived">
      <div className="account-card-ex-head">
        <div className="account-card-ex-tags">
          <AccountKindTag kind={account.kind} />
          <MetaTag>{account.platform}</MetaTag>
          <MetaTag>{account.type}</MetaTag>
          <span className="account-card-ex-id">
            # {account.login} {account.type}
          </span>
        </div>
      </div>
      <p className="account-archived-status">{archivedText}</p>
      <div className="account-archived-actions">
        <button type="button" className="account-action" onClick={onRestore}>
          <ArrowUpToLine size={16} />
          Restore
        </button>
        <button type="button" className="account-action" onClick={() => toast("Statement ready.")}>
          <ArrowDownToLine size={16} />
          Manage statements
        </button>
      </div>
    </article>
  );
}

export function AccountsPage({
  navigate,
  openDialog,
  toast,
  kycStatus,
  onRequireKycForRealFund,
  onTrade,
  onDeposit,
  onWithdraw,
  onTransfer,
}: AccountsPageProps) {
  const { state, dispatch } = usePA();
  const [kind, setKind] = useState<AccountKind>("Real");
  const [sort, setSort] = useState<AccountSort>("newest");
  const [view, setView] = useState<"list" | "grid">("list");
  const [expandedMap, setExpandedMap] = useState<Record<string, boolean>>({});
  const [archivedOpen, setArchivedOpen] = useState(true);
  const [menuAccount, setMenuAccount] = useState<Account | null>(null);
  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  const activeAccounts = useMemo(
    () =>
      sortAccounts(
        state.accounts.filter((account) => account.status === "Active" && account.kind === kind),
        sort,
      ),
    [state.accounts, kind, sort],
  );

  const archivedAccounts = useMemo(
    () =>
      sortAccounts(
        state.accounts.filter((account) => account.status === "Archived" && account.kind === kind),
        sort,
      ),
    [state.accounts, kind, sort],
  );

  useEffect(() => {
    setExpandedMap((current) => {
      const next = { ...current };
      activeAccounts.forEach((account) => {
        if (next[account.id] === undefined) next[account.id] = true;
      });
      return next;
    });
  }, [activeAccounts]);

  useEffect(() => {
    if (!menuAnchor) return;
    function onPointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || menuAnchor?.contains(target)) return;
      setMenuAnchor(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [menuAnchor]);

  function toggleExpanded(accountId: string) {
    setExpandedMap((current) => ({ ...current, [accountId]: !current[accountId] }));
  }

  function openMenu(event: React.MouseEvent<HTMLButtonElement>, account: Account) {
    event.stopPropagation();
    setMenuAccount(account);
    setMenuAnchor(event.currentTarget);
  }

  function closeMenu() {
    setMenuAnchor(null);
  }

  function runMenu(action: () => void) {
    action();
    closeMenu();
  }

  return (
    <PageShell
      title="My accounts"
      actions={
        <Button
          className="accounts-open-btn"
          variant="outlined"
          color="inherit"
          startIcon={<Plus size={16} />}
          onClick={() => navigate("/pa/trading/open-account")}
        >
          Open account
        </Button>
      }
    >
      <div className="accounts-promo-row">
        <button type="button" className="accounts-promo-card" onClick={() => openDialog({ name: "refer" })}>
          <div>
            <strong>Become a partner</strong>
            <span>Invite friends and earn up to 40% profit share</span>
          </div>
          <Users size={40} strokeWidth={1.2} className="accounts-promo-icon" aria-hidden />
        </button>
        <button
          type="button"
          className="accounts-promo-card"
          onClick={() => toast("Exness mobile app download link copied.")}
        >
          <div>
            <strong>Download Exness mobile app</strong>
            <span>Trade anytime, anywhere</span>
          </div>
          <Smartphone size={40} strokeWidth={1.2} className="accounts-promo-icon" aria-hidden />
        </button>
      </div>

      <div className="accounts-toolbar">
        <ToggleButtonGroup
          exclusive
          value={kind}
          onChange={(_, value: AccountKind | null) => value && setKind(value)}
          className="accounts-kind-toggle"
        >
          <ToggleButton value="Real">Real</ToggleButton>
          <ToggleButton value="Demo">Demo</ToggleButton>
        </ToggleButtonGroup>
        <div className="accounts-toolbar-right">
          <AccountSortSelect value={sort} onChange={setSort} />
          <ToggleButtonGroup
            exclusive
            value={view}
            onChange={(_, value: "list" | "grid" | null) => value && setView(value)}
            className="accounts-view-toggle"
          >
            <ToggleButton value="list" aria-label="List view">
              <List size={16} />
            </ToggleButton>
            <ToggleButton value="grid" aria-label="Grid view">
              <LayoutGrid size={16} />
            </ToggleButton>
          </ToggleButtonGroup>
        </div>
      </div>

      {activeAccounts.length === 0 ? (
        <div className="accounts-empty">
          <Typography variant="h3">No {kind.toLowerCase()} accounts</Typography>
          <Typography color="text.secondary">Open an account to see it here.</Typography>
          <Button variant="contained" onClick={() => navigate("/pa/trading/open-account")}>
            Open account
          </Button>
        </div>
      ) : (
        <div className={`account-list-ex ${view === "grid" ? "is-grid" : "is-list"}`}>
          {activeAccounts.map((account) =>
            view === "list" ? (
              <AccountCardList
                key={account.id}
                account={account}
                expanded={expandedMap[account.id] ?? true}
                onToggle={() => toggleExpanded(account.id)}
                toast={toast}
                kycStatus={kycStatus}
                onRequireKycForRealFund={onRequireKycForRealFund}
                openDialog={openDialog}
                onTrade={onTrade}
                onDeposit={onDeposit}
                onWithdraw={onWithdraw}
                onTransfer={onTransfer}
                onMore={(event) => openMenu(event, account)}
              />
            ) : (
              <AccountCardGrid key={account.id} account={account} onMore={(event) => openMenu(event, account)} />
            ),
          )}
        </div>
      )}

      {archivedAccounts.length > 0 && (
        <section className="accounts-archived-section">
          <div className="accounts-archived-head">
            <div className="accounts-archived-title">
              <Typography variant="h2">Archived accounts</Typography>
              <CircleHelp size={16} className="accounts-info-icon" aria-hidden />
            </div>
            <button
              type="button"
              className="accounts-archived-toggle"
              onClick={() => setArchivedOpen((value) => !value)}
            >
              {archivedOpen ? "Hide accounts" : "Show accounts"}
              <ChevronDown size={16} className={archivedOpen ? "is-open" : ""} />
            </button>
          </div>
          {archivedOpen && (
            <div className={`account-list-ex ${view === "grid" ? "is-grid" : "is-list"}`}>
              {archivedAccounts.map((account) => (
                <ArchivedAccountCard
                  key={account.id}
                  account={account}
                  view={view}
                  toast={toast}
                  onRestore={() => {
                    dispatch({ type: "RESTORE_ACCOUNT", accountId: account.id });
                    toast("Account restored.");
                  }}
                />
              ))}
            </div>
          )}
        </section>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        slotProps={{ paper: { className: "account-actions-menu" } }}
      >
        <div ref={menuRef}>
          <MenuItem onClick={() => runMenu(() => menuAccount && openDialog({ name: "leverage", accountId: menuAccount.id }))}>
            Adjust leverage
          </MenuItem>
          <MenuItem onClick={() => runMenu(() => menuAccount && openDialog({ name: "rename", accountId: menuAccount.id }))}>
            Add or edit nickname
          </MenuItem>
          <MenuItem onClick={() => runMenu(() => menuAccount && openDialog({ name: "accountInfo", accountId: menuAccount.id }))}>
            Account information
          </MenuItem>
          <MenuItem onClick={() => runMenu(() => toast("Read-only mode enabled."))}>Set read-only mode</MenuItem>
          <MenuItem
            onClick={() =>
              runMenu(() => {
                toast("Statement ready.");
                navigate("/pa/trading/ordersHistory");
              })
            }
          >
            Manage statements
          </MenuItem>
          <MenuItem onClick={() => runMenu(() => toast("Trading password updated."))}>Change trading password</MenuItem>
          <MenuItem
            onClick={() =>
              runMenu(() => {
                if (menuAccount) {
                  dispatch({ type: "ARCHIVE_ACCOUNT", accountId: menuAccount.id });
                  toast("Account archived.");
                }
              })
            }
          >
            Archive
          </MenuItem>
        </div>
      </Menu>
    </PageShell>
  );
}
