'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Car, 
  Users, 
  ShieldCheck, 
  Wallet, 
  Calendar, 
  Briefcase, 
  Map as MapIcon, 
  Smartphone,
  Menu, 
  X,
  ChevronDown,
  ArrowRight,
  Star
} from 'lucide-react';

export default function Home() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'ride' | 'drive'>('ride');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);
  
  // Search State
  const [search, setSearch] = useState({ origin: '', destination: '' });

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (search.origin) params.append('origin', search.origin);
    if (search.destination) params.append('destination', search.destination);
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="min-h-screen bg-velox-midnight text-velox-white font-sans overflow-x-hidden">
      
      {/* --- Navigation Bar --- */}
      <nav className="fixed w-full z-50 glass-nav border-b border-white/5 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 text-velox-gold">
              <div className="w-10 h-10 bg-gradient-to-br from-velox-gold to-yellow-600 text-velox-midnight rounded-xl flex items-center justify-center shadow-lg shadow-velox-gold/20">V</div>
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">VeloxRide</span>
            </Link>
            
            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-400">
              <Link href="#ride" className="hover:text-velox-gold transition duration-300">Ride</Link>
              <Link href="#drive" className="hover:text-velox-gold transition duration-300">Drive</Link>
              <Link href="#business" className="hover:text-velox-gold transition duration-300">Business</Link>
              <Link href="#safety" className="hover:text-velox-gold transition duration-300">Safety</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-6">
             <Link href="/auth?role=passenger" className="text-sm font-bold text-gray-300 hover:text-white transition">Log in</Link>
             <Link href="/auth?role=passenger" className="bg-velox-gold text-velox-midnight px-6 py-3 rounded-full text-sm font-bold hover:bg-velox-goldLight transition shadow-lg shadow-velox-gold/10">
               Sign up
             </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2 text-white" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-24 left-0 w-full bg-velox-midnight border-b border-white/10 p-6 shadow-xl flex flex-col gap-6 animate-slide-up">
             <Link href="#ride" className="text-lg font-semibold text-gray-200" onClick={() => setMobileMenuOpen(false)}>Ride</Link>
             <Link href="#drive" className="text-lg font-semibold text-gray-200" onClick={() => setMobileMenuOpen(false)}>Drive</Link>
             <Link href="#business" className="text-lg font-semibold text-gray-200" onClick={() => setMobileMenuOpen(false)}>Business</Link>
             <div className="h-px bg-white/10 w-full my-2"></div>
             <Link href="/auth?role=passenger" className="text-lg font-semibold text-velox-gold" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
             <Link href="/auth?role=passenger" className="bg-velox-gold text-velox-midnight py-3 rounded-xl text-center font-bold" onClick={() => setMobileMenuOpen(false)}>Sign Up Free</Link>
          </div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-40 pb-20 lg:pt-60 lg:pb-40 px-6 overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-velox-gold/10 rounded-full blur-[120px] -z-10 translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-900/10 rounded-full blur-[100px] -z-10 -translate-x-1/2 translate-y-1/3"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          
          <div className="animate-slide-up z-10">
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.1] mb-8">
              Move with <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-velox-gold to-yellow-200">Prestige.</span>
            </h1>
            
            <p className="text-lg text-gray-400 mb-10 max-w-lg leading-relaxed">
              Experience the new standard of Nigerian mobility. Schedule your commute, split the cost, and travel in verified comfort.
            </p>

            {/* The Tabbed Widget */}
            <div className="bg-white/5 backdrop-blur-md p-2 rounded-3xl border border-white/10 shadow-2xl max-w-md">
               <div className="flex bg-black/20 p-1 rounded-2xl mb-4">
                  <button 
                    onClick={() => setActiveTab('ride')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'ride' ? 'bg-velox-gold text-velox-midnight shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Car className="w-4 h-4" /> Ride
                  </button>
                  <button 
                    onClick={() => setActiveTab('drive')}
                    className={`flex-1 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'drive' ? 'bg-velox-gold text-velox-midnight shadow-lg' : 'text-gray-400 hover:text-white'}`}
                  >
                    <Wallet className="w-4 h-4" /> Drive
                  </button>
               </div>

               <div className="p-4">
                 {activeTab === 'ride' ? (
                   <div className="space-y-4">
                     <div className="space-y-3">
                        <div className="relative group">
                          <div className="absolute left-4 top-3.5 w-2 h-2 bg-velox-gold rounded-full shadow-[0_0_10px_rgba(226,185,59,0.5)]"></div>
                          <div className="absolute left-5 top-5 w-0.5 h-8 bg-white/10"></div>
                          <input 
                            type="text" 
                            placeholder="Pickup Location" 
                            className="w-full bg-velox-navy/50 border border-white/5 hover:border-velox-gold/30 text-white p-4 pl-10 rounded-xl font-medium focus:ring-1 focus:ring-velox-gold outline-none transition" 
                            value={search.origin}
                            onChange={(e) => setSearch({ ...search, origin: e.target.value })}
                          />
                        </div>
                        <div className="relative group">
                          <div className="absolute left-4 top-3.5 w-2 h-2 bg-white rounded-sm"></div>
                          <input 
                            type="text" 
                            placeholder="Destination" 
                            className="w-full bg-velox-navy/50 border border-white/5 hover:border-velox-gold/30 text-white p-4 pl-10 rounded-xl font-medium focus:ring-1 focus:ring-velox-gold outline-none transition" 
                            value={search.destination}
                            onChange={(e) => setSearch({ ...search, destination: e.target.value })}
                          />
                        </div>
                     </div>
                     <button 
                        onClick={handleSearch}
                        className="block w-full bg-white text-velox-midnight text-center py-4 rounded-xl font-bold hover:bg-gray-100 transition flex items-center justify-center gap-2"
                     >
                       Find Trajectory <ArrowRight className="w-5 h-5" />
                     </button>
                   </div>
                 ) : (
                   <div className="text-center py-6 space-y-5">
                     <div>
                       <div className="text-4xl font-black text-velox-gold">₦300k+</div>
                       <div className="text-sm text-gray-400 font-medium tracking-wide uppercase">Monthly earning potential</div>
                     </div>
                     <Link href="/auth?role=driver" className="block w-full bg-velox-gold text-velox-midnight text-center py-4 rounded-xl font-bold hover:bg-velox-goldLight transition shadow-lg shadow-velox-gold/20">
                       Start Earning Today
                     </Link>
                     <p className="text-xs text-gray-500">Monetize your daily commute. Zero detour required.</p>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Hero Image / Visual */}
          <div className="relative hidden lg:block h-[600px] w-full rounded-[40px] overflow-hidden shadow-2xl border border-white/10 group">
            <img 
              src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2940&auto=format&fit=crop" 
              alt="Night Drive" 
              className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition duration-1000"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-velox-midnight via-velox-midnight/50 to-transparent"></div>
            
            <div className="absolute bottom-10 left-10 right-10">
               <div className="flex items-center gap-3 mb-4">
                 <div className="bg-velox-gold/20 backdrop-blur-md p-2 rounded-lg">
                    <ShieldCheck className="text-velox-gold w-6 h-6" />
                 </div>
                 <span className="font-bold text-sm uppercase tracking-widest text-velox-gold">Verified Safe</span>
               </div>
               <p className="font-bold text-3xl text-white leading-tight">Where luxury meets<br/>affordability.</p>
            </div>
          </div>

        </div>
      </section>

      {/* --- Value Props --- */}
      <section className="py-24 px-6 border-y border-white/5 bg-velox-navy/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-velox-gold/30 transition duration-300 group">
               <div className="w-14 h-14 bg-velox-midnight rounded-2xl border border-white/10 flex items-center justify-center text-velox-gold mb-6 group-hover:scale-110 transition">
                 <Calendar className="w-7 h-7" />
               </div>
               <h3 className="text-xl font-bold mb-3 text-white">Precision Scheduling</h3>
               <p className="text-gray-400 leading-relaxed">
                 Lock in your seat up to 7 days in advance. Predictable transport for your daily routine.
               </p>
            </div>
            <div className="bg-gradient-to-br from-velox-gold to-yellow-700 text-velox-midnight p-8 rounded-3xl shadow-lg transform md:-translate-y-6 border border-yellow-500/20">
               <div className="w-14 h-14 bg-velox-midnight/10 rounded-2xl flex items-center justify-center text-velox-midnight mb-6">
                 <Wallet className="w-7 h-7" />
               </div>
               <h3 className="text-xl font-bold mb-3">Cost Sharing</h3>
               <p className="text-velox-midnight/80 font-medium leading-relaxed">
                 Save up to 60% by sharing your ride. Enjoy private car comfort at public transport prices.
               </p>
            </div>
            <div className="bg-white/5 p-8 rounded-3xl border border-white/5 hover:border-velox-gold/30 transition duration-300 group">
               <div className="w-14 h-14 bg-velox-midnight rounded-2xl border border-white/10 flex items-center justify-center text-velox-gold mb-6 group-hover:scale-110 transition">
                 <Star className="w-7 h-7" />
               </div>
               <h3 className="text-xl font-bold mb-3 text-white">Verified Community</h3>
               <p className="text-gray-400 leading-relaxed">
                 Strict verification for all drivers. Rate your experience and travel with professionals.
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Driver Section --- */}
      <section className="py-32 px-6 overflow-hidden relative" id="drive">
         <div className="absolute top-1/2 left-0 w-full h-[500px] bg-gradient-to-r from-velox-gold/5 to-transparent -skew-y-3"></div>
         
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16 relative z-10">
            <div className="md:w-1/2">
               <div className="inline-block px-4 py-1.5 rounded-full border border-velox-gold/50 text-velox-gold font-bold text-xs uppercase tracking-wider mb-6">
                 For Drivers
               </div>
               <h2 className="text-4xl lg:text-5xl font-extrabold mb-6 text-white">
                 Monetize your <br /> <span className="text-velox-gold">empty seats.</span>
               </h2>
               <p className="text-gray-400 text-lg mb-8">
                 You are driving anyway. Turn your empty seats into a revenue stream. Cover your fuel, maintenance, and gain extra income effortlessly.
               </p>
               
               <ul className="space-y-5 mb-10">
                 <li className="flex items-center gap-4">
                   <div className="w-6 h-6 rounded-full bg-velox-gold/20 flex items-center justify-center">
                     <div className="w-2 h-2 bg-velox-gold rounded-full"></div>
                   </div>
                   <span className="font-medium text-gray-200">Keep 85% of earnings</span>
                 </li>
                 <li className="flex items-center gap-4">
                   <div className="w-6 h-6 rounded-full bg-velox-gold/20 flex items-center justify-center">
                     <div className="w-2 h-2 bg-velox-gold rounded-full"></div>
                   </div>
                   <span className="font-medium text-gray-200">Filter passengers by profession rating</span>
                 </li>
                 <li className="flex items-center gap-4">
                   <div className="w-6 h-6 rounded-full bg-velox-gold/20 flex items-center justify-center">
                     <div className="w-2 h-2 bg-velox-gold rounded-full"></div>
                   </div>
                   <span className="font-medium text-gray-200">Recurring route publishing</span>
                 </li>
               </ul>

               <Link href="/auth?role=driver" className="inline-flex items-center bg-white hover:bg-gray-200 text-velox-midnight px-8 py-4 rounded-xl font-bold transition">
                 Register Vehicle <ArrowRight className="ml-2 w-5 h-5" />
               </Link>
            </div>
            
            <div className="md:w-1/2 relative">
               {/* Visual representation of earnings */}
               <div className="bg-velox-navy border border-white/10 p-8 rounded-[32px] shadow-2xl max-w-sm mx-auto transform rotate-3 hover:rotate-0 transition duration-500 relative">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-velox-gold/10 rounded-full blur-2xl"></div>
                  
                  <div className="flex justify-between items-end mb-8 relative">
                    <div>
                      <div className="text-gray-400 text-sm mb-1 uppercase tracking-wider font-bold">Weekly Balance</div>
                      <div className="text-4xl font-black text-white">₦142,500</div>
                    </div>
                    <div className="bg-green-500/20 text-green-400 px-3 py-1 rounded-lg text-xs font-bold">+18%</div>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/5">
                         <div className="w-10 h-10 rounded-full bg-velox-gold/20 text-velox-gold flex items-center justify-center">
                           <Car className="w-5 h-5" />
                         </div>
                         <div className="flex-1">
                           <div className="text-sm font-bold text-white">Lekki Phase 1 → VI</div>
                           <div className="text-xs text-gray-500">Completed • 08:30 AM</div>
                         </div>
                         <div className="font-bold text-velox-gold">+₦4,500</div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- FAQ Section --- */}
      <section className="py-24 bg-velox-midnight px-6">
        <div className="max-w-3xl mx-auto">
           <h2 className="text-3xl font-bold text-center mb-12 text-white">Common Questions</h2>
           <div className="space-y-4">
             {[
               { q: "Is VeloxRide safe?", a: "Yes. We verify every driver's license and vehicle documents. All trips are GPS tracked, and you can share your live trip details with loved ones." },
               { q: "How are prices calculated?", a: "Prices are based on distance and vehicle capacity. Because you share the ride, the total cost is split, saving you 50-70% compared to solo taxis." },
               { q: "Can I book a whole car?", a: "Yes, you can book all available seats in a car if you prefer a private ride, though the cost will reflect the full capacity." },
               { q: "How do I pay?", a: "You can pay via the app using your card or bank transfer. We hold the payment in escrow and release it to the driver once the trip is completed." }
             ].map((item, i) => (
               <div key={i} className="bg-velox-navy/50 rounded-xl border border-white/5 overflow-hidden">
                 <button 
                   onClick={() => toggleFaq(i)}
                   className="w-full flex justify-between items-center p-6 text-left hover:bg-white/5 transition"
                 >
                   <span className="font-bold text-gray-200">{item.q}</span>
                   <ChevronDown className={`w-5 h-5 text-velox-gold transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                 </button>
                 {activeFaq === i && (
                   <div className="px-6 pb-6 text-gray-400 leading-relaxed border-t border-white/5 pt-4">
                     {item.a}
                   </div>
                 )}
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-velox-midnight pt-20 pb-10 px-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-12 mb-16">
          <div className="col-span-1">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-8 h-8 bg-velox-gold rounded-lg text-velox-midnight flex items-center justify-center font-bold text-xl">V</div>
                <span className="font-bold text-2xl text-white">VeloxRide</span>
             </div>
             <p className="text-gray-500 text-sm leading-relaxed">
               Making urban transportation affordable, safe, and predictable for everyone in Nigeria.
             </p>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white">Product</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-velox-gold transition">Ride</Link></li>
              <li><Link href="#" className="hover:text-velox-gold transition">Drive</Link></li>
              <li><Link href="#" className="hover:text-velox-gold transition">Safety</Link></li>
              <li><Link href="#" className="hover:text-velox-gold transition">Business</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white">Company</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-velox-gold transition">About us</Link></li>
              <li><Link href="#" className="hover:text-velox-gold transition">Careers</Link></li>
              <li><Link href="#" className="hover:text-velox-gold transition">Press</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-6 text-white">Support</h4>
            <ul className="space-y-3 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-velox-gold transition">Help Center</Link></li>
              <li><Link href="#" className="hover:text-velox-gold transition">Trust & Safety</Link></li>
              <li><Link href="#" className="hover:text-velox-gold transition">Terms of Service</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-gray-600">© 2025 VeloxRide Nigeria. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-gray-600 hover:text-velox-gold text-sm transition">Privacy</Link>
            <Link href="#" className="text-gray-600 hover:text-velox-gold text-sm transition">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}