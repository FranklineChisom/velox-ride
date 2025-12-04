'use client';

export default function HelpPage() {
  return (
    <div className="pt-24 pb-12 w-[90%] md:w-[85%] mx-auto">
      <h1 className="text-4xl font-bold mb-8">Help Center</h1>
      <div className="grid md:grid-cols-2 gap-8">
         <div>
            <h2 className="text-2xl font-bold mb-4">Frequently Asked Questions</h2>
            <ul className="space-y-4">
               <li><button className="text-slate-600 hover:text-black hover:underline">How do I reset my password?</button></li>
               <li><button className="text-slate-600 hover:text-black hover:underline">Where can I see my ride history?</button></li>
               <li><button className="text-slate-600 hover:text-black hover:underline">My driver didn't show up.</button></li>
               <li><button className="text-slate-600 hover:text-black hover:underline">Payment issues.</button></li>
            </ul>
         </div>
         <div className="bg-slate-50 p-8 rounded-2xl">
            <h3 className="text-xl font-bold mb-4">Contact Support</h3>
            <p className="text-slate-600 mb-4">Can't find what you're looking for? Our team is here to help 24/7.</p>
            <button className="bg-black text-white px-6 py-3 rounded-lg font-bold">Chat with us</button>
         </div>
      </div>
    </div>
  );
}