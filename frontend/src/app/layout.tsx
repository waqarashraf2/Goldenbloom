import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golden Bloom CRM | Leads & Telecalling Management",
  description: "Centralized Lead Ingestion, Google Sheet Sync, and Telecaller Management CRM for Golden Bloom UAE (goldenbloom.ae)",
  icons: {
    icon: [
      { url: "/favicon.ico?v=2", sizes: "any" },
      { url: "/icon-32.png?v=2", type: "image/png", sizes: "32x32" },
      { url: "/icon-192.png?v=2", type: "image/png", sizes: "192x192" },
      { url: "/goldenbloom-logo.png?v=2", type: "image/png" },
    ],
    shortcut: "/favicon.ico?v=2",
    apple: "/icon-192.png?v=2",
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
        <link rel="icon" href="/favicon.ico?v=2" sizes="any" />
        <link rel="icon" type="image/png" sizes="32x32" href="/icon-32.png?v=2" />
        <link rel="icon" type="image/png" sizes="192x192" href="/icon-192.png?v=2" />
        <link rel="shortcut icon" href="/favicon.ico?v=2" />
        <link rel="apple-touch-icon" href="/icon-192.png?v=2" />
      </head>
      <body className="min-h-full flex flex-col bg-slate-50/50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
