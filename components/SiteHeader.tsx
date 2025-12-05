'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Menu, X, User, LogOut } from 'lucide-react';
import { APP_CONFIG, NAV_LINKS } from '@/lib/constants';
import { createClient } from '@/lib/supabase';
import { UserRole } from '@/types';

export default function SiteHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [role, setRole] = useState<UserRole>('passenger');
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        setRole(user.user_metadata?.role as UserRole || 'passenger');
      }
    };
    checkAuth();

    // Listen for auth changes to update header dynamically
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(session.user);
        setRole(session.user.user_metadata?.role as UserRole || 'passenger');
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    router.push('/');
    router.refresh();
  };

  const getDashboardLink = () => {
    switch(role) {
      case 'driver': return '/driver';
      case 'superadmin': return '/admin';
      case 'manager': return '/manager';
      case 'employee': return '/staff';
      default: return '/passenger';
    }
  };

  const isActive = (path: string) => pathname === path;

  return (
    <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-md border-b border-slate-100 transition-all h-20">
      <div className="w-[90%] md:w-[85%] mx-auto h-full flex items-center justify-between">
        <div className="flex items-center gap-12">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="w-10 h-10 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl tracking-tight shadow-lg shadow-black/20 transition-transform group-hover:scale-105">V</div>
            <span className="text-2xl font-bold tracking-tight text-slate-900">{APP_CONFIG.name}</span>
          </Link>
          
          <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            {NAV_LINKS.main.map((item) => (
              <Link 
                key={item.label} 
                href={item.href} 
                className={`hover:text-black transition-colors ${isActive(item.href) ? 'text-black font-bold' : ''}`}
              >
                {item.label}
              </Link>
            ))}
          </div>
        </div>

        <div className="hidden md:flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                <Link 
                  href={getDashboardLink()} 
                  className="flex items-center gap-2 text-sm font-bold text-slate-900 hover:text-slate-600 transition"
                >
                  <User className="w-4 h-4" /> Dashboard
                </Link>
                <button 
                  onClick={handleLogout}
                  className="bg-slate-100 text-slate-900 px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-200 transition flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            ) : (
              <>
                {/* Updated Login Link: Explicitly sets view=login */}
                <Link 
                  href="/auth?view=login&role=passenger" 
                  className="text-sm font-bold text-slate-900 hover:text-slate-600 transition"
                >
                  Log in
                </Link>
                
                {/* Updated Sign Up Link: Explicitly sets view=signup */}
                <Link 
                  href="/auth?view=signup&role=passenger" 
                  className="bg-black text-white px-6 py-3 rounded-full text-sm font-bold hover:bg-slate-800 transition shadow-lg shadow-black/10 transform hover:-translate-y-0.5"
                >
                  Sign up
                </Link>
              </>
            )}
        </div>

        <button className="md:hidden text-slate-900" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X className="w-7 h-7" /> : <Menu className="w-7 h-7" />}
        </button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-slate-100 p-6 shadow-2xl flex flex-col gap-4 animate-slide-up h-[calc(100vh-80px)] overflow-y-auto">
            {NAV_LINKS.main.map((item) => (
              <Link 
                key={item.label} 
                href={item.href} 
                className="text-lg font-medium text-slate-900" 
                onClick={() => setMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link href="/about" className="text-lg font-medium text-slate-900" onClick={() => setMobileMenuOpen(false)}>About</Link>
            
            <div className="h-px bg-slate-100 w-full my-2"></div>
            
            {user ? (
              <>
                <Link href={getDashboardLink()} className="w-full bg-black text-white py-3.5 rounded-lg text-center font-bold flex items-center justify-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                  <User className="w-5 h-5"/> Dashboard
                </Link>
                <button onClick={() => { handleLogout(); setMobileMenuOpen(false); }} className="w-full bg-slate-100 text-slate-900 py-3.5 rounded-lg text-center font-bold flex items-center justify-center gap-2">
                  <LogOut className="w-5 h-5"/> Sign Out
                </button>
              </>
            ) : (
              <>
                {/* Updated Mobile Login Link */}
                <Link 
                  href="/auth?view=login&role=passenger" 
                  className="w-full bg-slate-100 text-slate-900 py-3.5 rounded-lg text-center font-bold" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Log In
                </Link>
                
                {/* Updated Mobile Sign Up Link */}
                <Link 
                  href="/auth?view=signup&role=passenger" 
                  className="w-full bg-black text-white py-3.5 rounded-lg text-center font-bold" 
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Sign Up
                </Link>
              </>
            )}
        </div>
      )}
    </nav>
  );
}