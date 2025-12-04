'use client';
import Link from 'next/link';
import { Briefcase, PieChart, Users } from 'lucide-react';

export default function BusinessPage() {
  return (
    <div className="pt-24 pb-12">
      <div className="w-[90%] md:w-[85%] mx-auto">
        <section className="mb-24 text-center max-w-4xl mx-auto">
           <h1 className="text-5xl font-bold mb-6 text-slate-900 leading-tight">
             Velox for Business
           </h1>
           <p className="text-xl text-slate-500 mb-8 leading-relaxed">
             Move your people and guests with ease. A powerful platform to manage rides, meals, and local deliveries for companies of all sizes.
           </p>
           <button className="px-8 py-4 bg-black text-white rounded-full font-bold text-lg hover:bg-slate-800 transition">
             Contact Sales
           </button>
        </section>

        <section className="grid md:grid-cols-3 gap-8 mb-24">
           {[
             { icon: Briefcase, title: "Employee Travel", desc: "Automate expensing and set travel policies for your team." },
             { icon: Users, title: "Client Transport", desc: "Impress clients with scheduled, reliable rides charged to your account." },
             { icon: PieChart, title: "Usage Analytics", desc: "Track spending and usage patterns with our comprehensive dashboard." }
           ].map((item, i) => (
             <div key={i} className="border border-slate-200 p-8 rounded-2xl">
                <item.icon className="w-10 h-10 mb-4 text-black" />
                <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                <p className="text-slate-500">{item.desc}</p>
             </div>
           ))}
        </section>
      </div>
    </div>
  );
}