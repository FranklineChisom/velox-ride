import { Coordinates } from '@/types';
import { differenceInMinutes, isBefore, addMinutes } from 'date-fns';

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

/**
 * WORLD CLASS MATCHING ALGORITHM
 * Hierarchy:
 * 1. Availability (Filtered before this function)
 * 2. Location (Pickup Proximity is King)
 * 3. Time (Must be relevant)
 * 4. Dropoff (Flexible)
 */
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

  // 1. SPATIAL ANALYSIS
  // ---------------------------------------------------------
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

  // 2. TEMPORAL ANALYSIS
  // ---------------------------------------------------------
  const rideTime = new Date(ride.departure_time);
  const now = new Date();
  
  // Check if ride is in the past (allowing 15 min buffer for "just missed/late start")
  if (isBefore(rideTime, addMinutes(now, -15))) {
    analysis.isPast = true;
    analysis.tier = 'NONE';
    analysis.reason = 'Ride already departed';
    return analysis;
  }

  if (userTime) {
     analysis.timeDifference = Math.abs(differenceInMinutes(rideTime, userTime));
  } else {
     // If no specific time requested, compare to NOW to prioritize immediate rides
     analysis.timeDifference = differenceInMinutes(rideTime, now);
  }

  // 3. THE DECISION ENGINE
  // ---------------------------------------------------------
  
  // GATEKEEPER: Distance
  // If pickup is > 10km away, it's a different region. Irrelevant.
  if (analysis.pickupDistance > 10) {
      analysis.tier = 'NONE';
      analysis.reason = 'Pickup too far';
      return analysis;
  }

  // BASE SCORE: 100
  let score = 100;

  // Penalties
  score -= (analysis.pickupDistance * 10); // Heavy penalty for pickup distance
  score -= (analysis.dropoffDistance * 3); // Moderate penalty for dropoff
  score -= (analysis.timeDifference / 5);  // 1 point per 5 mins off

  // Boosters
  if (ride.profiles?.is_verified) score += 5;
  if (ride.price_per_seat < 5000) score += 2; // Small boost for affordability

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
      score -= 20; // Significant penalty for being "Regional" only
  }

  // Cap Score
  analysis.score = Math.max(0, Math.min(100, score));

  return analysis;
};