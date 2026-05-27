import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { ModalPortal } from "./ModalPortal";
import { CountryFlag } from "./CountryFlag";
import { DEFAULT_PHONE_COUNTRY, PHONE_COUNTRIES, type PhoneCountry } from "../data/phoneCountries";

type Props = {
  value: PhoneCountry;
  onChange: (country: PhoneCountry) => void;
};

const LIST_WIDTH = 340;
const LIST_MAX_HEIGHT = 320;

export function PhoneCountrySelect({ value, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, maxHeight: LIST_MAX_HEIGHT });

  const updateMenuPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const rect = trigger.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;
    const openUp = spaceBelow < 200 && spaceAbove > spaceBelow;
    const maxHeight = Math.min(
      LIST_MAX_HEIGHT,
      openUp ? spaceAbove - 8 : spaceBelow - 8,
    );
    setMenuRect({
      top: openUp ? rect.top - maxHeight - 4 : rect.bottom + 4,
      left: rect.left,
      maxHeight: Math.max(160, maxHeight),
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    updateMenuPosition();
    window.addEventListener("resize", updateMenuPosition);
    window.addEventListener("scroll", updateMenuPosition, true);
    return () => {
      window.removeEventListener("resize", updateMenuPosition);
      window.removeEventListener("scroll", updateMenuPosition, true);
    };
  }, [open, updateMenuPosition]);

  useEffect(() => {
    function onDocClick(event: MouseEvent) {
      const target = event.target as Node;
      if (rootRef.current?.contains(target)) return;
      if ((event.target as HTMLElement).closest?.(".profile-phone-country-list")) return;
      setOpen(false);
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const list = open ? (
    <ModalPortal>
      <ul
        className="profile-phone-country-list profile-phone-country-list--portal"
        role="listbox"
        style={{
          position: "fixed",
          top: menuRect.top,
          left: menuRect.left,
          width: LIST_WIDTH,
          maxHeight: menuRect.maxHeight,
        }}
      >
        {PHONE_COUNTRIES.map((country) => (
          <li key={country.code}>
            <button
              type="button"
              role="option"
              aria-selected={country.code === value.code}
              className={country.code === value.code ? "is-selected" : ""}
              onClick={() => {
                onChange(country);
                setOpen(false);
              }}
            >
              <CountryFlag code={country.code} size="sm" />
              <span className="profile-phone-country-name">{country.name}</span>
              <span className="profile-phone-country-dial">{country.dial}</span>
            </button>
          </li>
        ))}
      </ul>
    </ModalPortal>
  ) : null;

  return (
    <div className="profile-phone-country" ref={rootRef}>
      <button
        ref={triggerRef}
        type="button"
        className="profile-phone-prefix"
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((v) => !v)}
      >
        <CountryFlag code={value.code} />
        <span className="profile-phone-prefix-dial">{value.dial}</span>
        <ChevronDown size={14} className={`chevron${open ? " is-open" : ""}`} />
      </button>
      {list}
    </div>
  );
}

export { DEFAULT_PHONE_COUNTRY };
