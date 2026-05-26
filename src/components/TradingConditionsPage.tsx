import { useState, type KeyboardEvent, type ReactNode } from "react";
import { ChevronRight, ExternalLink, X } from "lucide-react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, IconButton } from "@mui/material";

type ConditionModal = "negative-balance" | "swap-free" | null;

const helpCenterHref = "https://get.exness.help/hc/zh-cn";

function ConditionCard({
  title,
  description,
  badge,
  onOpen,
}: {
  title: string;
  description: string;
  badge?: string;
  onOpen: () => void;
}) {
  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onOpen();
    }
  };

  return (
    <article
      className="trading-condition-card"
      role="button"
      tabIndex={0}
      onClick={onOpen}
      onKeyDown={handleKeyDown}
    >
      <div className="trading-condition-card-body">
        <div className="trading-condition-card-head">
          <h2 className="trading-condition-card-title">{title}</h2>
          {badge ? <span className="trading-condition-badge">{badge}</span> : null}
        </div>
        <p className="trading-condition-card-text">{description}</p>
      </div>
      <span className="trading-condition-card-arrow" aria-hidden>
        <ChevronRight size={18} />
      </span>
    </article>
  );
}

function ConditionDialog({
  open,
  title,
  onClose,
  children,
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="sm"
      className="trading-condition-dialog-root"
      slotProps={{ paper: { className: "trading-condition-dialog-paper" } }}
    >
      <DialogTitle className="trading-condition-dialog-title">
        <span>{title}</span>
        <IconButton aria-label="关闭" onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent className="trading-condition-dialog-content">{children}</DialogContent>
      <DialogActions className="trading-condition-dialog-actions">
        <Button variant="contained" color="primary" onClick={onClose}>
          好的
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function TradingConditionsPage() {
  const [modal, setModal] = useState<ConditionModal>(null);

  return (
    <div className="trading-conditions-page" data-no-i18n>
      <header className="trading-conditions-header">
        <h1 className="trading-conditions-title">交易条件</h1>
        <p className="trading-conditions-subtitle">
          以下是您账户目前可享受的领先市场的交易条件列表。
        </p>
      </header>

      <div className="trading-conditions-grid">
        <ConditionCard
          title="负余额保护"
          description="您的亏损金额永远不会超过您入金账户的金额。如果账户因爆仓出现负余额，我们会对其进行清零。"
          onOpen={() => setModal("negative-balance")}
        />
        <ConditionCard
          title="免隔夜利息"
          badge="符合资格"
          description="部分品种不再收取隔夜费用。免息交易热门品种。能否拥有免息权益资格取决于您的交易活动。"
          onOpen={() => setModal("swap-free")}
        />
      </div>

      <ConditionDialog
        open={modal === "negative-balance"}
        title="负余额保护"
        onClose={() => setModal(null)}
      >
        <p>
          您的亏损金额永远不会超过您入金账户的金额。如果账户因爆仓出现负余额，我们会对其进行清零。
        </p>
        <p>
          例如，如果账户的余额为100美元，仓位平仓时亏损150美元，则账户将出现50美元的负余额。这时，负余额保护功能会清零您账户的负余额，您无需使用自己的资金弥补亏损。
        </p>
      </ConditionDialog>

      <ConditionDialog
        open={modal === "swap-free"}
        title="免隔夜利息"
        onClose={() => setModal(null)}
      >
        <p>告别隔夜费用。免息交易热门品种。能否拥有免息权益资格取决于您的交易活动。</p>
        <div className="trading-condition-status">
          <span>免隔夜利息权益:</span>
          <strong>符合资格</strong>
        </div>
        <div className="trading-condition-progress" aria-hidden>
          <span className="trading-condition-progress-fill" />
        </div>
        <p>如需获取和保持免息权益，您需要以白天交易为主，并尽量避免持有隔夜仓位。</p>
        <p>访问帮助中心，获取可以免息交易的品种的列表。</p>
        <a
          className="trading-condition-help-link"
          href={helpCenterHref}
          rel="noopener noreferrer"
          target="_blank"
        >
          前往帮助中心了解详情
          <ExternalLink size={16} />
        </a>
      </ConditionDialog>
    </div>
  );
}
