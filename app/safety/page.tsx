'use client';
import { ShieldCheck, MapPin, Phone } from 'lucide-react';

export default function SafetyPage() {
  return (
    <div className="pt-24 pb-12">
      <div className="w-[90%] md:w-[85%] mx-auto">
        <section className="mb-20">
           <h1 className="text-5xl font-bold mb-6 text-slate-900">Safety is our priority</h1>
           <p className="text-xl text-slate-500 max-w-3xl">
             We are committed to the safety of everyone using VeloxRide. From driver verification to real-time trip tracking, our technology helps ensure every ride is safe.
           </p>
        </section>

        <div className="grid md:grid-cols-2 gap-16 mb-24">
           <div>
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><ShieldCheck className="w-6 h-6"/> Driver Screening</h2>
              <p className="text-slate-500 mb-8">Every driver undergoes a rigorous background check, including criminal history and driving record reviews, before they can accept a trip.</p>
              
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><MapPin className="w-6 h-6"/> Trip Tracking</h2>
              <p className="text-slate-500 mb-8">Share your live location and trip status with friends and family directly from the app so they know when you've arrived.</p>

              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2"><Phone className="w-6 h-6"/> Emergency Assistance</h2>
              <p className="text-slate-500">Our app includes an in-app emergency button that connects you directly to local authorities and our safety response team.</p>
           </div>
           <div className="bg-slate-100 rounded-3xl h-[400px] overflow-hidden">
              <img src="https://images.unsplash.com/photo-1549923746-c502d488b3ea?q=80&w=2071" className="object-cover w-full h-full" alt="Safety" />
           </div>
        </div>
      </div>
    </div>
  );
}