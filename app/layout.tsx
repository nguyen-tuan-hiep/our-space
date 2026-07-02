import type { Metadata, Viewport } from "next";
import { Be_Vietnam_Pro, Merriweather } from "next/font/google";
import "./globals.css";
import { AppProviders } from "@/components/layout/app-providers";
import { themeColors } from "@/lib/theme-colors";

const beVietnamPro = Be_Vietnam_Pro({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "600"],
  variable: "--font-sans",
  display: "swap",
});

const merriweather = Merriweather({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "700"],
  variable: "--font-serif",
  display: "swap",
  preload: false,
});

const appleStartupImages = [
  { size: "320x568", ratio: 2, portrait: "640-1136" },
  { size: "375x667", ratio: 2, portrait: "750-1334" },
  { size: "414x896", ratio: 2, portrait: "828-1792" },
  { size: "375x812", ratio: 3, portrait: "1125-2436" },
  { size: "414x736", ratio: 3, portrait: "1242-2208" },
  { size: "414x896", ratio: 3, portrait: "1242-2688" },
  { size: "390x844", ratio: 3, portrait: "1170-2532" },
  { size: "393x852", ratio: 3, portrait: "1179-2556" },
  { size: "428x926", ratio: 3, portrait: "1284-2778" },
  { size: "430x932", ratio: 3, portrait: "1290-2796" },
  { size: "360x780", ratio: 3, portrait: "1080-2340" },
  { size: "402x874", ratio: 3, portrait: "1206-2622" },
  { size: "440x956", ratio: 3, portrait: "1320-2868" },
  { size: "744x1133", ratio: 2, portrait: "1488-2266" },
  { size: "768x1024", ratio: 2, portrait: "1536-2048" },
  { size: "810x1080", ratio: 2, portrait: "1620-2160" },
  { size: "820x1180", ratio: 2, portrait: "1640-2360" },
  { size: "834x1112", ratio: 2, portrait: "1668-2224" },
  { size: "834x1194", ratio: 2, portrait: "1668-2388" },
  { size: "834x1210", ratio: 2, portrait: "1668-2420" },
  { size: "1024x1366", ratio: 2, portrait: "2048-2732" },
  { size: "1032x1376", ratio: 2, portrait: "2064-2752" },
].flatMap(({ size, ratio, portrait }) => {
  const [deviceWidth, deviceHeight] = size.split("x");
  const [imageWidth, imageHeight] = portrait.split("-");

  return [
    {
      url: `/splash/apple-splash-${portrait}.png`,
      media: `(device-width: ${deviceWidth}px) and (device-height: ${deviceHeight}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: portrait)`,
    },
    {
      url: `/splash/apple-splash-${imageHeight}-${imageWidth}.png`,
      media: `(device-width: ${deviceHeight}px) and (device-height: ${deviceWidth}px) and (-webkit-device-pixel-ratio: ${ratio}) and (orientation: landscape)`,
    },
  ];
});

export const metadata: Metadata = {
  title: "Our Space 𑣲⋆",
  description: "A private daily hub for two people, wherever they are.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "Our Space 𑣲⋆",
    statusBarStyle: "default",
    startupImage: appleStartupImages,
  },
  // 💡 TỐI ƯU TẠI ĐÂY: Khai báo tường minh icon cho Apple với nhiều kích thước khác nhau
  // Khai báo thêm shortcut để đảm bảo macOS Web App ưu tiên nhận diện ảnh icon chứ không lấy ảnh splash
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/splash/apple-icon-180.png", sizes: "180x180", type: "image/png" }
    ],
    apple: [
      { url: "/splash/apple-icon-180.png", sizes: "180x180", type: "image/png" },
      // Nếu bạn có file icon lớn hơn như 512x512 được gen ra, hãy thêm vào đây để macOS hiển thị cực nét:
      // { url: "/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
  },
};

export const viewport: Viewport = {
  viewportFit: "cover",
  themeColor: themeColors.darkBg,
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
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
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}