import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { ArrowLeft, ExternalLink, Eye, EyeOff } from "lucide-react";
import { usePA } from "../state/paStore";
import type { AccountKind, AccountPlatform, Route } from "../types";

type Toast = (message: string) => void;

export type OpenAccountTypeId = "standard" | "cent" | "pro" | "raw-spread" | "zero";

type AccountTypeSpec = {
  id: OpenAccountTypeId;
  section: "standard" | "professional";
  title: string;
  description: string;
  minDeposit: string;
  minSpread: string;
  maxLeverage: string;
  commission: string;
  internalType: string;
  icon: "corner" | "cylinder" | "stairs" | "frame" | "ring";
};

const accountTypes: AccountTypeSpec[] = [
  {
    id: "standard",
    section: "standard",
    title: "Standard account",
    description: "Low minimum deposit and zero commission, suitable for traders of all levels.",
    minDeposit: "200 USD",
    minSpread: "0.20 pips",
    maxLeverage: "1:Unlimited",
    commission: "No commission",
    internalType: "Standard",
    icon: "corner",
  },
  {
    id: "cent",
    section: "standard",
    title: "Cent account",
    description: "Smaller lot sizes and lower risk. Ideal for practicing trading.",
    minDeposit: "200 USD",
    minSpread: "0.30 pips",
    maxLeverage: "1:Unlimited",
    commission: "No commission",
    internalType: "Cent",
    icon: "cylinder",
  },
  {
    id: "pro",
    section: "professional",
    title: "Pro account",
    description: "Low spreads and zero commission for instant or market execution.",
    minDeposit: "2000 USD",
    minSpread: "0.10 pips",
    maxLeverage: "1:Unlimited",
    commission: "No commission",
    internalType: "Pro",
    icon: "stairs",
  },
  {
    id: "raw-spread",
    section: "professional",
    title: "Raw Spread account",
    description: "Fixed commission with direct market pricing for experienced traders.",
    minDeposit: "2000 USD",
    minSpread: "0.00 pips",
    maxLeverage: "1:Unlimited",
    commission: "Up to 3.50 USD/lot (one way)",
    internalType: "Raw Spread",
    icon: "frame",
  },
  {
    id: "zero",
    section: "professional",
    title: "Zero account",
    description: "Spreads from 0 pips on all popular instruments.",
    minDeposit: "2000 USD",
    minSpread: "0.00 pips",
    maxLeverage: "1:Unlimited",
    commission: "From 0.05 USD/lot (one way)",
    internalType: "Zero",
    icon: "ring",
  },
];

const leverageOptions = ["1:200", "1:500", "1:1000", "1:2000", "1:Unlimited"];

function TypeIcon({ kind }: { kind: AccountTypeSpec["icon"] }) {
  return <span className={`open-account-type-icon is-${kind}`} aria-hidden />;
}

function validatePassword(password: string) {
  if (password.length < 8 || password.length > 15) return false;
  if (!/[a-z]/.test(password) || !/[A-Z]/.test(password)) return false;
  if (!/\d/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

function sanitizeNickname(value: string) {
  return value.replace(/[<>"&?^*#@]/g, "").slice(0, 36);
}

type OpenAccountFlowProps = {
  navigate: (route: Route) => void;
  toast: Toast;
};

export function OpenAccountFlow({ navigate, toast }: OpenAccountFlowProps) {
  const [step, setStep] = useState<"select" | "setup">("select");
  const [selectedId, setSelectedId] = useState<OpenAccountTypeId>("standard");

  const selected = useMemo(
    () => accountTypes.find((item) => item.id === selectedId) ?? accountTypes[0],
    [selectedId],
  );

  if (step === "setup") {
    return (
      <OpenAccountSetupStep
        spec={selected}
        onBack={() => setStep("select")}
        onDone={() => navigate("/pa/trading/accounts")}
        toast={toast}
      />
    );
  }

  const standardTypes = accountTypes.filter((item) => item.section === "standard");
  const professionalTypes = accountTypes.filter((item) => item.section === "professional");

  return (
    <div className="open-account-page">
      <header className="open-account-header">
        <button type="button" className="open-account-back" onClick={() => navigate("/pa/trading/accounts")} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <Typography variant="h1" className="open-account-title">
          Open account
        </Typography>
        <button type="button" className="open-account-contract-link" onClick={() => toast("Contract specifications opened.")}>
          Contract specifications
          <ExternalLink size={14} />
        </button>
      </header>

      <AccountTypeSection
        title="Standard accounts"
        types={standardTypes}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />
      <AccountTypeSection
        title="Professional accounts"
        types={professionalTypes}
        selectedId={selectedId}
        onSelect={setSelectedId}
      />

      <button type="button" className="open-account-continue-btn" onClick={() => setStep("setup")}>
        Continue
      </button>
    </div>
  );
}

function AccountTypeSection({
  title,
  types,
  selectedId,
  onSelect,
}: {
  title: string;
  types: AccountTypeSpec[];
  selectedId: OpenAccountTypeId;
  onSelect: (id: OpenAccountTypeId) => void;
}) {
  return (
    <section className="open-account-section">
      <Typography variant="h2" className="open-account-section-title">
        {title}
      </Typography>
      <div className="open-account-table-head">
        <span />
        <span>Min deposit</span>
        <span>Min spread</span>
        <span>Max leverage</span>
        <span>Commission</span>
      </div>
      <div className="open-account-type-list">
        {types.map((type) => (
          <button
            key={type.id}
            type="button"
            className={`open-account-type-row${selectedId === type.id ? " is-selected" : ""}`}
            onClick={() => onSelect(type.id)}
          >
            <span className="open-account-type-radio" aria-hidden />
            <TypeIcon kind={type.icon} />
            <div className="open-account-type-copy">
              <strong>{type.title}</strong>
              <span>{type.description}</span>
            </div>
            <span className="open-account-type-metric">{type.minDeposit}</span>
            <span className="open-account-type-metric">{type.minSpread}</span>
            <span className="open-account-type-metric">{type.maxLeverage}</span>
            <span className="open-account-type-metric">{type.commission}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function OpenAccountSetupStep({
  spec,
  onBack,
  onDone,
  toast,
}: {
  spec: AccountTypeSpec;
  onBack: () => void;
  onDone: () => void;
  toast: Toast;
}) {
  const { dispatch } = usePA();
  const [kind, setKind] = useState<AccountKind>("Demo");
  const [currency, setCurrency] = useState("USD");
  const [initialFunds, setInitialFunds] = useState("500");
  const [nickname, setNickname] = useState(spec.title);
  const [leverage, setLeverage] = useState("1:2000");
  const [platform, setPlatform] = useState<AccountPlatform>("MT5");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    setNickname(spec.title);
  }, [spec.id, spec.title]);

  const passwordRules = useMemo(
    () => [
      { label: "8—15 characters", ok: password.length >= 8 && password.length <= 15 },
      { label: "At least one uppercase and lowercase letter", ok: /[a-z]/.test(password) && /[A-Z]/.test(password) },
      { label: "At least one number", ok: /\d/.test(password) },
      { label: "At least one special character", ok: /[^A-Za-z0-9]/.test(password) },
    ],
    [password],
  );

  function submit(event: FormEvent) {
    event.preventDefault();
    const cleanNickname = sanitizeNickname(nickname.trim()) || spec.title;
    const effectivePassword = password.trim() || "Aa12345!";
    if (kind === "Real" && !validatePassword(effectivePassword)) {
      toast("Please meet all trading password requirements.");
      return;
    }

    const balance =
      kind === "Demo" ? Math.max(0, Number.parseFloat(initialFunds) || 0) : 0;
    dispatch({
      type: "ADD_ACCOUNT",
      payload: {
        kind,
        platform,
        type: spec.internalType,
        nickname: cleanNickname,
        server: kind === "Real" ? "Exness-MT5Real11" : "Exness-MT5Trial7",
        currency: "USD",
        balance,
        equity: balance,
        margin: 0,
        freeMargin: balance,
        leverage: leverage === "1:Unlimited" ? "1:2000" : leverage,
      },
    });
    toast("Trading account created.");
    onDone();
  }

  return (
    <div className="open-account-page open-account-setup-page">
      <header className="open-account-header">
        <button type="button" className="open-account-back" onClick={onBack} aria-label="Back">
          <ArrowLeft size={20} />
        </button>
        <Typography variant="h1" className="open-account-title">
          Set up your account
        </Typography>
      </header>

      <div className="open-account-setup-layout">
        <form className="open-account-setup-form" onSubmit={submit}>
          <div className="open-account-kind-toggle">
            <button
              type="button"
              className={kind === "Demo" ? "is-active" : ""}
              onClick={() => setKind("Demo")}
            >
              Demo
            </button>
            <button
              type="button"
              className={kind === "Real" ? "is-active" : ""}
              onClick={() => setKind("Real")}
            >
              Real
            </button>
          </div>
          <Typography className="open-account-kind-hint" color="text.secondary">
            {kind === "Real"
              ? "Trade with real currency. Profits can be withdrawn."
              : "Zero-risk account. Trade with virtual funds."}
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Currency</InputLabel>
            <Select label="Currency" value={currency} onChange={(event) => setCurrency(event.target.value)}>
              <MenuItem value="USD">USD - US Dollar</MenuItem>
            </Select>
          </FormControl>

          {kind === "Demo" && (
            <TextField
              label="Initial funds"
              required
              fullWidth
              type="number"
              value={initialFunds}
              onChange={(event) => setInitialFunds(event.target.value.replace(/[^\d.]/g, ""))}
            />
          )}

          <TextField
            label="Nickname"
            required
            fullWidth
            value={nickname}
            onChange={(event) => setNickname(sanitizeNickname(event.target.value))}
            helperText={'Nickname cannot contain special characters: <>"&?^*#@'}
            slotProps={{ input: { endAdornment: <InputAdornment position="end">{nickname.length}/36</InputAdornment> } }}
          />

          <FormControl fullWidth>
            <InputLabel>Maximum leverage</InputLabel>
            <Select label="Maximum leverage" value={leverage} onChange={(event) => setLeverage(event.target.value)}>
              {leverageOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth>
            <InputLabel>Platform</InputLabel>
            <Select
              label="Platform"
              value={platform}
              onChange={(event) => setPlatform(event.target.value as AccountPlatform)}
            >
              <MenuItem value="MT5">MT5</MenuItem>
              <MenuItem value="MT4">MT4</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Trading password"
            type={showPassword ? "text" : "password"}
            fullWidth
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton edge="end" onClick={() => setShowPassword((value) => !value)} aria-label="Toggle password">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />
          <ul className="open-account-password-rules">
            {passwordRules.map((rule) => (
              <li key={rule.label} className={rule.ok ? "is-ok" : ""}>
                {rule.label}
              </li>
            ))}
          </ul>

          <button type="submit" className="open-account-create-btn">
            Create account
          </button>
        </form>

        <aside className="open-account-setup-sidebar">
          <Typography variant="h2">{spec.title}</Typography>
          <dl className="open-account-setup-spec">
            {kind === "Real" && (
              <div>
                <dt>Min deposit</dt>
                <dd>{spec.minDeposit}</dd>
              </div>
            )}
            <div>
              <dt>Min spread</dt>
              <dd>{spec.minSpread}</dd>
            </div>
            <div>
              <dt>Max leverage</dt>
              <dd>{spec.maxLeverage}</dd>
            </div>
            <div>
              <dt>Commission</dt>
              <dd>{spec.commission}</dd>
            </div>
          </dl>
          <button type="button" className="open-account-contract-link" onClick={() => toast("Contract specifications opened.")}>
            Contract specifications
            <ExternalLink size={14} />
          </button>
        </aside>
      </div>
    </div>
  );
}
