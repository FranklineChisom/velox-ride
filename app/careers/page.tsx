'use client';

export default function CareersPage() {
  return (
    <div className="pt-24 pb-12 w-[90%] md:w-[85%] mx-auto">
      <h1 className="text-5xl font-bold mb-6">Join our team</h1>
      <p className="text-xl text-slate-500 mb-16">Help us build the future of mobility in Africa.</p>
      
      <div className="space-y-4">
         {['Senior Software Engineer', 'Product Manager', 'Marketing Specialist', 'Operations Manager'].map((job) => (
           <div key={job} className="border border-slate-200 p-6 rounded-xl flex justify-between items-center hover:border-black transition cursor-pointer">
              <div>
                 <h3 className="font-bold text-lg">{job}</h3>
                 <p className="text-slate-500 text-sm">Lagos, Nigeria • Full-time</p>
              </div>
              <button className="text-black font-bold">Apply &rarr;</button>
           </div>
         ))}
      </div>
    </div>
  );
}