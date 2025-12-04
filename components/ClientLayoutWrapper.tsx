'use client';

import { usePathname } from 'next/navigation';
import SiteHeader from '@/components/SiteHeader';
import SiteFooter from '@/components/SiteFooter';

export default function ClientLayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Define routes where the global header/footer should be hidden
  // Added '/auth' to this list for a clean login experience
  const isIsolatedRoute = 
    pathname?.startsWith('/passenger') || 
    pathname?.startsWith('/driver') ||
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/staff') ||
    pathname === '/auth';

  return (
    <>
      {!isIsolatedRoute && <SiteHeader />}
      {children}
      {!isIsolatedRoute && <SiteFooter />}
    </>
  );
}