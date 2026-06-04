import { FormEvent, MouseEvent, ReactNode, useEffect, useMemo, useRef, useState } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  Collapse,
  CssBaseline,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Drawer,
  Fab,
  FormControl,
  FormControlLabel,
  IconButton,
  InputAdornment,
  InputLabel,
  List as MuiList,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  Tab,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  useMediaQuery,
} from "@mui/material";
import {
  ArrowDownCircle,
  Activity,
  AppWindow,
  Bell,
  ChevronDown,
  ChevronUp,
  ChevronsLeft,
  ChevronsRight,
  CircleHelp,
  ClipboardList,
  Clock3,
  Copy,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileText,
  Gift,
  Globe2,
  Grid3X3,
  Headphones,
  Heart,
  History,
  LayoutGrid,
  LineChart,
  List,
  LockKeyhole,
  LogOut,
  MessageCircle,
  MoreVertical,
  Plus,
  Search,
  Send,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  TrendingUp,
  UserCircle,
  Wallet,
  X,
  type LucideIcon,
} from "lucide-react";
import { PAProvider, usePA } from "./state/paStore";
import { ThemeModeProvider } from "./theme/ThemeModeProvider";
import { ThemeMenuButton } from "./components/ThemeMenuButton";
import { AccountsPage } from "./components/AccountsPage";
import { OpenAccountFlow } from "./components/OpenAccountFlow";
import { TradeDialog } from "./components/TradeDialog";
import { accounts as showcaseAccounts } from "./data/mockData";
import { filterByDateRange } from "./components/DateRangePicker";
import { OrdersHistoryFiltersBar } from "./components/OrdersHistoryFiltersBar";
import { OrdersHistoryTable } from "./components/OrdersHistoryTable";
import { TransactionHistoryFiltersBar } from "./components/TransactionHistoryFiltersBar";
import {
  defaultTransactionHistoryFilters,
  filterTransactions,
  type TransactionHistoryFilters,
} from "./utils/transactionFilters";
import { syncOrderHistory } from "./utils/syncOrderHistory";
import { AnalystViewsRoute } from "./components/AnalystViewsPage";
import { MarketNewsPage } from "./components/MarketNewsPage";
import { SavingsPage } from "./components/SavingsPage";
import { CryptoWalletPage } from "./components/CryptoWalletPage";
import { TradingConditionsPage } from "./components/TradingConditionsPage";
import { VpsPage } from "./components/VpsPage";
import { PerformancePage } from "./components/PerformancePage";
import { LegalFooter } from "./components/LegalFooter";
import { GoogleIcon } from "./components/GoogleIcon";
import { ProfilePage, PROFILE_FLOW_KEY } from "./components/ProfilePage";
import {
  resolveVerificationIntroActiveStep,
  VerificationStepsIntroModal,
} from "./components/VerificationStepsIntroModal";
import { refreshUserProfile } from "./utils/userProfile";
import { accountDisplayName, formatAccountFilterLabel, formatAccountLabelById, formatAccountOptionLabel } from "./utils/accountLabel";
import { DEFAULT_PA_ROUTE, exnessTerminalUrl, openExnessTerminal, readPathname, resolvePaRoute, writeAppRoot, writePaPath } from "./utils/paRoutes";
import { applyAppDocumentTitle, applyAuthDocumentTitle, applyLoadingDocumentTitle, type AuthTab } from "./utils/pageTitle";
import type { DateRangeValue } from "./utils/dateRange";
import { languageLocaleCodes, languageOptions, localizeTree, readStoredLanguage, translateText } from "./i18n";
import { depositMaintenanceWindow } from "./config/paymentMaintenance";
import { clearLegacyTokens, clearTokens, compressImageFile } from "./api/client";
import { canFundAccount, isDemoFundFlow, kycAllowsRealFund, pickDefaultFundAccountId } from "./config/simulation";
import * as authApi from "./api/auth";
import * as fundApi from "./api/fund";
import * as kycApi from "./api/kyc";
import * as webtradingApi from "./api/webtrading";
import {
  kycPaymentBlockedMessage,
  kycIdentityLocked,
  kycStatusLabel,
  verificationStatusLabel,
} from "./utils/kycSync";
import {
  validateFundAmount,
  normalizeAmountInput,
  parseFundAmount,
  defaultAmountText,
  roundFundAmount,
  formatFundAmountText,
  FUND_AMOUNT_DEFAULT_DEPOSIT,
} from "./utils/fundValidation";
import type {
  Account,
  AccountKind,
  AccountPlatform,
  GroupKey,
  Mt4Terminal,
  Mt5Terminal,
  OrderStatus,
  Route,
  Stage,
  TransactionType,
  VerificationStep,
  PaymentMethod,
  UserProfile,
} from "./types";
import type { Dispatch } from "react";

function promptKycForPayments(
  kycStatus: number,
  openDialog: DialogOpener,
  toast: Toast,
  language: string,
  navigate?: (route: Route) => void,
) {
  toast(kycPaymentBlockedMessage(kycStatus, language));
  if (navigate) {
    sessionStorage.setItem(PROFILE_FLOW_KEY, "identity");
    navigate("/pa/settings/profile");
    return;
  }
  openDialog({ name: "verification", stepId: "identity" });
}

function KycPaymentBlock({
  kycStatus,
  language,
  openDialog,
  toast,
  navigate,
}: {
  kycStatus: number;
  language: string;
  openDialog: DialogOpener;
  toast: Toast;
  navigate?: (route: Route) => void;
}) {
  const actionLabel = kycStatus === 1 ? "查看状态" : "Verify now";
  return (
    <Alert
      severity="warning"
      action={
        <Button color="inherit" size="small" onClick={() => promptKycForPayments(kycStatus, openDialog, toast, language, navigate)}>
          {actionLabel}
        </Button>
      }
    >
      {kycPaymentBlockedMessage(kycStatus, language)}
    </Alert>
  );
}

async function syncUserProfile(dispatch: Dispatch<{ type: "SET_USER_PROFILE"; profile: UserProfile }>): Promise<number> {
  return refreshUserProfile(dispatch);
}

type HeaderMenu = "balance" | "language" | "help" | "notifications" | "apps" | "profile" | null;
type DialogState =
  | { name: "payment"; flow: "deposit" | "withdrawal"; accountId?: string }
  | { name: "transfer"; accountId?: string }
  | { name: "ticket" }
  | { name: "verificationIntro" }
  | { name: "verification"; stepId?: string }
  | { name: "refer" }
  | { name: "external"; title: string; body: string }
  | { name: "rename"; accountId: string }
  | { name: "leverage"; accountId: string }
  | { name: "accountInfo"; accountId: string }
  | { name: "password"; accountId?: string }
  | { name: "terminate" }
  | { name: "wallet" }
  | { name: "setBalance"; accountId: string }
  | { name: "trade"; accountId: string }
  | null;

const FUND_ACCOUNT_STORAGE_KEY = "pa.fundAccountId";

type DialogOpener = (dialog: DialogState) => void;
type Toast = (message: string) => void;

const routeLabels: Record<Route, string> = {
  "/pa/trading/accounts": "My accounts",
  "/pa/trading/open-account": "Open account",
  "/pa/trading/orderSummary": "Performance",
  "/pa/trading/ordersHistory": "History of orders",
  "/pa/payments-and-wallet/deposit": "Deposit",
  "/pa/payments-and-wallet/withdrawal": "Withdrawal",
  "/pa/payments-and-wallet/history": "Transaction history",
  "/pa/payments-and-wallet/crypto-wallet": "Crypto wallet",
  "/pa/analytics/analystViews": "Analyst Views",
  "/pa/analytics/fxnews": "Market News",
  "/pa/exness-benefits/swapfree": "Trading Conditions",
  "/pa/exness-benefits/savings": "Savings",
  "/pa/exness-benefits/vps": "Virtual Private Server",
  "/pa/socialtrading": "Copy Trading",
  "/pa/support_hub/help_center": "Support hub",
  "/pa/settings/profile": "Profile",
  "/pa/settings/security": "Security",
  "/pa/settings/terminal-settings": "Trading Terminal",
};

const sidebarGroups: Array<{
  key: GroupKey;
  label: string;
  icon: LucideIcon;
  children: Array<{ route: Route; label: string; external?: boolean; href?: string }>;
}> = [
  {
    key: "trading",
    label: "Trading",
    icon: SlidersHorizontal,
    children: [
      { route: "/pa/trading/accounts", label: "My accounts" },
      { route: "/pa/trading/orderSummary", label: "Performance" },
      { route: "/pa/trading/ordersHistory", label: "History of orders" },
      { route: "/pa/trading/accounts", label: "Exness Terminal", href: exnessTerminalUrl },
    ],
  },
  {
    key: "payments",
    label: "Payments & wallet",
    icon: Wallet,
    children: [
      { route: "/pa/payments-and-wallet/deposit", label: "Deposit" },
      { route: "/pa/payments-and-wallet/withdrawal", label: "Withdrawal" },
      { route: "/pa/payments-and-wallet/history", label: "Transaction history" },
      { route: "/pa/payments-and-wallet/crypto-wallet", label: "Crypto wallet" },
    ],
  },
  {
    key: "analytics",
    label: "Analytics",
    icon: ClipboardList,
    children: [
      { route: "/pa/analytics/analystViews", label: "Analyst Views" },
      { route: "/pa/analytics/fxnews", label: "Market News" },
      { route: "/pa/analytics/analystViews", label: "Economic Calendar", external: true },
    ],
  },
  {
    key: "benefits",
    label: "Exness benefits",
    icon: Gift,
    children: [
      { route: "/pa/exness-benefits/swapfree", label: "Trading Conditions" },
      { route: "/pa/exness-benefits/savings", label: "Savings" },
      { route: "/pa/exness-benefits/vps", label: "Virtual Private Server" },
    ],
  },
  {
    key: "settings",
    label: "Settings",
    icon: Settings,
    children: [
      { route: "/pa/settings/profile", label: "Profile" },
      { route: "/pa/settings/security", label: "Security" },
      { route: "/pa/settings/terminal-settings", label: "Trading Terminal" },
    ],
  },
];

function formatMoney(value: number, currency = "USD") {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function downloadCsv(filename: string, rows: object[]) {
  const data = rows.length ? rows : [{ empty: "" }];
  const headers = Object.keys(data[0] as Record<string, unknown>);
  const body = [
    headers.join(","),
    ...data.map((row) => {
      const record = row as Record<string, unknown>;
      return headers.map((header) => JSON.stringify(record[header] ?? "")).join(",");
    }),
  ].join("\n");
  const blob = new Blob([body], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

async function copyToClipboard(value: string, toast: Toast) {
  try {
    await navigator.clipboard.writeText(value);
    toast("Copied to clipboard.");
  } catch {
    toast(value);
  }
}

export default function App() {
  const [stage, setStage] = useState<Stage>("login");
  const [authTab, setAuthTab] = useState<AuthTab>("login");
  const [dialog, setDialog] = useState<DialogState>(null);
  const [snackbar, setSnackbar] = useState("");
  const [booting, setBooting] = useState(true);
  const navigateRef = useRef<(route: Route) => void>(() => undefined);

  const toast = (message: string) => setSnackbar(message);

  useEffect(() => {
    let cancelled = false;
    clearLegacyTokens();
    (async () => {
      try {
        const ok = await authApi.restoreSession();
        if (!cancelled && ok) {
          setStage("app");
          writePaPath(resolvePaRoute(), true);
        }
      } catch {
        // 未登录或 cookie 已失效
      } finally {
        if (!cancelled) setBooting(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (booting) {
      applyLoadingDocumentTitle(readStoredLanguage());
    }
  }, [booting]);

  if (booting) {
    return (
      <ThemeModeProvider>
        <CssBaseline />
        <div className="login-page">
          <main className="login-main">
            <Typography variant="h3">Loading...</Typography>
          </main>
        </div>
      </ThemeModeProvider>
    );
  }

  return (
    <ThemeModeProvider>
      <CssBaseline />
      <PAProvider>
        <I18nSync />
        {stage === "login" ? (
          <LoginPage setStage={setStage} openDialog={setDialog} toast={toast} authTab={authTab} setAuthTab={setAuthTab} />
        ) : (
          <AppShell setStage={setStage} openDialog={setDialog} toast={toast} navigateRef={navigateRef} />
        )}
        <DialogHost
          dialog={dialog}
          close={() => setDialog(null)}
          openDialog={setDialog}
          toast={toast}
          setStage={setStage}
          navigate={(route) => navigateRef.current(route)}
        />
        <Snackbar open={Boolean(snackbar)} autoHideDuration={4200} onClose={() => setSnackbar("")} anchorOrigin={{ vertical: "bottom", horizontal: "center" }}>
          <Alert severity="info" variant="filled" onClose={() => setSnackbar("")}>
            {snackbar}
          </Alert>
        </Snackbar>
      </PAProvider>
    </ThemeModeProvider>
  );
}

function I18nSync() {
  const { state } = usePA();
  const language = state.settings.language;

  useEffect(() => {
    document.documentElement.lang = languageLocaleCodes[language as keyof typeof languageLocaleCodes] ?? "en";

    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => localizeTree(document.body, language));
    };

    apply();
    const observer = new MutationObserver(() => apply());
    observer.observe(document.body, {
      childList: true,
      characterData: true,
      subtree: true,
    });

    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [language]);

  return null;
}

function LoginField({
  label,
  children,
  className,
}: {
  label: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className ? `login-field ${className}` : "login-field"}>
      <span className="login-field-label">{label}</span>
      {children}
    </div>
  );
}

function LoginPage({
  setStage,
  openDialog,
  toast,
  authTab,
  setAuthTab,
}: {
  setStage: (stage: Stage) => void;
  openDialog: DialogOpener;
  toast: Toast;
  authTab: AuthTab;
  setAuthTab: (tab: AuthTab) => void;
}) {
  const { state, dispatch } = usePA();
  const tab = authTab;
  const setTab = setAuthTab;
  const [showPassword, setShowPassword] = useState(false);
  const [languageAnchor, setLanguageAnchor] = useState<HTMLElement | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [country, setCountry] = useState("China");
  const [emailCode, setEmailCode] = useState("");
  const [captchaId, setCaptchaId] = useState("");
  const [captchaCode, setCaptchaCode] = useState("");
  const [captchaImage, setCaptchaImage] = useState("");
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const [captchaError, setCaptchaError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);
  const [partnerCodeOpen, setPartnerCodeOpen] = useState(true);
  const [partnerCode, setPartnerCode] = useState("");

  const registerPasswordRules = useMemo(
    () => [
      { label: "8—15个字符", ok: password.length >= 8 && password.length <= 15 },
      { label: "需包含至少一个大写和小写字母", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
      { label: "需包含至少一个数字", ok: /\d/.test(password) },
      { label: "需包含至少一个特殊字符", ok: /[^A-Za-z0-9]/.test(password) },
    ],
    [password],
  );

  async function loadCaptcha() {
    setCaptchaLoading(true);
    setCaptchaError("");
    try {
      const data = await authApi.fetchCaptcha();
      setCaptchaId(data.captchaId);
      const image = data.imageBase64?.trim() ?? "";
      if (!image) {
        throw new Error("验证码图片为空");
      }
      setCaptchaImage(image.startsWith("data:") ? image : `data:image/png;base64,${image}`);
    } catch (err) {
      setCaptchaImage("");
      setCaptchaId("");
      const message = err instanceof Error ? err.message : "验证码加载失败";
      setCaptchaError(message);
      toast(message);
    } finally {
      setCaptchaLoading(false);
    }
  }

  useEffect(() => {
    void loadCaptcha();
  }, []);

  useEffect(() => {
    applyAuthDocumentTitle(tab, state.settings.language);
  }, [tab, state.settings.language]);

  useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = window.setTimeout(() => setCodeCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [codeCooldown]);

  async function sendRegisterCode() {
    if (!email.trim()) {
      toast("Please enter your email first.");
      return;
    }
    setSendingCode(true);
    try {
      await authApi.sendEmailCode(email.trim(), "register");
      setCodeCooldown(60);
      toast("Email code sent. Dev mode uses 123456.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to send email code.");
    } finally {
      setSendingCode(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    try {
      if (tab === "login") {
        await authApi.login({
          email: email.trim(),
          password,
          captchaId,
          captchaCode: captchaCode.trim(),
        });
        toast("Signed in successfully.");
      } else {
        await authApi.register({
          email: email.trim(),
          password,
          emailCode: emailCode.trim(),
          captchaId,
          captchaCode: captchaCode.trim(),
          country,
        });
        toast("Account created successfully.");
      }
      setStage("app");
      const target = resolvePaRoute();
      writePaPath(target, true);
    } catch (err) {
      toast(err instanceof Error ? err.message : "Authentication failed.");
      void loadCaptcha();
      setCaptchaCode("");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="login-page">
      <header className="login-header">
        <ExnessLogo />
        <Stack direction="row" spacing={0.5} sx={{ alignItems: "center" }}>
          <ThemeMenuButton size={18} />
          <IconButton aria-label="Language" onClick={(event) => setLanguageAnchor(event.currentTarget)}>
            <Globe2 size={18} />
          </IconButton>
        </Stack>
        <Menu anchorEl={languageAnchor} open={Boolean(languageAnchor)} onClose={() => setLanguageAnchor(null)}>
          {languageOptions.map((language) => (
            <MenuItem
              key={language}
              selected={state.settings.language === language}
              onClick={() => {
                dispatch({ type: "SET_LANGUAGE", language });
                setLanguageAnchor(null);
                toast(`Language set to ${language}.`);
              }}
            >
              {language}
            </MenuItem>
          ))}
        </Menu>
      </header>
      <main className="login-main">
        <form className="login-form" onSubmit={submit}>
          <Typography variant="h1" sx={{ textAlign: "center" }}>
            Exness 欢迎您
          </Typography>
          <Tabs value={tab} onChange={(_, value: AuthTab) => setTab(value)} className="login-tabs-mui">
            <Tab value="login" label="登录" />
            <Tab value="register" label="开立账户" />
          </Tabs>
          {tab === "register" && (
            <LoginField label="居住国家/地区">
              <TextField value={country} onChange={(event) => setCountry(event.target.value)} fullWidth hiddenLabel />
            </LoginField>
          )}
          <LoginField label="电子邮箱地址">
            <TextField
              type="email"
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              fullWidth
              hiddenLabel
            />
          </LoginField>
          {tab === "register" && (
            <LoginField label="邮箱验证码">
              <div className="login-field-row">
                <TextField value={emailCode} onChange={(event) => setEmailCode(event.target.value)} fullWidth hiddenLabel />
                <Button
                  variant="outlined"
                  className="login-inline-button"
                  disabled={sendingCode || codeCooldown > 0}
                  onClick={() => void sendRegisterCode()}
                >
                  {codeCooldown > 0 ? `${codeCooldown}s` : "发送验证码"}
                </Button>
              </div>
            </LoginField>
          )}
          <LoginField label="密码">
            <TextField
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete={tab === "login" ? "current-password" : "new-password"}
              fullWidth
              hiddenLabel
              slotProps={{
                input: {
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton aria-label="Toggle password" onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                      </IconButton>
                    </InputAdornment>
                  ),
                },
              }}
            />
            {tab === "register" ? (
              <ul className="login-password-rules">
                {registerPasswordRules.map((rule, index) => (
                  <li key={rule.label} className={rule.ok ? "is-ok" : ""}>
                    <span>{rule.label}</span>
                    {index === 0 ? <span className="login-password-rules-count">{password.length}</span> : null}
                  </li>
                ))}
              </ul>
            ) : null}
          </LoginField>
          {tab === "register" && (
            <div className="login-partner-code">
              <button
                type="button"
                className="login-partner-code-toggle"
                aria-expanded={partnerCodeOpen}
                onClick={() => setPartnerCodeOpen((open) => !open)}
              >
                <span>合作伙伴代码（选填）</span>
                {partnerCodeOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>
              {partnerCodeOpen ? (
                <TextField
                  value={partnerCode}
                  onChange={(event) => setPartnerCode(event.target.value)}
                  fullWidth
                  hiddenLabel
                  placeholder=""
                  autoComplete="off"
                />
              ) : null}
            </div>
          )}
          {tab === "register" && <FormControlLabel control={<Checkbox defaultChecked />} label="我确认自己不是美国居民，并同意法律文件。" />}
          <LoginField label="验证码">
            <div className="login-captcha-row">
              <div className="login-captcha-box">
                {captchaLoading ? (
                  <Typography variant="caption" color="text.secondary">
                    加载中...
                  </Typography>
                ) : captchaImage ? (
                  <img src={captchaImage} alt="验证码" />
                ) : (
                  <Typography variant="caption" color="error">
                    {captchaError ? "加载失败" : "无图片"}
                  </Typography>
                )}
              </div>
              <IconButton
                className="login-captcha-refresh"
                aria-label="Refresh captcha"
                onClick={() => void loadCaptcha()}
                disabled={captchaLoading}
              >
                <History size={18} />
              </IconButton>
              <TextField value={captchaCode} onChange={(event) => setCaptchaCode(event.target.value)} fullWidth hiddenLabel />
            </div>
          </LoginField>
          {captchaError ? (
            <Typography variant="caption" color="error">
              {captchaError}（请确认后端 :8080 已启动，或点击刷新）
            </Typography>
          ) : null}
          <Button type="submit" variant="contained" color="primary" fullWidth disabled={submitting || !captchaId}>
            {tab === "login" ? "登录" : "继续"}
          </Button>
          <div className="divider">
            <span>或使用以下方式登录</span>
          </div>
          <Button
            className="login-google-btn"
            variant="outlined"
            fullWidth
            onClick={() =>
              openDialog({
                name: "external",
                title: "Google sign-in",
                body: "Google authentication is represented locally in this static build.",
              })
            }
          >
            <GoogleIcon size={20} />
            Google
          </Button>
          <Button variant="text" onClick={() => openDialog({ name: "external", title: "Forgot password", body: "Enter your email and Exness would send a password reset link. This preview keeps the action local." })}>
            忘记密码
          </Button>
        </form>
      </main>
      <LegalFooter variant="login" />
      <ChatFab />
    </div>
  );
}

function AppShell({
  setStage,
  openDialog,
  toast,
  navigateRef,
}: {
  setStage: (stage: Stage) => void;
  openDialog: DialogOpener;
  toast: Toast;
  navigateRef: React.MutableRefObject<(route: Route) => void>;
}) {
  const { state, dispatch } = usePA();
  const language = state.settings.language;
  const kycStatus = state.userProfile?.kycStatus ?? 0;
  const isNarrow = useMediaQuery("(max-width:960px)");

  function requireKycForRealFund() {
    promptKycForPayments(kycStatus, openDialog, toast, language, navigate);
  }

  function openRealFundRoute(accountId: string, fundRoute: "/pa/payments-and-wallet/deposit" | "/pa/payments-and-wallet/withdrawal") {
    const account = state.accounts.find((item) => item.id === accountId);
    if (account?.kind === "Real" && !kycAllowsRealFund(kycStatus)) {
      requireKycForRealFund();
      return;
    }
    sessionStorage.setItem(FUND_ACCOUNT_STORAGE_KEY, accountId);
    navigate(fundRoute);
  }
  const [route, setRoute] = useState<Route>(() => resolvePaRoute());
  const [collapsed, setCollapsed] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<GroupKey, boolean>>({
    trading: true,
    payments: false,
    analytics: false,
    benefits: false,
    settings: false,
  });
  const sidebarCollapsed = collapsed || isNarrow;
  const effectiveOpenGroups: Record<GroupKey, boolean> = isNarrow
    ? {
        trading: false,
        payments: false,
        analytics: false,
        benefits: false,
        settings: false,
      }
    : openGroups;

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [, accounts, transactions] = await Promise.all([
          syncUserProfile(dispatch),
          fundApi.fetchAccounts(),
          fundApi.fetchTransactions(),
        ]);
        if (cancelled) return;
        dispatch({ type: "SET_ACCOUNTS", accounts });
        dispatch({ type: "SET_TRANSACTIONS", transactions: transactions.list });
        try {
          const orders = await syncOrderHistory(accounts);
          if (!cancelled) {
            dispatch({ type: "SET_ORDERS", orders, loaded: true });
          }
        } catch (orderErr) {
          if (!cancelled) {
            dispatch({ type: "SET_ORDERS", orders: [], loaded: true });
            toast(orderErr instanceof Error ? orderErr.message : "Failed to load order history.");
          }
        }
      } catch (err) {
        if (!cancelled) {
          dispatch({ type: "SET_ACCOUNTS", accounts: showcaseAccounts });
          dispatch({ type: "SET_ORDERS", orders: [], loaded: true });
          toast(err instanceof Error ? err.message : "Failed to load account data.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, toast]);

  useEffect(() => {
    if (isNarrow) {
      setOpenGroups({
        trading: false,
        payments: false,
        analytics: false,
        benefits: false,
        settings: false,
      });
      return;
    }

    if (!collapsed) {
      setOpenGroups(singleOpenGroup(getRouteGroup(route)));
    }
  }, [isNarrow, collapsed, route]);

  function getRouteGroup(next: Route): GroupKey | null {
    if (next.startsWith("/pa/trading")) return "trading";
    if (next.startsWith("/pa/payments")) return "payments";
    if (next.startsWith("/pa/analytics")) return "analytics";
    if (next.startsWith("/pa/exness-benefits")) return "benefits";
    if (next.startsWith("/pa/settings")) return "settings";
    return null;
  }

  function singleOpenGroup(group: GroupKey | null): Record<GroupKey, boolean> {
    return {
      trading: group === "trading",
      payments: group === "payments",
      analytics: group === "analytics",
      benefits: group === "benefits",
      settings: group === "settings",
    };
  }

  function navigate(next: Route) {
    setRoute(next);
    writePaPath(next);
    if (!sidebarCollapsed) setOpenGroups(singleOpenGroup(getRouteGroup(next)));
  }

  useEffect(() => {
    navigateRef.current = navigate;
  });

  useEffect(() => {
    applyAppDocumentTitle(route, language);
  }, [route, language]);

  useEffect(() => {
    const initial = resolvePaRoute();
    if (readPathname() !== initial) {
      writePaPath(initial, true);
    }

    function onPopState() {
      const path = resolvePaRoute(readPathname());
      setRoute(path);
      if (!sidebarCollapsed) {
        setOpenGroups(singleOpenGroup(getRouteGroup(path)));
      }
    }

    window.addEventListener("popstate", onPopState);
    return () => window.removeEventListener("popstate", onPopState);
  }, [sidebarCollapsed]);

  function toggleGroup(group: GroupKey) {
    setOpenGroups((groups) => (groups[group] ? { ...groups, [group]: false } : singleOpenGroup(group)));
  }

  function updateCollapsed(next: boolean) {
    setCollapsed(next);
    if (!next) setOpenGroups(singleOpenGroup(getRouteGroup(route)));
  }

  return (
    <div className={`pa-shell ${sidebarCollapsed ? "is-collapsed" : ""}`}>
      <Header
        setStage={setStage}
        navigate={navigate}
        openDialog={openDialog}
        toast={toast}
        kycStatus={kycStatus}
        onRequireKycForRealFund={requireKycForRealFund}
      />
      <div className="pa-body">
        <Sidebar
          route={route}
          collapsed={sidebarCollapsed}
          openGroups={effectiveOpenGroups}
          navigate={navigate}
          setCollapsed={updateCollapsed}
          toggleGroup={toggleGroup}
          openDialog={openDialog}
          isNarrow={isNarrow}
        />
        <main className={`content${route === "/pa/trading/open-account" ? " is-open-account" : ""}`}>
          {route !== "/pa/trading/open-account" && <KycBanner navigate={navigate} openDialog={openDialog} />}
          <section className={`content-inner${route === "/pa/trading/open-account" ? " is-open-account" : ""}`}>
            {route === "/pa/trading/open-account" && <OpenAccountFlow navigate={navigate} toast={toast} />}
            {route === "/pa/trading/accounts" && (
              <AccountsPage
                navigate={navigate}
                openDialog={openDialog}
                toast={toast}
                kycStatus={kycStatus}
                onRequireKycForRealFund={requireKycForRealFund}
                onTrade={(accountId) => openDialog({ name: "trade", accountId })}
                onDeposit={(accountId) => openRealFundRoute(accountId, "/pa/payments-and-wallet/deposit")}
                onWithdraw={(accountId) => openRealFundRoute(accountId, "/pa/payments-and-wallet/withdrawal")}
                onTransfer={(accountId) => openDialog({ name: "transfer", accountId })}
              />
            )}
            {route === "/pa/trading/orderSummary" && <PerformancePage />}
            {route === "/pa/trading/ordersHistory" && <OrdersPage toast={toast} />}
            {route.startsWith("/pa/payments-and-wallet") && route !== "/pa/payments-and-wallet/crypto-wallet" && (
              <PaymentsPage route={route} navigate={navigate} openDialog={openDialog} toast={toast} />
            )}
            {route === "/pa/payments-and-wallet/crypto-wallet" && (
              <CryptoWalletPage
                toast={toast}
                navigate={navigate}
                openDialog={openDialog}
                kycStatus={kycStatus}
                onRequireKycForRealFund={requireKycForRealFund}
              />
            )}
            {route === "/pa/analytics/analystViews" && <AnalystViewsRoute openDialog={openDialog} />}
            {route === "/pa/analytics/fxnews" && (
              <Page title="Market News">
                <MarketNewsPage />
              </Page>
            )}
            {route === "/pa/exness-benefits/swapfree" && <TradingConditionsPage />}
            {route === "/pa/exness-benefits/savings" && <SavingsPage navigate={navigate} />}
            {route === "/pa/exness-benefits/vps" && <VpsPage />}
            {route.startsWith("/pa/exness-benefits") &&
              route !== "/pa/exness-benefits/swapfree" &&
              route !== "/pa/exness-benefits/savings" &&
              route !== "/pa/exness-benefits/vps" && (
                <BenefitsPage route={route} openDialog={openDialog} navigate={navigate} />
              )}
            {route === "/pa/socialtrading" && <CopyTradingPage openDialog={openDialog} toast={toast} />}
            {route === "/pa/support_hub/help_center" && <SupportHubPage openDialog={openDialog} toast={toast} />}
            {route.startsWith("/pa/settings") && <SettingsPage route={route} openDialog={openDialog} toast={toast} />}
            <LegalFooter />
          </section>
        </main>
      </div>
      <ChatFab />
      <InstallToast toast={toast} />
    </div>
  );
}

function Header({
  setStage,
  navigate,
  openDialog,
  toast,
  kycStatus,
  onRequireKycForRealFund,
}: {
  setStage: (stage: Stage) => void;
  navigate: (route: Route) => void;
  openDialog: DialogOpener;
  toast: Toast;
  kycStatus: number;
  onRequireKycForRealFund: () => void;
}) {
  const { state, dispatch, totalBalance, unreadNotifications } = usePA();
  const [menu, setMenu] = useState<HeaderMenu>(null);
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);

  function open(event: React.MouseEvent<HTMLElement>, next: HeaderMenu) {
    setAnchor(event.currentTarget);
    setMenu(next);
  }

  function close() {
    setMenu(null);
    setAnchor(null);
  }

  return (
    <header className="pa-header">
      <button className="header-logo" type="button" onClick={() => navigate("/pa/trading/accounts")}>
        <ExnessLogo />
      </button>
      <div className="header-actions">
        <Button className="balance-trigger" startIcon={<Wallet size={18} />} onClick={(event) => open(event, "balance")} color="inherit">
          <strong>{totalBalance.toFixed(2)}</strong> USD
        </Button>
        <ThemeMenuButton />
        <IconButton aria-label="Language" onClick={(event) => open(event, "language")}>
          <Globe2 size={20} />
        </IconButton>
        <IconButton aria-label="Help" onClick={(event) => open(event, "help")}>
          <CircleHelp size={20} />
        </IconButton>
        <IconButton aria-label="Notifications" onClick={(event) => open(event, "notifications")}>
          <Badge color="error" badgeContent={unreadNotifications}>
            <Bell size={20} />
          </Badge>
        </IconButton>
        <IconButton aria-label="Apps" onClick={(event) => open(event, "apps")}>
          <Grid3X3 size={20} />
        </IconButton>
        <IconButton aria-label="Profile" onClick={(event) => open(event, "profile")}>
          <UserCircle size={21} />
        </IconButton>
      </div>

      <Menu anchorEl={anchor} open={menu === "balance"} onClose={close} slotProps={{ paper: { sx: { width: 340 } } }}>
        <Box className="menu-panel">
          <Typography variant="h3">Available balance</Typography>
          <Typography className="balance-total">{formatMoney(totalBalance)}</Typography>
          <Divider />
          {state.accounts
            .filter((account) => account.status === "Active")
            .map((account) => (
              <button className="mini-account" key={account.id} type="button" onClick={() => copyToClipboard(account.login, toast)}>
                <span>
                  {formatAccountFilterLabel(account)}
                </span>
                <strong>{formatMoney(account.balance, account.currency)}</strong>
              </button>
            ))}
          <Stack direction="row" spacing={1}>
            <Button
              fullWidth
              variant="contained"
              onClick={() => {
                close();
                if (!kycAllowsRealFund(kycStatus)) {
                  onRequireKycForRealFund();
                  return;
                }
                navigate("/pa/payments-and-wallet/deposit");
              }}
            >
              Deposit
            </Button>
            <Button
              fullWidth
              variant="outlined"
              onClick={() => {
                close();
                if (!kycAllowsRealFund(kycStatus)) {
                  onRequireKycForRealFund();
                  return;
                }
                navigate("/pa/payments-and-wallet/withdrawal");
              }}
            >
              Withdraw
            </Button>
          </Stack>
          <Button fullWidth color="inherit" onClick={() => { close(); navigate("/pa/payments-and-wallet/history"); }}>
            Transaction history
          </Button>
        </Box>
      </Menu>

      <Menu anchorEl={anchor} open={menu === "language"} onClose={close}>
        {languageOptions.map((language) => (
          <MenuItem
            key={language}
            selected={state.settings.language === language}
            onClick={() => {
              dispatch({ type: "SET_LANGUAGE", language });
              close();
              toast(`Language set to ${language}.`);
            }}
          >
            {language}
          </MenuItem>
        ))}
      </Menu>

      <Menu anchorEl={anchor} open={menu === "help"} onClose={close} slotProps={{ paper: { sx: { width: 260 } } }}>
        <MenuItem onClick={() => { close(); navigate("/pa/support_hub/help_center"); }}>Help Center</MenuItem>
        <MenuItem onClick={() => { close(); openDialog({ name: "external", title: "Trading tools", body: "Calculators, converters and economic calendar open as Exness tool shortcuts in this static build." }); }}>Trading tools</MenuItem>
        <MenuItem onClick={() => { close(); openDialog({ name: "external", title: "Exness blog", body: "This shortcut represents the Exness education and market commentary area." }); }}>Exness blog</MenuItem>
        <MenuItem onClick={() => { close(); openDialog({ name: "ticket" }); }}>Contact support</MenuItem>
      </Menu>

      <Menu anchorEl={anchor} open={menu === "notifications"} onClose={close} slotProps={{ paper: { sx: { width: 380 } } }}>
        <Box className="menu-panel">
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h3">Notifications</Typography>
            <Button size="small" onClick={() => dispatch({ type: "MARK_ALL_NOTIFICATIONS_READ" })}>
              Mark all read
            </Button>
          </Stack>
          {state.notifications.length === 0 ? (
            <EmptyState icon={Bell} title="No notifications" text="New activity will appear here." />
          ) : (
            state.notifications.map((item) => (
              <button
                className={`notice-row ${item.read ? "" : "is-unread"}`}
                key={item.id}
                type="button"
                onClick={() => {
                  dispatch({ type: "MARK_NOTIFICATION_READ", id: item.id });
                  if (item.action) navigate(item.action);
                  close();
                }}
              >
                <strong>{item.title}</strong>
                <span>{item.body}</span>
              </button>
            ))
          )}
          <Button variant="outlined" onClick={() => dispatch({ type: "CLEAR_NOTIFICATIONS" })}>
            Clear notifications
          </Button>
        </Box>
      </Menu>

      <Menu anchorEl={anchor} open={menu === "apps"} onClose={close} slotProps={{ paper: { sx: { width: 380 } } }}>
        <Box className="app-grid">
          {[
            ["Exness Terminal", exnessTerminalUrl],
            ["Trading calculator", ""],
            ["Partner Area", ""],
            ["Social Trading", "/pa/socialtrading"],
            ["Exness website", "https://my.exnesss.link.daboluo.pro"],
            ["Help Center", "/pa/support_hub/help_center"],
          ].map(([label, route]) => (
            <button
              type="button"
              key={label}
              onClick={() => {
                close();
                if (!route) {
                  openDialog({ name: "external", title: label, body: `${label} is represented as an Exness app shortcut.` });
                } else if (route.startsWith("http://") || route.startsWith("https://")) {
                  if (route === exnessTerminalUrl) {
                    openExnessTerminal();
                  } else {
                    window.open(route, "_blank", "noopener,noreferrer");
                  }
                } else {
                  navigate(route as Route);
                }
              }}
            >
              <AppWindow size={18} />
              {label}
            </button>
          ))}
        </Box>
      </Menu>

      <Menu anchorEl={anchor} open={menu === "profile"} onClose={close} slotProps={{ paper: { sx: { width: 320 } } }}>
        <Box className="profile-pop">
          <UserCircle size={34} />
          <div>
            <strong>{state.userProfile?.maskedEmail ?? "Personal Area"}</strong>
            <span>{kycStatusLabel(state.userProfile?.kycStatus ?? 0, state.settings.language)}</span>
          </div>
        </Box>
        <Divider />
        <MenuItem onClick={() => { close(); navigate("/pa/settings/profile"); }}>Settings</MenuItem>
        <MenuItem onClick={() => { close(); navigate("/pa/exness-benefits/swapfree"); }}>Trading Conditions</MenuItem>
        <MenuItem
          onClick={() => {
            close();
            void authApi.logout().finally(() => {
              clearTokens();
              writeAppRoot(true);
              setStage("login");
              toast("Signed out.");
            });
          }}
        >
          <LogOut size={16} />
          Sign out
        </MenuItem>
      </Menu>
    </header>
  );
}

function Sidebar({
  route,
  collapsed,
  openGroups,
  navigate,
  setCollapsed,
  toggleGroup,
  openDialog,
  isNarrow,
}: {
  route: Route;
  collapsed: boolean;
  openGroups: Record<GroupKey, boolean>;
  navigate: (route: Route) => void;
  setCollapsed: (value: boolean) => void;
  toggleGroup: (group: GroupKey) => void;
  openDialog: DialogOpener;
  isNarrow: boolean;
}) {
  const width = collapsed ? 56 : 280;
  const drawerWidth = { xs: 56, md: width };

  return (
    <Drawer
      variant="permanent"
      className="sidebar-drawer"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          top: 56,
          height: "calc(100vh - 56px)",
          overflowX: "hidden",
          display: "flex",
          flexDirection: "column",
          px: 1,
          py: 1,
        },
      }}
    >
      <MuiList className="sidebar-list">
        {sidebarGroups.slice(0, 3).map((group) => (
          <SideGroup
            key={group.key}
            group={group}
            route={route}
            open={openGroups[group.key]}
            collapsed={collapsed}
            onToggle={() => toggleGroup(group.key)}
            navigate={navigate}
            openDialog={openDialog}
          />
        ))}
        <SideGroup
          group={sidebarGroups[3]}
          route={route}
          open={openGroups.benefits}
          collapsed={collapsed}
          onToggle={() => toggleGroup("benefits")}
          navigate={navigate}
          openDialog={openDialog}
        />
        <SideLink icon={Copy} label="Copy Trading" route="/pa/socialtrading" current={route} collapsed={collapsed} navigate={navigate} />
        <SideLink icon={Heart} label="Support hub" route="/pa/support_hub/help_center" current={route} collapsed={collapsed} navigate={navigate} badge="New" />
        <SideGroup
          group={sidebarGroups[4]}
          route={route}
          open={openGroups.settings}
          collapsed={collapsed}
          onToggle={() => toggleGroup("settings")}
          navigate={navigate}
          openDialog={openDialog}
        />
      </MuiList>
      <div className="sidebar-bottom">
        <button className="refer-card" type="button" onClick={() => openDialog({ name: "refer" })}>
          <Gift size={18} />
          {!collapsed && <span>Refer traders, earn commission</span>}
        </button>
        <button
          className="collapse-button"
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          aria-label="Collapse sidebar"
          disabled={isNarrow}
        >
          {collapsed ? <ChevronsRight size={18} /> : <ChevronsLeft size={18} />}
        </button>
      </div>
    </Drawer>
  );
}

function SideGroup({
  group,
  route,
  open,
  collapsed,
  onToggle,
  navigate,
  openDialog,
}: {
  group: (typeof sidebarGroups)[number];
  route: Route;
  open: boolean;
  collapsed: boolean;
  onToggle: () => void;
  navigate: (route: Route) => void;
  openDialog: DialogOpener;
}) {
  const Icon = group.icon;
  const [flyoutAnchor, setFlyoutAnchor] = useState<HTMLElement | null>(null);
  const groupSelected = collapsed && group.children.some((child) => !child.external && child.route === route);

  useEffect(() => {
    setFlyoutAnchor(null);
  }, [route]);

  function closeFlyout() {
    setFlyoutAnchor(null);
  }

  function handleChildClick(child: (typeof group.children)[number]) {
    closeFlyout();
    if (child.href) {
      window.location.assign(child.href);
      return;
    }
    if (child.external) {
      openDialog({
        name: "external",
        title: child.label,
        body: `${child.label} opens outside the Personal Area. This preview keeps the action local.`,
      });
      return;
    }
    navigate(child.route);
  }

  function handleGroupClick(event: MouseEvent<HTMLElement>) {
    if (!collapsed) {
      onToggle();
      return;
    }
    setFlyoutAnchor(event.currentTarget);
  }

  return (
    <div className="sidebar-group">
      <ListItemButton onClick={handleGroupClick} selected={groupSelected || Boolean(flyoutAnchor)}>
        <ListItemIcon>
          <Icon size={18} />
        </ListItemIcon>
        {!collapsed && <ListItemText primary={group.label} />}
        {!collapsed && <ChevronDown className={`chevron ${open ? "is-open" : ""}`} size={16} />}
      </ListItemButton>
      {open && !collapsed ? (
        <MuiList className="sidebar-children" disablePadding>
          {group.children.map((child) => (
            <ListItemButton
              key={`${child.label}-${child.route}`}
              selected={!child.external && route === child.route}
              onClick={() => handleChildClick(child)}
            >
              <ListItemText primary={child.label} />
            </ListItemButton>
          ))}
        </MuiList>
      ) : null}
      {collapsed ? (
        <Menu
          anchorEl={flyoutAnchor}
          open={Boolean(flyoutAnchor)}
          onClose={closeFlyout}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          transformOrigin={{ vertical: "top", horizontal: "left" }}
          slotProps={{
            paper: {
              className: "sidebar-flyout-menu",
              sx: { minWidth: 220, ml: 0.5 },
            },
          }}
        >
          {group.children.map((child) => (
            <MenuItem
              key={`${child.label}-${child.route}`}
              selected={!child.external && route === child.route}
              onClick={() => handleChildClick(child)}
            >
              {child.label}
            </MenuItem>
          ))}
        </Menu>
      ) : null}
    </div>
  );
}

function SideLink({
  icon: Icon,
  label,
  route,
  current,
  collapsed,
  navigate,
  badge,
}: {
  icon: LucideIcon;
  label: string;
  route: Route;
  current: Route;
  collapsed: boolean;
  navigate: (route: Route) => void;
  badge?: string;
}) {
  return (
    <ListItemButton selected={current === route} onClick={() => navigate(route)}>
      <ListItemIcon>
        <Icon size={18} />
      </ListItemIcon>
      {!collapsed && <ListItemText primary={label} />}
      {!collapsed && badge && <Chip size="small" label={badge} color="primary" />}
    </ListItemButton>
  );
}

function KycBanner({ navigate, openDialog }: { navigate: (route: Route) => void; openDialog: DialogOpener }) {
  const { state } = usePA();
  const kycStatus = state.userProfile?.kycStatus ?? 0;
  const step1Done = state.userProfile?.profileStep1Done ?? false;
  const hasRealAccount = state.accounts.some((account) => account.kind === "Real" && account.status === "Active");
  if (kycStatus === 2 || !hasRealAccount) return null;

  function startVerification() {
    sessionStorage.setItem(PROFILE_FLOW_KEY, step1Done ? "identity" : "step1");
    navigate("/pa/settings/profile");
  }

  return (
    <div className="kyc-banner">
      <ShieldCheck size={24} />
      <div>
        <strong>您好！请完善账户资料，以便进行首次入金</strong>
        <span>Complete profile, identity and address verification to unlock the full payment flow.</span>
      </div>
      <Button variant="outlined" onClick={() => openDialog({ name: "verificationIntro" })}>
        了解详情
      </Button>
      <Button variant="contained" onClick={startVerification}>
        完成
      </Button>
    </div>
  );
}

function OrdersPage({ toast }: { toast: Toast }) {
  const { state, dispatch } = usePA();
  const [status, setStatus] = useState<OrderStatus | "All">("Closed");
  const [dateRange, setDateRange] = useState<DateRangeValue>({ start: null, end: null });
  const [accountId, setAccountId] = useState("all");
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (state.accounts.length === 0) {
      return;
    }
    let cancelled = false;
    (async () => {
      setRefreshing(true);
      try {
        const orders = await syncOrderHistory(state.accounts);
        if (!cancelled) {
          dispatch({ type: "SET_ORDERS", orders, loaded: true });
        }
      } catch (err) {
        if (!cancelled) {
          toast(err instanceof Error ? err.message : "Failed to load order history.");
        }
      } finally {
        if (!cancelled) {
          setRefreshing(false);
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, state.accounts, toast]);

  const rows = filterByDateRange(
    state.orders.filter((order) => (status === "All" || order.status === status) && (accountId === "all" || order.accountId === accountId)),
    dateRange,
  );

  if (!state.ordersLoaded) {
    return (
      <Page title="History of orders">
        <Typography color="text.secondary">{translateText("Loading...", state.settings.language)}</Typography>
      </Page>
    );
  }

  return (
    <Page title="History of orders">
      <div className="orders-history-toolbar">
        <OrdersHistoryFiltersBar
          status={status}
          onStatusChange={setStatus}
          accountId={accountId}
          onAccountIdChange={setAccountId}
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          accounts={state.accounts}
        />
        <Button
          className="orders-history-download"
          variant="outlined"
          startIcon={<Download size={16} />}
          disabled={refreshing || rows.length === 0}
          onClick={() => {
            downloadCsv("orders.csv", rows);
            toast("CSV download generated.");
          }}
        >
          Download CSV
        </Button>
      </div>
      <OrdersHistoryTable orders={rows} empty="No orders match this filter." />
    </Page>
  );
}

function PaymentsNoActiveAccounts({ navigate }: { navigate: (route: Route) => void }) {
  return (
    <div className="payments-no-active">
      <CircleHelp size={48} strokeWidth={1.5} className="payments-no-active-icon" aria-hidden />
      <Typography variant="h5" component="h2">
        You don&apos;t have any active accounts.
      </Typography>
      <Stack spacing={1} sx={{ alignItems: "center" }}>
        <Typography color="text.secondary">Only real accounts can be used for trading.</Typography>
        <Typography color="text.secondary">Create an account to start depositing and withdrawing.</Typography>
      </Stack>
      <Button variant="contained" onClick={() => navigate("/pa/trading/open-account")}>
        Create new account
      </Button>
    </div>
  );
}

function DepositMaintenanceDialog({
  open,
  language,
  onClose,
}: {
  open: boolean;
  language: string;
  onClose: () => void;
}) {
  const label = (text: string) => translateText(text, language);
  return (
    <Dialog open={open} onClose={onClose} className="deposit-maintenance-dialog" fullWidth maxWidth="xs">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
        {label("Scheduled maintenance reminder")}
        <IconButton aria-label="Close" onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        <Typography>{label("Payment services will be temporarily unavailable during the following period:")}</Typography>
        <strong className="maintenance-window">{depositMaintenanceWindow}</strong>
        <Typography sx={{ mt: 1.5 }}>
          {label(
            "After maintenance is completed, services will return to normal. We apologize for any inconvenience caused.",
          )}
        </Typography>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 3, pt: 0 }}>
        <Button fullWidth variant="contained" className="deposit-maintenance-submit" onClick={onClose}>
          {label("Got it")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function PaymentsPage({ route, openDialog, toast, navigate }: { route: Route; openDialog: DialogOpener; toast: Toast; navigate: (route: Route) => void }) {
  const { state, dispatch } = usePA();
  const language = state.settings.language;
  const kycStatus = state.userProfile?.kycStatus ?? 0;
  const [accountId, setAccountId] = useState(() => {
    const stored = sessionStorage.getItem(FUND_ACCOUNT_STORAGE_KEY);
    if (stored && state.accounts.some((account) => account.id === stored && account.status === "Active")) {
      sessionStorage.removeItem(FUND_ACCOUNT_STORAGE_KEY);
      return stored;
    }
    return pickDefaultFundAccountId(state.accounts, kycStatus);
  });
  const [transactionFilters, setTransactionFilters] = useState<TransactionHistoryFilters>(defaultTransactionHistoryFilters);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [maintenanceOpen, setMaintenanceOpen] = useState(false);
  const flow = route.includes("withdrawal") ? "withdrawal" : "deposit";

  useEffect(() => {
    if (route === "/pa/payments-and-wallet/deposit") {
      setMaintenanceOpen(true);
    }
  }, [route]);

  useEffect(() => {
    const realActive = state.accounts.filter((account) => account.status === "Active" && account.kind === "Real");
    const current = state.accounts.find((account) => account.id === accountId);
    if (!current || current.kind !== "Real" || current.status !== "Active") {
      setAccountId(pickDefaultFundAccountId(state.accounts, kycStatus));
    }
    if (realActive.length === 0 && accountId) {
      setAccountId("");
    }
  }, [state.accounts, kycStatus, accountId]);

  useEffect(() => {
    if (!route.startsWith("/pa/payments-and-wallet")) return;
    let cancelled = false;
    (async () => {
      try {
        const methods = await fundApi.fetchPaymentMethods(flow);
        if (!cancelled) setPaymentMethods(methods);
      } catch (err) {
        if (!cancelled) {
          setPaymentMethods([]);
          toast(err instanceof Error ? err.message : "Failed to load payment methods.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [flow, route, toast]);

  useEffect(() => {
    if (!route.endsWith("/history")) return;
    let cancelled = false;
    (async () => {
      try {
        const resp = await fundApi.fetchTransactions();
        if (!cancelled) dispatch({ type: "SET_TRANSACTIONS", transactions: resp.list });
      } catch (err) {
        if (!cancelled) toast(err instanceof Error ? err.message : "Failed to load transactions.");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [dispatch, route, toast]);

  if (route.endsWith("/history")) {
    const rows = filterTransactions(state.transactions, transactionFilters);
    return (
      <Page title="Transaction history" actions={<Button variant="outlined" startIcon={<Download size={16} />} onClick={() => {
          downloadCsv("transactions.csv", rows.map((item) => ({
            Reference: item.reference,
            Type: item.type,
            Account: formatAccountLabelById(state.accounts, item.accountId),
            Amount: formatMoney(item.amount, item.currency),
            Status: item.status,
            Created: formatDate(item.createdAt),
          })));
          toast("Transaction CSV generated.");
        }}>Download CSV</Button>}>
        <TransactionHistoryFiltersBar
          value={transactionFilters}
          onChange={setTransactionFilters}
          accounts={state.accounts}
        />
        <DataTable
          columns={["Reference", "Type", "Account", "Amount", "Status", "Created"]}
          rows={rows.map((item) => [item.reference, item.type, formatAccountLabelById(state.accounts, item.accountId), formatMoney(item.amount, item.currency), item.status, formatDate(item.createdAt)])}
          empty="No transactions found."
        />
      </Page>
    );
  }

  const realActiveAccounts = state.accounts.filter((account) => account.status === "Active" && account.kind === "Real");
  if (realActiveAccounts.length === 0) {
    return (
      <Page title={flow === "deposit" ? "Deposit" : "Withdrawal"}>
        <PaymentsNoActiveAccounts navigate={navigate} />
      </Page>
    );
  }

  const methods = paymentMethods.filter((method) => method.flow === flow);
  const selectedAccount = state.accounts.find((account) => account.id === accountId);
  const fundBlocked = !kycAllowsRealFund(kycStatus);
  return (
    <>
      <DepositMaintenanceDialog
        open={maintenanceOpen && flow === "deposit"}
        language={language}
        onClose={() => setMaintenanceOpen(false)}
      />
      <Page title={flow === "deposit" ? "Deposit" : "Withdrawal"}>
      <div className="payment-layout">
        <Paper className="payment-account">
          <Typography variant="h3">Account</Typography>
          <FormControl fullWidth size="small">
            <InputLabel>Trading account</InputLabel>
            <Select value={accountId} label="Trading account" onChange={(event) => setAccountId(event.target.value)}>
              {state.accounts
                .filter((account) => account.status === "Active" && account.kind === "Real")
                .map((account) => (
                  <MenuItem key={account.id} value={account.id}>
                    {formatAccountLabelById(state.accounts, account.id)} · {formatMoney(account.balance, account.currency)}
                    {account.kind === "Demo" ? " · Demo" : ""}
                  </MenuItem>
                ))}
            </Select>
          </FormControl>
          <Button variant="outlined" startIcon={<Send size={16} />} onClick={() => openDialog({ name: "transfer", accountId })}>
            Internal transfer
          </Button>
        </Paper>
        <Stack spacing={2}>
          {fundBlocked ? (
            <KycPaymentBlock kycStatus={kycStatus} language={language} navigate={navigate} openDialog={openDialog} toast={toast} />
          ) : null}
          <div className="method-grid">
            {methods.map((method) => (
              <button
                className="method-card"
                type="button"
                key={method.id}
                disabled={fundBlocked}
                onClick={() => {
                  if (fundBlocked) return;
                  openDialog({ name: "payment", flow, accountId });
                }}
              >
                <Stack direction="row" sx={{ justifyContent: "space-between" }}>
                  <CreditCard size={22} />
                  {method.recommended && <Chip label="Recommended" size="small" color="primary" />}
                </Stack>
                <strong>{method.name}</strong>
                <span>{method.network}</span>
                <small>{method.processingTime} · min {formatMoney(method.min)} · fee {method.fee}</small>
              </button>
            ))}
          </div>
        </Stack>
      </div>
    </Page>
    </>
  );
}

function BenefitsPage({ route, openDialog, navigate }: { route: Route; openDialog: DialogOpener; navigate: (route: Route) => void }) {
  const { state } = usePA();
  const active = route.includes("savings") ? "savings" : route.includes("vps") ? "vps" : "swap-free";
  return (
    <Page title={routeLabels[route]}>
      <div className="benefit-grid">
        {state.benefits.map((benefit) => (
          <Card key={benefit.id} className={benefit.id === active ? "is-featured" : ""}>
            <CardContent>
              <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "flex-start" }}>
                <Typography variant="h3">{benefit.title}</Typography>
                <Chip label={benefit.status} />
              </Stack>
              <Typography>{benefit.description}</Typography>
              {typeof benefit.savedAmount === "number" && <Typography variant="h2">{formatMoney(benefit.savedAmount)}</Typography>}
              <Typography color="text.secondary">{benefit.requirement}</Typography>
              <Button
                variant={benefit.id === active ? "contained" : "outlined"}
                onClick={() => {
                  if (benefit.id === "savings") navigate("/pa/exness-benefits/savings");
                  else if (benefit.id === "vps") navigate("/pa/exness-benefits/vps");
                  else openDialog({ name: "external", title: benefit.title, body: benefit.requirement });
                }}
              >
                {benefit.cta}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Page>
  );
}

function CopyTradingPage({ openDialog, toast }: { openDialog: DialogOpener; toast: Toast }) {
  const [risk, setRisk] = useState("All");
  const strategies = [
    { name: "Steady Gold", risk: "Medium", return: "18.4%", followers: 842 },
    { name: "FX Momentum", risk: "High", return: "31.2%", followers: 318 },
    { name: "Index Balance", risk: "Low", return: "9.8%", followers: 1204 },
  ];
  const rows = strategies.filter((strategy) => risk === "All" || strategy.risk === risk);
  return (
    <Page title="Copy Trading">
      <div className="toolbar">
        <ToggleButtonGroup exclusive value={risk} onChange={(_, value: string | null) => value && setRisk(value)}>
          <ToggleButton value="All">All</ToggleButton>
          <ToggleButton value="Low">Low risk</ToggleButton>
          <ToggleButton value="Medium">Medium</ToggleButton>
          <ToggleButton value="High">High</ToggleButton>
        </ToggleButtonGroup>
      </div>
      <div className="strategy-grid">
        {rows.map((strategy) => (
          <Card key={strategy.name}>
            <CardContent>
              <Typography variant="h3">{strategy.name}</Typography>
              <Typography variant="h2">{strategy.return}</Typography>
              <Typography color="text.secondary">{strategy.followers} investors · {strategy.risk} risk</Typography>
              <Button variant="contained" onClick={() => { openDialog({ name: "external", title: "Copy strategy", body: `${strategy.name} subscription simulated locally.` }); toast(`${strategy.name} opened.`); }}>
                Copy strategy
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </Page>
  );
}

function SupportHubPage({ openDialog, toast }: { openDialog: DialogOpener; toast: Toast }) {
  const { state } = usePA();
  const [query, setQuery] = useState("");
  const topics = [
    ["Deposits and withdrawals", "Payments, limits and processing time"],
    ["Account verification", "Documents, profile and address checks"],
    ["Trading platforms", "MT4, MT5 and Exness Terminal"],
    ["Security", "Password, devices and two-factor verification"],
  ].filter(([title, text]) => `${title} ${text}`.toLowerCase().includes(query.toLowerCase()));

  return (
    <Page title="Support hub">
      <section className="support-hero">
        <Typography variant="h2">How can we help you?</Typography>
        <TextField
          fullWidth
          placeholder="Search support topics"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          slotProps={{ input: { startAdornment: <InputAdornment position="start"><Search size={18} /></InputAdornment> } }}
        />
        <Stack direction="row" spacing={1} sx={{ flexWrap: "wrap" }}>
          <Button
            variant="contained"
            startIcon={<MessageCircle size={16} />}
            onClick={() => {
              window.dispatchEvent(new Event("exness-open-chat"));
              toast("Chat panel opened.");
            }}
          >
            Start chat
          </Button>
          <Button variant="outlined" startIcon={<FileText size={16} />} onClick={() => openDialog({ name: "ticket" })}>Open a ticket</Button>
        </Stack>
      </section>
      <div className="topic-grid">
        {topics.map(([title, text]) => (
          <Card key={title}>
            <CardContent>
              <Headphones size={22} />
              <Typography variant="h3">{title}</Typography>
              <Typography>{text}</Typography>
            </CardContent>
          </Card>
        ))}
      </div>
      <Typography variant="h2">My tickets</Typography>
      <DataTable
        columns={["Ticket", "Subject", "Category", "Status", "Updated"]}
        rows={state.tickets.map((ticket) => [ticket.id, ticket.subject, ticket.category, ticket.status, formatDate(ticket.updatedAt)])}
        empty="No support tickets yet."
      />
    </Page>
  );
}

function TerminalSettingsSection({ toast }: { toast: Toast }) {
  const { state, dispatch } = usePA();
  const [editing, setEditing] = useState<"MT5" | "MT4" | null>(null);
  const [draftMt5, setDraftMt5] = useState<Mt5Terminal | "">("");
  const [draftMt4, setDraftMt4] = useState<Mt4Terminal | "">("");

  const mt5Options: Mt5Terminal[] = ["Exness Web Trading Terminal", "MetaTrader 5", "MT5 Web Terminal"];
  const mt4Options: Mt4Terminal[] = ["MetaTrader 4", "MT4 Web Terminal"];

  const openEditor = (platform: "MT5" | "MT4") => {
    setEditing(platform);
    if (platform === "MT5") {
      setDraftMt5(state.settings.mt5Terminal ?? "");
    } else {
      setDraftMt4(state.settings.mt4Terminal ?? "");
    }
  };

  const closeEditor = () => {
    setEditing(null);
    setDraftMt5("");
    setDraftMt4("");
  };

  const saveMt5 = () => {
    if (!draftMt5) return;
    dispatch({ type: "SET_MT5_TERMINAL", terminal: draftMt5 });
    toast("Trading terminal preferences saved.");
    closeEditor();
  };

  const saveMt4 = () => {
    if (!draftMt4) return;
    dispatch({ type: "SET_MT4_TERMINAL", terminal: draftMt4 });
    toast("Trading terminal preferences saved.");
    closeEditor();
  };

  const renderEditor = (
    platform: "MT5" | "MT4",
    options: readonly string[],
    draft: string,
    onDraftChange: (value: string) => void,
    onSave: () => void,
  ) => (
    <div className="terminal-settings-editor">
      <div className="terminal-settings-editor-title">Set trading terminal</div>
      <div className="terminal-settings-options" role="radiogroup" aria-label="Set trading terminal">
        {options.map((option) => (
          <label key={option} className="terminal-settings-option">
            <input
              type="radio"
              name={`terminal-${platform}`}
              value={option}
              checked={draft === option}
              onChange={() => onDraftChange(option)}
            />
            <span>{option}</span>
          </label>
        ))}
      </div>
      <div className="terminal-settings-actions">
        <button
          type="button"
          className={`terminal-settings-save-btn${draft ? " is-active" : ""}`}
          disabled={!draft}
          onClick={onSave}
        >
          Set terminal
        </button>
        <button type="button" className="terminal-settings-cancel-btn" onClick={closeEditor}>
          Cancel
        </button>
      </div>
    </div>
  );

  return (
    <div className="terminal-settings-panel">
      <div className={`terminal-settings-row${editing === "MT5" ? " is-editing" : ""}`}>
        <div className="terminal-settings-label">MT5 Account</div>
        <div className="terminal-settings-content">
          {editing === "MT5" ? (
            renderEditor("MT5", mt5Options, draftMt5, (value) => setDraftMt5(value as Mt5Terminal), saveMt5)
          ) : (
            <div className="terminal-settings-summary">
              <span className="terminal-settings-status">Set your default terminal</span>
              <button type="button" className="terminal-settings-change-btn" onClick={() => openEditor("MT5")}>
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      <div className={`terminal-settings-row${editing === "MT4" ? " is-editing" : ""}`}>
        <div className="terminal-settings-label">MT4 Account</div>
        <div className="terminal-settings-content">
          {editing === "MT4" ? (
            renderEditor("MT4", mt4Options, draftMt4, (value) => setDraftMt4(value as Mt4Terminal), saveMt4)
          ) : (
            <div className="terminal-settings-summary">
              <span className="terminal-settings-status">Set your default terminal</span>
              <button type="button" className="terminal-settings-change-btn" onClick={() => openEditor("MT4")}>
                Change
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="terminal-settings-row">
        <div className="terminal-settings-label">EXT Account</div>
        <div className="terminal-settings-content">
          <span className="terminal-settings-static">Exness trading terminal only</span>
        </div>
      </div>
    </div>
  );
}

function SettingsPage({ route, openDialog, toast }: { route: Route; openDialog: DialogOpener; toast: Toast }) {
  const { state, dispatch, verificationComplete } = usePA();
  const language = state.settings.language;
  if (route.endsWith("/security")) {
    const maskedEmail = state.userProfile?.maskedEmail ?? "—";
    return (
      <Page title="Security">
        <section className="security-section">
          <h2 className="security-section-title">登录信息</h2>
          <p className="security-section-desc">
            用于登录 Exness 的信息。如您认为密码可能已经泄露，请随时更改密码。
          </p>
          <div className="security-panel">
            <div className="security-row">
              <span className="security-label">登录</span>
              <span className="security-value">{maskedEmail}</span>
              <span className="security-action-spacer" aria-hidden="true" />
            </div>
            <div className="security-row">
              <span className="security-label">密码</span>
              <span className="security-value security-password">••••••••••••</span>
              <button type="button" className="security-change-btn" onClick={() => openDialog({ name: "password" })}>
                更改
              </button>
            </div>
          </div>
        </section>

        <section className="security-section">
          <h2 className="security-section-title">2 步验证方式</h2>
          <p className="security-section-desc">
            2 步验证可以确保所有敏感交易均已得到您的授权。我们建议您输入验证码确认相关交易。
          </p>
          <div className="security-panel">
            <div className="security-row">
              <span className="security-label">验证方式</span>
              <span className="security-value">{maskedEmail}</span>
              <button
                type="button"
                className="security-change-btn"
                onClick={() => toast("Email verification is your current two-step method.")}
              >
                更改
              </button>
            </div>
          </div>
        </section>

        <section className="security-section">
          <h2 className="security-section-title">设备和账户安全</h2>
          <div className="security-panel">
            <div className="security-row security-row--devices">
              <span className="security-device-text">
                从其他所有设备（本设备除外）退出登录，以确保账户安全。
              </span>
              <button
                type="button"
                className="security-logout-btn"
                onClick={() => {
                  dispatch({ type: "LOG_OUT_OTHER_SESSIONS" });
                  toast("Logged out from other devices.");
                }}
              >
                <LogOut size={16} />
                从其他设备退出登录
              </button>
            </div>
          </div>
        </section>
      </Page>
    );
  }

  if (route.endsWith("/terminal-settings")) {
    return (
      <Page title="Trading Terminal">
        <Typography className="terminal-settings-lead" color="text.secondary">
          Set the default trading terminal for all your MT4 and MT5 accounts.
        </Typography>
        <TerminalSettingsSection toast={toast} />
      </Page>
    );
  }

  return <ProfilePage toast={toast} />;
}

function DialogHost({
  dialog,
  close,
  openDialog,
  toast,
  setStage,
  navigate,
}: {
  dialog: DialogState;
  close: () => void;
  openDialog: DialogOpener;
  toast: Toast;
  setStage: (stage: Stage) => void;
  navigate: (route: Route) => void;
}) {
  const { state } = usePA();
  if (!dialog) return null;
  if (dialog.name === "trade") {
    const account = state.accounts.find((item) => item.id === dialog.accountId);
    if (!account) return null;
    return <TradeDialog account={account} close={close} toast={toast} navigate={navigate} />;
  }
  if (dialog.name === "payment") return <PaymentFlowDialog flow={dialog.flow} accountId={dialog.accountId} close={close} openDialog={openDialog} toast={toast} />;
  if (dialog.name === "transfer") return <TransferDialog accountId={dialog.accountId} close={close} toast={toast} />;
  if (dialog.name === "ticket") return <TicketDialog close={close} toast={toast} />;
  if (dialog.name === "verificationIntro") {
    const kycStatus = state.userProfile?.kycStatus ?? 0;
    const step1Done = state.userProfile?.profileStep1Done ?? false;
    const activeStep = resolveVerificationIntroActiveStep({ profileStep1Done: step1Done, kycStatus });
    return (
      <VerificationStepsIntroModal
        activeStep={activeStep}
        onClose={close}
        onVerify={() => {
          close();
          sessionStorage.setItem(PROFILE_FLOW_KEY, step1Done ? "identity" : "step1");
          navigate("/pa/settings/profile");
        }}
      />
    );
  }
  if (dialog.name === "verification") return <VerificationDialog stepId={dialog.stepId} close={close} toast={toast} />;
  if (dialog.name === "rename") return <RenameDialog accountId={dialog.accountId} close={close} toast={toast} />;
  if (dialog.name === "leverage") return <LeverageDialog accountId={dialog.accountId} close={close} toast={toast} />;
  if (dialog.name === "accountInfo") return <AccountInfoDialog accountId={dialog.accountId} close={close} openDialog={openDialog} toast={toast} />;
  if (dialog.name === "password") return <PasswordDialog close={close} toast={toast} setStage={setStage} />;
  if (dialog.name === "terminate") return <ConfirmDialog title="Terminate Personal Area" body="This is a static preview, so termination only shows the confirmation flow and does not delete anything." close={close} confirmLabel="Terminate" onConfirm={() => toast("Termination request simulated locally.")} />;
  if (dialog.name === "wallet") return <WalletDialog close={close} toast={toast} />;
  if (dialog.name === "setBalance") return <SetBalanceDialog accountId={dialog.accountId} close={close} toast={toast} />;
  if (dialog.name === "refer") return <ConfirmDialog title="Become a partner" body="Invite a friend and earn up to 40% of our revenue. The partner link can be copied in this preview." close={close} confirmLabel="Copy link" onConfirm={() => copyToClipboard("https://one.exness.link/a/mock-partner", toast)} />;
  return <ConfirmDialog title={dialog.title} body={dialog.body} close={close} confirmLabel="Got it" onConfirm={() => undefined} />;
}

function PaymentFlowDialog({ flow, accountId, close, openDialog, toast }: { flow: "deposit" | "withdrawal"; accountId?: string; close: () => void; openDialog: DialogOpener; toast: Toast }) {
  const { state, dispatch } = usePA();
  const language = state.settings.language;
  const kycStatus = state.userProfile?.kycStatus ?? 0;
  const fundAccounts = state.accounts.filter((account) => account.status === "Active" && account.kind === "Real");
  const [activeStep, setActiveStep] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState(() => {
    if (accountId && fundAccounts.some((item) => item.id === accountId)) {
      return accountId;
    }
    return fundAccounts[0]?.id ?? "";
  });
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodId, setMethodId] = useState("");
  const [amountText, setAmountText] = useState(() => defaultAmountText(flow));
  const [voucherImage, setVoucherImage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingWithdraw, setPendingWithdraw] = useState(false);
  const account = state.accounts.find((item) => item.id === selectedAccount);
  const isDemo = isDemoFundFlow(account?.kind ?? "Real");
  const steps = isDemo ? ["Account", "Method", "Amount", "Confirm"] : ["Account", "Method", "Amount", "Voucher", "Confirm"];
  const voucherStep = 3;
  const confirmStep = isDemo ? 3 : 4;
  const realVoucherRequired = !isDemo && !voucherImage.trim();
  const method = methods.find((item) => item.id === methodId);
  const canProceed = account ? canFundAccount(account.kind, kycStatus) : false;
  const availableBalance = account?.balance ?? 0;
  const amount = parseFundAmount(amountText);
  const amountError = validateFundAmount(flow, amount, availableBalance, method);
  const amountBlocksContinue = activeStep >= 2 && (amount <= 0 || Boolean(amountError));

  useEffect(() => {
    if (accountId && fundAccounts.some((item) => item.id === accountId)) {
      setSelectedAccount(accountId);
    }
  }, [accountId, fundAccounts]);

  useEffect(() => {
    setVoucherImage("");
  }, [isDemo]);

  useEffect(() => {
    setAmountText(defaultAmountText(flow));
  }, [selectedAccount, flow]);

  useEffect(() => {
    if (flow !== "withdrawal" || !canProceed || isDemo) {
      setPendingWithdraw(false);
      return;
    }
    let cancelled = false;
    void fundApi.fetchTransactions(1, 50).then((resp) => {
      if (cancelled) return;
      const hasPending = resp.list.some(
        (item) => item.type === "withdrawal" && item.status === "Pending" && item.accountId === selectedAccount,
      );
      setPendingWithdraw(hasPending);
    }).catch(() => {
      if (!cancelled) setPendingWithdraw(false);
    });
    return () => {
      cancelled = true;
    };
  }, [flow, canProceed, selectedAccount, isDemo]);

  useEffect(() => {
    if (activeStep > confirmStep) {
      setActiveStep(confirmStep);
    }
  }, [activeStep, confirmStep]);

  useEffect(() => {
    if (!canProceed) return;
    let cancelled = false;
    (async () => {
      try {
        const list = await fundApi.fetchPaymentMethods(flow);
        if (cancelled) return;
        setMethods(list);
        setMethodId(list[0]?.id ?? "");
      } catch (err) {
        if (!cancelled) {
          setMethods([]);
          setMethodId("");
          toast(err instanceof Error ? err.message : "Failed to load payment methods.");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [flow, canProceed, toast]);

  function goNext() {
    if (realVoucherRequired && activeStep === voucherStep) {
      toast("Please upload a payment voucher before continuing.");
      return;
    }
    if (activeStep === 2) {
      const parsed = parseFundAmount(amountText);
      const err = validateFundAmount(flow, parsed, availableBalance, method);
      if (err) {
        toast(err);
        return;
      }
      setAmountText(formatFundAmountText(parsed));
    }
    setActiveStep(activeStep + 1);
  }

  async function finish() {
    if (!canProceed) {
      promptKycForPayments(kycStatus, openDialog, toast, language);
      close();
      return;
    }
    const submitAmount = parseFundAmount(amountText);
    if (!selectedAccount || !methodId || submitAmount <= 0) return;
    const err = validateFundAmount(flow, submitAmount, availableBalance, method);
    if (err) {
      toast(err);
      return;
    }
    if (realVoucherRequired) {
      toast("Payment voucher is required for Real account deposit and withdrawal.");
      return;
    }
    if (flow === "withdrawal" && pendingWithdraw && !isDemo) {
      toast("您有一笔 Real 出金正在审核中，请等待后台处理后再提交。");
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        accountId: selectedAccount,
        methodId,
        amount: roundFundAmount(submitAmount),
        currency: account?.currency ?? "USD",
        voucherImage: isDemo ? undefined : voucherImage,
      };
      const transaction =
        flow === "deposit" ? await fundApi.createDeposit(payload) : await fundApi.createWithdraw(payload);
      const txResp = await fundApi.fetchTransactions(1, 50);
      dispatch({ type: "SET_TRANSACTIONS", transactions: txResp.list });
      const accounts = await fundApi.fetchAccounts();
      dispatch({ type: "SET_ACCOUNTS", accounts });
      if (flow === "withdrawal") {
        if (isDemo && transaction.status === "Completed") {
          toast("Demo 出金已即时到账。");
        } else if (transaction.status === "Pending") {
          toast("出金已提交，等待后台审核。审核期间资金已冻结，请勿重复提交。");
          setPendingWithdraw(true);
        } else {
          toast(`出金状态：${transaction.status}`);
        }
      } else if (transaction.status === "Completed") {
        toast("入金已完成。");
      } else {
        toast("入金已提交，等待后台审核。");
      }
      close();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Payment request failed.";
      if (msg.includes("already pending review") || msg.includes("42002")) {
        if (isDemo) {
          toast("Demo 出金被 Real 待审单拦截，通常是后端未更新。请确认请求 accountId 为 Demo 账户并重启 simu-stock-server。");
        } else {
          toast("您有一笔 Real 出金正在审核中，请等待后台处理。");
          setPendingWithdraw(true);
        }
      } else {
        toast(msg);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (!canProceed) {
    return (
      <Dialog open onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>{flow === "deposit" ? "Deposit" : "Withdrawal"}</DialogTitle>
        <DialogContent>
          <KycPaymentBlock kycStatus={kycStatus} language={language} openDialog={openDialog} toast={toast} />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>Close</Button>
          <Button
            variant="contained"
            onClick={() => {
              promptKycForPayments(kycStatus, openDialog, toast, language);
              close();
            }}
          >
            {kycStatus === 1 ? "查看状态" : "Verify now"}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>{flow === "deposit" ? "Deposit" : "Withdrawal"}</DialogTitle>
      <DialogContent className="dialog-grid">
        {flow === "withdrawal" && pendingWithdraw && !isDemo ? (
          <Alert severity="warning">
            您有一笔 Real 账户出金正在审核中，资金已冻结。请等待后台审核完成后再提交新的 Real 出金。
          </Alert>
        ) : null}
        {!isDemo && flow === "withdrawal" ? (
          <Alert severity="info">Real 账户出金需 KYC 通过且后台人工审核，提交后不会即时到账。</Alert>
        ) : null}
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{label}</StepLabel></Step>
          ))}
        </Stepper>
        {activeStep === 0 && (
          <FormControl fullWidth>
            <InputLabel>Trading account</InputLabel>
            <Select value={selectedAccount} label="Trading account" onChange={(event) => setSelectedAccount(event.target.value)}>
              {fundAccounts.map((item) => (
                <MenuItem key={item.id} value={item.id}>{formatAccountLabelById(state.accounts, item.id)} · {formatMoney(item.balance, item.currency)}</MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {activeStep === 1 && (
          <div className="method-grid compact">
            {methods.map((item) => (
              <button key={item.id} className={`method-card ${methodId === item.id ? "is-selected" : ""}`} type="button" onClick={() => setMethodId(item.id)}>
                <CreditCard size={22} />
                <strong>{item.name}</strong>
                <span>{item.network}</span>
                <small>{item.processingTime} · {item.fee}</small>
              </button>
            ))}
          </div>
        )}
        {activeStep === 2 && (
          <TextField
            label="Amount"
            type="text"
            inputMode="decimal"
            placeholder={flow === "deposit" ? FUND_AMOUNT_DEFAULT_DEPOSIT : "0.00"}
            value={amountText}
            onChange={(event) => setAmountText(normalizeAmountInput(event.target.value))}
            onBlur={() => {
              const parsed = parseFundAmount(amountText);
              if (Number.isFinite(parsed) && parsed > 0) {
                setAmountText(formatFundAmountText(parsed));
              }
            }}
            error={Boolean(amountError)}
            helperText={
              amountError
                ?? (flow === "withdrawal"
                  ? `Available ${formatMoney(availableBalance, account?.currency ?? "USD")}${method ? ` · Min ${formatMoney(method.min)} · Max ${formatMoney(method.max)}` : ""}`
                  : method ? `Min ${formatMoney(method.min)} · Max ${formatMoney(method.max)}` : "")
            }
          />
        )}
        {!isDemo && activeStep === voucherStep && (
          <Stack spacing={1}>
            <Typography color="text.secondary">
              Upload payment voucher (jpeg/png) <Typography component="span" color="error">*</Typography>
            </Typography>
            {!voucherImage ? <Alert severity="warning">Voucher is required for Real account.</Alert> : null}
            <Button variant="outlined" component="label">
              Choose file
              <input
                hidden
                type="file"
                accept="image/png,image/jpeg"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (!file) return;
                  void compressImageFile(file).then(setVoucherImage).catch(() => toast("Failed to read voucher image."));
                }}
              />
            </Button>
            {voucherImage ? <Box component="img" src={voucherImage} alt="Voucher preview" sx={{ maxHeight: 160, borderRadius: 1 }} /> : null}
          </Stack>
        )}
        {activeStep === confirmStep && (
          <Paper className="confirm-box">
            <Info label="Account" value={account ? formatAccountLabelById(state.accounts, account.id) : ""} />
            <Info label="Method" value={method ? `${method.name} ${method.network}` : ""} />
            <Info label="Amount" value={formatMoney(roundFundAmount(amount), account?.currency ?? "USD")} />
            <Info label="Fee" value={method?.fee ?? "0%"} />
            {!isDemo ? <Info label="Voucher" value={voucherImage ? "Attached" : "Missing"} /> : null}
            <Typography variant="caption" color="text.secondary">
              {isDemo
                ? "Demo account: funds settle immediately, no voucher required."
                : "Real account: submitted for admin review after confirmation."}
            </Typography>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={activeStep === 0 ? close : () => setActiveStep(activeStep - 1)}>{activeStep === 0 ? "Cancel" : "Back"}</Button>
        <Button
          variant="contained"
          disabled={
            !selectedAccount
            || !methodId
            || amountBlocksContinue
            || submitting
            || (flow === "withdrawal" && pendingWithdraw && !isDemo)
            || (realVoucherRequired && (activeStep === voucherStep || activeStep === confirmStep))
          }
          onClick={activeStep === confirmStep ? () => void finish() : goNext}
        >
          {activeStep === confirmStep ? (submitting ? "Submitting..." : "Confirm") : "Continue"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TransferDialog({ accountId, close, toast }: { accountId?: string; close: () => void; toast: Toast }) {
  const { state, dispatch } = usePA();
  const accounts = state.accounts.filter((account) => account.status === "Active");
  const [from, setFrom] = useState(accountId ?? accounts[0]?.id ?? "");
  const [to, setTo] = useState(accounts.find((account) => account.id !== from)?.id ?? "");
  const [amountText, setAmountText] = useState("25");

  const amount = parseFundAmount(amountText);
  const amountValid = Number.isFinite(amount) && amount >= 0;

  function finish() {
    const submitAmount = roundFundAmount(amount);
    if (!Number.isFinite(submitAmount) || submitAmount < 0) {
      return;
    }
    dispatch({
      type: "ADD_TRANSACTION",
      payload: {
        type: "transfer",
        accountId: from,
        targetAccountId: to,
        amount: submitAmount,
        currency: "USD",
        fee: "0%",
      },
    });
    toast("Transfer completed locally.");
    close();
  }

  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Transfer</DialogTitle>
      <DialogContent className="dialog-grid">
        <FormControl fullWidth>
          <InputLabel>From account</InputLabel>
          <Select value={from} label="From account" onChange={(event) => setFrom(event.target.value)}>
            {accounts.map((account) => <MenuItem key={account.id} value={account.id}>{formatAccountLabelById(state.accounts, account.id)} · {formatMoney(account.balance, account.currency)}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>To account</InputLabel>
          <Select value={to} label="To account" onChange={(event) => setTo(event.target.value)}>
            {accounts.filter((account) => account.id !== from).map((account) => <MenuItem key={account.id} value={account.id}>{formatAccountLabelById(state.accounts, account.id)}</MenuItem>)}
          </Select>
        </FormControl>
        <TextField
          label="Amount"
          type="text"
          inputMode="decimal"
          placeholder="0.00"
          value={amountText}
          onChange={(event) => setAmountText(normalizeAmountInput(event.target.value))}
          onBlur={() => {
            const parsed = parseFundAmount(amountText);
            if (Number.isFinite(parsed) && parsed >= 0) {
              setAmountText(parsed === 0 ? "0" : formatFundAmountText(parsed));
            }
          }}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button variant="contained" disabled={!from || !to || from === to || !amountValid} onClick={finish}>Transfer</Button>
      </DialogActions>
    </Dialog>
  );
}

function TicketDialog({ close, toast }: { close: () => void; toast: Toast }) {
  const { dispatch } = usePA();
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("Payments");
  const [message, setMessage] = useState("");

  function submit() {
    dispatch({ type: "ADD_TICKET", payload: { subject, category, message } });
    toast("Support ticket opened.");
    close();
  }

  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Open a ticket</DialogTitle>
      <DialogContent className="dialog-grid">
        <TextField label="Subject" value={subject} onChange={(event) => setSubject(event.target.value)} />
        <FormControl fullWidth>
          <InputLabel>Category</InputLabel>
          <Select value={category} label="Category" onChange={(event) => setCategory(event.target.value)}>
            <MenuItem value="Payments">Payments</MenuItem>
            <MenuItem value="Verification">Verification</MenuItem>
            <MenuItem value="Trading">Trading</MenuItem>
            <MenuItem value="Security">Security</MenuItem>
          </Select>
        </FormControl>
        <TextField label="Message" value={message} onChange={(event) => setMessage(event.target.value)} multiline minRows={4} />
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button variant="contained" disabled={!subject || !message} onClick={submit}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
}

function VerificationDialog({ stepId, close, toast }: { stepId?: string; close: () => void; toast: Toast }) {
  const { state, dispatch } = usePA();
  const kycStatus = state.userProfile?.kycStatus ?? 0;
  const firstPending = state.verification.find((step) => step.status !== "Completed");
  const [selected, setSelected] = useState(stepId ?? firstPending?.id ?? state.verification[0]?.id ?? "");
  const step = state.verification.find((item) => item.id === selected);
  const [values, setValues] = useState<Record<string, string>>({});
  const [fullName, setFullName] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [idFrontImage, setIdFrontImage] = useState("");
  const [idBackImage, setIdBackImage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function submit() {
    if (!step) return;
    if (step.id === "identity") {
      if (kycIdentityLocked(kycStatus)) {
        if (kycStatus === 1) {
          toast("KYC 审核中，请等待后台处理，暂不可重复提交。");
        } else {
          toast("Identity verification already approved.");
        }
        close();
        return;
      }
      if (!fullName.trim() || !idNumber.trim()) {
        toast("请填写姓名和证件号码。");
        return;
      }
      if (!idFrontImage.trim() || !idBackImage.trim()) {
        toast("请上传身份证正反面照片。");
        return;
      }
      setSubmitting(true);
      try {
        await kycApi.submitKyc({
          fullName: fullName.trim(),
          idNumber: idNumber.trim(),
          idFrontImage,
          idBackImage,
        });
        const kycStatus = await syncUserProfile(dispatch);
        if (kycStatus === 2) {
          toast("KYC 已通过。");
        } else if (kycStatus === 1) {
          toast("KYC 已提交，状态：审核中，请等待后台处理。");
        } else {
          toast("KYC 已提交，请等待后台审核。");
        }
        close();
      } catch (err) {
        toast(err instanceof Error ? err.message : "KYC submission failed.");
      } finally {
        setSubmitting(false);
      }
      return;
    }
    dispatch({ type: "COMPLETE_VERIFICATION", stepId: step.id, values });
    toast("验证信息已保存。");
    close();
  }

  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Account verification</DialogTitle>
      <DialogContent className="dialog-grid">
        <FormControl fullWidth>
          <InputLabel>Step</InputLabel>
          <Select value={selected} label="Step" onChange={(event) => setSelected(event.target.value)}>
            {state.verification.map((item) => <MenuItem key={item.id} value={item.id}>{item.title} · {item.status}</MenuItem>)}
          </Select>
        </FormControl>
        {step ? <Typography color="text.secondary">{step.description}</Typography> : null}
        {step?.id === "identity" ? (
          <>
            {kycStatus === 1 ? (
              <Alert severity="info">KYC 审核中，请等待后台处理。审核完成前不可修改或重新上传。</Alert>
            ) : null}
            {kycStatus === 3 && state.userProfile?.kycRejectReason ? (
              <Alert severity="warning">Previous rejection: {state.userProfile.kycRejectReason}</Alert>
            ) : null}
            {kycStatus !== 1 ? (
              <Alert severity="info">
                请上传身份证正反面照片。提交后需后台人工审核，审核通过后方可进行 Real 账户充提。
              </Alert>
            ) : null}
            <TextField
              label="姓名"
              value={fullName}
              onChange={(event) => setFullName(event.target.value)}
              disabled={kycIdentityLocked(kycStatus)}
              fullWidth
              required
            />
            <TextField
              label="证件号码"
              value={idNumber}
              onChange={(event) => setIdNumber(event.target.value)}
              disabled={kycIdentityLocked(kycStatus)}
              fullWidth
              required
            />
            <Stack spacing={1}>
              <Typography variant="body2">
                身份证正面 <Typography component="span" color="error">*</Typography>
              </Typography>
              <Button variant="outlined" component="label" disabled={kycIdentityLocked(kycStatus)}>
                选择正面照片
                <input
                  hidden
                  type="file"
                  accept="image/png,image/jpeg"
                  disabled={kycIdentityLocked(kycStatus)}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void compressImageFile(file).then(setIdFrontImage).catch(() => toast("Invalid front image."));
                  }}
                />
              </Button>
              {idFrontImage ? <Box component="img" src={idFrontImage} alt="身份证正面" sx={{ maxHeight: 120, borderRadius: 1 }} /> : null}
              <Typography variant="body2">
                身份证反面 <Typography component="span" color="error">*</Typography>
              </Typography>
              <Button variant="outlined" component="label" disabled={kycIdentityLocked(kycStatus)}>
                选择反面照片
                <input
                  hidden
                  type="file"
                  accept="image/png,image/jpeg"
                  disabled={kycIdentityLocked(kycStatus)}
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (!file) return;
                    void compressImageFile(file).then(setIdBackImage).catch(() => toast("Invalid back image."));
                  }}
                />
              </Button>
              {idBackImage ? <Box component="img" src={idBackImage} alt="身份证反面" sx={{ maxHeight: 120, borderRadius: 1 }} /> : null}
            </Stack>
          </>
        ) : (
          step?.fields.map((field) => (
            <TextField
              key={field}
              label={field}
              value={values[field] ?? ""}
              onChange={(event) => setValues((current) => ({ ...current, [field]: event.target.value }))}
              disabled={step.status === "Completed"}
            />
          ))
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button
          variant="contained"
          disabled={
            !step
            || step.status === "Completed"
            || (step.id === "identity" && kycIdentityLocked(kycStatus))
            || submitting
            || (step.id === "identity" && !kycIdentityLocked(kycStatus) && (!fullName.trim() || !idNumber.trim() || !idFrontImage || !idBackImage))
          }
          onClick={() => void submit()}
        >
          {submitting ? "Submitting..." : step?.id === "identity" ? (kycStatus === 1 ? "审核中" : "Verify") : "Complete"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function SetBalanceDialog({ accountId, close, toast }: { accountId: string; close: () => void; toast: Toast }) {
  const { state, dispatch } = usePA();
  const account = state.accounts.find((item) => item.id === accountId);
  const [amountText, setAmountText] = useState(account ? String(account.balance) : "");
  const [submitting, setSubmitting] = useState(false);
  if (!account) return null;
  const acc = account;

  async function submit() {
    const amount = parseFundAmount(amountText);
    if (!Number.isFinite(amount) || amount < 0) {
      toast("Enter a valid amount.");
      return;
    }
    setSubmitting(true);
    try {
      const updated = await fundApi.setDemoAccountBalance({
        accountId,
        amount,
        currency: acc.currency,
      });
      const accounts = state.accounts.map((item) => (item.id === accountId ? updated : item));
      dispatch({ type: "SET_ACCOUNTS", accounts });
      toast("Demo account balance updated.");
      close();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to set demo balance.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onClose={close} fullWidth maxWidth="xs">
      <DialogTitle className="set-balance-dialog-title">
        <div>
          <Typography variant="h6" component="div">
            Set balance for demo account
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Account: {formatAccountOptionLabel(account)}
          </Typography>
        </div>
        <IconButton aria-label="Close" onClick={close}>
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent className="dialog-grid set-balance-dialog-content">
        <TextField
          label="Amount"
          value={amountText}
          onChange={(event) => setAmountText(normalizeAmountInput(event.target.value))}
          fullWidth
          slotProps={{
            input: {
              endAdornment: <InputAdornment position="end">{account.currency}</InputAdornment>,
            },
          }}
        />
        <Button variant="contained" fullWidth className="set-balance-submit" disabled={submitting} onClick={() => void submit()}>
          {submitting ? "Saving..." : "Set balance"}
        </Button>
      </DialogContent>
    </Dialog>
  );
}

function RenameDialog({ accountId, close, toast }: { accountId: string; close: () => void; toast: Toast }) {
  const { state, dispatch } = usePA();
  const account = state.accounts.find((item) => item.id === accountId);
  const [nickname, setNickname] = useState(account?.nickname ?? "");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const name = nickname.trim();
    if (!name) {
      toast("Account name is required.");
      return;
    }
    setSaving(true);
    try {
      await webtradingApi.patchAccount(accountId, { name });
      const accounts = await fundApi.fetchAccounts();
      dispatch({ type: "SET_ACCOUNTS", accounts });
      toast("Account renamed.");
      close();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>
        <div>
          Rename account
          {account ? (
            <Typography variant="body2" color="text.secondary" component="div">
              {formatAccountOptionLabel(account)}
            </Typography>
          ) : null}
        </div>
      </DialogTitle>
      <DialogContent className="dialog-grid">
        <TextField label="Account name" value={nickname} onChange={(event) => setNickname(event.target.value)} />
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={() => void onSave()} disabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function LeverageDialog({ accountId, close, toast }: { accountId: string; close: () => void; toast: Toast }) {
  const { state, dispatch } = usePA();
  const account = state.accounts.find((item) => item.id === accountId);
  const [leverage, setLeverage] = useState(account?.leverage ?? "1:2000");
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    setSaving(true);
    try {
      const ratio = webtradingApi.parseLeverageRatio(leverage);
      await webtradingApi.patchAccount(accountId, { leverage: ratio });
      const accounts = await fundApi.fetchAccounts();
      dispatch({ type: "SET_ACCOUNTS", accounts });
      toast("Leverage changed.");
      close();
    } catch (error) {
      toast(error instanceof Error ? error.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>
        <div>
          Change leverage
          {account ? (
            <Typography variant="body2" color="text.secondary" component="div">
              {formatAccountOptionLabel(account)}
            </Typography>
          ) : null}
        </div>
      </DialogTitle>
      <DialogContent className="dialog-grid">
        <FormControl fullWidth>
          <InputLabel>Leverage</InputLabel>
          <Select value={leverage} label="Leverage" onChange={(event) => setLeverage(event.target.value)}>
            <MenuItem value="1:200">1:200</MenuItem>
            <MenuItem value="1:500">1:500</MenuItem>
            <MenuItem value="1:1000">1:1000</MenuItem>
            <MenuItem value="1:2000">1:2000</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={saving}>Cancel</Button>
        <Button variant="contained" onClick={() => void onSave()} disabled={saving}>
          {saving ? "Saving..." : "Change"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function AccountInfoDialog({ accountId, close, openDialog, toast }: { accountId: string; close: () => void; openDialog: DialogOpener; toast: Toast }) {
  const { state, dispatch } = usePA();
  const account = state.accounts.find((item) => item.id === accountId);
  if (!account) return null;
  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>Account information</DialogTitle>
      <DialogContent className="dialog-grid">
        <Info label="Account name" value={account.nickname?.trim() || accountDisplayName(account)} />
        <Info label="Login" value={account.login} onCopy={() => copyToClipboard(account.login, toast)} />
        <Info label="Server" value={account.server} onCopy={() => copyToClipboard(account.server, toast)} />
        <Info label="Platform" value={account.platform} />
        <Info label="Account type" value={account.type} />
        <Info label="Leverage" value={account.leverage} />
        <Info label="Balance" value={formatMoney(account.balance, account.currency)} />
      </DialogContent>
      <DialogActions>
        <Button color="error" onClick={() => { dispatch({ type: "ARCHIVE_ACCOUNT", accountId }); toast("Account archived."); close(); }}>Archive</Button>
        <Button onClick={() => { close(); openDialog({ name: "rename", accountId }); }}>Rename</Button>
        <Button variant="contained" onClick={close}>Done</Button>
      </DialogActions>
    </Dialog>
  );
}

function PasswordDialog({ close, toast, setStage }: { close: () => void; toast: Toast; setStage: (stage: Stage) => void }) {
  const { state } = usePA();
  const email = state.userProfile?.email ?? "";
  const [newPassword, setNewPassword] = useState("");
  const [emailCode, setEmailCode] = useState("");
  const [show, setShow] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [sendingCode, setSendingCode] = useState(false);
  const [codeCooldown, setCodeCooldown] = useState(0);

  useEffect(() => {
    if (codeCooldown <= 0) return;
    const timer = window.setTimeout(() => setCodeCooldown((value) => value - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [codeCooldown]);

  async function sendCode() {
    if (!email.trim()) {
      toast("Email not available.");
      return;
    }
    setSendingCode(true);
    try {
      await authApi.sendEmailCode(email.trim(), "reset");
      setCodeCooldown(60);
      toast("Email code sent. Dev mode uses 123456.");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to send email code.");
    } finally {
      setSendingCode(false);
    }
  }

  async function submit() {
    if (!email.trim() || !newPassword || !emailCode.trim()) {
      toast("Please fill in all fields.");
      return;
    }
    setSubmitting(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        emailCode: emailCode.trim(),
        newPassword,
      });
      toast("Password changed successfully. Please sign in again.");
      clearTokens();
      close();
      setStage("login");
    } catch (err) {
      toast(err instanceof Error ? err.message : "Failed to change password.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>Change password</DialogTitle>
      <DialogContent className="dialog-grid">
        <TextField
          label="Email verification code"
          value={emailCode}
          onChange={(event) => setEmailCode(event.target.value)}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <Button
                    size="small"
                    disabled={sendingCode || codeCooldown > 0}
                    onClick={() => void sendCode()}
                  >
                    {codeCooldown > 0 ? `${codeCooldown}s` : "Send code"}
                  </Button>
                </InputAdornment>
              ),
            },
          }}
        />
        <TextField
          label="New password"
          type={show ? "text" : "password"}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          autoComplete="new-password"
        />
        <FormControlLabel control={<Checkbox checked={show} onChange={(event) => setShow(event.target.checked)} />} label="Show password" />
      </DialogContent>
      <DialogActions>
        <Button onClick={close} disabled={submitting}>Cancel</Button>
        <Button variant="contained" disabled={submitting} onClick={() => void submit()}>Change</Button>
      </DialogActions>
    </Dialog>
  );
}

function WalletDialog({ close, toast }: { close: () => void; toast: Toast }) {
  const { dispatch } = usePA();
  const [asset, setAsset] = useState("USDT");
  const [network, setNetwork] = useState("TRC20");
  return (
    <Dialog open onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>Create wallet</DialogTitle>
      <DialogContent className="dialog-grid">
        <FormControl fullWidth>
          <InputLabel>Asset</InputLabel>
          <Select value={asset} label="Asset" onChange={(event) => setAsset(event.target.value)}>
            <MenuItem value="USDT">USDT</MenuItem>
            <MenuItem value="USDC">USDC</MenuItem>
            <MenuItem value="BTC">BTC</MenuItem>
          </Select>
        </FormControl>
        <FormControl fullWidth>
          <InputLabel>Network</InputLabel>
          <Select value={network} label="Network" onChange={(event) => setNetwork(event.target.value)}>
            <MenuItem value="TRC20">TRC20</MenuItem>
            <MenuItem value="ERC20">ERC20</MenuItem>
            <MenuItem value="Bitcoin">Bitcoin</MenuItem>
          </Select>
        </FormControl>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Cancel</Button>
        <Button variant="contained" onClick={() => { dispatch({ type: "ADD_WALLET", payload: { asset, network } }); toast("Wallet created."); close(); }}>Create</Button>
      </DialogActions>
    </Dialog>
  );
}

function ConfirmDialog({ title, body, close, confirmLabel, onConfirm }: { title: string; body: string; close: () => void; confirmLabel: string; onConfirm: () => void }) {
  return (
    <Dialog open onClose={close} fullWidth maxWidth="xs">
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>
        <Typography>{body}</Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={close}>Close</Button>
        <Button variant="contained" onClick={() => { onConfirm(); close(); }}>{confirmLabel}</Button>
      </DialogActions>
    </Dialog>
  );
}

function ChatFab() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState([
    { from: "support", text: "Hello. How can we help you today?" },
  ]);

  useEffect(() => {
    const openChat = () => setOpen(true);
    window.addEventListener("exness-open-chat", openChat);
    return () => window.removeEventListener("exness-open-chat", openChat);
  }, []);

  function send() {
    if (!draft.trim()) return;
    setMessages((current) => [
      ...current,
      { from: "me", text: draft.trim() },
      { from: "support", text: "Thanks. A support specialist will continue from this local ticket preview." },
    ]);
    setDraft("");
  }

  return (
    <>
      <Fab color="primary" className="chat-fab" onClick={() => setOpen(true)} aria-label="Chat">
        <MessageCircle size={24} />
      </Fab>
      <Collapse in={open} timeout={180}>
        <Paper className="chat-panel">
          <Stack direction="row" sx={{ justifyContent: "space-between", alignItems: "center" }}>
            <Typography variant="h3">Exness Assistant</Typography>
            <IconButton onClick={() => setOpen(false)}><X size={18} /></IconButton>
          </Stack>
          <div className="chat-messages">
            {messages.map((message, index) => (
              <span className={message.from === "me" ? "is-me" : ""} key={index}>{message.text}</span>
            ))}
          </div>
          <Stack direction="row" spacing={1}>
            <TextField size="small" fullWidth value={draft} onChange={(event) => setDraft(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") send(); }} placeholder="Type a message" />
            <IconButton onClick={send}><Send size={18} /></IconButton>
          </Stack>
        </Paper>
      </Collapse>
    </>
  );
}

function InstallToast({ toast }: { toast: Toast }) {
  const { state, dispatch } = usePA();
  if (!state.settings.installToastVisible) return null;
  return (
    <div className="install-toast">
      <button
        className="install-main"
        type="button"
        onClick={() => toast("成功")}
      >
        <span className="install-toast-icon" aria-hidden="true">ex</span>
        <span className="install-toast-text">将 Exness 应用程序需添加到主屏幕</span>
      </button>
      <button
        className="install-toast-close"
        type="button"
        onClick={() => dispatch({ type: "DISMISS_INSTALL_TOAST" })}
        aria-label="关闭"
      >
        <X size={18} strokeWidth={1.75} />
      </button>
    </div>
  );
}

function Page({ title, actions, children }: { title: string; actions?: ReactNode; children: ReactNode }) {
  return (
    <div className="page">
      <div className="page-head">
        <Typography variant="h1">{title}</Typography>
        {actions}
      </div>
      {children}
    </div>
  );
}

function Metric({ title, value, icon: Icon, positive }: { title: string; value: string; icon: LucideIcon; positive?: boolean }) {
  return (
    <Card>
      <CardContent className="metric-card">
        <Icon size={20} />
        <span>{title}</span>
        <strong className={positive === false ? "negative" : ""}>{value}</strong>
      </CardContent>
    </Card>
  );
}

function EmptyState({ icon: Icon, title, text, action }: { icon: LucideIcon; title: string; text: string; action?: ReactNode }) {
  return (
    <Paper className="empty-state">
      <Icon size={28} />
      <Typography variant="h3">{title}</Typography>
      <Typography color="text.secondary">{text}</Typography>
      {action}
    </Paper>
  );
}

function DataTable({ columns, rows, empty }: { columns: string[]; rows: Array<Array<string | number>>; empty: string }) {
  if (rows.length === 0) {
    return <EmptyState icon={History} title={empty} text="Change the filter or create local sample activity." />;
  }
  return (
    <div className="table-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => <th key={column}>{column}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionRow({ title, text, action }: { title: string; text: string; action: ReactNode }) {
  return (
    <div className="action-row">
      <div>
        <strong>{title}</strong>
        <span>{text}</span>
      </div>
      {action}
    </div>
  );
}

function Info({ label, value, onCopy }: { label: string; value: string; onCopy?: () => void }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
      {onCopy && (
        <IconButton size="small" onClick={onCopy} aria-label={`Copy ${label}`}>
          <Copy size={14} />
        </IconButton>
      )}
    </div>
  );
}

function ExnessLogo() {
  return <div className="exness-logo" aria-label="Exness">exness</div>;
}
