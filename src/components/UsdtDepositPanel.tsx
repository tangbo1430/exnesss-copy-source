import { useEffect, useState } from "react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Copy } from "lucide-react";
import QRCode from "qrcode";
import * as fundApi from "../api/fund";
import type { DepositOrderResponse } from "../api/fund";
import { translateText } from "../i18n";
import { UsdtDepositHelpButton, UsdtDepositHelpDialog } from "./UsdtDepositHelpDialog";

function formatMoney(value: number, currency = "USD") {
  return value.toLocaleString("en-US", { style: "currency", currency, minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

type Props = {
  initial: DepositOrderResponse;
  language: string;
  onCompleted: () => void;
  toast: (message: string) => void;
};

export function UsdtDepositPanel({ initial, language, onCompleted, toast }: Props) {
  const t = (text: string) => translateText(text, language);
  const [order, setOrder] = useState(initial);
  const [qrDataUrl, setQrDataUrl] = useState("");
  const [helpOpen, setHelpOpen] = useState(false);

  useEffect(() => {
    const content = order.payAddress || order.qrContent || "";
    if (!content) return;
    void QRCode.toDataURL(content, { width: 200, margin: 1 }).then(setQrDataUrl).catch(() => setQrDataUrl(""));
  }, [order.payAddress, order.qrContent]);

  useEffect(() => {
    if (order.status === "Completed") {
      onCompleted();
      return;
    }
    const orderId = order.orderId ?? Number(order.id);
    if (!orderId) return;
    const timer = window.setInterval(() => {
      void fundApi.getDeposit(orderId).then((next) => {
        setOrder(next);
        if (next.status === "Completed") {
          toast(t("Deposit completed."));
          onCompleted();
        }
      }).catch(() => undefined);
    }, 5000);
    return () => window.clearInterval(timer);
  }, [order.id, order.orderId, order.status, onCompleted, t, toast]);

  async function copyAddress() {
    if (!order.payAddress) return;
    try {
      await navigator.clipboard.writeText(order.payAddress);
      toast(t("Copied to clipboard."));
    } catch {
      toast(order.payAddress);
    }
  }

  return (
    <Stack spacing={2} className="usdt-deposit-panel">
      <Stack direction="row" sx={{ alignItems: "center", justifyContent: "space-between" }}>
        <Typography variant="subtitle2" color="text.secondary">
          {t("Scan or copy the address below to pay")}
        </Typography>
        <UsdtDepositHelpButton language={language} onClick={() => setHelpOpen(true)} />
      </Stack>
      <UsdtDepositHelpDialog language={language} open={helpOpen} onClose={() => setHelpOpen(false)} />

      <Alert severity="info" sx={{ py: 0.75 }}>
        {t("USDT · TRC20 only. Balance updates after on-chain confirmation.")}
      </Alert>

      <Paper className="confirm-box" sx={{ textAlign: "center", py: 2 }}>
        {qrDataUrl ? (
          <Box component="img" src={qrDataUrl} alt="USDT deposit QR" sx={{ width: 200, height: 200, mx: "auto", display: "block" }} />
        ) : null}
        <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
          USDT · TRC20
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
          {t("Payment address")}
        </Typography>
        <Typography variant="body2" sx={{ wordBreak: "break-all", fontFamily: "monospace" }}>
          {order.payAddress}
        </Typography>
        <Button size="small" startIcon={<Copy size={14} />} onClick={() => void copyAddress()} sx={{ mt: 1 }}>
          {t("Copy address")}
        </Button>
      </Paper>

      <Paper className="confirm-box">
        {order.amount > 0 ? (
          <Typography variant="body2">
            {t("Reference amount")}: {formatMoney(order.amount, order.currency)}
          </Typography>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {t("Transfer any USDT amount from your wallet. Balance credits by on-chain receipt.")}
          </Typography>
        )}
        <Typography variant="body2" color="text.secondary">
          {t("Status")}: {order.status}
        </Typography>
        {order.expiresAt ? (
          <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
            {t("Expires")}: {new Date(order.expiresAt).toLocaleString()}
          </Typography>
        ) : null}
        {order.paidAmount != null && order.paidAmount > 0 ? (
          <Typography variant="body2" color="success.main">
            {t("Received")}: {order.paidAmount} USDT
          </Typography>
        ) : null}
      </Paper>
    </Stack>
  );
}
