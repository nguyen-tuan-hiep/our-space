"use client";

import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import { SnackbarProvider } from "notistack";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { RuntimeErrorGuard } from "@/components/layout/runtime-error-guard";

const theme = createTheme({
  palette: {
    mode: "light",
    background: {
      default: "#f5f3ee",
      paper: "#fffaf0",
    },
    primary: {
      main: "#11110f",
    },
    secondary: {
      main: "#b76e79",
    },
  },
  shape: {
    borderRadius: 8,
  },
  typography: {
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    h1: {
      fontFamily: "Iowan Old Style, Baskerville, Times New Roman, serif",
    },
    h2: {
      fontFamily: "Iowan Old Style, Baskerville, Times New Roman, serif",
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
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: "0 22px 70px rgba(17, 17, 15, 0.10)",
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
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: "#fffefb",
          borderRadius: 8,
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
