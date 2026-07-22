import type { Metadata } from 'next';
import { Geist, Inter } from 'next/font/google';
import '@repo/ui/styles/globals.css';
import { Providers } from '@/lib/providers';
import { MobileNav } from '@/components/layout/mobile-nav';

const geist = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Scrymechat - Messaging and Team Chat Application',
  description: 'Your personal dashboard to manage your account and settings.',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Scrymechat',
  },
  formatDetection: {
    telephone: false,
  },
};

export const viewport = {
  themeColor: '#000000',
  viewportFit: 'cover',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <body className={`${geist.className} antialiased`}>
        <Providers>
          {children}
          <MobileNav />
        </Providers>
      </body>
    </html>
  );
}
