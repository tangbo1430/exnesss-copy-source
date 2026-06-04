const currencyCountryCodes: Record<string, string> = {
  AUD: "au",
  CAD: "ca",
  USD: "us",
  EUR: "eu",
  GBP: "gb",
  JPY: "jp",
  CHF: "ch",
  NZD: "nz",
  SEK: "se",
  NOK: "no",
  DKK: "dk",
  PLN: "pl",
  HUF: "hu",
  CZK: "cz",
  SGD: "sg",
  HKD: "hk",
  CNH: "cn",
  ZAR: "za",
  MXN: "mx",
  TRY: "tr",
};

const cryptoIconUrls: Record<string, string> = {
  BTC: "https://assets.coingecko.com/coins/images/1/small/bitcoin.png",
  ETH: "https://assets.coingecko.com/coins/images/279/small/ethereum.png",
};

export function flagIconUrl(countryCode: string, size = 40) {
  return `https://flagcdn.com/w${size}/${countryCode.toLowerCase()}.png`;
}

export function parseInstrumentSymbol(symbol: string) {
  if (symbol.includes("/")) {
    const [base, quote] = symbol.split("/");
    return { base: base.trim(), quote: quote.trim() };
  }

  if (symbol.length === 6) {
    return { base: symbol.slice(0, 3), quote: symbol.slice(3, 6) };
  }

  return { base: symbol, quote: "" };
}

export function getInstrumentIcons(symbol: string) {
  const { base, quote } = parseInstrumentSymbol(symbol);

  const baseCrypto = cryptoIconUrls[base];
  const quoteCrypto = cryptoIconUrls[quote];
  const baseCountry = currencyCountryCodes[base];
  const quoteCountry = currencyCountryCodes[quote];

  return {
    base: baseCrypto
      ? { kind: "crypto" as const, src: baseCrypto, label: base }
      : baseCountry
        ? { kind: "flag" as const, src: flagIconUrl(baseCountry), label: base }
        : base === "XAU" || base === "GOLD"
          ? { kind: "metal" as const, label: "Gold" }
          : base === "XAG"
            ? { kind: "metal" as const, label: "Silver" }
            : null,
    quote: quoteCrypto
      ? { kind: "crypto" as const, src: quoteCrypto, label: quote }
      : quoteCountry
        ? { kind: "flag" as const, src: flagIconUrl(quoteCountry), label: quote }
        : null,
  };
}
