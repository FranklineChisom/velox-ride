'use client';

export default function AboutPage() {
  return (
    <div className="pt-24 pb-12 w-[90%] md:w-[85%] mx-auto">
      <h1 className="text-5xl font-bold mb-8">About VeloxRide</h1>
      <p className="text-xl text-slate-500 max-w-3xl leading-relaxed mb-12">
        VeloxRide is reimagining urban mobility in Nigeria. We believe that transportation should be reliable, affordable, and accessible to everyone. By connecting passengers with drivers already heading in the same direction, we are reducing congestion, lowering costs, and building a community of trust.
      </p>
      <div className="grid md:grid-cols-2 gap-8">
         <div className="bg-slate-50 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">Our Mission</h3>
            <p className="text-slate-600">To make daily commuting in African cities efficient and dignified.</p>
         </div>
         <div className="bg-slate-50 p-8 rounded-2xl">
            <h3 className="text-2xl font-bold mb-4">Our Vision</h3>
            <p className="text-slate-600">A future where shared mobility reduces the need for car ownership.</p>
         </div>
      </div>
    </div>
  );
}