'use client';
import { useState } from 'react';
import { Star, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';

interface Props {
  rideId: string;
  revieweeId: string; // The person being rated
  onClose: () => void;
}

export default function ReviewModal({ rideId, revieweeId, onClose }: Props) {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const supabase = createClient();

  const handleSubmit = async () => {
    if (rating === 0) return alert("Please select a rating");
    setLoading(true);
    
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from('reviews').insert({
      ride_id: rideId,
      reviewer_id: user.id,
      reviewee_id: revieweeId,
      rating,
      comment
    });

    if (error) alert(error.message);
    else {
      alert("Thanks for your feedback!");
      onClose();
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl p-8 max-w-sm w-full relative animate-scale-up">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-black"><X className="w-5 h-5"/></button>
        <h3 className="text-2xl font-bold text-center mb-2">Rate your trip</h3>
        <p className="text-center text-slate-500 text-sm mb-6">How was your experience?</p>
        
        <div className="flex justify-center gap-2 mb-6">
          {[1, 2, 3, 4, 5].map((star) => (
            <button key={star} onClick={() => setRating(star)} className="transition hover:scale-110">
              <Star className={`w-8 h-8 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-slate-300'}`} />
            </button>
          ))}
        </div>

        <textarea 
          className="w-full bg-slate-50 p-4 rounded-xl text-sm border border-slate-100 outline-none focus:border-black mb-4 h-24 resize-none"
          placeholder="Leave a comment (optional)..."
          value={comment}
          onChange={e => setComment(e.target.value)}
        />

        <button 
          onClick={handleSubmit} 
          disabled={loading}
          className="w-full bg-black text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition"
        >
          {loading ? 'Submitting...' : 'Submit Review'}
        </button>
      </div>
    </div>
  );
}