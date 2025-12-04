'use client';
import { useState } from 'react';
import { Calendar, MapPin, Clock, ArrowUpRight, AlertCircle } from 'lucide-react';
import { APP_CONFIG } from '@/lib/constants';

export default function TripsPage() {
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed' | 'cancelled'>('completed');

  // Mock data - replace with Supabase fetch
  const trips = [
    {
      id: 'TR-88392',
      date: 'Dec 02, 2025',
      time: '08:30 AM',
      origin: 'Gwarinpa Estate',
      destination: 'Wuse 2, Abuja',
      price: 1200,
      status: 'completed',
      driver: 'Emmanuel O.',
    },
    {
      id: 'TR-88102',
      date: 'Nov 28, 2025',
      time: '05:15 PM',
      origin: 'Central Business District',
      destination: 'Maitama',
      price: 800,
      status: 'completed',
      driver: 'Sarah J.',
    },
    {
      id: 'TR-87001',
      date: 'Nov 15, 2025',
      time: '09:00 AM',
      origin: 'Airport Road',
      destination: 'Transcorp Hilton',
      price: 4500,
      status: 'cancelled',
      driver: 'N/A',
    }
  ];

  const filteredTrips = trips.filter(t => t.status === activeTab);

  return (
    <div className="p-6 lg:p-10 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">My Trips</h1>

      {/* Tabs */}
      <div className="flex p-1 bg-slate-100 rounded-xl w-fit mb-8">
        {['upcoming', 'completed', 'cancelled'].map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${
              activeTab === tab 
                ? 'bg-white text-black shadow-sm' 
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* List */}
      <div className="space-y-4">
        {filteredTrips.length === 0 ? (
          <div className="text-center py-20 border-2 border-dashed border-slate-100 rounded-3xl">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
              <Calendar className="w-8 h-8" />
            </div>
            <h3 className="text-slate-900 font-bold mb-1">No {activeTab} trips</h3>
            <p className="text-slate-500 text-sm">Your trip history will appear here.</p>
          </div>
        ) : (
          filteredTrips.map((trip) => (
            <div key={trip.id} className="bg-white border border-slate-100 rounded-2xl p-6 hover:border-black/10 hover:shadow-lg transition group cursor-pointer">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                
                {/* Time & Date */}
                <div className="flex items-start gap-4 min-w-[140px]">
                  <div className="bg-slate-50 p-3 rounded-xl text-slate-600">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900">{trip.date}</div>
                    <div className="text-xs text-slate-500 font-medium">{trip.time}</div>
                  </div>
                </div>

                {/* Route */}
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-2 h-2 bg-black rounded-full"></div>
                    <span className="text-sm font-semibold text-slate-700">{trip.origin}</span>
                  </div>
                  <div className="pl-[3px] border-l-2 border-slate-100 h-4 ml-[3px] mb-1"></div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-slate-400 rounded-sm"></div>
                    <span className="text-sm font-semibold text-slate-900">{trip.destination}</span>
                  </div>
                </div>

                {/* Price & Status */}
                <div className="text-right">
                  <div className="text-lg font-bold text-slate-900 mb-1">{APP_CONFIG.currency}{trip.price}</div>
                  <div className={`text-xs font-bold px-2 py-1 rounded-md inline-flex items-center gap-1 ${
                    trip.status === 'completed' ? 'bg-green-50 text-green-700' : 
                    trip.status === 'cancelled' ? 'bg-red-50 text-red-700' : 'bg-blue-50 text-blue-700'
                  }`}>
                    {trip.status === 'cancelled' && <AlertCircle className="w-3 h-3" />}
                    {trip.status.toUpperCase()}
                  </div>
                </div>

                <div className="hidden md:block">
                  <div className="w-8 h-8 rounded-full border border-slate-200 flex items-center justify-center text-slate-400 group-hover:border-black group-hover:text-black transition">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>

              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}