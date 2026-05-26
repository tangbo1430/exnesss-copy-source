import { useState } from "react";
import { Box, IconButton, ListItemIcon, ListItemText, Menu, MenuItem, Typography } from "@mui/material";
import { Contrast, Moon, Sun, type LucideIcon } from "lucide-react";
import { useThemeMode } from "../theme/ThemeModeProvider";
import type { ThemeMode } from "../theme/themeMode";

const themeOptions: Array<{ value: ThemeMode; label: string; icon: LucideIcon }> = [
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
  { value: "system", label: "System theme", icon: Contrast },
];

const themeModeIcons: Record<ThemeMode, LucideIcon> = {
  light: Sun,
  dark: Moon,
  system: Contrast,
};

export function ThemeMenuButton({ size = 20 }: { size?: number }) {
  const { mode, setMode } = useThemeMode();
  const [anchor, setAnchor] = useState<HTMLElement | null>(null);
  const TriggerIcon = themeModeIcons[mode];

  return (
    <>
      <IconButton aria-label="Display theme" onClick={(event) => setAnchor(event.currentTarget)}>
        <TriggerIcon size={size} />
      </IconButton>
      <Menu
        anchorEl={anchor}
        open={Boolean(anchor)}
        onClose={() => setAnchor(null)}
        slotProps={{ paper: { sx: { width: 240 } } }}
      >
        <Box className="theme-menu-header">
          <Typography variant="body2" color="text.secondary">
            Display theme
          </Typography>
        </Box>
        {themeOptions.map((option) => {
          const OptionIcon = option.icon;
          return (
            <MenuItem
              key={option.value}
              selected={mode === option.value}
              onClick={() => {
                setMode(option.value);
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
