'use client';
import { ShieldCheck, MapPin, Phone } from 'lucide-react';

export default function SafetyPage() {
  return (
    <div className="pt-32 pb-20 w-[90%] md:w-[85%] mx-auto min-h-screen">
      <section className="mb-20">
         <h1 className="text-5xl font-bold mb-6 text-slate-900">Safety is our priority</h1>
         <p className="text-xl text-slate-500 max-w-3xl leading-relaxed">
           We are committed to the safety of everyone using VeloxRide. From driver verification to real-time trip tracking, our technology helps ensure every ride is safe.
         </p>
      </section>

      <div className="grid md:grid-cols-2 gap-16 mb-24">
         <div className="space-y-12">
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><ShieldCheck className="w-6 h-6"/> Driver Screening</h2>
              <p className="text-slate-500 leading-relaxed">Every driver undergoes a rigorous background check, including criminal history and driving record reviews, before they can accept a trip.</p>
            </div>
            
            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><MapPin className="w-6 h-6"/> Trip Tracking</h2>
              <p className="text-slate-500 leading-relaxed">Share your live location and trip status with friends and family directly from the app so they know when you've arrived.</p>
            </div>

            <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-3"><Phone className="w-6 h-6"/> Emergency Assistance</h2>
              <p className="text-slate-500 leading-relaxed">Our app includes an in-app emergency button that connects you directly to local authorities and our safety response team.</p>
            </div>
         </div>
         <div className="bg-slate-100 rounded-[2.5rem] h-[500px] overflow-hidden shadow-2xl">
            <img src="https://images.unsplash.com/photo-1549923746-c502d488b3ea?q=80&w=2071" className="object-cover w-full h-full hover:scale-105 transition duration-700" alt="Safety" />
         </div>
      </div>
    </div>
  );
}