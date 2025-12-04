import './globals.css';
import type { Metadata } from 'next';
import { Plus_Jakarta_Sans } from 'next/font/google';

const jakarta = Plus_Jakarta_Sans({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-jakarta',
});

export const metadata: Metadata = {
  title: 'VeloxRide | Elite Urban Mobility',
  description: 'Experience the premium standard of scheduled ride-sharing in Nigeria.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning className={jakarta.variable}>
      <body className={`${jakarta.className} antialiased bg-velox-midnight text-velox-white selection:bg-velox-gold selection:text-velox-midnight`}>
        {children}
      </body>
    </html>
  );
}