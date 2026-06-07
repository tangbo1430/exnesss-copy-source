import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItem,
  ListItemText,
  Typography,
} from "@mui/material";
import { CircleHelp, X } from "lucide-react";
import { translateText } from "../i18n";

type Props = {
  language: string;
  open: boolean;
  onClose: () => void;
};

export function UsdtDepositHelpButton({ language, onClick }: { language: string; onClick: () => void }) {
  const t = (text: string) => translateText(text, language);
  return (
    <IconButton
      size="small"
      aria-label={t("How to pay")}
      onClick={onClick}
      sx={{ color: "text.secondary" }}
    >
      <CircleHelp size={20} />
    </IconButton>
  );
}

export function UsdtDepositHelpDialog({ language, open, onClose }: Props) {
  const t = (text: string) => translateText(text, language);

  const steps = [
    t("Open a crypto wallet that supports USDT on the Tron network (TRC20), such as imToken, TronLink, TokenPocket, or Trust Wallet. You can also withdraw USDT-TRC20 from an exchange to this address."),
    t("Recommended: tap Copy address on this page, then in your wallet choose Send / Transfer → USDT → network Tron (TRC20) → paste the address and amount."),
    t("Alternatively, open the scan function inside your wallet app (not WeChat or Alipay) and scan the QR code on this page. The QR contains the same deposit address."),
    t("Double-check: currency USDT, network TRC20 only. Do not use ERC20, BEP20, or other networks."),
    t("Submit the transfer and wait for on-chain confirmation. Your platform balance will update automatically based on the actual amount received."),
  ];

  const warnings = [
    t("WeChat Pay and Alipay cannot send USDT."),
    t("Enter the amount you wish to transfer in your wallet. Credited balance follows the actual on-chain receipt (1 USDT = 1 USD)."),
  ];

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", pr: 1 }}>
        {t("How to pay with USDT (TRC20)")}
        <IconButton aria-label={t("Close")} onClick={onClose} size="small">
          <X size={18} />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {t("This follows the usual exchange deposit flow: QR code and address show the same Tron receiving address from the payment gateway. Any compatible wallet can pay.")}
        </Typography>
        <Typography variant="subtitle2" gutterBottom>
          {t("Steps")}
        </Typography>
        <List dense disablePadding>
          {steps.map((step, index) => (
            <ListItem key={step} disableGutters sx={{ alignItems: "flex-start" }}>
              <ListItemText
                primary={`${index + 1}. ${step}`}
                slotProps={{ primary: { variant: "body2" } }}
              />
            </ListItem>
          ))}
        </List>
        <Typography variant="subtitle2" gutterBottom sx={{ mt: 1 }}>
          {t("Please note")}
        </Typography>
        <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
          {warnings.map((item) => (
            <Typography key={item} component="li" variant="body2" sx={{ mb: 0.5 }}>
              {item}
            </Typography>
          ))}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
