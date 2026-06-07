import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Radio,
  RadioGroup,
  Select,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from "@mui/material";
import { CreditCard } from "lucide-react";
import * as fundApi from "../api/fund";
import type { DepositChannel, DepositOrderResponse } from "../api/fund";
import { compressImageFile } from "../api/client";
import { canFundAccount } from "../config/simulation";
import { translateText } from "../i18n";
import { usePA } from "../state/paStore";
import type { PaymentMethod } from "../types";
import {
  formatFundAmountText,
  normalizeAmountInput,
  parseFundAmount,
  roundFundAmount,
  validateFundAmount,
} from "../utils/fundValidation";
import { formatAccountLabelById } from "../utils/accountLabel";
import { kycPaymentBlockedMessage } from "../utils/kycSync";
import { UsdtDepositPanel } from "./UsdtDepositPanel";

function formatMoney(value: number, currency = "USD") {
  return `${value.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${currency}`;
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="info-row">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

type Toast = (message: string) => void;

type Props = {
  flow: "deposit" | "withdrawal";
  accountId?: string;
  close: () => void;
  toast: Toast;
  onKycPrompt: () => void;
};

const WITHDRAW_STEPS = ["Account", "Method", "Amount", "Address", "Confirm"] as const;
const DEPOSIT_STEPS_UDUN = ["Account", "Method", "Confirm"] as const;
const DEPOSIT_STEPS_MANUAL = ["Account", "Method", "Amount", "Proof", "Confirm"] as const;

function depositSteps(channel: DepositChannel) {
  return channel === "manual" ? DEPOSIT_STEPS_MANUAL : DEPOSIT_STEPS_UDUN;
}

function depositStepKind(channel: DepositChannel, activeStep: number): "amount" | "proof" | "confirm" | null {
  if (channel === "udun") {
    if (activeStep === 2) return "confirm";
    return null;
  }
  if (activeStep === 2) return "amount";
  if (activeStep === 3) return "proof";
  if (activeStep === 4) return "confirm";
  return null;
}

export function PaymentFlowDialog({ flow, accountId, close, toast, onKycPrompt }: Props) {
  const { state, dispatch } = usePA();
  const language = state.settings.language;
  const t = (text: string) => translateText(text, language);
  const kycStatus = state.userProfile?.kycStatus ?? 0;
  const fundAccounts = state.accounts.filter((account) => account.status === "Active" && account.kind === "Real");

  const [activeStep, setActiveStep] = useState(0);
  const [selectedAccount, setSelectedAccount] = useState(() => {
    if (accountId && fundAccounts.some((item) => item.id === accountId)) return accountId;
    return fundAccounts[0]?.id ?? "";
  });
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodId, setMethodId] = useState("");
  const [depositChannel, setDepositChannel] = useState<DepositChannel>("udun");
  const [amountText, setAmountText] = useState("");
  const [voucherImage, setVoucherImage] = useState("");
  const [voucherName, setVoucherName] = useState("");
  const [uploadingVoucher, setUploadingVoucher] = useState(false);
  const [toAddress, setToAddress] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingWithdraw, setPendingWithdraw] = useState(false);
  const [depositView, setDepositView] = useState<DepositOrderResponse | null>(null);

  const steps = useMemo(
    () => (flow === "withdrawal" ? WITHDRAW_STEPS : depositSteps(depositChannel)),
    [flow, depositChannel],
  );
  const confirmStep = steps.length - 1;
  const addressStep = flow === "withdrawal" ? 3 : -1;
  const depositKind = flow === "deposit" ? depositStepKind(depositChannel, activeStep) : null;

  const account = state.accounts.find((item) => item.id === selectedAccount);
  const canProceed = account ? canFundAccount(account.kind, kycStatus) : false;
  const method = methods.find((item) => item.id === methodId);
  const availableBalance = account?.balance ?? 0;
  const amount = parseFundAmount(amountText);
  const needsAmount = flow === "withdrawal" || depositChannel === "manual";
  const amountError = needsAmount ? validateFundAmount(flow, amount, availableBalance, method) : null;
  const amountBlocksContinue = (flow === "withdrawal" && activeStep === 2 && (amount <= 0 || Boolean(amountError)))
    || (depositKind === "amount" && (amount <= 0 || Boolean(amountError)));
  const proofBlocksContinue = depositKind === "proof" && !voucherImage;

  useEffect(() => {
    if (accountId && fundAccounts.some((item) => item.id === accountId)) {
      setSelectedAccount(accountId);
    }
  }, [accountId, fundAccounts]);

  useEffect(() => {
    if (flow === "withdrawal") {
      setAmountText("");
    }
  }, [selectedAccount, flow]);

  useEffect(() => {
    if (flow !== "withdrawal" || !canProceed) {
      setPendingWithdraw(false);
      return;
    }
    let cancelled = false;
    void fundApi.fetchTransactions(1, 50).then((resp) => {
      if (cancelled) return;
      const hasPending = resp.list.some(
        (item) =>
          item.type === "withdrawal"
          && (item.status === "Pending" || item.status === "Processing")
          && item.accountId === selectedAccount,
      );
      setPendingWithdraw(hasPending);
    }).catch(() => {
      if (!cancelled) setPendingWithdraw(false);
    });
    return () => {
      cancelled = true;
    };
  }, [flow, canProceed, selectedAccount]);

  useEffect(() => {
    if (!canProceed) return;
    let cancelled = false;
    void fundApi.fetchPaymentMethods(flow).then((list) => {
      if (cancelled) return;
      setMethods(list);
      setMethodId(list[0]?.id ?? "");
    }).catch((err) => {
      if (!cancelled) {
        setMethods([]);
        setMethodId("");
        toast(err instanceof Error ? err.message : "Failed to load payment methods.");
      }
    });
    return () => {
      cancelled = true;
    };
  }, [flow, canProceed, toast]);

  function handleDepositChannelChange(next: DepositChannel) {
    setDepositChannel(next);
    setAmountText("");
    setVoucherImage("");
    setVoucherName("");
    if (activeStep > 1) {
      setActiveStep(1);
    }
  }

  async function refreshAfterPayment() {
    const txResp = await fundApi.fetchTransactions(1, 50);
    dispatch({ type: "SET_TRANSACTIONS", transactions: txResp.list });
    const accounts = await fundApi.fetchAccounts();
    dispatch({ type: "SET_ACCOUNTS", accounts });
  }

  async function handleVoucherFile(file: File | null) {
    if (!file) return;
    setUploadingVoucher(true);
    try {
      const dataUrl = await compressImageFile(file);
      setVoucherImage(dataUrl);
      setVoucherName(file.name);
    } catch {
      toast(t("Failed to read image. Use JPEG or PNG."));
      setVoucherImage("");
      setVoucherName("");
    } finally {
      setUploadingVoucher(false);
    }
  }

  async function finish() {
    if (!selectedAccount || !methodId) return;
    if (flow === "withdrawal") {
      const submitAmount = parseFundAmount(amountText);
      if (submitAmount <= 0) return;
      const err = validateFundAmount(flow, submitAmount, availableBalance, method);
      if (err) {
        toast(err);
        return;
      }
      if (!toAddress.trim()) {
        toast(t("Enter a valid USDT TRC20 address."));
        return;
      }
      if (pendingWithdraw) {
        toast(t("You have a withdrawal under review. Please wait."));
        return;
      }
    }
    setSubmitting(true);
    try {
      if (flow === "deposit") {
        if (depositChannel === "manual") {
          const submitAmount = parseFundAmount(amountText);
          const err = validateFundAmount(flow, submitAmount, availableBalance, method);
          if (err) {
            toast(err);
            return;
          }
          if (!voucherImage) {
            toast(t("Upload a transfer screenshot."));
            return;
          }
          await fundApi.createDeposit({
            accountId: selectedAccount,
            methodId,
            amount: roundFundAmount(submitAmount),
            currency: account?.currency ?? "USD",
            channel: "manual",
            voucherImage,
          });
          await refreshAfterPayment();
          toast(t("Deposit submitted. Waiting for admin review."));
          close();
          return;
        }
        const result = await fundApi.createDeposit({
          accountId: selectedAccount,
          methodId,
          currency: account?.currency ?? "USD",
          channel: "udun",
        });
        setDepositView(result);
        return;
      }
      const transaction = await fundApi.createWithdraw({
        accountId: selectedAccount,
        methodId,
        amount: roundFundAmount(parseFundAmount(amountText)),
        currency: account?.currency ?? "USD",
        toAddress: toAddress.trim(),
      });
      await refreshAfterPayment();
      if (transaction.status === "Pending" || transaction.status === "Processing") {
        toast(t("Withdrawal submitted. Waiting for admin review."));
        setPendingWithdraw(true);
      } else {
        toast(t(`Withdrawal status: ${transaction.status}`));
      }
      close();
    } catch (err) {
      toast(err instanceof Error ? err.message : "Payment request failed.");
    } finally {
      setSubmitting(false);
    }
  }

  function goNext() {
    if (depositKind === "amount" || (flow === "withdrawal" && activeStep === 2)) {
      const parsed = parseFundAmount(amountText);
      const err = validateFundAmount(flow, parsed, availableBalance, method);
      if (err) {
        toast(err);
        return;
      }
      setAmountText(formatFundAmountText(parsed));
    }
    if (depositKind === "proof" && !voucherImage) {
      toast(t("Upload a transfer screenshot."));
      return;
    }
    if (activeStep === addressStep && !toAddress.trim()) {
      toast(t("Enter a valid USDT TRC20 address."));
      return;
    }
    setActiveStep(activeStep + 1);
  }

  if (!canProceed) {
    return (
      <Dialog open onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>{flow === "deposit" ? t("Deposit") : t("Withdrawal")}</DialogTitle>
        <DialogContent>
          <Alert severity="warning">{kycPaymentBlockedMessage(kycStatus, language)}</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>{t("Close")}</Button>
          <Button variant="contained" onClick={() => { onKycPrompt(); close(); }}>
            {kycStatus === 1 ? t("View status") : t("Verify now")}
          </Button>
        </DialogActions>
      </Dialog>
    );
  }

  if (depositView) {
    return (
      <Dialog open onClose={close} fullWidth maxWidth="sm">
        <DialogTitle>{t("USDT Deposit")}</DialogTitle>
        <DialogContent>
          <UsdtDepositPanel
            initial={depositView}
            language={language}
            toast={toast}
            onCompleted={() => {
              void refreshAfterPayment().then(() => close());
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={close}>{t("Close")}</Button>
        </DialogActions>
      </Dialog>
    );
  }

  return (
    <Dialog open onClose={close} fullWidth maxWidth="sm">
      <DialogTitle>{flow === "deposit" ? t("Deposit") : t("Withdrawal")}</DialogTitle>
      <DialogContent className="dialog-grid">
        {flow === "withdrawal" && pendingWithdraw ? (
          <Alert severity="warning">{t("You have a withdrawal under review. Funds are frozen until processed.")}</Alert>
        ) : null}
        {flow === "deposit" ? (
          <Alert severity="info">
            {depositChannel === "udun"
              ? t("Copy the deposit address and send USDT (TRC20) from your wallet. Balance credits by on-chain receipt.")
              : t("Upload your transfer proof. An admin will review and credit your balance.")}
          </Alert>
        ) : (
          <Alert severity="info">{t("Withdrawals require admin approval, then automatic USDT payout.")}</Alert>
        )}
        <Stepper activeStep={activeStep} alternativeLabel>
          {steps.map((label) => (
            <Step key={label}><StepLabel>{t(label)}</StepLabel></Step>
          ))}
        </Stepper>
        {activeStep === 0 && (
          <FormControl fullWidth>
            <InputLabel>{t("Trading account")}</InputLabel>
            <Select value={selectedAccount} label={t("Trading account")} onChange={(event) => setSelectedAccount(event.target.value)}>
              {fundAccounts.map((item) => (
                <MenuItem key={item.id} value={item.id}>
                  {formatAccountLabelById(state.accounts, item.id)} · {formatMoney(item.balance, item.currency)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        {activeStep === 1 && (
          <>
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
            {flow === "deposit" ? (
              <Paper className="confirm-box" sx={{ mt: 1 }}>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>{t("Deposit method")}</Typography>
                <FormControl component="fieldset" fullWidth>
                  <RadioGroup
                    value={depositChannel}
                    onChange={(event) => handleDepositChannelChange(event.target.value as DepositChannel)}
                  >
                    <FormControlLabel
                      value="udun"
                      control={<Radio size="small" />}
                      label={(
                        <Box>
                          <Typography variant="body2">{t("USDT auto deposit (recommended)")}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t("Get a TRC20 address. Transfer any amount from your wallet.")}
                          </Typography>
                        </Box>
                      )}
                    />
                    <FormControlLabel
                      value="manual"
                      control={<Radio size="small" />}
                      label={(
                        <Box>
                          <Typography variant="body2">{t("Transfer proof review")}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            {t("If auto deposit fails, submit amount and screenshot for manual review.")}
                          </Typography>
                        </Box>
                      )}
                    />
                  </RadioGroup>
                </FormControl>
              </Paper>
            ) : null}
          </>
        )}
        {(flow === "withdrawal" && activeStep === 2) || depositKind === "amount" ? (
          <TextField
            label={t("Amount")}
            type="text"
            inputMode="decimal"
            placeholder="0.00"
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
                  ? `${t("Available")} ${formatMoney(availableBalance, account?.currency ?? "USD")}${method ? ` · Min ${formatMoney(method.min)} · Max ${formatMoney(method.max)}` : ""}`
                  : method ? `${t("Declared transfer amount")} · Min ${formatMoney(method.min)} · Max ${formatMoney(method.max)}` : "")
            }
            fullWidth
          />
        ) : null}
        {depositKind === "proof" ? (
          <Paper className="confirm-box">
            <Typography variant="subtitle2" sx={{ mb: 1 }}>{t("Transfer screenshot")}</Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
              {t("Upload a screenshot showing amount, address, and transaction status.")}
            </Typography>
            <Button variant="outlined" component="label" disabled={uploadingVoucher}>
              {uploadingVoucher ? t("Uploading...") : t("Choose image")}
              <input
                hidden
                accept="image/jpeg,image/png,image/webp"
                type="file"
                onChange={(event) => void handleVoucherFile(event.target.files?.[0] ?? null)}
              />
            </Button>
            {voucherName ? (
              <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1 }}>
                {voucherName}
              </Typography>
            ) : null}
            {voucherImage ? (
              <Box
                component="img"
                src={voucherImage}
                alt={t("Transfer screenshot")}
                sx={{ mt: 1.5, maxWidth: "100%", maxHeight: 220, borderRadius: 1, border: "1px solid", borderColor: "divider" }}
              />
            ) : null}
          </Paper>
        ) : null}
        {activeStep === addressStep && (
          <TextField
            label={t("USDT TRC20 address")}
            value={toAddress}
            onChange={(event) => setToAddress(event.target.value)}
            placeholder="T..."
            helperText={t("Double-check your withdrawal address.")}
            fullWidth
          />
        )}
        {activeStep === confirmStep && (
          <Paper className="confirm-box">
            <Info label={t("Account")} value={account ? formatAccountLabelById(state.accounts, account.id) : ""} />
            <Info label={t("Method")} value={method ? `${method.name} ${method.network}` : ""} />
            {flow === "deposit" && depositChannel === "udun" ? (
              <Info label={t("Deposit method")} value={t("USDT auto deposit")} />
            ) : null}
            {flow === "deposit" && depositChannel === "manual" ? (
              <>
                <Info label={t("Deposit method")} value={t("Transfer proof review")} />
                <Info label={t("Amount")} value={formatMoney(roundFundAmount(amount), account?.currency ?? "USD")} />
                <Info label={t("Proof")} value={voucherName || t("Uploaded")} />
              </>
            ) : null}
            {flow === "withdrawal" ? (
              <>
                <Info label={t("Amount")} value={formatMoney(roundFundAmount(amount), account?.currency ?? "USD")} />
                <Info label={t("Address")} value={toAddress} />
              </>
            ) : null}
            <Typography variant="caption" color="text.secondary">
              {flow === "deposit" && depositChannel === "udun"
                ? t("You will receive a TRC20 address. Send USDT from your wallet; balance updates by on-chain receipt.")
                : flow === "deposit"
                  ? t("Submitted for admin review before balance is credited.")
                  : t("Submitted for admin review before automatic payout.")}
            </Typography>
          </Paper>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={activeStep === 0 ? close : () => setActiveStep(activeStep - 1)}>
          {activeStep === 0 ? t("Cancel") : t("Back")}
        </Button>
        <Button
          variant="contained"
          disabled={
            !selectedAccount
            || !methodId
            || amountBlocksContinue
            || proofBlocksContinue
            || submitting
            || (flow === "withdrawal" && pendingWithdraw)
          }
          onClick={activeStep === confirmStep ? () => void finish() : goNext}
        >
          {activeStep === confirmStep ? (submitting ? t("Submitting...") : t("Confirm")) : t("Continue")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
