export type Stage = "login" | "app";

export type Route =
  | "/pa/trading/accounts"
  | "/pa/trading/orderSummary"
  | "/pa/trading/ordersHistory"
  | "/pa/payments-and-wallet/deposit"
  | "/pa/payments-and-wallet/withdrawal"
  | "/pa/payments-and-wallet/history"
  | "/pa/payments-and-wallet/crypto-wallet"
  | "/pa/analytics/analystViews"
  | "/pa/analytics/fxnews"
  | "/pa/exness-benefits/swapfree"
  | "/pa/exness-benefits/savings"
  | "/pa/exness-benefits/vps"
  | "/pa/socialtrading"
  | "/pa/support_hub/help_center"
  | "/pa/settings/profile"
  | "/pa/settings/security"
  | "/pa/settings/terminal-settings";

export type GroupKey = "trading" | "payments" | "analytics" | "benefits" | "settings";
export type AccountKind = "Real" | "Demo";
export type AccountPlatform = "MT5" | "MT4";
export type TransactionType = "deposit" | "withdrawal" | "transfer";
export type TransactionStatus = "Pending" | "Completed" | "Rejected";
export type OrderStatus = "Open" | "Closed";
export type VerificationStatus = "Pending" | "In progress" | "Completed";

export interface Account {
  id: string;
  login: string;
  kind: AccountKind;
  platform: AccountPlatform;
  type: string;
  nickname: string;
  server: string;
  currency: "USD" | "USDT";
  balance: number;
  equity: number;
  margin: number;
  freeMargin: number;
  leverage: string;
  status: "Active" | "Archived";
  createdAt: string;
}

export interface PaymentMethod {
  id: string;
  flow: "deposit" | "withdrawal";
  name: string;
  network: string;
  processingTime: string;
  min: number;
  max: number;
  fee: string;
  recommended?: boolean;
  enabled: boolean;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  accountId: string;
  targetAccountId?: string;
  methodId?: string;
  amount: number;
  currency: string;
  status: TransactionStatus;
  fee: string;
  createdAt: string;
  completedAt?: string;
  reference: string;
}

export interface Order {
  id: string;
  accountId: string;
  symbol: string;
  side: "Buy" | "Sell";
  volume: number;
  openPrice: number;
  closePrice?: number;
  pnl: number;
  status: OrderStatus;
  openedAt: string;
  closedAt?: string;
}

export interface Ticket {
  id: string;
  subject: string;
  category: string;
  message: string;
  status: "Open" | "Waiting" | "Solved";
  priority: "Normal" | "High";
  createdAt: string;
  updatedAt: string;
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  type: "verification" | "payment" | "platform" | "security";
  read: boolean;
  createdAt: string;
  action?: Route;
}

export interface Insight {
  id: string;
  source: string;
  title: string;
  summary: string;
  body: string;
  tags: string[];
  symbol: string;
  sentiment: "Bullish" | "Bearish" | "Neutral";
  publishedAt: string;
}

export interface VerificationStep {
  id: string;
  title: string;
  description: string;
  status: VerificationStatus;
  required: boolean;
  fields: string[];
  completedAt?: string;
}

export interface Benefit {
  id: string;
  title: string;
  description: string;
  status: string;
  savedAmount?: number;
  requirement: string;
  cta: string;
}

export interface WalletItem {
  id: string;
  asset: string;
  network: string;
  address: string;
  balance: number;
  status: "Ready" | "Pending";
}

export interface PaSettings {
  language: string;
  terminal: "Exness Terminal" | "MetaTrader WebTerminal";
  terminalOpenMode: "Current tab" | "New tab";
  twoFactor: boolean;
  installToastVisible: boolean;
  sessions: Array<{ id: string; device: string; location: string; lastActive: string; current?: boolean }>;
}

export interface UserProfile {
  email: string;
  maskedEmail: string;
  kycStatus: number;
  kycRejectReason: string;
}

export interface PAState {
  userProfile: UserProfile | null;
  accounts: Account[];
  paymentMethods: PaymentMethod[];
  transactions: Transaction[];
  orders: Order[];
  tickets: Ticket[];
  notifications: NotificationItem[];
  insights: Insight[];
  news: Insight[];
  verification: VerificationStep[];
  benefits: Benefit[];
  wallets: WalletItem[];
  settings: PaSettings;
}
