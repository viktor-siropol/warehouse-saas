import type { Metadata } from "next";

import { Geist } from "next/font/google";

import { TooltipProvider } from "@/components/ui/tooltip";

import "./globals.css";

const geist = Geist({
  subsets: ["latin"],

  variable: "--font-geist-sans",
});

export const metadata: Metadata = {
  title: {
    default: "Warehouse",
    template: "%s | Warehouse",
  },

  description: "Warehouse operations management platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geist.variable} min-h-screen font-sans antialiased`}>
        <TooltipProvider>{children}</TooltipProvider>
      </body>
    </html>
  );
}
