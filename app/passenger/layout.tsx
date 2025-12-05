'use client';
import { useState } from 'react';
import PassengerSidebar from '@/components/passenger/PassengerSidebar';
import PassengerHeader from '@/components/passenger/PassengerHeader';
import { X } from 'lucide-react';

export default function PassengerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-slate-50/50 font-sans text-slate-900">
      
      {/* Desktop Sidebar */}
      <div className="hidden lg:block w-72 sticky top-0 h-screen">
        <PassengerSidebar />
      </div>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setMobileMenuOpen(false)}></div>
          <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl animate-slide-right">
             <div className="absolute top-4 right-4">
               <button onClick={() => setMobileMenuOpen(false)} className="p-2 text-slate-400 hover:text-black"><X/></button>
             </div>
             {/* We can reuse the sidebar content logic here or create a mobile specific one if layouts differ significantly */}
             <div className="h-full pt-12">
                <PassengerSidebar mobile close={() => setMobileMenuOpen(false)} />
             </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <PassengerHeader onMenuClick={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-6 lg:p-10 max-w-7xl w-full mx-auto animate-fade-in relative">
          {children}
        </main>
      </div>
    </div>
  );
}