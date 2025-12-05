import { SmartRideResult } from '@/hooks/useSmartSearch';
import { User, ArrowLeft, Clock, Star, MapPin, Users, Car } from 'lucide-react';
import { format } from 'date-fns';
import { APP_CONFIG } from '@/lib/constants';

interface Props {
  ride: SmartRideResult;
  isSelected: boolean;
  onSelect: () => void;
}

export default function RideResultCard({ ride, isSelected, onSelect }: Props) {
  
  const getBadge = () => {
    switch (ride.match.tier) {
        case 'PERFECT':
            return <div className="bg-green-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm animate-pulse"><Star className="w-3 h-3 fill-current"/> PERFECT MATCH</div>;
        case 'EXCELLENT':
            return <div className="bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm"><Star className="w-3 h-3"/> EXCELLENT</div>;
        case 'GOOD':
            return <div className="bg-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm"><MapPin className="w-3 h-3"/> GOOD OPTION</div>;
        case 'REGIONAL':
            return <div className="bg-slate-500 text-white text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-sm"><MapPin className="w-3 h-3"/> IN REGION</div>;
        default: return null;
    }
  };

  return (
    <div 
      onClick={onSelect}
      className={`relative bg-white p-5 rounded-2xl border transition-all cursor-pointer group shadow-sm hover:shadow-md ${isSelected ? 'border-black ring-1 ring-black' : 'border-slate-100'}`}
    >
      <div className="absolute -top-3 left-4 z-10">
         {getBadge()}
      </div>

      <div className="flex justify-between items-start mb-4 mt-2">
          <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-slate-100 rounded-full overflow-hidden border-2 border-white shadow-sm flex items-center justify-center">
                  {ride.profiles?.avatar_url ? <img src={ride.profiles.avatar_url} className="w-full h-full object-cover" alt="Driver"/> : <User className="w-5 h-5 text-slate-400"/>}
              </div>
              <div>
                  <div className="flex items-center gap-1">
                      <h4 className="font-bold text-slate-900 text-sm">{ride.profiles?.full_name?.split(' ')[0]}</h4>
                      {ride.profiles?.is_verified && <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white" title="Verified"><ArrowLeft className="w-2.5 h-2.5 rotate-180"/></div>}
                  </div>
                  <p className="text-xs text-slate-500 font-medium">{ride.profiles?.vehicle_model} • {ride.profiles?.vehicle_color}</p>
              </div>
          </div>
          <div className="text-right">
              <p className="font-bold text-xl text-slate-900">{APP_CONFIG.currency}{ride.price_per_seat}</p>
              <p className="text-[10px] font-bold text-slate-400 uppercase">{ride.match.reason}</p>
          </div>
      </div>

      <div className="bg-slate-50 p-3 rounded-xl flex items-center justify-between text-xs mb-3 border border-slate-100">
          <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-slate-400"/>
              <span className={`font-bold ${Math.abs(ride.match.timeDifference) > 60 ? 'text-orange-600' : 'text-slate-700'}`}>
                  {format(new Date(ride.departure_time), 'h:mm a')}
              </span>
              <span className="text-slate-300">|</span>
              <span className="text-slate-500">{format(new Date(ride.departure_time), 'MMM dd')}</span>
          </div>
          <div className="flex items-center gap-1 font-bold text-slate-700">
              <Users className="w-3 h-3"/> {ride.availableSeats} seats left
          </div>
      </div>

      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
          <div className="w-1.5 h-1.5 bg-black rounded-full"></div>
          <span className="truncate max-w-[40%] text-slate-700">{ride.origin}</span>
          <div className="h-px w-4 bg-slate-300"></div>
          <div className="w-1.5 h-1.5 bg-slate-400 rounded-sm"></div>
          <span className="truncate max-w-[40%] text-slate-700">{ride.destination}</span>
      </div>
      
      {/* Real-Time Context or Distance Fallback */}
      {ride.realDrivingTime ? (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-blue-700 bg-blue-50 p-2 rounded-lg font-bold">
             <Car className="w-3 h-3"/>
             Pickup is {ride.realDrivingTime} min ({ride.realDrivingDistance?.toFixed(1)}km) drive away.
          </div>
      ) : ride.match.pickupDistance > 2 && (
          <div className="mt-3 flex items-center gap-2 text-[10px] text-orange-600 bg-orange-50 p-2 rounded-lg font-medium">
             <MapPin className="w-3 h-3"/>
             Pickup is approx {ride.match.pickupDistance.toFixed(1)}km away (Straight line).
          </div>
      )}
    </div>
  );
}