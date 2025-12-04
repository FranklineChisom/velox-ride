import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';
import ClientLayoutWrapper from '@/components/ClientLayoutWrapper';
import { ToastProvider } from '@/components/ui/ToastProvider';

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'Veluxeride | Elite Urban Mobility',
  description: 'Experience the premium standard of scheduled ride-sharing in Nigeria.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={jakarta.variable}>
      <body className={`${jakarta.className} antialiased bg-slate-50 text-slate-900 selection:bg-black selection:text-white`}>
        <ToastProvider>
          <ClientLayoutWrapper>
            {children}
          </ClientLayoutWrapper>
        </ToastProvider>
      </body>
    </html>
  );
}