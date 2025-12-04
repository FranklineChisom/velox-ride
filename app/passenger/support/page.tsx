'use client';
import { HelpCircle, MessageCircle, Phone, FileText, ChevronDown } from 'lucide-react';

export default function SupportPage() {
  return (
    <div className="p-6 lg:p-10 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Help & Support</h1>

      {/* Contact Options */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
         <div className="bg-black text-white p-6 rounded-2xl flex flex-col items-center text-center hover:bg-slate-900 transition cursor-pointer">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
               <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-1">Live Chat</h3>
            <p className="text-slate-400 text-sm">Chat with our support team 24/7</p>
         </div>
         <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center text-center hover:border-black transition cursor-pointer">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <Phone className="w-6 h-6 text-slate-900" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-slate-900">Emergency Line</h3>
            <p className="text-slate-500 text-sm">Call for urgent safety issues</p>
         </div>
      </div>

      {/* FAQs */}
      <section>
         <h2 className="font-bold text-xl text-slate-900 mb-6">Frequently Asked Questions</h2>
         <div className="space-y-4">
            {[
               "How do I cancel a ride?",
               "Why was I charged a cancellation fee?",
               "How do I change my payment method?",
               "I left an item in the car."
            ].map((question, i) => (
               <div key={i} className="bg-white border border-slate-100 p-5 rounded-xl flex items-center justify-between cursor-pointer hover:bg-slate-50 transition">
                  <span className="font-medium text-slate-800">{question}</span>
                  <ChevronDown className="w-5 h-5 text-slate-400" />
               </div>
            ))}
         </div>
         <button className="w-full mt-6 py-4 text-center font-bold text-black hover:bg-slate-50 rounded-xl transition">
            View all FAQs
         </button>
      </section>
    </div>
  );
}