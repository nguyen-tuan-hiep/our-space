import type { Metadata } from "next";
import { Be_Vietnam_Pro, Merriweather } from "next/font/google";
import { AppRouterCacheProvider } from "@mui/material-nextjs/v15-appRouter";
import "./globals.css";
import { AppProviders } from "@/components/layout/app-providers";
import { OneSignalBootstrap } from "@/components/notifications/onesignal-bootstrap";
import { ONESIGNAL_WEB_APP_ID } from "@/lib/onesignal-web";
import { themeColors } from "@/lib/theme-colors";

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
  title: "Our Space 𑣲⋆",
  description:
    "A private daily hub for two people across Vietnam and Singapore.",
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
      <head>
        <script
          id="onesignal-sdk"
          src="https://cdn.onesignal.com/sdks/web/v16/OneSignalSDK.page.js"
          defer
        />
        <script
          id="onesignal-init"
          dangerouslySetInnerHTML={{
            __html: `
            window.OneSignalDeferred = window.OneSignalDeferred || [];
            window.__oneSignalInitPromise = new Promise(function(resolve, reject) {
              window.OneSignalDeferred.push(async function(OneSignal) {
                try {
                  await OneSignal.init({
                    appId: "${ONESIGNAL_WEB_APP_ID}",
                    serviceWorkerPath: "OneSignalSDKWorker.js",
                    serviceWorkerParam: { scope: "/" },
                    notifyButton: { enable: false },
                    welcomeNotification: { disable: true },
                    promptOptions: {
                      slidedown: {
                        prompts: [{
                          type: "push",
                          autoPrompt: false,
                          text: {
                            actionMessage: "Allow private note and finance notifications?",
                            acceptButton: "Allow",
                            cancelButton: "Not now"
                          }
                        }]
                      }
                    }
                  });
                  window.__oneSignalInitialized = true;
                  resolve(OneSignal);
                } catch (error) {
                  reject(error);
                }
              });
            });
          `,
          }}
        />
      </head>
      <body>
        <AppRouterCacheProvider>
          <AppProviders>
            <OneSignalBootstrap />
            {children}
          </AppProviders>
        </AppRouterCacheProvider>
      </body>
    </html>
  );
}
