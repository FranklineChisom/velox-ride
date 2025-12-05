import { Coordinates } from '@/types';
import { differenceInMinutes, isBefore, addMinutes } from 'date-fns';

// --- Utilities ---
export function deg2rad(deg: number) {
  return deg * (Math.PI / 180);
}

export function getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the earth in km
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// --- Types ---
export type MatchTier = 'PERFECT' | 'EXCELLENT' | 'GOOD' | 'REGIONAL' | 'NONE';

export interface MatchAnalysis {
  tier: MatchTier;
  score: number;
  pickupDistance: number;
  dropoffDistance: number;
  timeDifference: number;
  isPast: boolean;
  reason: string;
}

// --- The Algorithm ---
export const analyzeRideMatch = (
  ride: any,
  userCoords: { pickup?: Coordinates; dropoff?: Coordinates },
  userTime?: Date
): MatchAnalysis => {
  const analysis: MatchAnalysis = {
    tier: 'NONE',
    score: 0,
    pickupDistance: 9999,
    dropoffDistance: 9999,
    timeDifference: 0,
    isPast: false,
    reason: ''
  };

  // 1. Spatial Analysis
  if (userCoords.pickup && ride.origin_lat && ride.origin_lng) {
     analysis.pickupDistance = getDistanceFromLatLonInKm(
        userCoords.pickup.lat, userCoords.pickup.lng,
        ride.origin_lat, ride.origin_lng
     );
  }

  if (userCoords.dropoff && ride.destination_lat && ride.destination_lng) {
     analysis.dropoffDistance = getDistanceFromLatLonInKm(
        userCoords.dropoff.lat, userCoords.dropoff.lng,
        ride.destination_lat, ride.destination_lng
     );
  }

  // 2. Temporal Analysis
  const rideTime = new Date(ride.departure_time);
  const now = new Date();
  
  if (isBefore(rideTime, addMinutes(now, -15))) {
    analysis.isPast = true;
    analysis.tier = 'NONE';
    analysis.reason = 'Ride already departed';
    return analysis;
  }

  if (userTime) {
     analysis.timeDifference = Math.abs(differenceInMinutes(rideTime, userTime));
  } else {
     analysis.timeDifference = Math.abs(differenceInMinutes(rideTime, now)); // Prioritize immediate
  }

  // 3. Gating Logic (The "Hard Rules")
  if (analysis.pickupDistance > 20) {
      analysis.tier = 'NONE';
      analysis.reason = 'Too far away';
      return analysis;
  }

  // 4. Scoring & Classification
  let score = 100;

  // Penalties
  score -= (analysis.pickupDistance * 8); // Pickup distance hurts score most
  score -= (analysis.dropoffDistance * 3); 
  score -= (analysis.timeDifference / 5); 

  // Boosters
  if (ride.profiles?.is_verified) score += 5;
  if (ride.price_per_seat < 5000) score += 2;

  // Tier Assignment
  if (analysis.pickupDistance < 1 && analysis.timeDifference < 30) {
      analysis.tier = 'PERFECT';
      analysis.reason = 'Exact Match';
  } else if (analysis.pickupDistance < 3 && analysis.timeDifference < 60) {
      analysis.tier = 'EXCELLENT';
      analysis.reason = 'Great Option';
  } else if (analysis.pickupDistance < 5) {
      analysis.tier = 'GOOD';
      analysis.reason = 'Nearby Pickup';
  } else {
      analysis.tier = 'REGIONAL';
      analysis.reason = 'In your area';
      score -= 15; 
  }

  analysis.score = Math.max(0, Math.min(100, score));
  return analysis;
};