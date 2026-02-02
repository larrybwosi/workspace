import type { Metadata } from "next";
import { Geist, Geist_Mono, Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "@/lib/providers";

const geist = Inter({ subsets: ["latin"] });
// const geistMono = Inter_({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Dealio - Messaging and Team Chat Application",
  description: "Your personal dashboard to manage your account and settings.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geist.className} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
