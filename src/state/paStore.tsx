import { createContext, ReactNode, useContext, useEffect, useMemo, useReducer } from "react";
import { initialState } from "../data/mockData";
import { readStoredLanguage, writeStoredLanguage } from "../i18n";
import type {
  Account,
  PAState,
  Ticket,
  Transaction,
  UserProfile,
  VerificationStep,
  WalletItem,
} from "../types";
import { verification as verificationTemplate } from "../data/mockData";
import { mapVerificationFromKyc } from "../utils/kycSync";

type Action =
  | { type: "SET_USER_PROFILE"; profile: UserProfile }
  | { type: "SET_ACCOUNTS"; accounts: Account[] }
  | { type: "SET_TRANSACTIONS"; transactions: Transaction[] }
  | { type: "ADD_ACCOUNT"; payload: Omit<Account, "id" | "login" | "createdAt" | "status"> }
  | { type: "RENAME_ACCOUNT"; accountId: string; nickname: string }
  | { type: "CHANGE_LEVERAGE"; accountId: string; leverage: string }
  | { type: "SET_DEMO_BALANCE"; accountId: string; amount: number }
  | { type: "ARCHIVE_ACCOUNT"; accountId: string }
  | { type: "ADD_TRANSACTION"; payload: Omit<Transaction, "id" | "createdAt" | "reference" | "status"> }
  | { type: "ADD_TICKET"; payload: Omit<Ticket, "id" | "createdAt" | "updatedAt" | "status" | "priority"> }
  | { type: "ADD_WALLET"; payload: Omit<WalletItem, "id" | "address" | "balance" | "status"> }
  | { type: "MARK_NOTIFICATION_READ"; id: string }
  | { type: "MARK_ALL_NOTIFICATIONS_READ" }
  | { type: "CLEAR_NOTIFICATIONS" }
  | { type: "COMPLETE_VERIFICATION"; stepId: string; values: Record<string, string> }
  | { type: "SET_LANGUAGE"; language: string }
  | { type: "SET_MT5_TERMINAL"; terminal: PAState["settings"]["mt5Terminal"] }
  | { type: "SET_MT4_TERMINAL"; terminal: PAState["settings"]["mt4Terminal"] }
  | { type: "TOGGLE_TWO_FACTOR"; enabled: boolean }
  | { type: "LOG_OUT_OTHER_SESSIONS" }
  | { type: "DISMISS_INSTALL_TOAST" };

interface PAContextValue {
  state: PAState;
  dispatch: React.Dispatch<Action>;
  totalBalance: number;
  unreadNotifications: number;
  verificationComplete: boolean;
}

const PAContext = createContext<PAContextValue | null>(null);

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 8)}${Date.now().toString(36).slice(-4)}`;
}

function nextLogin(accounts: Account[]) {
  const max = accounts.reduce((value, account) => Math.max(value, Number(account.login) || 0), 419105454);
  return String(max + Math.floor(Math.random() * 8000) + 1000);
}

function addBalance(account: Account, delta: number): Account {
  const balance = Math.max(0, Number((account.balance + delta).toFixed(2)));
  const equity = Math.max(0, Number((account.equity + delta).toFixed(2)));
  const freeMargin = Math.max(0, Number((account.freeMargin + delta).toFixed(2)));
  return { ...account, balance, equity, freeMargin };
}

function completeStep(step: VerificationStep): VerificationStep {
  return {
    ...step,
    status: "Completed",
    completedAt: new Date().toISOString(),
  };
}

function reducer(state: PAState, action: Action): PAState {
  switch (action.type) {
    case "SET_USER_PROFILE":
      return {
        ...state,
        userProfile: action.profile,
        verification: mapVerificationFromKyc(
          action.profile.kycStatus,
          action.profile.kycRejectReason,
          state.verification,
          state.settings.language,
        ),
      };
    case "SET_ACCOUNTS":
      return { ...state, accounts: action.accounts };
    case "SET_TRANSACTIONS":
      return { ...state, transactions: action.transactions };
    case "ADD_ACCOUNT": {
      const login = nextLogin(state.accounts);
      const account: Account = {
        ...action.payload,
        id: uid("acc"),
        login,
        status: "Active",
        createdAt: new Date().toISOString(),
      };
      return {
        ...state,
        accounts: [account, ...state.accounts],
        notifications: [
          {
            id: uid("nt"),
            title: "Trading account created",
            body: `${account.platform} ${account.type} #${account.login} is ready.`,
            type: "platform",
            read: false,
            createdAt: new Date().toISOString(),
            action: "/pa/trading/accounts",
          },
          ...state.notifications,
        ],
      };
    }
    case "RENAME_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((account) =>
          account.id === action.accountId ? { ...account, nickname: action.nickname || account.nickname } : account,
        ),
      };
    case "CHANGE_LEVERAGE":
      return {
        ...state,
        accounts: state.accounts.map((account) =>
          account.id === action.accountId ? { ...account, leverage: action.leverage } : account,
        ),
      };
    case "SET_DEMO_BALANCE": {
      const amount = Math.max(0, Number(action.amount.toFixed(2)));
      return {
        ...state,
        accounts: state.accounts.map((account) =>
          account.id === action.accountId
            ? { ...account, balance: amount, equity: amount, freeMargin: amount, margin: 0 }
            : account,
        ),
      };
    }
    case "ARCHIVE_ACCOUNT":
      return {
        ...state,
        accounts: state.accounts.map((account) =>
          account.id === action.accountId ? { ...account, status: "Archived" } : account,
        ),
      };
    case "ADD_TRANSACTION": {
      const createdAt = new Date().toISOString();
      const transaction: Transaction = {
        ...action.payload,
        id: uid("tr"),
        status: "Completed",
        createdAt,
        completedAt: createdAt,
        reference: `${action.payload.type.slice(0, 2).toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
      };
      const accounts = state.accounts.map((account) => {
        if (transaction.type === "deposit" && account.id === transaction.accountId) {
          return addBalance(account, transaction.amount);
        }
        if (transaction.type === "withdrawal" && account.id === transaction.accountId) {
          return addBalance(account, -transaction.amount);
        }
        if (transaction.type === "transfer") {
          if (account.id === transaction.accountId) return addBalance(account, -transaction.amount);
          if (account.id === transaction.targetAccountId) return addBalance(account, transaction.amount);
        }
        return account;
      });
      return {
        ...state,
        accounts,
        transactions: [transaction, ...state.transactions],
        notifications: [
          {
            id: uid("nt"),
            title: `${transaction.type[0].toUpperCase()}${transaction.type.slice(1)} completed`,
            body: `${transaction.amount.toFixed(2)} ${transaction.currency} has been recorded locally.`,
            type: "payment",
            read: false,
            createdAt,
            action: "/pa/payments-and-wallet/history",
          },
          ...state.notifications,
        ],
      };
    }
    case "ADD_TICKET": {
      const now = new Date().toISOString();
      return {
        ...state,
        tickets: [
          {
            ...action.payload,
            id: `TK-${Math.floor(3000 + Math.random() * 6000)}`,
            status: "Open",
            priority: "Normal",
            createdAt: now,
            updatedAt: now,
          },
          ...state.tickets,
        ],
        notifications: [
          {
            id: uid("nt"),
            title: "Support ticket opened",
            body: "Support will reply in the ticket thread.",
            type: "platform",
            read: false,
            createdAt: now,
            action: "/pa/support_hub/help_center",
          },
          ...state.notifications,
        ],
      };
    }
    case "ADD_WALLET":
      return {
        ...state,
        wallets: [
          {
            ...action.payload,
            id: uid("wallet"),
            address: `${action.payload.asset.slice(0, 1)}${Math.random().toString(36).slice(2, 6)}...${Math.random()
              .toString(36)
              .slice(2, 6)}`,
            balance: 0,
            status: "Ready",
          },
          ...state.wallets,
        ],
      };
    case "MARK_NOTIFICATION_READ":
      return {
        ...state,
        notifications: state.notifications.map((item) => (item.id === action.id ? { ...item, read: true } : item)),
      };
    case "MARK_ALL_NOTIFICATIONS_READ":
      return {
        ...state,
        notifications: state.notifications.map((item) => ({ ...item, read: true })),
      };
    case "CLEAR_NOTIFICATIONS":
      return {
        ...state,
        notifications: [],
      };
    case "COMPLETE_VERIFICATION":
      return {
        ...state,
        verification: state.verification.map((step) => (step.id === action.stepId ? completeStep(step) : step)),
      };
    case "SET_LANGUAGE": {
      const steps = verificationTemplate.map((tpl) => {
        const cur = state.verification.find((s) => s.id === tpl.id);
        return cur ? { ...tpl, status: cur.status, completedAt: cur.completedAt } : tpl;
      });
      return {
        ...state,
        settings: { ...state.settings, language: action.language },
        verification: state.userProfile
          ? mapVerificationFromKyc(
              state.userProfile.kycStatus,
              state.userProfile.kycRejectReason,
              steps,
              action.language,
            )
          : state.verification,
      };
    }
    case "SET_MT5_TERMINAL":
      return {
        ...state,
        settings: {
          ...state.settings,
          mt5Terminal: action.terminal,
        },
      };
    case "SET_MT4_TERMINAL":
      return {
        ...state,
        settings: {
          ...state.settings,
          mt4Terminal: action.terminal,
        },
      };
    case "TOGGLE_TWO_FACTOR":
      return {
        ...state,
        settings: { ...state.settings, twoFactor: action.enabled },
      };
    case "LOG_OUT_OTHER_SESSIONS":
      return {
        ...state,
        settings: {
          ...state.settings,
          sessions: state.settings.sessions.filter((session) => session.current),
        },
      };
    case "DISMISS_INSTALL_TOAST":
      return {
        ...state,
        settings: { ...state.settings, installToastVisible: false },
      };
    default:
      return state;
  }
}

function createInitialState(): PAState {
  return {
    ...initialState,
    settings: {
      ...initialState.settings,
      language: readStoredLanguage(),
    },
  };
}

export function PAProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, createInitialState);

  useEffect(() => {
    writeStoredLanguage(state.settings.language);
  }, [state.settings.language]);

  const value = useMemo<PAContextValue>(() => {
    const totalBalance = state.accounts
      .filter((account) => account.status === "Active" && account.kind === "Real")
      .reduce((total, account) => total + account.balance, 0);
    const unreadNotifications = state.notifications.filter((item) => !item.read).length;
    const verificationComplete = state.userProfile?.kycStatus === 2;
    return { state, dispatch, totalBalance, unreadNotifications, verificationComplete };
  }, [state]);

  return <PAContext.Provider value={value}>{children}</PAContext.Provider>;
}

export function usePA() {
  const value = useContext(PAContext);
  if (!value) {
    throw new Error("usePA must be used inside PAProvider");
  }
  return value;
}
