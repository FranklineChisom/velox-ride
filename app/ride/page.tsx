'use client';
import Link from 'next/link';
import { Clock, ShieldCheck, Wallet } from 'lucide-react';
import { IMAGES } from '@/lib/constants';

export default function RidePage() {
  return (
    <div className="pt-32 pb-20 w-[90%] md:w-[85%] mx-auto min-h-screen">
      <section className="mb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div>
            <h1 className="text-5xl font-bold mb-6 text-slate-900 leading-tight">
              Always the ride <br/> you want.
            </h1>
            <p className="text-xl text-slate-500 mb-8 leading-relaxed">
              The best way to get wherever you’re going. Schedule a ride, share the cost, and travel in verified comfort.
            </p>
            <Link href="/auth?role=passenger" className="inline-flex items-center px-8 py-4 bg-black text-white rounded-full font-bold text-lg hover:bg-slate-800 transition shadow-lg">
              Request a Ride
            </Link>
          </div>
          <div className="h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl">
            <img src={IMAGES.passengerHero} className="object-cover w-full h-full hover:scale-105 transition duration-700" alt="Passenger" />
          </div>
        </div>
      </section>

      <section className="mb-24 grid md:grid-cols-3 gap-8">
          {[
            { icon: Clock, title: "Schedule ahead", desc: "Plan your day with confidence by booking your ride up to 30 days in advance." },
            { icon: Wallet, title: "Budget friendly", desc: "Our shared model allows you to split the cost with others heading your way." },
            { icon: ShieldCheck, title: "Safety first", desc: "We screen all drivers and offer in-app safety features for peace of mind." }
          ].map((item, i) => (
            <div key={i} className="bg-slate-50 p-8 rounded-3xl hover:bg-slate-100 transition duration-300">
              <item.icon className="w-10 h-10 mb-4 text-black" />
              <h3 className="text-xl font-bold mb-2">{item.title}</h3>
              <p className="text-slate-500">{item.desc}</p>
            </div>
          ))}
      </section>
    </div>
  );
}