import Link from 'next/link';

export default function SiteFooter() {
  return (
    <footer className="bg-white pt-20 pb-10 px-6 border-t border-slate-100">
      <div className="w-[90%] md:w-[85%] mx-auto grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg">V</div>
              <span className="font-bold text-xl text-slate-900">VeloxRide</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              Making urban transportation affordable, safe, and predictable for everyone in Nigeria.
            </p>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-slate-900">Product</h4>
          <ul className="space-y-3 text-sm text-slate-500">
            <li><Link href="/ride" className="hover:text-black transition">Ride</Link></li>
            <li><Link href="/drive" className="hover:text-black transition">Drive</Link></li>
            <li><Link href="/safety" className="hover:text-black transition">Safety</Link></li>
            <li><Link href="/business" className="hover:text-black transition">Business</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-slate-900">Company</h4>
          <ul className="space-y-3 text-sm text-slate-500">
            <li><Link href="/about" className="hover:text-black transition">About us</Link></li>
            <li><Link href="/careers" className="hover:text-black transition">Careers</Link></li>
            <li><Link href="/press" className="hover:text-black transition">Press</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold mb-6 text-slate-900">Support</h4>
          <ul className="space-y-3 text-sm text-slate-500">
            <li><Link href="/help" className="hover:text-black transition">Help Center</Link></li>
            <li><Link href="/safety" className="hover:text-black transition">Trust & Safety</Link></li>
            <li><Link href="/terms" className="hover:text-black transition">Terms of Service</Link></li>
          </ul>
        </div>
      </div>
      <div className="w-[90%] md:w-[85%] mx-auto pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-500">© 2025 VeloxRide Nigeria. All rights reserved.</p>
        <div className="flex gap-6">
          <Link href="/privacy" className="text-slate-500 hover:text-black text-xs transition">Privacy</Link>
          <Link href="/terms" className="text-slate-500 hover:text-black text-xs transition">Terms</Link>
        </div>
      </div>
    </footer>
  );
}