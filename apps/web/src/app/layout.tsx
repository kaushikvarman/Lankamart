import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
});

export const metadata: Metadata = {
  title: {
    default: 'LankaMart — Sri Lanka & India B2B/B2C Marketplace',
    template: '%s | LankaMart',
  },
  description:
    'Discover authentic products from Sri Lanka and India. Premium spices, textiles, gems, handicrafts, and more from verified vendors shipped worldwide.',
  keywords: [
    'marketplace',
    'Sri Lanka',
    'India',
    'B2B',
    'wholesale',
    'spices',
    'textiles',
    'gems',
  ],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen flex flex-col">{children}</body>
    </html>
  );
}
