export type CryptoWalletSort = "name" | "balance";

export type CryptoWalletType = "exchange" | "self-custody";

export interface CryptoAccountAsset {
  id: string;
  name: string;
  symbol: string;
  balance: number;
  usdValue: number;
  decimals: number;
  icons: string[];
}

export interface ExternalCryptoWallet {
  id: string;
  address: string;
  walletType: CryptoWalletType;
  label: string;
}

export const cryptoAccountAssets: CryptoAccountAsset[] = [
  {
    id: "btc",
    name: "Bitcoin",
    symbol: "BTC",
    balance: 0,
    usdValue: 0,
    decimals: 8,
    icons: ["https://assets.coingecko.com/coins/images/1/small/bitcoin.png"],
  },
  {
    id: "bnb",
    name: "BNB",
    symbol: "BNB",
    balance: 0,
    usdValue: 0,
    decimals: 8,
    icons: ["https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png"],
  },
  {
    id: "eth",
    name: "Ether",
    symbol: "ETH",
    balance: 0,
    usdValue: 0,
    decimals: 8,
    icons: ["https://assets.coingecko.com/coins/images/279/small/ethereum.png"],
  },
  {
    id: "usdt-bep20",
    name: "Tether",
    symbol: "USDT BEP20",
    balance: 0,
    usdValue: 0,
    decimals: 2,
    icons: [
      "https://assets.coingecko.com/coins/images/325/small/Tether.png",
      "https://assets.coingecko.com/coins/images/825/small/bnb-icon2_2x.png",
    ],
  },
  {
    id: "usdt-erc20",
    name: "Tether",
    symbol: "USDT ERC20",
    balance: 0,
    usdValue: 0,
    decimals: 2,
    icons: [
      "https://assets.coingecko.com/coins/images/325/small/Tether.png",
      "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
    ],
  },
  {
    id: "usdt-trc20",
    name: "Tether",
    symbol: "USDT TRC20",
    balance: 0,
    usdValue: 0,
    decimals: 2,
    icons: [
      "https://assets.coingecko.com/coins/images/325/small/Tether.png",
      "https://assets.coingecko.com/coins/images/1094/small/tron-logo.png",
    ],
  },
];

export const cryptoWalletSortOptions: Array<{ value: CryptoWalletSort; label: string }> = [
  { value: "name", label: "账户姓名" },
  { value: "balance", label: "余额" },
];

export function formatCryptoBalance(asset: CryptoAccountAsset) {
  const amount = asset.balance.toFixed(asset.decimals);
  const unit = asset.symbol.includes("USDT") ? "USDT" : asset.symbol.split(" ")[0];
  return `${amount} ${unit}`;
}

export function formatUsdApprox(value: number) {
  return `≈ ${value.toFixed(2)} USD`;
}

export function sortCryptoAssets(assets: CryptoAccountAsset[], sort: CryptoWalletSort) {
  return [...assets].sort((a, b) => {
    if (sort === "balance") {
      return b.usdValue - a.usdValue || a.name.localeCompare(b.name);
    }
    return a.name.localeCompare(b.name) || a.symbol.localeCompare(b.symbol);
  });
}

export function maskWalletAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
