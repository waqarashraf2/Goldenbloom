import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Golden Bloom CRM | Leads & Telecalling Management",
  description: "Centralized Lead Ingestion, Google Sheet Sync, and Telecaller Management CRM for Golden Bloom UAE (goldenbloom.ae)",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-slate-50/50 text-slate-800">
        {children}
      </body>
    </html>
  );
}
