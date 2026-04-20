import type { Metadata, Viewport } from "next";
import localFont from "next/font/local";
import "./globals.css";

const sfPro = localFont({
  src: [
    { path: "../Fonts/SF-Pro-Display-Regular.otf", weight: "400", style: "normal" },
    { path: "../Fonts/SF-Pro-Display-Medium.otf", weight: "500", style: "normal" },
    { path: "../Fonts/SF-Pro-Display-Semibold.otf", weight: "600", style: "normal" },
    { path: "../Fonts/SF-Pro-Display-Bold.otf", weight: "700", style: "normal" },
  ],
  variable: "--font-sf-pro",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Argo Growth",
  description: "Operations dashboard for Argo Growth.",
  manifest: "/manifest.json",
  appleWebApp: { capable: true, statusBarStyle: "default", title: "Argo" },
};

export const viewport: Viewport = {
  themeColor: "#fff2ec",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={sfPro.variable} suppressHydrationWarning>
      <body className="antialiased min-h-screen bg-gradient-app font-sf-pro">{children}</body>
    </html>
  );
}
