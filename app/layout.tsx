import type { Metadata } from "next";
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Bidinsouk - Marketplace & Auction Platform",
  description: "Discover unique products and participate in exciting auctions on Bidinsouk marketplace",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}