import { createTheme } from "@mui/material/styles";

export const exnessTheme = createTheme({
  typography: {
    fontFamily: 'aktiv-grotesk, "Segoe UI", Arial, sans-serif',
    h1: { fontSize: 32, lineHeight: 1.25, fontWeight: 500 },
    h2: { fontSize: 24, lineHeight: 1.3, fontWeight: 500 },
    h3: { fontSize: 20, lineHeight: 1.35, fontWeight: 500 },
    button: { textTransform: "none", fontWeight: 500 },
  },
  palette: {
    text: {
      primary: "#141d22",
      secondary: "rgba(20, 29, 34, 0.6)",
    },
    primary: {
      main: "#ffde02",
      contrastText: "#141d22",
    },
    error: {
      main: "#d31f2a",
    },
    background: {
      default: "#fff",
      paper: "#fff",
    },
  },
  shape: {
    borderRadius: 4,
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          color: "#141d22",
          background: "#fff",
          minWidth: 320,
        },
      },
    },
    MuiButtonBase: {
      defaultProps: {
        disableTouchRipple: false,
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
          borderColor: "rgba(20, 29, 34, 0.12)",
          color: "#141d22",
          "&:hover": {
            borderColor: "rgba(20, 29, 34, 0.2)",
            backgroundColor: "rgba(108, 133, 149, 0.08)",
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
          color: "#141d22",
          "&:hover": {
            backgroundColor: "rgba(108, 133, 149, 0.08)",
          },
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 0,
          boxShadow: "none",
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          minHeight: 40,
          borderRadius: 4,
          padding: 9,
          color: "#141d22",
          "&.Mui-selected": {
            backgroundColor: "rgba(108, 133, 149, 0.08)",
          },
          "&.Mui-selected:hover, &:hover": {
            backgroundColor: "rgba(108, 133, 149, 0.08)",
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          height: 32,
          borderRadius: 4,
          borderColor: "rgba(20, 29, 34, 0.12)",
          padding: "0 14px",
          textTransform: "none",
          color: "#141d22",
          "&.Mui-selected": {
            backgroundColor: "rgba(108, 133, 149, 0.08)",
            color: "#141d22",
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: "1px solid rgba(20, 29, 34, 0.12)",
          boxShadow: "none",
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
          border: "1px solid rgba(20, 29, 34, 0.12)",
          boxShadow: "0 14px 40px rgba(20, 29, 34, 0.16)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
          boxShadow: "0 24px 80px rgba(20, 29, 34, 0.24)",
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          minHeight: 40,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#6c8595",
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
          border: "1px solid rgba(20, 29, 34, 0.12)",
          boxShadow: "none",
          "&:before": { display: "none" },
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          width: 56,
          height: 56,
          boxShadow: "0 8px 24px rgba(20, 29, 34, 0.18)",
        },
      },
    },
  },
});
