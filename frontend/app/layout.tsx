import type { Metadata } from "next";
import { Inter } from "next/font/google"; // [ADD]
import "./globals.css";
import CursorTrail from "./components/CursorTrail";

const inter = Inter({ subsets: ["latin"], weight: ["400", "500", "600", "700", "800"] }); // [ADD]

export const metadata: Metadata = {
  title: "Solsara — Reputation OS",
  description: "The operating system for your Google presence. More customers find you. More trust you. On autopilot.",
  openGraph: {
    title: "Solsara — Reputation OS",
    description: "The operating system for your Google presence.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}
