import type { Metadata } from 'next';
import { Inter } from "next/font/google";
import './globals.css';
import { Sidebar } from "@/components/Sidebar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: 'LeadForge — Internal Dashboard',
  description:
    'LeadForge agentic lead generation dashboard. Scrape, process, and outreach qualified local businesses.',
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.className} bg-inface-bg text-inface-text font-sans antialiased`}>
        <div className="flex h-screen overflow-hidden">
          <Sidebar />
          <main className="flex-1 overflow-y-auto">{children}</main>
        </div>
      </body>
    </html>
  );
}
