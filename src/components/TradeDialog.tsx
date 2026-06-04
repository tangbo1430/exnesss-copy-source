import { useState } from "react";
import { Checkbox, Collapse, Dialog, FormControlLabel, IconButton, Typography } from "@mui/material";
import { ChevronDown, ChevronRight, X } from "lucide-react";
import { openExnessTerminal } from "../utils/paRoutes";
import { formatAccountOptionLabel } from "../utils/accountLabel";
import { usePA } from "../state/paStore";
import type { Account, Mt5Terminal, Route } from "../types";

type Toast = (message: string) => void;

type TradeDialogProps = {
  account: Account;
  close: () => void;
  toast: Toast;
  navigate: (route: Route) => void;
};

type TerminalOption = {
  id: Mt5Terminal;
  title: string;
  subtitle: string;
  icon: "exness" | "mt5";
};

const primaryOptions: TerminalOption[] = [
  {
    id: "Exness Web Trading Terminal",
    title: "Exness Web Trading Terminal",
    subtitle: "Trade directly in the browser",
    icon: "exness",
  },
  {
    id: "MetaTrader 5",
    title: "MetaTrader 5",
    subtitle: "Download and install the MT5 platform",
    icon: "mt5",
  },
];

const otherOptions: TerminalOption[] = [
  {
    id: "MT5 Web Terminal",
    title: "MT5 Web Terminal",
    subtitle: "Trade in the browser via MT5 Web",
    icon: "mt5",
  },
];

function TerminalIcon({ kind }: { kind: TerminalOption["icon"] }) {
  if (kind === "exness") {
    return (
      <span className="trade-terminal-icon is-exness" aria-hidden>
        <span>ex</span>
      </span>
    );
  }
  return (
    <span className="trade-terminal-icon is-mt5" aria-hidden>
      <svg viewBox="0 0 32 32" width="28" height="28" role="img" aria-label="MT5">
        <circle cx="16" cy="16" r="15" fill="#1a1a1a" />
        <path fill="#fff" d="M10 22v-8l3-5 3 5v8h-2v-5.8L13 11.8l-1 1.7V22H10zm9 0v-8l3-5 3 5v8h-2v-5.8L22 11.8l-1 1.7V22h-2z" />
      </svg>
    </span>
  );
}

export function TradeDialog({ account, close, toast, navigate }: TradeDialogProps) {
  const { dispatch } = usePA();
  const [otherOpen, setOtherOpen] = useState(false);
  const [alwaysUse, setAlwaysUse] = useState(false);

  function selectTerminal(option: TerminalOption) {
    if (alwaysUse) {
      dispatch({ type: "SET_MT5_TERMINAL", terminal: option.id });
    }
    close();
    if (option.id === "Exness Web Trading Terminal") {
      openExnessTerminal();
      return;
    }
    if (option.id === "MT5 Web Terminal") {
      toast(`Opening ${option.title} for ${formatAccountOptionLabel(account)}.`);
      return;
    }
    toast("MetaTrader 5 download started.");
  }

  function renderOption(option: TerminalOption) {
    return (
      <button key={option.id} type="button" className="trade-terminal-option" onClick={() => selectTerminal(option)}>
        <TerminalIcon kind={option.icon} />
        <div className="trade-terminal-option-text">
          <strong>{option.title}</strong>
          <span>{option.subtitle}</span>
        </div>
        <ChevronRight size={18} className="trade-terminal-option-arrow" aria-hidden />
      </button>
    );
  }

  return (
    <Dialog open onClose={close} className="trade-dialog-root" maxWidth="sm" fullWidth slotProps={{ paper: { className: "trade-dialog-paper" } }}>
      <div className="trade-dialog">
        <div className="trade-dialog-head">
          <Typography variant="h6" component="h2">
            Trade
          </Typography>
          <IconButton aria-label="Close" onClick={close} size="small">
            <X size={18} />
          </IconButton>
        </div>

        <div className="trade-dialog-options">{primaryOptions.map(renderOption)}</div>

        <div className="trade-dialog-other">
          <button type="button" className="trade-dialog-other-toggle" onClick={() => setOtherOpen((value) => !value)}>
            Other choices
            <ChevronDown size={16} className={otherOpen ? "is-open" : ""} />
          </button>
          <Collapse in={otherOpen}>
            <div className="trade-dialog-options is-other">{otherOptions.map(renderOption)}</div>
          </Collapse>
        </div>

        <div className="trade-dialog-footer">
          <FormControlLabel
            control={<Checkbox checked={alwaysUse} onChange={(event) => setAlwaysUse(event.target.checked)} />}
            label="Always use this terminal"
          />
          <Typography variant="caption" color="text.secondary" className="trade-dialog-footer-hint">
            You can change this later in{" "}
            <button
              type="button"
              className="trade-dialog-settings-link"
              onClick={() => {
                close();
                navigate("/pa/settings/terminal-settings");
              }}
            >
              Settings
            </button>
          </Typography>
        </div>
      </div>
    </Dialog>
  );
}
