import type { Metadata, Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#166534",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Golden Bloom CRM | Leads & Telecalling Management",
  description: "Centralized Lead Ingestion, Google Sheet Sync, and Telecaller Management CRM for Golden Bloom UAE (goldenbloom.ae)",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Golden Bloom",
  },
  icons: {
    icon: [
      { url: "/favicon.ico?v=3", sizes: "any" },
      { url: "/icon-32.png?v=3", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png?v=3", type: "image/png", sizes: "192x192" },
      { url: "/icon-512.png?v=3", type: "image/png", sizes: "512x512" },
    ],
    shortcut: "/favicon.ico?v=3",
    apple: [
      { url: "/apple-touch-icon.png?v=3", sizes: "180x180", type: "image/png" },
      { url: "/icon-192.png?v=3", sizes: "192x192", type: "image/png" },
    ],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <head>
        <link rel="icon" href="/favicon.ico?v=3" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png?v=3" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=3" />
        <link rel="icon" type="image/png" sizes="512x512" href="/icon-512.png?v=3" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
        <link rel="apple-touch-icon" sizes="192x192" href="/icon-192.png?v=3" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Golden Bloom" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50/50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
