'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all h-20">
      <div className="w-[90%] md:w-[85%] mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl tracking-tight shadow-lg shadow-black/20 transition-transform group-hover:scale-105">V</div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">VeloxRide</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            {['Ride', 'Drive', 'Business', 'Safety'].map((item) => (
              <Link 
                key={item} 
                href={`/${item.toLowerCase()}`} 
                className={`hover:text-black transition-colors ${isActive(`/${item.toLowerCase()}`) ? 'text-black font-bold' : ''}`}
              >
                {item}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
            <Link href="/auth?role=passenger" className="text-sm font-bold text-slate-900 hover:text-slate-600 transition">Log in</Link>
            <Link href="/auth?role=passenger" className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-slate-800 transition shadow-lg shadow-black/10 transform hover:-translate-y-0.5">
              Sign up
            </Link>
        </div>

        <button className="md:hidden text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 p-6 shadow-2xl flex flex-col gap-4 animate-slide-up">
            {['Ride', 'Drive', 'Business', 'Safety', 'About'].map((item) => (
              <Link 
                key={item} 
                href={`/${item.toLowerCase()}`} 
                className="text-lg font-medium text-slate-900" 
                onClick={() => setMobileMenuOpen(false)}
              >
                {item}
              </Link>
            ))}
            <div className="h-px bg-slate-100 w-full my-2"></div>
            <Link href="/auth?role=passenger" className="w-full bg-slate-100 text-slate-900 py-3.5 rounded-lg text-center font-bold" onClick={() => setMobileMenuOpen(false)}>Log In</Link>
            <Link href="/auth?role=passenger" className="w-full bg-black text-white py-3.5 rounded-lg text-center font-bold" onClick={() => setMobileMenuOpen(false)}>Sign Up</Link>
        </div>
      )}
    </nav>
  );
}