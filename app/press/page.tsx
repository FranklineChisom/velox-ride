'use client';

export default function PressPage() {
  return (
    <div className="pt-32 pb-20 w-[90%] md:w-[85%] mx-auto max-w-4xl min-h-screen">
      <h1 className="text-5xl font-bold mb-8 text-slate-900">Veluxeride in the News</h1>
      <p className="text-xl text-slate-500 mb-16 leading-relaxed">
        Read about our latest milestones, product launches, and company updates.
      </p>

      <div className="space-y-12">
        {[
          {
            date: "November 15, 2025",
            source: "TechCabal",
            title: "Veluxeride Expands to Abuja, Introduces Scheduled Rides",
            excerpt: "The new ride-sharing platform aims to reduce commuting costs by up to 60% with its innovative scheduled matching system."
          },
          {
            date: "October 2, 2025",
            source: "BusinessDay",
            title: "How Veluxeride is redefining urban mobility in Nigeria",
            excerpt: "An interview with the founding team on solving the chaotic traffic problem in Lagos through shared efficiency."
          },
          {
            date: "September 10, 2025",
            source: "TechPoint Africa",
            title: "Veluxeride raises seed round to fuel expansion",
            excerpt: "The company plans to use the funds to onboard 10,000 drivers and improve its safety verification technology."
          }
        ].map((article, i) => (
          <div key={i} className="border-b border-slate-100 pb-12 last:border-0">
             <div className="text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">{article.source} • {article.date}</div>
             <h2 className="text-3xl font-bold text-slate-900 mb-4 hover:text-black cursor-pointer transition">{article.title}</h2>
             <p className="text-slate-600 text-lg leading-relaxed mb-6">{article.excerpt}</p>
             <button className="text-black font-bold border-b-2 border-black pb-1 hover:text-slate-600 hover:border-slate-600 transition">Read Article</button>
          </div>
        ))}
      </div>

      <div className="mt-20 bg-slate-50 p-12 rounded-3xl text-center">
         <h3 className="text-2xl font-bold mb-4">Media Inquiries</h3>
         <p className="text-slate-600 mb-8">For press kits, interview requests, or other media inquiries, please contact our team.</p>
         <button className="bg-black text-white px-8 py-4 rounded-full font-bold hover:bg-slate-800 transition">Contact Press Team</button>
      </div>
    </div>
  );
}