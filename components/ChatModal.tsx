'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Send, User, Check, CheckCheck } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';
import { Message } from '@/types';

interface ExtendedMessage extends Message {
  is_mine: boolean;
}

interface ChatModalProps {
  bookingId: string;
  driverName: string;
  currentUserId: string;
  onClose: () => void;
}

const SUGGESTED_MESSAGES = [
  "I'm here waiting.",
  "Where are you?",
  "Running 5 mins late.",
  "Can you call me?",
  "I'm at the pickup point."
];

export default function ChatModal({ bookingId, driverName, currentUserId, onClose }: ChatModalProps) {
  const supabase = createClient();
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { addToast } = useToast();

  const markAsRead = async () => {
    // Update all unread messages sent by the other party
    await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('booking_id', bookingId)
      .neq('sender_id', currentUserId)
      .eq('is_read', false);
  };

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
        // Mark as read on load
        markAsRead();
      }
    };

    fetchMessages();

    // 2. Subscribe to new messages
    const channel = supabase.channel(`chat-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => [...prev, { ...newMsg, is_mine: newMsg.sender_id === currentUserId }]);
          
          // If message is from other person, mark as read immediately since chat is open
          if (newMsg.sender_id !== currentUserId) {
            markAsRead();
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
        (payload) => {
           // Update read status in UI for my messages
           const updatedMsg = payload.new as Message;
           setMessages(prev => prev.map(m => m.id === updatedMsg.id ? { ...m, is_read: updatedMsg.is_read } : m));
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

  const handleSend = async (messageText: string = newMessage) => {
    if (!messageText.trim()) return;

    const { error } = await supabase.from('messages').insert({
      booking_id: bookingId,
      sender_id: currentUserId,
      content: messageText.trim()
    });

    if (error) {
      addToast('Failed to send message', 'error');
    } else {
      setNewMessage('');
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  }

  return (
    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/20 pointer-events-auto backdrop-blur-sm transition-opacity opacity-100" onClick={onClose}></div>
      
      {/* Modal */}
      <div className="bg-white w-full sm:w-[400px] h-[80vh] sm:h-[600px] rounded-t-3xl sm:rounded-3xl shadow-2xl flex flex-col pointer-events-auto animate-slide-up sm:animate-scale-up overflow-hidden border border-slate-100 relative z-50 transition-all transform">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-white z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 ring-2 ring-white shadow-sm">
              <User className="w-5 h-5"/>
            </div>
            <div>
              <h3 className="font-bold text-slate-900 leading-tight">{driverName}</h3>
              <p className="text-xs text-green-600 font-bold flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.5)]"></span> Online
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-400 hover:text-black">
            <X className="w-5 h-5"/>
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scrollbar-thin scrollbar-thumb-slate-200">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-xs gap-3 opacity-60">
              <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-1">
                <Send className="w-6 h-6 text-slate-300 ml-1" />
              </div>
              <p>Start a conversation with your driver.</p>
            </div>
          )}
          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'} animate-fade-in`}>
              <div 
                className={`max-w-[75%] p-3 px-4 rounded-2xl text-sm shadow-sm relative group transition-all ${
                  msg.is_mine 
                    ? 'bg-black text-white rounded-br-none hover:bg-slate-900' 
                    : 'bg-white border border-slate-100 text-slate-800 rounded-bl-none hover:shadow-md'
                }`}
              >
                {msg.content}
                {msg.is_mine && (
                  <div className="absolute -bottom-4 right-0 opacity-70 scale-75">
                     {msg.is_read ? <CheckCheck className="w-4 h-4 text-blue-500"/> : <Check className="w-4 h-4 text-slate-400"/>}
                  </div>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        <div className="bg-white px-4 pt-3 pb-2 flex gap-2 overflow-x-auto no-scrollbar border-t border-slate-50">
          {SUGGESTED_MESSAGES.map((msg, i) => (
            <button 
              key={i}
              onClick={() => handleSend(msg)}
              className="whitespace-nowrap px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-bold rounded-full transition-colors border border-slate-200"
            >
              {msg}
            </button>
          ))}
        </div>

        {/* Input */}
        <form onSubmit={handleFormSubmit} className="p-4 bg-white border-t border-slate-100 flex gap-3 items-center pb-6 sm:pb-4">
          <input 
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..." 
            className="flex-1 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-black/5 focus:border-black outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-black text-white p-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 disabled:hover:bg-black transition-all flex items-center justify-center shadow-lg shadow-black/10 active:scale-95"
          >
            <Send className="w-5 h-5 ml-0.5"/>
          </button>
        </form>
      </div>
    </div>
  );
}