'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Send, User } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
  is_mine: boolean;
}

interface ChatModalProps {
  bookingId: string;
  driverName: string;
  currentUserId: string;
  onClose: () => void;
}

export default function ChatModal({ bookingId, driverName, currentUserId, onClose }: ChatModalProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  useEffect(() => {
    // 1. Fetch initial messages
    const fetchMessages = async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('booking_id', bookingId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error(error);
        addToast('Failed to load messages', 'error');
      } else if (data) {
        setMessages(data.map(m => ({ ...m, is_mine: m.sender_id === currentUserId })));
      }
    };

    fetchMessages();

    // 2. Subscribe to new messages
    const channel = supabase.channel(`chat-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          const newMsg = payload.new as any;
          setMessages((prev) => [...prev, { ...newMsg, is_mine: newMsg.sender_id === currentUserId }]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId, currentUserId, supabase, addToast]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { error } = await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: currentUserId,
      content: newMessage.trim()
    });

    if (error) {
      addToast('Failed to send message', 'error');
    } else {
      setNewMessage('');
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 pointer-events-auto backdrop-blur-sm" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="bg-white w-full sm:w-[400px] h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col pointer-events-auto animate-slide-up sm:animate-scale-up overflow-hidden border border-slate-100 relative z-50">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500">
              <User className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-bold text-slate-900">{driverName}</h3>
              <p className="text-xs text-green-600 font-medium flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span> Online
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-black">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
          {messages.length === 0 && (
            <div className="text-center text-slate-400 text-xs py-10 flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-2">
                <Send className="w-5 h-5 text-slate-300" />
              </div>
              <p>Start a conversation with your driver.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}>
              <div 
                className={`max-w-[75%] p-3 rounded-2xl text-sm ${
                  msg.is_mine 
                    ? 'bg-black text-white rounded-br-none' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none shadow-sm'
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <form onSubmit={handleSend} className="p-4 bg-white border-t border-slate-100 flex gap-2">
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 bg-slate-50 border-none rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-black outline-none transition"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-black text-white p-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition flex items-center justify-center"
          >
            <Send className="w-5 h-5"/>
          </button>
        </form>
      </div>
    </div>
  );
}