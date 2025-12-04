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
  const isDashboardRoute = pathname?.startsWith('/passenger') || pathname?.startsWith('/driver');

  return (
    <>
      {!isDashboardRoute && <SiteHeader />}
      {children}
      {!isDashboardRoute && <SiteFooter />}
    </>
  );
}