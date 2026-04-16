import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import { Geist } from "next/font/google";
import "@/styles/globals.css";

const geist = Geist({
  variable: "--font-geist",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "単語 — Aprende japonés",
  description: "Aprende japonés con tus propias palabras usando tarjetas interactivas.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  applicationName: "単語",
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={geist.variable}>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
