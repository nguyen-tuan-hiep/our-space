import type { Metadata } from "next";
import { Be_Vietnam_Pro, Merriweather } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import "./globals.css";
import { AppProviders } from "@/components/layout/app-providers";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-sans",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin", "vietnamese"],
  weight: ["300", "400", "700", "900"],
  variable: "--font-serif",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Our Space",
  description: "A private daily hub for two people across Vietnam and Singapore.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Our Space",
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${beVietnamPro.variable} ${merriweather.variable}`}
    >
      <body>
        <AppRouterCacheProvider>
          <AppProviders>{children}</AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
