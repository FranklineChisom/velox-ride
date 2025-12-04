'use client';
import { useState } from 'react';
import { Star, X, MessageSquare, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { useToast } from '@/components/ui/ToastProvider';
import { useRouter } from 'next/navigation';

interface Props {
  rideId: string;
  driverId: string;
  driverName: string;
  driverAvatar?: string;
  onClose: () => void;
}

export default function ReviewModal({ rideId, driverId, driverName, driverAvatar, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();
  const { addToast } = useToast();
  const router = useRouter();

  const handleSubmit = async () => {
    if (rating === 0) {
      addToast('Please select a star rating', 'error');
      return;
    }
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    try {
        const { error } = await supabase.from('reviews').insert({
            ride_id: rideId,
            reviewer_id: user.id,
            reviewee_id: driverId,
            rating,
            comment
        });

        if (error) throw error;

        addToast('Review submitted successfully!', 'success');
        onClose();
        router.push('/passenger/trips'); // Redirect to trips after rating
    } catch (err: any) {
        addToast(err.message || 'Failed to submit review', 'error');
    } finally {
        setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[2000] flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative animate-scale-up shadow-2xl">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black p-2 bg-slate-50 rounded-full transition">
            <X className="w-5 h-5"/>
        </button>
        
        <div className="flex flex-col items-center mb-6">
            <div className="w-20 h-20 bg-slate-100 rounded-full mb-4 overflow-hidden border-4 border-white shadow-lg relative">
                {driverAvatar ? (
                    <img src={driverAvatar} alt={driverName} className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center font-bold text-2xl text-slate-400">
                        {driverName?.[0]}
                    </div>
                )}
            </div>
            <h3 className="text-2xl font-bold text-slate-900 text-center">Rate your trip</h3>
            <p className="text-slate-500 text-sm text-center">How was your ride with {driverName.split(' ')[0]}?</p>
        </div>
        
        <div className="flex justify-center gap-3 mb-8">
          {[1, 2, 3, 4, 5].map((star) => (
            <button 
                key={star} 
                onClick={() => setRating(star)} 
                className="transition hover:scale-110 focus:outline-none"
            >
              <Star 
                className={`w-10 h-10 transition-colors ${
                    star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-200 hover:text-yellow-200'
                }`} 
              />
            </button>
          ))}
        </div>

        <div className="relative mb-6">
            <MessageSquare className="absolute top-3.5 left-3.5 w-5 h-5 text-slate-400" />
            <textarea 
                className="w-full bg-slate-50 p-3 pl-11 rounded-2xl text-sm border border-slate-200 outline-none focus:border-black focus:ring-1 focus:ring-black transition h-28 resize-none"
                placeholder="Leave a comment (optional)..."
                value={comment}
                onChange={e => setComment(e.target.value)}
            />
        </div>

        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className="w-full bg-black text-white py-4 rounded-xl font-bold hover:bg-slate-800 transition disabled:opacity-70 flex items-center justify-center gap-2 shadow-xl"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin"/> : 'Submit Review'}
        </button>
        
        <button onClick={onClose} className="w-full text-center mt-4 text-xs font-bold text-slate-400 hover:text-slate-600">
            Skip Feedback
        </button>
      </div>
    </div>
  );
}