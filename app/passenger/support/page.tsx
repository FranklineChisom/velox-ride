'use client';
import { useState, useEffect } from 'react';
import { HelpCircle, MessageCircle, Phone, ChevronDown, Send, Loader2, Clock, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';
import { SupportTicket } from '@/types';
import Modal from '@/components/ui/Modal';

export default function SupportPage() {
  const supabase = createClient();
  const { addToast } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [newTicket, setNewTicket] = useState({ subject: '', message: '' });
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            setUser(user);
            fetchTickets(user.id);
        }
    };
    init();
  }, []);

  const fetchTickets = async (userId: string) => {
    const { data } = await supabase
      .from('support_tickets')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (data) setTickets(data as SupportTicket[]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTicket.subject || !newTicket.message || !user) return;
    
    setLoading(true);

    const { data, error } = await supabase.from('support_tickets').insert({
        user_id: user.id,
        subject: newTicket.subject,
        message: newTicket.message,
        status: 'open'
    }).select().single();

    if (error) {
        addToast("Failed to submit ticket", 'error');
    } else if (data) {
        addToast("Ticket submitted successfully", 'success');
        setShowForm(false);
        setNewTicket({ subject: '', message: '' });
        setTickets(prev => [data, ...prev]); // Optimistic update
    }
    setLoading(false);
  };

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto pt-32">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Help & Support</h1>

      {/* Contact Options */}
      <div className="grid md:grid-cols-2 gap-4 mb-10">
         <div 
           onClick={() => setShowForm(true)}
           className="bg-black text-white p-6 rounded-2xl flex flex-col items-center text-center hover:bg-slate-900 transition cursor-pointer"
         >
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center mb-4">
               <MessageCircle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-lg mb-1">Open a Ticket</h3>
            <p className="text-slate-400 text-sm">Report an issue with a ride or payment</p>
         </div>
         
         <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col items-center text-center hover:border-black transition cursor-pointer">
            <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center mb-4">
               <Phone className="w-6 h-6 text-slate-900" />
            </div>
            <h3 className="font-bold text-lg mb-1 text-slate-900">Emergency Line</h3>
            <p className="text-slate-500 text-sm">Call for urgent safety issues only</p>
         </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
         {/* My Tickets */}
         <section>
            <h2 className="font-bold text-xl text-slate-900 mb-6">Recent Tickets</h2>
            <div className="space-y-3">
               {tickets.length === 0 ? (
                   <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-100">
                       <p className="text-slate-400 text-sm">No support tickets found.</p>
                   </div>
               ) : (
                   tickets.map(ticket => (
                       <div key={ticket.id} className="bg-white border border-slate-100 p-4 rounded-xl hover:shadow-sm transition">
                           <div className="flex justify-between items-start mb-2">
                               <h4 className="font-bold text-slate-800 text-sm">{ticket.subject}</h4>
                               <span className={`text-[10px] uppercase font-bold px-2 py-1 rounded-full ${
                                   ticket.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                               }`}>
                                   {ticket.status.replace('_', ' ')}
                               </span>
                           </div>
                           <p className="text-xs text-slate-500 line-clamp-2">{ticket.message}</p>
                           <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-2 text-xs text-slate-400">
                               <Clock className="w-3 h-3"/> {new Date(ticket.created_at).toLocaleDateString()}
                           </div>
                       </div>
                   ))
               )}
            </div>
         </section>

         {/* FAQs (Static for now, can be DB driven later) */}
         <section>
            <h2 className="font-bold text-xl text-slate-900 mb-6">Frequently Asked Questions</h2>
            <div className="space-y-3">
               {[
                  { q: "How do I cancel a ride?", a: "Go to 'My Trips', select the upcoming trip, and tap 'Cancel Ride'." },
                  { q: "Why was I charged a fee?", a: "Cancellation fees apply if you cancel less than 1 hour before pickup." },
                  { q: "How do I fund my wallet?", a: "Navigate to the Wallet tab and use the 'Fund Wallet' button via Paystack." },
               ].map((faq, i) => (
                  <div key={i} className="group bg-white border border-slate-100 p-5 rounded-xl cursor-pointer hover:bg-slate-50 transition">
                     <div className="flex justify-between items-center">
                        <span className="font-medium text-slate-800 text-sm">{faq.q}</span>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                     </div>
                     <div className="hidden group-hover:block mt-2 text-xs text-slate-500 pt-2 border-t border-slate-200/50">
                        {faq.a}
                     </div>
                  </div>
               ))}
            </div>
         </section>
      </div>

      {/* Ticket Modal */}
      <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Submit a Ticket">
         <form onSubmit={handleSubmit} className="space-y-4">
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Subject</label>
               <input 
                 required 
                 className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-black transition border border-slate-200"
                 placeholder="e.g. Lost Item"
                 value={newTicket.subject}
                 onChange={e => setNewTicket({...newTicket, subject: e.target.value})}
               />
            </div>
            <div>
               <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Message</label>
               <textarea 
                 required 
                 className="w-full p-3 bg-slate-50 rounded-xl outline-none focus:ring-2 focus:ring-black transition border border-slate-200 h-32 resize-none"
                 placeholder="Describe your issue..."
                 value={newTicket.message}
                 onChange={e => setNewTicket({...newTicket, message: e.target.value})}
               />
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-black text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition flex items-center justify-center gap-2"
            >
               {loading ? <Loader2 className="animate-spin"/> : <><Send className="w-4 h-4"/> Submit Ticket</>}
            </button>
         </form>
      </Modal>
    </div>
  );
}