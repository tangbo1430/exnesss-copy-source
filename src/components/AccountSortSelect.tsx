import { useMemo, useState } from "react";
import { Button, ListItemIcon, ListItemText, Menu, MenuItem } from "@mui/material";
import { ArrowDown10, ArrowDownAZ, ArrowDownNarrowWide, ArrowUpNarrowWide, ChevronDown, type LucideIcon } from "lucide-react";

export type AccountSort = "newest" | "oldest" | "freeMargin" | "nickname";

const sortOptions: Array<{ value: AccountSort; label: string; icon: LucideIcon }> = [
  { value: "newest", label: "Newest", icon: ArrowUpNarrowWide },
  { value: "oldest", label: "Earliest", icon: ArrowDownNarrowWide },
  { value: "freeMargin", label: "Available margin", icon: ArrowDown10 },
  { value: "nickname", label: "Account nickname", icon: ArrowDownAZ },
];

export function sortAccounts<T extends { createdAt: string; freeMargin: number; nickname: string }>(
  accounts: T[],
  sort: AccountSort,
): T[] {
  return [...accounts].sort((a, b) => {
    if (sort === "oldest") {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sort === "freeMargin") {
      return b.freeMargin - a.freeMargin;
    }
    if (sort === "nickname") {
      return a.nickname.localeCompare(b.nickname);
    }
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

export function AccountSortSelect({ value, onChange }: { value: AccountSort; onChange: (value: AccountSort) => void }) {
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const open = Boolean(anchor);

  const selected = useMemo(() => sortOptions.find((option) => option.value === value) ?? sortOptions[0], [value]);
  const SelectedIcon = selected.icon;

  return (
    <>
      <Button
        className="account-sort-trigger"
        variant="outlined"
        color="inherit"
        onClick={(event) => setAnchor(event.currentTarget)}
        startIcon={<SelectedIcon size={16} />}
        endIcon={<ChevronDown size={16} className={`chevron ${open ? "is-open" : ""}`} />}
      >
        {selected.label}
      </Button>
      <Menu
        anchorEl={anchor}
        open={open}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { minWidth: 220 } } }}
      >
        {sortOptions.map((option) => {
          const OptionIcon = option.icon;
          return (
            <MenuItem
              key={option.value}
              selected={value === option.value}
              onClick={() => {
                onChange(option.value);
                setAnchor(null);
              }}
            >
              <ListItemIcon>
                <OptionIcon size={18} />
              </ListItemIcon>
              <ListItemText>{option.label}</ListItemText>
            </MenuItem>
          );
        })}
      </Menu>
    </>
  );
}
