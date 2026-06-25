"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SnackbarProvider } from "notistack";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { RuntimeErrorGuard } from "@/components/layout/runtime-error-guard";
import { themeColors } from "@/lib/theme-colors";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: themeColors.bg,
      paper: themeColors.paper,
    },
    primary: {
      main: themeColors.mui,
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "var(--font-sans), ui-sans-serif, system-ui, sans-serif",
    h1: {
      fontFamily: "var(--font-serif), Georgia, Times New Roman, serif",
    },
    h2: {
      fontFamily: "var(--font-serif), Georgia, Times New Roman, serif",
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: "none",
          fontWeight: 700,
        },
        outlinedPrimary: {
          borderColor: themeColors.mui,
          color: themeColors.mui,
          "&:hover": {
            borderColor: themeColors.mui,
            backgroundColor: `color-mix(in srgb, ${themeColors.mui} 10%, transparent)`,
          },
        },
        textPrimary: {
          color: themeColors.mui,
          "&:hover": {
            backgroundColor: `color-mix(in srgb, ${themeColors.mui} 10%, transparent)`,
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: `0 22px 70px ${themeColors.shadowCard}`,
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 8,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        fullWidth: true,
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: {
          "&.Mui-focused": {
            color: themeColors.mui,
          },
        },
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: themeColors.paper,
          borderRadius: 8,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: themeColors.mui,
          },
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        icon: {
          ".Mui-focused &": {
            color: themeColors.mui,
          },
        },
      },
    },
    MuiToggleButton: {
      styleOverrides: {
        root: {
          "&.Mui-selected": {
            borderColor: themeColors.mui,
            color: themeColors.mui,
            backgroundColor: `color-mix(in srgb, ${themeColors.mui} 12%, transparent)`,
          },
          "&.Mui-selected:hover": {
            backgroundColor: `color-mix(in srgb, ${themeColors.mui} 18%, transparent)`,
          },
        },
      },
    },
  },
});

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider theme={theme}>
      <LocalizationProvider dateAdapter={AdapterDayjs}>
        <SnackbarProvider
          maxSnack={4}
          anchorOrigin={{ vertical: "top", horizontal: "right" }}
          autoHideDuration={3200}
        >
          <CssBaseline />
          <RuntimeErrorGuard />
          {children}
        </SnackbarProvider>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
