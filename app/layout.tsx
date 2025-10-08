import type { Metadata } from "next";
import { ColorSchemeScript } from '@mantine/core';
import { Providers } from "./providers";
import "./globals.css";
import Header from "@/components/shared/Header";
import Footer from "@/components/shared/Footer";

export const metadata: Metadata = {
  title: "Bidinsouk - Marketplace & Auction Platform",
  description: "Discover unique products and participate in exciting auctions on Bidinsouk marketplace",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <ColorSchemeScript defaultColorScheme="light" />
      </head>
      <body suppressHydrationWarning>
        <Providers>
          <Header />
          <main style={{ minHeight: 'calc(100vh - 200px)' }}>
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}