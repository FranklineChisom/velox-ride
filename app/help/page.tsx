'use client';

export default function HelpPage() {
  return (
    <div className="pt-32 pb-20 w-[90%] md:w-[85%] mx-auto min-h-screen">
      <h1 className="text-5xl font-bold mb-12 text-slate-900">Help Center</h1>
      <div className="grid md:grid-cols-2 gap-16">
         <div>
            <h2 className="text-2xl font-bold mb-6">Frequently Asked Questions</h2>
            <ul className="space-y-6">
               <li><button className="text-slate-600 font-medium text-lg hover:text-black hover:underline text-left">How do I reset my password?</button></li>
               <li><button className="text-slate-600 font-medium text-lg hover:text-black hover:underline text-left">Where can I see my ride history?</button></li>
               <li><button className="text-slate-600 font-medium text-lg hover:text-black hover:underline text-left">My driver didn&apos;t show up.</button></li>
               <li><button className="text-slate-600 font-medium text-lg hover:text-black hover:underline text-left">Payment issues.</button></li>
            </ul>
         </div>
         <div className="bg-slate-50 p-10 rounded-3xl h-fit">
            <h3 className="text-2xl font-bold mb-4">Contact Support</h3>
            <p className="text-slate-600 mb-8 leading-relaxed">Can&apos;t find what you&apos;re looking for? Our team is here to help 24/7.</p>
            <button className="bg-black text-white px-8 py-4 rounded-xl font-bold hover:bg-slate-800 transition w-full shadow-lg">Chat with us</button>
         </div>
      </div>
    </div>
  );
}