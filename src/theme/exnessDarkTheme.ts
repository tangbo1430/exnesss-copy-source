import { createTheme } from "@mui/material/styles";

export const exnessDarkTheme = createTheme({
  typography: {
    fontFamily: 'aktiv-grotesk, "Segoe UI", Arial, sans-serif',
    h1: { fontSize: 32, lineHeight: 1.25, fontWeight: 500 },
    h2: { fontSize: 24, lineHeight: 1.3, fontWeight: 500 },
    h3: { fontSize: 20, lineHeight: 1.35, fontWeight: 500 },
    button: { textTransform: "none", fontWeight: 500 },
  },
  palette: {
    mode: "dark",
    text: {
      primary: "#f5f7fa",
      secondary: "rgba(245, 247, 250, 0.6)",
    },
    primary: {
      main: "#ffde02",
      contrastText: "#141d22",
    },
    error: {
      main: "#ff5a64",
    },
    background: {
      default: "#0d1114",
      paper: "#1a2228",
    },
    divider: "rgba(255, 255, 255, 0.12)",
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          color: "#f5f7fa",
          background: "#0d1114",
          minWidth: 320,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        disableElevation: true,
      },
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 4,
          paddingLeft: 16,
          paddingRight: 16,
          boxShadow: "none",
        },
        contained: {
          "&.MuiButton-containedPrimary": {
            backgroundColor: "#ffde02",
            color: "#141d22",
            "&:hover": {
              backgroundColor: "#f5d300",
              boxShadow: "none",
            },
          },
        },
        outlined: {
          borderColor: "rgba(255, 255, 255, 0.12)",
          color: "#f5f7fa",
          "&:hover": {
            borderColor: "rgba(255, 255, 255, 0.2)",
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
      },
    },
    MuiIconButton: {
      styleOverrides: {
        root: {
          width: 40,
          height: 40,
          borderRadius: 4,
          color: "#f5f7fa",
          "&:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 0,
          boxShadow: "none",
          backgroundColor: "#1a2228",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 4,
          padding: 9,
          color: "#f5f7fa",
          "&.Mui-selected": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
          "&.Mui-selected:hover, &:hover": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          height: 32,
          borderRadius: 4,
          borderColor: "rgba(255, 255, 255, 0.12)",
          padding: "0 14px",
          textTransform: "none",
          color: "#f5f7fa",
          "&.Mui-selected": {
            backgroundColor: "rgba(255, 255, 255, 0.08)",
            color: "#f5f7fa",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "none",
          backgroundColor: "#1a2228",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        rounded: {
          borderRadius: 8,
        },
      },
    },
    MuiMenu: {
      styleOverrides: {
        paper: {
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "0 14px 40px rgba(0, 0, 0, 0.48)",
          backgroundColor: "#1a2228",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: "0 24px 80px rgba(0, 0, 0, 0.56)",
          backgroundColor: "#1a2228",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          minHeight: 40,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#8aa3b2",
            borderWidth: 1,
          },
        },
        input: {
          paddingTop: 10,
          paddingBottom: 10,
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(255, 255, 255, 0.12)",
          boxShadow: "none",
          backgroundColor: "#1a2228",
          "&:before": { display: "none" },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          width: 56,
          height: 56,
          boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        indicator: {
          backgroundColor: "#f5f7fa",
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          color: "rgba(245, 247, 250, 0.55)",
          "&.Mui-selected": {
            color: "#f5f7fa",
          },
        },
      },
    },
  },
});
