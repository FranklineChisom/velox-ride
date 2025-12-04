'use client';
import Link from 'next/link';
import { DollarSign, Clock, ShieldCheck } from 'lucide-react';
import { IMAGES } from '@/lib/constants';

export default function DrivePage() {
  return (
    <div className="pt-32 pb-20 w-[90%] md:w-[85%] mx-auto min-h-screen">
      <section className="mb-24">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="order-2 md:order-1 h-[500px] rounded-[2.5rem] overflow-hidden shadow-2xl">
            <img src={IMAGES.driverHero} className="object-cover w-full h-full hover:scale-105 transition duration-700" alt="Driver" />
          </div>
          <div className="order-1 md:order-2">
            <h1 className="text-5xl font-bold mb-6 text-slate-900 leading-tight">
              Drive when you want, <br/> make what you need.
            </h1>
            <p className="text-xl text-slate-500 mb-8 leading-relaxed">
              Earn on your own schedule. Veluxeride offers flexible earning opportunities with instant payouts and low commissions.
            </p>
            <Link href="/auth?role=driver" className="inline-flex items-center px-8 py-4 bg-black text-white rounded-full font-bold text-lg hover:bg-slate-800 transition shadow-lg">
              Sign up to drive
            </Link>
          </div>
        </div>
      </section>

      <section className="bg-black text-white p-12 rounded-[2.5rem] mb-24 shadow-2xl">
          <h2 className="text-3xl font-bold mb-12 text-center">Why drive with Velox?</h2>
          <div className="grid md:grid-cols-3 gap-12">
            <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <DollarSign className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">High Earnings</h3>
                <p className="text-slate-400">Keep 85% of your fare. No hidden fees.</p>
            </div>
            <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Clock className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Flexible Hours</h3>
                <p className="text-slate-400">You are the boss. Drive as much or as little as you want.</p>
            </div>
            <div className="text-center">
                <div className="w-16 h-16 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <ShieldCheck className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold mb-2">Driver Safety</h3>
                <p className="text-slate-400">24/7 support and verified passenger ratings.</p>
            </div>
          </div>
      </section>
    </div>
  );
}