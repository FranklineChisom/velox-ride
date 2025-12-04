'use client';
import Link from 'next/link';
import { Briefcase, PieChart, Users } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';

export default function BusinessPage() {
  return (
    <div className="pt-32 pb-20 w-[90%] md:w-[85%] mx-auto min-h-screen">
      <section className="mb-24 text-center max-w-4xl mx-auto">
         <h1 className="text-6xl font-bold mb-6 text-slate-900 leading-tight">
           Velox for Business
         </h1>
         <p className="text-xl text-slate-500 mb-8 leading-relaxed max-w-2xl mx-auto">
           Move your people and guests with ease. A powerful platform to manage rides, meals, and local deliveries for companies of all sizes.
         </p>
         <button className="px-8 py-4 bg-black text-white rounded-full font-bold text-lg hover:bg-slate-800 transition shadow-lg">
           Contact Sales
         </button>
      </section>

      <section className="grid md:grid-cols-3 gap-8 mb-24">
         {[
           { icon: Briefcase, title: "Employee Travel", desc: "Automate expensing and set travel policies for your team." },
           { icon: Users, title: "Client Transport", desc: "Impress clients with scheduled, reliable rides charged to your account." },
           { icon: PieChart, title: "Usage Analytics", desc: "Track spending and usage patterns with our comprehensive dashboard." }
         ].map((item, i) => (
           <div key={i} className="border border-slate-200 p-8 rounded-3xl hover:border-slate-300 transition duration-300">
              <item.icon className="w-12 h-12 mb-6 text-black" />
              <h3 className="text-2xl font-bold mb-3">{item.title}</h3>
              <p className="text-slate-500 leading-relaxed">{item.desc}</p>
           </div>
         ))}
      </section>
    </div>
  );
}