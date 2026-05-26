import { useMemo, useState } from "react";
import { CalendarDays, Info, Wallet, X } from "lucide-react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  MenuItem,
  Select,
} from "@mui/material";
import { usePA } from "../state/paStore";
import type { Route } from "../types";

type BenefitModal = "negative-balance" | "swap-free" | null;

function formatSavingsAccountLabel(type: string, login: string) {
  return `${type} #${login}`;
}

function BenefitDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      className="savings-benefit-dialog-root"
      slotProps={{ paper: { className: "savings-benefit-dialog-paper" } }}
    >
      <DialogTitle className="savings-benefit-dialog-title">
        <span>{title}</span>
        <IconButton aria-label="关闭" onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent className="savings-benefit-dialog-content">{children}</DialogContent>
      <DialogActions className="savings-benefit-dialog-actions">
        <Button variant="contained" color="primary" onClick={onClose}>
          好的
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function BenefitCard({
  title,
  description,
  onInfo,
}: {
  title: string;
  description: string;
  onInfo: () => void;
}) {
  return (
    <article className="savings-benefit-card">
      <div className="savings-benefit-card-body">
        <div className="savings-benefit-card-head">
          <h3 className="savings-benefit-card-title">{title}</h3>
          <button type="button" className="savings-benefit-info" aria-label={`${title}详情`} onClick={onInfo}>
            <Info size={16} />
          </button>
        </div>
        <p className="savings-benefit-card-text">{description}</p>
      </div>
    </article>
  );
}

export function SavingsPage({ navigate }: { navigate: (route: Route) => void }) {
  const { state } = usePA();
  const activeAccounts = useMemo(
    () => state.accounts.filter((account) => account.status === "Active"),
    [state.accounts],
  );
  const [accountId, setAccountId] = useState(() => activeAccounts[0]?.id ?? "");
  const [modal, setModal] = useState<BenefitModal>(null);

  const selectedAccount = activeAccounts.find((account) => account.id === accountId) ?? activeAccounts[0];

  return (
    <div className="savings-page" data-no-i18n>
      <header className="savings-header">
        <h1 className="savings-title">节省数据</h1>
        <p className="savings-subtitle">
          在这个版块下，您可以查看每项交易福利帮助您节省了多少资金（以美元为单位），比如负余额清零、降低交易成本、爆仓保护。
        </p>
      </header>

      <div className="savings-account-field">
        <label className="savings-account-label" htmlFor="savings-account-select">
          账户
        </label>
        <FormControl fullWidth size="small" className="savings-account-control">
          <Select
            id="savings-account-select"
            value={selectedAccount?.id ?? ""}
            displayEmpty
            onChange={(event) => setAccountId(event.target.value)}
            className="savings-account-select"
          >
            {activeAccounts.map((account) => (
              <MenuItem key={account.id} value={account.id}>
                {formatSavingsAccountLabel(account.type, account.login)}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </div>

      <section className="savings-empty">
        <Wallet size={48} strokeWidth={1.5} className="savings-empty-icon" aria-hidden />
        <h2 className="savings-empty-title">您暂无任何资金节省数据</h2>
        <p className="savings-empty-text">
          欢迎开始交易，以便畅享我们优于市场的交易条件，降低交易成本以及避免爆仓。
        </p>
        <Button
          variant="contained"
          className="savings-start-trade"
          startIcon={<CalendarDays size={18} />}
          onClick={() => navigate("/pa/trading/accounts")}
        >
          开始交易
        </Button>
      </section>

      <section className="savings-benefits">
        <h2 className="savings-benefits-title">可享福利</h2>
        <div className="savings-benefits-grid">
          <BenefitCard
            title="负余额保护"
            description="您的亏损金额永远不会超过您入金账户的金额。如果账户出现负余额，我们会对其进行清零。"
            onInfo={() => setModal("negative-balance")}
          />
          <BenefitCard
            title="免隔夜利息"
            description="不收取隔夜利息费用。您可以免隔夜利息交易热门品种。"
            onInfo={() => setModal("swap-free")}
          />
        </div>
      </section>

      <BenefitDialog open={modal === "negative-balance"} title="负余额保护" onClose={() => setModal(null)}>
        <p>
          您的亏损金额永远不会超过您入金账户的金额。如果账户出现负余额，我们会对其进行清零。
        </p>
        <p>
          例如，如果账户的余额为100美元，仓位平仓时亏损150美元，则账户将出现50美元的负余额。这时，负余额保护功能会清零您账户的负余额，您无需使用自己的资金弥补亏损。
        </p>
      </BenefitDialog>

      <BenefitDialog open={modal === "swap-free"} title="免隔夜利息" onClose={() => setModal(null)}>
        <p>不收取隔夜利息费用。您可以免隔夜利息交易热门品种。</p>
        <p>能否拥有免息权益资格取决于您的交易活动。如需获取和保持免息权益，您需要以白天交易为主，并尽量避免持有隔夜仓位。</p>
      </BenefitDialog>
    </div>
  );
}
