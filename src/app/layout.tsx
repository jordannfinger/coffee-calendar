import type { Metadata } from "next";
import { Fraunces, Inter } from "next/font/google";
import { Nav } from "@/components/layout/Nav";
import { Footer } from "@/components/layout/Footer";
import { TodayProvider } from "@/lib/coffee/useToday";
import { formatDateOnly, today } from "@/lib/coffee/dateUtils";
import "./globals.css";

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const displayFont = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "Coffee Calendar — Know when your coffee is ready",
  description:
    "Roast date in, peak drinking window out. Coffee Calendar predicts when filter coffee is ready to drink, when it peaks, and when it's past its best.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${bodyFont.variable} ${displayFont.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <TodayProvider initialDay={formatDateOnly(today())}>
          <Nav />
          <main className="flex-1">{children}</main>
          <Footer />
        </TodayProvider>
      </body>
    </html>
  );
}
