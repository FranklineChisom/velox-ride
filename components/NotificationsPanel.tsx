'use client';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase';
import { Bell, Check, Loader2 } from 'lucide-react';
import { format } from 'date-fns';

export default function NotificationsPanel() {
  const supabase = createClient();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    const channel = supabase.channel('notifications')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, 
        (payload) => {
          setNotifications(prev => [payload.new, ...prev]);
          setUnreadCount(prev => prev + 1);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const fetchNotifications = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10);
    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter(n => !n.is_read).length);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    await supabase.from('notifications').update({ is_read: true }).eq('id', id);
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  return (
    <div className="relative">
      <button onClick={() => setIsOpen(!isOpen)} className="p-2 relative hover:bg-slate-100 rounded-full transition">
        <Bell className="w-5 h-5 text-slate-600"/>
        {unreadCount > 0 && <span className="absolute top-1.5 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
      </button>
      {isOpen && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setIsOpen(false)}></div>
          <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden animate-slide-up">
             <div className="p-4 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-bold text-sm text-slate-900">Notifications</h3>
                {unreadCount > 0 && <span className="text-[10px] bg-black text-white px-2 py-0.5 rounded-full">{unreadCount} New</span>}
             </div>
             <div className="max-h-[300px] overflow-y-auto">
                {loading ? <div className="p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-300"/></div> : notifications.length === 0 ? <div className="p-8 text-center text-slate-400 text-xs italic">No notifications yet.</div> : notifications.map(n => (
                      <div key={n.id} className={`p-4 border-b border-slate-50 hover:bg-slate-50 transition flex gap-3 ${!n.is_read ? 'bg-blue-50/30' : ''}`}>
                         <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.type === 'success' ? 'bg-green-500' : n.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></div>
                         <div className="flex-1"><p className="text-sm font-bold text-slate-800">{n.title}</p><p className="text-xs text-slate-500 mt-0.5 line-clamp-2">{n.message}</p><p className="text-[10px] text-slate-400 mt-1">{format(new Date(n.created_at), 'MMM dd, h:mm a')}</p></div>
                         {!n.is_read && <button onClick={() => markAsRead(n.id)} className="text-slate-300 hover:text-blue-600 self-start"><Check className="w-3 h-3"/></button>}
                      </div>
                   ))}
             </div>
          </div>
        </>
      )}
    </div>
  );
}