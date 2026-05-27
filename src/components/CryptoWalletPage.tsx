import { useMemo, useState } from "react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  ListItemText,
  Menu,
  MenuItem,
  Radio,
  RadioGroup,
  TextField,
} from "@mui/material";
import {
  ArrowDownAZ,
  ArrowDownCircle,
  ArrowDownNarrowWide,
  ArrowLeftRight,
  ArrowUpCircle,
  ChevronDown,
  FolderOpen,
  Info,
  Plus,
  X,
} from "lucide-react";
import {
  cryptoAccountAssets,
  cryptoWalletSortOptions,
  formatCryptoBalance,
  formatUsdApprox,
  maskWalletAddress,
  sortCryptoAssets,
  type CryptoAccountAsset,
  type CryptoWalletSort,
  type CryptoWalletType,
  type ExternalCryptoWallet,
} from "../data/cryptoWalletData";
import { kycAllowsRealFund } from "../config/simulation";
import type { Route } from "../types";

type CryptoWalletTab = "account" | "external";

type Toast = (message: string) => void;
type DialogOpener = (dialog: { name: "transfer" }) => void;

function CryptoSortSelect({ value, onChange }: { value: CryptoWalletSort; onChange: (value: CryptoWalletSort) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);
  const selected = cryptoWalletSortOptions.find((option) => option.value === value) ?? cryptoWalletSortOptions[0];
  const SortIcon = value === "balance" ? ArrowDownNarrowWide : ArrowDownAZ;

  return (
    <>
      <Button
        className="crypto-wallet-sort-trigger"
        variant="outlined"
        color="inherit"
        onClick={(event) => setAnchor(event.currentTarget)}
        startIcon={<SortIcon size={16} />}
        endIcon={<ChevronDown size={16} className={`chevron ${open ? "is-open" : ""}`} />}
      >
        {selected.label}
      </Button>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { className: "crypto-wallet-sort-menu" } }}
      >
        {cryptoWalletSortOptions.map((option) => (
          <MenuItem
            key={option.value}
            selected={value === option.value}
            onClick={() => {
              onChange(option.value);
              setAnchor(null);
            }}
          >
            <ListItemText>{option.label}</ListItemText>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

function AssetIcons({ icons }: { icons: string[] }) {
  return (
    <div className={`crypto-wallet-asset-icons ${icons.length > 1 ? "is-dual" : ""}`}>
      {icons.map((icon, index) => (
        <img key={`${icon}-${index}`} src={icon} alt="" className="crypto-wallet-asset-icon" />
      ))}
    </div>
  );
}

function AssetCard({
  asset,
  onDeposit,
  onWithdraw,
  onTransfer,
}: {
  asset: CryptoAccountAsset;
  onDeposit: () => void;
  onWithdraw: () => void;
  onTransfer: () => void;
}) {
  return (
    <article className="crypto-wallet-asset-card">
      <div className="crypto-wallet-asset-main">
        <div className="crypto-wallet-asset-head">
          <AssetIcons icons={asset.icons} />
          <span className="crypto-wallet-asset-name">
            {asset.name} ({asset.symbol})
          </span>
        </div>
        <div className="crypto-wallet-asset-balance-row">
          <strong className="crypto-wallet-asset-balance">{formatCryptoBalance(asset)}</strong>
          <span className="crypto-wallet-asset-usd">{formatUsdApprox(asset.usdValue)}</span>
        </div>
      </div>
      <div className="crypto-wallet-asset-actions">
        <Button className="crypto-wallet-action crypto-wallet-action-deposit" onClick={onDeposit} startIcon={<ArrowDownCircle size={16} />}>
          入金
        </Button>
        <Button className="crypto-wallet-action crypto-wallet-action-outline" onClick={onWithdraw} startIcon={<ArrowUpCircle size={16} />}>
          出金
        </Button>
        <Button className="crypto-wallet-action crypto-wallet-action-outline" onClick={onTransfer} startIcon={<ArrowLeftRight size={16} />}>
          转账
        </Button>
      </div>
    </article>
  );
}

function AddExternalWalletDialog({
  open,
  onClose,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: { address: string; walletType: CryptoWalletType }) => void;
}) {
  const [address, setAddress] = useState("");
  const [walletType, setWalletType] = useState<CryptoWalletType>("exchange");

  function reset() {
    setAddress("");
    setWalletType("exchange");
  }

  function handleClose() {
    reset();
    onClose();
  }

  function handleContinue() {
    const trimmed = address.trim();
    if (!trimmed) return;
    onSubmit({ address: trimmed, walletType });
    reset();
    onClose();
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
      className="crypto-wallet-dialog-root"
      slotProps={{ paper: { className: "crypto-wallet-dialog-paper" } }}
    >
      <DialogTitle className="crypto-wallet-dialog-title">
        <span>添加外部加密货币钱包</span>
        <IconButton aria-label="关闭" onClick={handleClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent className="crypto-wallet-dialog-content">
        <div className="crypto-wallet-field">
          <label className="crypto-wallet-field-label" htmlFor="crypto-wallet-address">
            输入加密货币地址
            <Info size={14} aria-hidden />
          </label>
          <TextField
            id="crypto-wallet-address"
            fullWidth
            size="small"
            value={address}
            onChange={(event) => setAddress(event.target.value)}
            placeholder=""
            className="crypto-wallet-address-input"
          />
          <p className="crypto-wallet-field-hint">可以在您的加密货币平台的“入金”或“收款”版块下查看</p>
        </div>

        <div className="crypto-wallet-field">
          <p className="crypto-wallet-field-label">
            请选择绑定此加密货币地址的钱包类型。
            <button type="button" className="crypto-wallet-link" onClick={() => undefined}>
              了解详情
            </button>
          </p>
          <div className="crypto-wallet-type-box">
            <RadioGroup value={walletType} onChange={(_, value) => setWalletType(value as CryptoWalletType)}>
              <label className="crypto-wallet-type-option">
                <FormControlLabel
                  value="exchange"
                  control={<Radio size="small" />}
                  label={
                    <span className="crypto-wallet-type-copy">
                      <strong>加密货币钱包</strong>
                      <span>由币安、OKX等加密货币交易所提供和托管。</span>
                    </span>
                  }
                />
              </label>
              <div className="crypto-wallet-type-divider" />
              <label className="crypto-wallet-type-option">
                <FormControlLabel
                  value="self-custody"
                  control={<Radio size="small" />}
                  label={
                    <span className="crypto-wallet-type-copy">
                      <strong>自托管钱包</strong>
                      <span>您自己托管的钱包，如MetaMask、Ledger Nano S和Trezor。</span>
                    </span>
                  }
                />
              </label>
            </RadioGroup>
          </div>
        </div>
      </DialogContent>
      <DialogActions className="crypto-wallet-dialog-actions">
        <Button variant="contained" className="crypto-wallet-continue-btn" disabled={!address.trim()} onClick={handleContinue}>
          继续
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export function CryptoWalletPage({
  toast,
  navigate,
  openDialog,
  kycStatus,
  onRequireKycForRealFund,
}: {
  toast: Toast;
  navigate: (route: Route) => void;
  openDialog: DialogOpener;
  kycStatus: number;
  onRequireKycForRealFund: () => void;
}) {
  function goDeposit() {
    if (!kycAllowsRealFund(kycStatus)) {
      onRequireKycForRealFund();
      return;
    }
    navigate("/pa/payments-and-wallet/deposit");
  }

  function goWithdraw() {
    if (!kycAllowsRealFund(kycStatus)) {
      onRequireKycForRealFund();
      return;
    }
    navigate("/pa/payments-and-wallet/withdrawal");
  }
  const [tab, setTab] = useState<CryptoWalletTab>("account");
  const [sort, setSort] = useState<CryptoWalletSort>("name");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [externalWallets, setExternalWallets] = useState<ExternalCryptoWallet[]>([]);

  const assets = useMemo(() => sortCryptoAssets(cryptoAccountAssets, sort), [sort]);

  function handleAddExternalWallet(payload: { address: string; walletType: CryptoWalletType }) {
    const label = payload.walletType === "exchange" ? "加密货币钱包" : "自托管钱包";
    setExternalWallets((items) => [
      ...items,
      {
        id: `external-${Date.now()}`,
        address: payload.address,
        walletType: payload.walletType,
        label,
      },
    ]);
    toast("外部钱包添加成功。");
  }

  return (
    <div className="crypto-wallet-page" data-no-i18n>
      <header className="crypto-wallet-header">
        <h1 className="crypto-wallet-title">加密货币钱包</h1>
        <p className="crypto-wallet-balance-label">总余额</p>
        <p className="crypto-wallet-balance-value">0.00 USD</p>
      </header>

      <div className="crypto-wallet-tabs" role="tablist" aria-label="加密货币钱包视图">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "account"}
          className={`crypto-wallet-tab ${tab === "account" ? "is-active" : ""}`}
          onClick={() => setTab("account")}
        >
          账户
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "external"}
          className={`crypto-wallet-tab ${tab === "external" ? "is-active" : ""}`}
          onClick={() => setTab("external")}
        >
          外部钱包
        </button>
      </div>

      {tab === "account" ? (
        <>
          <div className="crypto-wallet-toolbar">
            <CryptoSortSelect value={sort} onChange={setSort} />
          </div>
          <div className="crypto-wallet-asset-list">
            {assets.map((asset) => (
              <AssetCard
                key={asset.id}
                asset={asset}
                onDeposit={goDeposit}
                onWithdraw={goWithdraw}
                onTransfer={() => openDialog({ name: "transfer" })}
              />
            ))}
          </div>
        </>
      ) : externalWallets.length === 0 ? (
        <section className="crypto-wallet-empty">
          <FolderOpen size={48} strokeWidth={1.5} className="crypto-wallet-empty-icon" aria-hidden />
          <h2 className="crypto-wallet-empty-title">No external wallet added</h2>
          <p className="crypto-wallet-empty-text">Add and verify your external crypto wallets for quick transactions</p>
          <Button variant="outlined" className="crypto-wallet-add-btn" startIcon={<Plus size={16} />} onClick={() => setDialogOpen(true)}>
            添加新的外部钱包
          </Button>
        </section>
      ) : (
        <>
          <div className="crypto-wallet-external-list">
            {externalWallets.map((wallet) => (
              <article key={wallet.id} className="crypto-wallet-external-card">
                <div>
                  <strong>{wallet.label}</strong>
                  <p>{maskWalletAddress(wallet.address)}</p>
                </div>
                <span className="crypto-wallet-external-status">已验证</span>
              </article>
            ))}
          </div>
          <div className="crypto-wallet-external-actions">
            <Button variant="outlined" className="crypto-wallet-add-btn" startIcon={<Plus size={16} />} onClick={() => setDialogOpen(true)}>
              添加新的外部钱包
            </Button>
          </div>
        </>
      )}

      <AddExternalWalletDialog open={dialogOpen} onClose={() => setDialogOpen(false)} onSubmit={handleAddExternalWallet} />
    </div>
  );
}
