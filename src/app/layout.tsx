import type { Metadata, Viewport } from 'next';
import { fontVariables } from '@/lib/fonts';
import './globals.css';

export const metadata: Metadata = {
  title: 'Noah Colbourne · noahjrc',
  description:
    "Noah Colbourne's portfolio: an interactive 3D room with experience on a retro console, projects in a cookbook, and favourite records on a turntable.",
};

export const viewport: Viewport = {
  themeColor: '#1e1b33',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={fontVariables}>
      <body>{children}</body>
    </html>
  );
}
