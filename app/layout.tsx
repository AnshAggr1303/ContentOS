import type { Metadata } from "next";
import { Inter, Newsreader, DM_Mono } from "next/font/google";
import "./globals.css";
import SidebarNav from "@/components/SidebarNav";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const newsreader = Newsreader({
  variable: "--font-newsreader",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "ContentOS — ET AI Hackathon 2026",
  description:
    "4-agent AI pipeline for enterprise content operations: draft, compliance, localize, distribute.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`light ${inter.variable} ${newsreader.variable} ${dmMono.variable}`}
    >
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="bg-surface text-on-surface">
        <SidebarNav />
        <main className="ml-64 min-h-screen flex flex-col">{children}</main>
      </body>
    </html>
  );
}
