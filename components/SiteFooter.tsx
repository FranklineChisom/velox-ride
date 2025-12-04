import Link from 'next/link';
import { APP_CONFIG, TEXT_CONTENT, NAV_LINKS } from '@/lib/constants';

export default function SiteFooter() {
  return (
    <footer className="bg-white pt-20 pb-10 px-6 border-t border-slate-100">
      <div className="w-[90%] md:w-[85%] mx-auto grid md:grid-cols-4 gap-12 mb-16">
        <div className="col-span-1">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-black text-white rounded-lg flex items-center justify-center font-bold text-lg">V</div>
              <span className="font-bold text-xl text-slate-900">{APP_CONFIG.name}</span>
            </div>
            <p className="text-slate-500 text-sm leading-relaxed">
              {TEXT_CONTENT.footerDesc}
            </p>
        </div>
        
        <div>
          <h4 className="font-bold mb-6 text-slate-900">Product</h4>
          <ul className="space-y-3 text-sm text-slate-500">
            {NAV_LINKS.main.map(item => (
              <li key={item.label}><Link href={item.href} className="hover:text-black transition">{item.label}</Link></li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold mb-6 text-slate-900">Company</h4>
          <ul className="space-y-3 text-sm text-slate-500">
            {NAV_LINKS.company.map(item => (
              <li key={item.label}><Link href={item.href} className="hover:text-black transition">{item.label}</Link></li>
            ))}
          </ul>
        </div>
        
        <div>
          <h4 className="font-bold mb-6 text-slate-900">Support</h4>
          <ul className="space-y-3 text-sm text-slate-500">
            {NAV_LINKS.support.map(item => (
              <li key={item.label}><Link href={item.href} className="hover:text-black transition">{item.label}</Link></li>
            ))}
          </ul>
        </div>
      </div>
      
      <div className="w-[90%] md:w-[85%] mx-auto pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-xs text-slate-500">{TEXT_CONTENT.copyright}</p>
        <div className="flex gap-6">
          {NAV_LINKS.legal.map(item => (
            <Link key={item.label} href={item.href} className="text-slate-500 hover:text-black text-xs transition">{item.label}</Link>
          ))}
        </div>
      </div>
    </footer>
  );
}