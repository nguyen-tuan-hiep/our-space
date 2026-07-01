import type { Metadata } from "next";
import { Be_Vietnam_Pro, Merriweather } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import "./globals.css";
import { AppProviders } from "@/components/layout/app-providers";
import { themeColors } from "@/lib/theme-colors";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600"],
  variable: "--font-sans",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Our Space 𑣲⋆",
  description: "A private daily hub for two people, wherever they are.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Our Space 𑣲⋆",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${beVietnamPro.variable} ${merriweather.variable}`}
      style={
        {
          "--color-bg": themeColors.bg,
          "--color-paper": themeColors.paper,
          "--color-dark-bg": themeColors.darkBg,
          "--color-dark-text": themeColors.darkText,
        } as React.CSSProperties
      }
    >
      <body>
        <AppRouterCacheProvider>
          <AppProviders>
            {children}
          </AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
