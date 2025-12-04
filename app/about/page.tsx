'use client';

export default function AboutPage() {
  return (
    <div className="pt-32 pb-20 w-[90%] md:w-[85%] mx-auto min-h-screen">
      <h1 className="text-5xl font-bold mb-8 text-slate-900">About VeloxRide</h1>
      <p className="text-xl text-slate-500 max-w-3xl leading-relaxed mb-16">
        VeloxRide is reimagining urban mobility in Nigeria. We believe that transportation should be reliable, affordable, and accessible to everyone. By connecting passengers with drivers already heading in the same direction, we are reducing congestion, lowering costs, and building a community of trust.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
         <div className="bg-slate-50 p-10 rounded-3xl">
            <h3 className="text-3xl font-bold mb-4">Our Mission</h3>
            <p className="text-slate-600 text-lg leading-relaxed">To make daily commuting in African cities efficient and dignified.</p>
         </div>
         <div className="bg-slate-50 p-10 rounded-3xl">
            <h3 className="text-3xl font-bold mb-4">Our Vision</h3>
            <p className="text-slate-600 text-lg leading-relaxed">A future where shared mobility reduces the need for car ownership.</p>
         </div>
      </div>
    </div>
  );
}