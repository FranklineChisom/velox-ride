'use client';
import { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  Car, 
  Users, 
  Calendar, 
  ShieldCheck, 
  Wallet, 
  Map as MapIcon, 
  Briefcase, 
  Smartphone,
  Star,
  Menu,
  X,
  CheckCircle2,
  Clock,
  ChevronDown
} from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<'passenger' | 'driver'>('passenger');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const toggleFaq = (index: number) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-gray-900 overflow-x-hidden font-sans">
      
      {/* --- Navigation --- */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100 transition-all duration-300">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-12">
            <Link href="/" className="text-2xl font-black tracking-tighter text-teal-700 flex items-center gap-2">
              <div className="w-9 h-9 bg-teal-600 rounded-lg flex items-center justify-center text-white shadow-lg">V</div>
              <span className="text-gray-900">Velox</span>Ride
            </Link>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <Link href="#ride" className="hover:text-teal-600 transition">Ride</Link>
              <Link href="#drive" className="hover:text-teal-600 transition">Drive</Link>
              <Link href="#safety" className="hover:text-teal-600 transition">Safety</Link>
              <Link href="#about" className="hover:text-teal-600 transition">About</Link>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-4">
            <Link href="/auth?role=passenger" className="text-sm font-bold text-gray-900 hover:text-teal-600 px-4 py-2">Log in</Link>
            <Link href="/auth?role=passenger" className="text-sm font-bold bg-gray-900 text-white px-6 py-3 rounded-full hover:bg-teal-600 transition shadow-lg hover:shadow-teal-500/20">
              Sign up
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button className="md:hidden p-2 text-gray-600" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden absolute top-20 left-0 w-full bg-white border-b border-gray-100 p-6 shadow-xl flex flex-col gap-4 animate-fade-in-up">
             <Link href="#ride" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Ride</Link>
             <Link href="#drive" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Drive</Link>
             <Link href="#safety" className="text-lg font-medium" onClick={() => setMobileMenuOpen(false)}>Safety</Link>
             <Link href="/auth?role=passenger" className="text-lg font-medium text-teal-600" onClick={() => setMobileMenuOpen(false)}>Log in</Link>
             <Link href="/auth?role=passenger" className="w-full bg-teal-600 text-white py-4 rounded-xl text-center font-bold" onClick={() => setMobileMenuOpen(false)}>Sign Up Free</Link>
          </div>
        )}
      </nav>

      {/* --- Hero Section --- */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 px-6 bg-[url('https://images.unsplash.com/photo-1592861956120-e524fc739696?q=80&w=3270&auto=format&fit=crop')] bg-cover bg-center">
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/90 to-transparent"></div>
        
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          
          {/* Left Column: The "Widget" */}
          <div className="animate-fade-in-up">
            <h1 className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-[1.05] mb-6 text-gray-900">
              Ride smart. <br />
              <span className="text-teal-600">Pay less.</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-lg leading-relaxed font-medium">
              Join Nigeria's smartest commuting network. Schedule rides, split fares, and travel comfortably in Abuja and Lagos.
            </p>

            {/* The Interaction Widget */}
            <div className="bg-white p-2 rounded-3xl shadow-2xl border border-gray-100 max-w-[480px]">
              <div className="flex mb-4 bg-gray-50 p-1 rounded-2xl">
                <button 
                  onClick={() => setActiveTab('passenger')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'passenger' ? 'bg-white shadow-md text-gray-900 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Users className="w-4 h-4" /> Get a Ride
                </button>
                <button 
                  onClick={() => setActiveTab('driver')}
                  className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-sm font-bold transition-all ${activeTab === 'driver' ? 'bg-white shadow-md text-gray-900 ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                >
                  <Car className="w-4 h-4" /> Earn Money
                </button>
              </div>

              <div className="p-4 pt-2">
                {activeTab === 'passenger' ? (
                  <div className="space-y-4">
                    <div className="space-y-3">
                       <div className="relative group">
                         <div className="absolute left-4 top-4 w-2 h-2 bg-black rounded-full ring-4 ring-gray-100 group-focus-within:ring-teal-100 transition-all"></div>
                         <div className="absolute left-5 top-6 w-0.5 h-10 bg-gray-200"></div>
                         <input type="text" placeholder="Pickup location" className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white p-4 pl-12 rounded-xl font-medium focus:ring-2 focus:ring-teal-600 outline-none transition-all" />
                       </div>
                       <div className="relative group">
                         <div className="absolute left-4 top-4 w-2 h-2 bg-teal-600 rounded-sm ring-4 ring-gray-100 group-focus-within:ring-teal-100 transition-all"></div>
                         <input type="text" placeholder="Where to?" className="w-full bg-gray-50 hover:bg-gray-100 focus:bg-white p-4 pl-12 rounded-xl font-medium focus:ring-2 focus:ring-teal-600 outline-none transition-all" />
                       </div>
                    </div>
                    <div className="pt-2">
                        <Link href="/auth?role=passenger" className="block w-full bg-black text-white text-center py-4 rounded-xl font-bold text-lg hover:bg-gray-800 transition shadow-xl hover:shadow-2xl translate-y-0 hover:-translate-y-0.5 transform duration-200">
                        See prices
                        </Link>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 text-center py-4">
                    <div>
                       <h3 className="text-4xl font-black text-gray-900 mb-1">₦250,000<span className="text-lg text-gray-400 font-medium">+</span></h3>
                       <p className="text-gray-500 font-medium">Monthly earnings potential in Lagos</p>
                    </div>
                    <div className="flex justify-center gap-4 text-sm text-gray-600">
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-700"><Calendar className="w-5 h-5"/></div>
                            <span>Flexible</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-700"><Wallet className="w-5 h-5"/></div>
                            <span>Weekly Pay</span>
                        </div>
                         <div className="flex flex-col items-center gap-1">
                            <div className="w-10 h-10 bg-teal-50 rounded-full flex items-center justify-center text-teal-700"><ShieldCheck className="w-5 h-5"/></div>
                            <span>Safe</span>
                        </div>
                    </div>
                    <Link href="/auth?role=driver" className="block w-full bg-teal-600 text-white text-center py-4 rounded-xl font-bold text-lg hover:bg-teal-700 transition shadow-xl hover:shadow-teal-500/30">
                      Sign up to drive
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* --- Social Proof --- */}
      <section className="py-10 bg-black text-white overflow-hidden">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-8">
            <p className="text-gray-400 font-medium text-sm tracking-widest uppercase">Trusted by 10,000+ commuters in</p>
            <div className="flex gap-12 text-gray-500 font-bold text-2xl grayscale opacity-70">
                <span>ABUJA</span>
                <span>LAGOS</span>
                <span>PORT HARCOURT</span>
                <span className="hidden md:inline">IBADAN</span>
            </div>
        </div>
      </section>

      {/* --- Value Proposition (Grid) --- */}
      <section className="py-24 bg-white px-6" id="features">
        <div className="max-w-7xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-20">
            <span className="text-teal-600 font-bold tracking-wider uppercase text-xs mb-2 block">Why VeloxRide?</span>
            <h2 className="text-4xl font-extrabold mb-6 text-gray-900">More than just a ride.</h2>
            <p className="text-gray-500 text-lg leading-relaxed">
                We've reimagined urban transport to put money back in your pocket and time back in your day.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-10">
            {/* Feature 1 */}
            <div className="group">
              <div className="w-full h-64 bg-gray-100 rounded-3xl mb-8 overflow-hidden relative">
                 <div className="absolute inset-0 bg-teal-600/10 group-hover:bg-teal-600/5 transition-colors"></div>
                 <img src="https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2940&auto=format&fit=crop" className="w-full h-full object-cover mix-blend-overlay opacity-80" alt="Driving" />
                 <div className="absolute bottom-6 left-6 bg-white p-3 rounded-xl shadow-lg">
                    <Calendar className="w-6 h-6 text-teal-600" />
                 </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Schedule & Relax</h3>
              <p className="text-gray-500 leading-relaxed">
                Book your commute up to 7 days in advance. Know your driver, your price, and your pickup time before you even wake up.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group">
              <div className="w-full h-64 bg-gray-100 rounded-3xl mb-8 overflow-hidden relative">
                 <div className="absolute inset-0 bg-purple-600/10 group-hover:bg-purple-600/5 transition-colors"></div>
                 <img src="https://images.unsplash.com/photo-1556742049-0cfed4f7a07d?q=80&w=2940&auto=format&fit=crop" className="w-full h-full object-cover mix-blend-overlay opacity-80" alt="Payment" />
                 <div className="absolute bottom-6 left-6 bg-white p-3 rounded-xl shadow-lg">
                    <Wallet className="w-6 h-6 text-purple-600" />
                 </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Split the Cost</h3>
              <p className="text-gray-500 leading-relaxed">
                Share the ride with others going your way. You pay for your seat, saving up to 60% compared to traditional solo ride-hailing.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group">
              <div className="w-full h-64 bg-gray-100 rounded-3xl mb-8 overflow-hidden relative">
                 <div className="absolute inset-0 bg-blue-600/10 group-hover:bg-blue-600/5 transition-colors"></div>
                 <img src="https://images.unsplash.com/photo-1533558524355-635292419c83?q=80&w=2940&auto=format&fit=crop" className="w-full h-full object-cover mix-blend-overlay opacity-80" alt="Safety" />
                 <div className="absolute bottom-6 left-6 bg-white p-3 rounded-xl shadow-lg">
                    <ShieldCheck className="w-6 h-6 text-blue-600" />
                 </div>
              </div>
              <h3 className="text-2xl font-bold mb-3 text-gray-900">Verified & Safe</h3>
              <p className="text-gray-500 leading-relaxed">
                Every trip is tracked. Every driver is vetted with government ID. Share your live location with loved ones instantly.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* --- Driver Section --- */}
      <section className="py-24 bg-gray-900 text-white px-6 overflow-hidden relative" id="drive">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-teal-900/20 skew-x-12 transform translate-x-20"></div>
        <div className="max-w-7xl mx-auto grid md:grid-cols-2 gap-16 items-center relative z-10">
            <div>
                <div className="inline-block px-4 py-2 bg-teal-900/50 rounded-full text-teal-400 font-bold text-sm mb-6 border border-teal-800">For Car Owners</div>
                <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">Turn your empty seats into income.</h2>
                <p className="text-gray-400 text-lg mb-8 max-w-md">
                    Driving to work? Heading to the market? Don't go alone. Pick up verified passengers along your route and cover your fuel costs plus profit.
                </p>
                
                <div className="space-y-6 mb-10">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
                            <Wallet className="text-teal-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-xl">Keep more of what you earn</h4>
                            <p className="text-gray-400 text-sm mt-1">We charge the lowest commission in the market (15%). Instant payouts available.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-gray-800 rounded-xl flex items-center justify-center shrink-0">
                            <Clock className="text-purple-400" />
                        </div>
                        <div>
                            <h4 className="font-bold text-xl">Control your schedule</h4>
                            <p className="text-gray-400 text-sm mt-1">No shifting. No roaming. You set the route and the time. We find the passengers.</p>
                        </div>
                    </div>
                </div>

                <Link href="/auth?role=driver" className="inline-flex items-center bg-teal-500 text-gray-900 px-8 py-4 rounded-xl font-bold hover:bg-teal-400 transition">
                    Become a Driver <ArrowRight className="ml-2 w-5 h-5" />
                </Link>
            </div>
            <div className="relative">
                <div className="bg-gradient-to-br from-gray-800 to-gray-900 p-8 rounded-3xl border border-gray-700 shadow-2xl">
                    <div className="flex justify-between items-center mb-8 border-b border-gray-700 pb-4">
                        <span className="text-gray-400 font-medium">Weekly Earnings</span>
                        <span className="text-teal-400 font-bold text-xl">₦85,400</span>
                    </div>
                    <div className="space-y-4">
                        <div className="flex items-center gap-4 bg-gray-800/50 p-4 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center text-green-400"><CheckCircle2 className="w-5 h-5"/></div>
                            <div className="flex-1">
                                <h5 className="font-bold text-sm">Gwarinpa to Central Area</h5>
                                <p className="text-xs text-gray-500">Today, 7:30 AM • 3 Passengers</p>
                            </div>
                            <span className="font-bold">₦4,500</span>
                        </div>
                        <div className="flex items-center gap-4 bg-gray-800/50 p-4 rounded-xl">
                            <div className="w-10 h-10 rounded-full bg-green-900/30 flex items-center justify-center text-green-400"><CheckCircle2 className="w-5 h-5"/></div>
                            <div className="flex-1">
                                <h5 className="font-bold text-sm">Central Area to Kubwa</h5>
                                <p className="text-xs text-gray-500">Yesterday, 5:15 PM • 4 Passengers</p>
                            </div>
                            <span className="font-bold">₦6,000</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* --- How it Works --- */}
      <section className="py-24 bg-teal-50 px-6">
         <div className="max-w-7xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-16">How VeloxRide works</h2>
            
            <div className="grid md:grid-cols-3 gap-8 relative">
                {/* Connecting Line (Desktop) */}
                <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-teal-200 -z-10 border-t-2 border-dashed border-teal-300"></div>

                <div className="text-center relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-2xl font-black text-teal-600 border-4 border-teal-50">1</div>
                    <h3 className="font-bold text-xl mb-2">Book a Seat</h3>
                    <p className="text-gray-500 px-4">Search for your destination and choose a driver passing by. See their rating and car details.</p>
                </div>
                <div className="text-center relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-2xl font-black text-teal-600 border-4 border-teal-50">2</div>
                    <h3 className="font-bold text-xl mb-2">Meet at Pickup</h3>
                    <p className="text-gray-500 px-4">Walk to the designated pickup spot on the driver's route. Live track their arrival.</p>
                </div>
                <div className="text-center relative">
                    <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl text-2xl font-black text-teal-600 border-4 border-teal-50">3</div>
                    <h3 className="font-bold text-xl mb-2">Travel & Save</h3>
                    <p className="text-gray-500 px-4">Enjoy a comfortable ride in a verified car. Pay automatically via the app upon arrival.</p>
                </div>
            </div>
         </div>
      </section>

      {/* --- FAQ Section --- */}
      <section className="py-24 bg-white px-6 border-t border-gray-100">
        <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl font-bold mb-10 text-center">Frequently Asked Questions</h2>
            <div className="space-y-4">
                {[
                    { q: "Is VeloxRide safe?", a: "Safety is our priority. We verify every driver's license and vehicle documents. All trips are GPS tracked, and you can share your ride details with family in real-time." },
                    { q: "How much does a ride cost?", a: "VeloxRide is 50-70% cheaper than traditional taxis because you share the cost with others. Prices are fixed upfront—no surprises." },
                    { q: "Can I book for my friends?", a: "Yes! You can book up to 4 seats in a single ride, provided the driver has enough space available." },
                    { q: "How do I become a driver?", a: "Simply sign up as a driver, upload your driver's license, vehicle registration, and car photos. Once verified (usually within 24 hours), you can start posting rides." }
                ].map((item, idx) => (
                    <div key={idx} className="border border-gray-200 rounded-2xl overflow-hidden">
                        <button 
                            onClick={() => toggleFaq(idx)}
                            className="w-full flex items-center justify-between p-6 text-left bg-white hover:bg-gray-50 transition"
                        >
                            <span className="font-bold text-lg">{item.q}</span>
                            <ChevronDown className={`w-5 h-5 transition-transform ${openFaq === idx ? 'rotate-180' : ''}`} />
                        </button>
                        {openFaq === idx && (
                            <div className="p-6 pt-0 text-gray-600 bg-gray-50/50">
                                {item.a}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
      </section>

      {/* --- App Download CTA --- */}
      <section className="py-24 bg-black text-white px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-12">
          <div className="md:w-1/2">
            <span className="text-teal-400 font-bold tracking-wider uppercase text-xs mb-2 block">Download the App</span>
            <h2 className="text-4xl lg:text-5xl font-extrabold mb-6">Ready to move smarter?</h2>
            <p className="text-lg text-gray-400 mb-8 max-w-md">
              Get the VeloxRide app for the best experience. Live tracking, easy payments, and 24/7 support.
            </p>
            <div className="flex flex-wrap gap-4">
              <button className="bg-white text-black px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-gray-200 transition">
                <Smartphone className="w-8 h-8" />
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold">Download on the</div>
                  <div className="text-base font-bold leading-none">App Store</div>
                </div>
              </button>
              <button className="bg-transparent border border-white/30 text-white px-6 py-3 rounded-xl flex items-center gap-3 hover:bg-white/10 transition">
                <div className="text-left">
                  <div className="text-[10px] uppercase font-bold">Get it on</div>
                  <div className="text-base font-bold leading-none">Google Play</div>
                </div>
              </button>
            </div>
          </div>
          <div className="md:w-1/2 flex justify-center relative">
             <div className="absolute inset-0 bg-teal-500 blur-[100px] opacity-20"></div>
             {/* Abstract Phone Mockup */}
             <div className="w-72 h-[500px] bg-gray-900 rounded-[3rem] p-4 shadow-2xl ring-8 ring-gray-800 relative z-10">
                <div className="w-full h-full bg-white rounded-[2rem] overflow-hidden relative">
                   <div className="absolute top-0 w-full h-1/2 bg-gray-100">
                      {/* Map Placeholder */}
                      <div className="w-full h-full opacity-30 bg-[url('https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/OpenStreetMap_Logo_2011.svg/1024px-OpenStreetMap_Logo_2011.svg.png')] bg-cover"></div>
                      {/* Car Marker */}
                      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-black rounded-full border-4 border-white shadow-lg"></div>
                   </div>
                   <div className="absolute bottom-0 w-full h-1/2 bg-white rounded-t-3xl p-6 shadow-[0_-10px_40px_rgba(0,0,0,0.1)]">
                      <div className="w-12 h-1 bg-gray-200 rounded-full mx-auto mb-6"></div>
                      <h4 className="font-bold text-xl mb-1">Driver Arriving</h4>
                      <p className="text-sm text-gray-500 mb-6">2 mins away • Toyota Corolla</p>
                      
                      <div className="flex items-center gap-4 mb-6">
                         <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                         <div>
                            <div className="font-bold">Ibrahim Musa</div>
                            <div className="text-xs text-gray-500 flex items-center gap-1"><Star className="w-3 h-3 fill-yellow-400 text-yellow-400"/> 4.9 Rating</div>
                         </div>
                         <div className="ml-auto font-bold text-teal-600">ABJ-124</div>
                      </div>
                      
                      <div className="w-full h-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-sm">Contact Driver</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* --- Footer --- */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8 px-6">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-1 md:col-span-1">
             <div className="text-2xl font-black text-teal-700 mb-6 flex items-center gap-2">
              <div className="w-8 h-8 bg-teal-600 rounded-lg flex items-center justify-center text-white">V</div>
              <span className="text-gray-900">Velox</span>Ride
            </div>
            <p className="text-gray-500 text-sm mb-6">
              Reinventing urban mobility in Africa. <br />
              Safe. Affordable. Scheduled.
            </p>
            <div className="flex gap-4">
               {/* Social Icons */}
               <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition cursor-pointer">
                  <span className="font-bold text-xs">X</span>
               </div>
               <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition cursor-pointer">
                  <span className="font-bold text-xs">in</span>
               </div>
               <div className="w-10 h-10 bg-gray-50 rounded-full flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition cursor-pointer">
                  <span className="font-bold text-xs">Ig</span>
               </div>
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-6 text-gray-900">Company</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-teal-600 transition">About Us</Link></li>
              <li><Link href="#" className="hover:text-teal-600 transition">Careers</Link></li>
              <li><Link href="#" className="hover:text-teal-600 transition">Blog</Link></li>
              <li><Link href="#" className="hover:text-teal-600 transition">Press</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-gray-900">Product</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-teal-600 transition">Ride</Link></li>
              <li><Link href="#" className="hover:text-teal-600 transition">Drive</Link></li>
              <li><Link href="#" className="hover:text-teal-600 transition">Velox Business</Link></li>
              <li><Link href="#" className="hover:text-teal-600 transition">Safety Standards</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-6 text-gray-900">Legal</h4>
            <ul className="space-y-4 text-sm text-gray-500">
              <li><Link href="#" className="hover:text-teal-600 transition">Terms of Service</Link></li>
              <li><Link href="#" className="hover:text-teal-600 transition">Privacy Policy</Link></li>
              <li><Link href="#" className="hover:text-teal-600 transition">Cookie Policy</Link></li>
              <li><Link href="#" className="hover:text-teal-600 transition">Dispute Resolution</Link></li>
            </ul>
          </div>
        </div>

        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center pt-8 border-t border-gray-100">
          <p className="text-xs text-gray-400">© 2025 VeloxRide Nigeria. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}