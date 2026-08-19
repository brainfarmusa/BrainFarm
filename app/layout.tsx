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
    icon: "/site/assets/brain-farm-usa-emblem-transparent.png",
    shortcut: "/site/assets/brain-farm-usa-emblem-transparent.png",
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
