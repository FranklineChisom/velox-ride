'use client';

import { IMAGES } from "@/lib/constants";

export default function OnboardingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
        <div className="mx-auto h-12 w-12 bg-black text-white rounded-xl flex items-center justify-center font-bold text-xl shadow-xl">
          V
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-slate-900 tracking-tight">
          Welcome to Veluxeride
        </h2>
        <p className="mt-2 text-center text-sm text-slate-600">
          Let&apos;s get your profile ready for the road.
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-lg">
        <div className="bg-white py-8 px-4 shadow-float sm:rounded-[2rem] sm:px-10 border border-slate-100 relative overflow-hidden">
          {children}
        </div>
        
        <p className="text-center text-xs text-slate-400 mt-8">
          Step-by-step Secure Identity Verification
        </p>
      </div>
    </div>
  );
}