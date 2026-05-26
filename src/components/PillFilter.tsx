import { useState, type MouseEvent, type ReactNode } from "react";
import { Menu, MenuItem } from "@mui/material";
import { ChevronDown, ChevronRight } from "lucide-react";

export function PillFilter<T extends string>({
  label,
  value,
  options,
  onChange,
  active = false,
  startIcon,
  onOptionClick,
}: {
  label: string;
  value: T;
  options: Array<{ value: T; label: string; trailingIcon?: "chevron-right" }>;
  onChange: (value: T) => void;
  active?: boolean;
  startIcon?: ReactNode;
  onOptionClick?: (value: T, event: MouseEvent<HTMLElement>) => void;
}) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  return (
    <>
      <button
        type="button"
        className={`pill-filter ${active ? "is-active" : ""}`}
        onClick={(event) => setAnchor(event.currentTarget)}
      >
        {startIcon}
        <span className="pill-filter-label">{label}</span>
        <ChevronDown size={16} className={`pill-filter-chevron ${open ? "is-open" : ""}`} />
      </button>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { className: "pill-filter-menu", sx: { minWidth: 220 } } }}
      >
        {options.map((option) => (
          <MenuItem
            key={option.value}
            selected={value === option.value}
            className="pill-filter-menu-item"
            onClick={() => {
              if (onOptionClick) {
                onOptionClick(option.value, {} as MouseEvent<HTMLElement>);
              } else {
                onChange(option.value);
              }
              setAnchor(null);
            }}
          >
            <span>{option.label}</span>
            {option.trailingIcon === "chevron-right" && <ChevronRight size={16} />}
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}
