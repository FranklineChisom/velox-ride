'use client';
import { useState } from 'react';
import Link from 'next/link';
import { 
  Car, 
  Users, 
  ShieldCheck, 
  Wallet, 
  Calendar, 
  Briefcase, 
  Map, 
  Smartphone,
  CheckCircle2,
  Menu, 
  X,
  Star,
  Clock,
  ArrowRight,
  ChevronDown
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'ride' | 'drive'>('ride');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeFaq, setActiveFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans overflow-x-hidden">
      
      {/* --- Navigation Bar --- */}
      <nav className="fixed w-full z-50 bg-white/95 backdrop-blur-sm border-b border-slate-100 transition-all">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            <Link href="/" className="text-2xl font-black tracking-tighter flex items-center gap-2 text-teal-700">
              <div className="w-8 h-8 bg-teal-600 text-white rounded-lg flex items-center justify-center">V</div>
              <span>VeloxRide</span>
            </Link>
            
            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-6 text-sm font-semibold text-slate-600">
              <Link href="#ride" className="hover:text-teal-600 transition">Ride</Link>
              <Link href="#drive" className="hover:text-teal-600 transition">Drive</Link>
              <Link href="#business" className="hover:text-teal-600 transition">Business</Link>
              <Link href="#safety" className="hover:text-teal-600 transition">Safety</Link>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-4">
             <Link href="/auth?role=passenger" className="text-sm font-bold hover:text-teal-600">Log in</Link>
             <Link href="/auth?role=passenger" className="bg-slate-900 text-white px-5 py-2.5 rounded-full text-sm font-bold hover:bg-slate-800 transition shadow-lg">
               Sign up
             </Link>
          </div>

          {/* Mobile Menu Button */}
          <button className="md:hidden p-2" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 p-6 shadow-xl flex flex-col gap-6 animate-slide-up">
             <Link href="#ride" className="text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>Ride</Link>
             <Link href="#drive" className="text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>Drive</Link>
             <Link href="#business" className="text-lg font-semibold" onClick={() => setMobileMenuOpen(false)}>Business</Link>
             <div className="h-px bg-gray-100 w-full my-2"></div>
             <Link href="/auth?role=passenger" className="text-lg font-semibold text-teal-600" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
             <Link href="/auth?role=passenger" className="bg-teal-600 text-white py-3 rounded-xl text-center font-bold" onClick={() => setMobileMenuOpen(false)}>Sign Up Free</Link>
          </div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 bg-slate-50 overflow-hidden">
        {/* Background Decorative Blob */}
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-teal-100/50 rounded-full blur-3xl -z-10"></div>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          <div className="animate-slide-up">
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight text-slate-900 leading-[1.1] mb-6">
              Go anywhere. <br />
              <span className="text-teal-600">Spend less.</span>
            </h1>
            <p className="text-lg text-slate-600 mb-8 max-w-lg leading-relaxed">
              Nigeria's first scheduled ride-sharing network. Connect with drivers heading your way, split the fare, and enjoy a premium commute for less.
            </p>

            {/* The Tabbed Widget */}
            <div className="bg-white p-2 rounded-2xl shadow-2xl border border-slate-100 max-w-md transform hover:-translate-y-1 transition duration-300">
               <div className="flex bg-slate-100 p-1 rounded-xl mb-4">
                  <button 
                    onClick={() => setActiveTab('ride')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'ride' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Car className="w-4 h-4" /> Ride
                  </button>
                  <button 
                    onClick={() => setActiveTab('drive')}
                    className={`flex-1 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'drive' ? 'bg-white shadow text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    <Wallet className="w-4 h-4" /> Drive
                  </button>
               </div>

               <div className="p-4">
                 {activeTab === 'ride' ? (
                   <div className="space-y-4">
                     <div className="space-y-3">
                        <div className="relative">
                          <div className="absolute left-4 top-3.5 w-2 h-2 bg-black rounded-full"></div>
                          <div className="absolute left-5 top-5 w-0.5 h-8 bg-gray-200"></div>
                          <input type="text" placeholder="Pickup Location" className="w-full bg-slate-50 hover:bg-slate-100 p-3 pl-10 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 outline-none transition" />
                        </div>
                        <div className="relative">
                          <div className="absolute left-4 top-3.5 w-2 h-2 bg-teal-600 rounded-sm"></div>
                          <input type="text" placeholder="Destination" className="w-full bg-slate-50 hover:bg-slate-100 p-3 pl-10 rounded-lg font-medium focus:ring-2 focus:ring-teal-500 outline-none transition" />
                        </div>
                     </div>
                     <Link href="/auth?role=passenger" className="block w-full bg-slate-900 text-white text-center py-4 rounded-xl font-bold hover:bg-slate-800 transition">
                       See Prices
                     </Link>
                   </div>
                 ) : (
                   <div className="text-center py-4 space-y-4">
                     <div>
                       <div className="text-3xl font-black text-slate-900">₦250k+</div>
                       <div className="text-sm text-slate-500 font-medium">Monthly earning potential</div>
                     </div>
                     <Link href="/auth?role=driver" className="block w-full bg-teal-600 text-white text-center py-4 rounded-xl font-bold hover:bg-teal-700 transition">
                       Become a Driver
                     </Link>
                     <p className="text-xs text-slate-400">Own a car? Turn your commute into cash.</p>
                   </div>
                 )}
               </div>
            </div>
          </div>

          {/* Hero Image / Visual */}
          <div className="relative hidden lg:block h-[600px] w-full bg-slate-200 rounded-3xl overflow-hidden shadow-2xl">
            <img 
              src="https://images.unsplash.com/photo-1617788138017-80ad40651399?q=80&w=2940&auto=format&fit=crop" 
              alt="Commuter" 
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8 text-white">
               <div className="flex items-center gap-3 mb-2">
                 <ShieldCheck className="text-teal-400 w-6 h-6" />
                 <span className="font-bold text-sm uppercase tracking-wider text-teal-400">Verified Safety</span>
               </div>
               <p className="font-bold text-2xl">Travel with peace of mind.</p>
            </div>
          </div>

        </div>
      </section>

      {/* --- Value Props (Bento Grid) --- */}
      <section className="py-24 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-8 rounded-3xl hover:bg-slate-100 transition duration-300">
               <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-teal-600 mb-6">
                 <Calendar className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold mb-3">Schedule Ahead</h3>
               <p className="text-slate-600 leading-relaxed">
                 Don't gamble with your time. Book your ride up to 7 days in advance and lock in your price.
               </p>
            </div>
            <div className="bg-teal-900 text-white p-8 rounded-3xl shadow-xl transform md:-translate-y-4">
               <div className="w-12 h-12 bg-teal-800 rounded-xl flex items-center justify-center text-teal-200 mb-6">
                 <Wallet className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold mb-3">Split & Save</h3>
               <p className="text-teal-100 leading-relaxed">
                 Save up to 60% by sharing your ride with others going the same way. Smart pricing for smart commuters.
               </p>
            </div>
            <div className="bg-slate-50 p-8 rounded-3xl hover:bg-slate-100 transition duration-300">
               <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-teal-600 mb-6">
                 <ShieldCheck className="w-6 h-6" />
               </div>
               <h3 className="text-xl font-bold mb-3">Verified Community</h3>
               <p className="text-slate-600 leading-relaxed">
                 We verify every driver's ID and vehicle papers. See ratings and reviews before you book.
               </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Driver Section --- */}
      <section className="py-24 bg-slate-900 text-white px-6 overflow-hidden" id="drive">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
            <div className="md:w-1/2">
               <div className="inline-block px-4 py-1.5 rounded-full border border-teal-500 text-teal-400 font-bold text-xs uppercase tracking-wider mb-6">
                 For Drivers
               </div>
               <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">
                 Turn your commute <br /> into capital.
               </h2>
               <p className="text-slate-400 text-lg mb-8">
                 You are already driving to work. Why not get paid for it? Pick up verified professionals along your route and cover your fuel costs plus profit.
               </p>
               
               <ul className="space-y-4 mb-10">
                 <li className="flex items-center gap-3">
                   <CheckCircle2 className="text-teal-500 w-6 h-6" />
                   <span className="font-medium">Lowest commission (15%)</span>
                 </li>
                 <li className="flex items-center gap-3">
                   <CheckCircle2 className="text-teal-500 w-6 h-6" />
                   <span className="font-medium">You control the schedule</span>
                 </li>
                 <li className="flex items-center gap-3">
                   <CheckCircle2 className="text-teal-500 w-6 h-6" />
                   <span className="font-medium">Filter passengers by rating</span>
                 </li>
               </ul>

               <Link href="/auth?role=driver" className="inline-flex items-center bg-teal-500 hover:bg-teal-400 text-slate-900 px-8 py-4 rounded-xl font-bold transition">
                 Sign Up to Drive <ArrowRight className="ml-2 w-5 h-5" />
               </Link>
            </div>
            
            <div className="md:w-1/2 relative">
               {/* Visual representation of earnings */}
               <div className="bg-slate-800 border border-slate-700 p-8 rounded-3xl shadow-2xl max-w-sm mx-auto transform rotate-3 hover:rotate-0 transition duration-500">
                  <div className="flex justify-between items-end mb-8">
                    <div>
                      <div className="text-slate-400 text-sm mb-1">Weekly Balance</div>
                      <div className="text-3xl font-bold text-white">₦85,400</div>
                    </div>
                    <div className="bg-teal-500/20 text-teal-400 px-3 py-1 rounded-lg text-xs font-bold">+12% vs last wk</div>
                  </div>
                  <div className="space-y-4">
                    {[1, 2, 3].map((_, i) => (
                      <div key={i} className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-xl">
                         <div className="w-10 h-10 rounded-full bg-slate-600 flex items-center justify-center">
                           <Car className="w-5 h-5 text-slate-300" />
                         </div>
                         <div className="flex-1">
                           <div className="text-sm font-bold">Trip Completed</div>
                           <div className="text-xs text-slate-400">Gwarinpa - Wuse II</div>
                         </div>
                         <div className="font-bold text-teal-400">+₦4,500</div>
                      </div>
                    ))}
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- Upcoming Features (Ecosystem) --- */}
      <section className="py-24 bg-white px-6 border-b border-slate-100">
         <div className="max-w-7xl mx-auto">
           <div className="text-center mb-16">
             <h2 className="text-3xl font-bold mb-4">Building the future of transport</h2>
             <p className="text-slate-500">More ways to move are coming soon to the Velox ecosystem.</p>
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="border border-slate-200 p-8 rounded-2xl bg-slate-50/50">
                 <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-6">
                   <Map className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Velox Inter-City</h3>
                 <p className="text-slate-500 text-sm mb-4">
                   Safe, scheduled travel between major cities (Lagos, Abuja, Ibadan). verified drivers and comfortable cars.
                 </p>
                 <span className="inline-block px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">Coming Q2 2026</span>
              </div>

              {/* Feature 2 */}
              <div className="border border-slate-200 p-8 rounded-2xl bg-slate-50/50">
                 <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center mb-6">
                   <Briefcase className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Velox for Business</h3>
                 <p className="text-slate-500 text-sm mb-4">
                   Manage employee transportation with a centralized dashboard. Monthly billing and expense reports.
                 </p>
                 <span className="inline-block px-2 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded">Coming Q3 2026</span>
              </div>

               {/* Feature 3 */}
               <div className="border border-slate-200 p-8 rounded-2xl bg-slate-50/50">
                 <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mb-6">
                   <Wallet className="w-6 h-6" />
                 </div>
                 <h3 className="text-xl font-bold mb-2">Velox Wallet</h3>
                 <p className="text-slate-500 text-sm mb-4">
                   Seamless payments. Top up your wallet and pay for rides instantly. Send credits to family.
                 </p>
                 <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">Coming Q4 2026</span>
              </div>
           </div>
         </div>
      </section>

      {/* --- FAQ Section --- */}
      <section className="py-24 bg-slate-50 px-6">
        <div className="max-w-3xl mx-auto">
           <h2 className="text-3xl font-bold text-center mb-12">Frequently Asked Questions</h2>
           <div className="space-y-4">
             {[
               { q: "Is VeloxRide safe?", a: "Yes. We verify every driver's license and vehicle documents. All trips are GPS tracked, and you can share your live trip details with loved ones." },
               { q: "How are prices calculated?", a: "Prices are based on distance and vehicle capacity. Because you share the ride, the total cost is split, saving you 50-70% compared to solo taxis." },
               { q: "Can I book a whole car?", a: "Yes, you can book all available seats in a car if you prefer a private ride, though the cost will reflect the full capacity." },
               { q: "How do I pay?", a: "You can pay via the app using your card or bank transfer. We hold the payment in escrow and release it to the driver once the trip is completed." }
             ].map((item, i) => (
               <div key={i} className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                 <button 
                   onClick={() => toggleFaq(i)}
                   className="w-full flex justify-between items-center p-6 text-left hover:bg-slate-50 transition"
                 >
                   <span className="font-bold text-slate-800">{item.q}</span>
                   <ChevronDown className={`w-5 h-5 transition-transform ${activeFaq === i ? 'rotate-180' : ''}`} />
                 </button>
                 {activeFaq === i && (
                   <div className="px-6 pb-6 text-slate-600 leading-relaxed">
                     {item.a}
                   </div>
                 )}
               </div>
             ))}
           </div>
        </div>
      </section>

      {/* --- Download CTA --- */}
      <section className="py-24 bg-black text-white px-6">
         <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between">
            <div className="md:w-1/2 mb-12 md:mb-0">
              <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">Ready to ride?</h2>
              <p className="text-lg text-slate-400 mb-8 max-w-md">
                Download the app today. Available for iOS and Android. Experience the new standard of African mobility.
              </p>
              <div className="flex gap-4">
                <button className="flex items-center gap-3 bg-white text-black px-6 py-3 rounded-xl hover:bg-slate-200 transition">
                  <Smartphone className="w-8 h-8" />
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold tracking-wider">Download on the</div>
                    <div className="text-lg font-bold leading-none">App Store</div>
                  </div>
                </button>
                <button className="flex items-center gap-3 bg-slate-800 text-white px-6 py-3 rounded-xl hover:bg-slate-700 transition border border-slate-700">
                  <div className="text-left">
                    <div className="text-[10px] uppercase font-bold tracking-wider">Get it on</div>
                    <div className="text-lg font-bold leading-none">Google Play</div>
                  </div>
                </button>
              </div>
            </div>
            
            <div className="md:w-1/2 flex justify-center">
              {/* Mockup */}
               <div className="w-72 bg-slate-900 rounded-[3rem] border-8 border-slate-800 p-2 shadow-2xl">
                 <div className="h-[500px] bg-white rounded-[2.5rem] overflow-hidden relative">
                    <div className="absolute top-0 w-full h-1/2 bg-teal-600 flex items-center justify-center text-white font-bold text-2xl">
                      VeloxRide
                    </div>
                    <div className="absolute bottom-0 w-full h-1/2 bg-white p-6">
                       <div className="w-16 h-1 bg-slate-200 rounded-full mx-auto mb-6"></div>
                       <h3 className="font-bold text-xl mb-2">Confirm Ride</h3>
                       <div className="flex justify-between items-center border-b border-slate-100 pb-4 mb-4">
                         <span className="text-slate-500">Total Price</span>
                         <span className="text-xl font-bold text-teal-600">₦1,200</span>
                       </div>
                       <button className="w-full bg-black text-white py-4 rounded-xl font-bold shadow-lg">Book Now</button>
                    </div>
                 </div>
               </div>
            </div>
         </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-white pt-16 pb-8 px-6 border-t border-slate-100">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1">
             <div className="flex items-center gap-2 mb-6">
                <div className="w-6 h-6 bg-teal-600 rounded text-white flex items-center justify-center font-bold text-xs">V</div>
                <span className="font-bold text-xl">VeloxRide</span>
             </div>
             <p className="text-slate-500 text-sm leading-relaxed">
               Making urban transportation affordable, safe, and predictable for everyone in Nigeria.
             </p>
          </div>
          <div>
            <h4 className="font-bold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="#" className="hover:text-teal-600">Ride</Link></li>
              <li><Link href="#" className="hover:text-teal-600">Drive</Link></li>
              <li><Link href="#" className="hover:text-teal-600">Safety</Link></li>
              <li><Link href="#" className="hover:text-teal-600">Business</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="#" className="hover:text-teal-600">About us</Link></li>
              <li><Link href="#" className="hover:text-teal-600">Careers</Link></li>
              <li><Link href="#" className="hover:text-teal-600">Press</Link></li>
              <li><Link href="#" className="hover:text-teal-600">Blog</Link></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold mb-4">Support</h4>
            <ul className="space-y-2 text-sm text-slate-500">
              <li><Link href="#" className="hover:text-teal-600">Help Center</Link></li>
              <li><Link href="#" className="hover:text-teal-600">Trust & Safety</Link></li>
              <li><Link href="#" className="hover:text-teal-600">Lost & Found</Link></li>
            </ul>
          </div>
        </div>
        <div className="max-w-7xl mx-auto pt-8 border-t border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-xs text-slate-400">© 2025 VeloxRide Nigeria. All rights reserved.</p>
          <div className="flex gap-4">
            <Link href="#" className="text-slate-400 hover:text-slate-900 text-sm">Privacy</Link>
            <Link href="#" className="text-slate-400 hover:text-slate-900 text-sm">Terms</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}