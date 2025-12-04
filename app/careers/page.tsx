'use client';

export default function CareersPage() {
  return (
    <div className="pt-32 pb-20 w-[90%] md:w-[85%] mx-auto min-h-screen">
      <h1 className="text-5xl font-bold mb-6 text-slate-900">Join our team</h1>
      <p className="text-xl text-slate-500 mb-16 max-w-2xl">Help us build the future of mobility in Africa. We are looking for passionate individuals to join our mission.</p>
      
      <div className="space-y-6">
         {['Senior Software Engineer', 'Product Manager', 'Marketing Specialist', 'Operations Manager'].map((job) => (
           <div key={job} className="border border-slate-200 p-8 rounded-2xl flex flex-col md:flex-row justify-between items-start md:items-center hover:border-black transition cursor-pointer group">
              <div className="mb-4 md:mb-0">
                 <h3 className="font-bold text-2xl mb-1 group-hover:text-slate-700 transition">{job}</h3>
                 <p className="text-slate-500 font-medium">Lagos, Nigeria • Full-time</p>
              </div>
              <button className="text-black font-bold text-lg flex items-center gap-2 group-hover:gap-3 transition-all">Apply &rarr;</button>
           </div>
         ))}
      </div>
    </div>
  );
}