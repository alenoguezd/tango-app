import type { Metadata } from "next";
import "@/styles/globals.css";

export const metadata: Metadata = {
  title: "単語 — Aprende japonés",
  description: "Aprende japonés con tus propias palabras usando tarjetas interactivas.",
  icons: {
    icon: [
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
    ],
  },
  applicationName: "単語",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
