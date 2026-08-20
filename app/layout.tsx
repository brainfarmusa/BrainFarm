import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "BrainFarm USA | Private Enterprise AI",
  description:
    "Secure, on-premises AI appliances for document intelligence, enterprise knowledge search, automation, and analytics.",
  other: {
    "codex-preview": "development",
  },
  icons: {
    icon: {
      url: "/favicon.ico?v=2",
      type: "image/x-icon",
    },
    shortcut: "/favicon.ico?v=2",
    apple: "/favicon.png?v=2",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
