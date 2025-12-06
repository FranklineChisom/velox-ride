import { RoutingStats } from './osm';

export const PRICING_CONFIG = {
  baseFare: 500,
  costPerKm: 150,
  costPerMinute: 30,
  bookingFee: 200,
  minimumFare: 1000,
  surgeMultiplier: 1 // Dynamic in future
};

export function calculateFare(stats: RoutingStats | null, multiplier: number = 1): number {
  if (!stats) return 0;

  const distanceKm = stats.distanceMeters / 1000;
  const durationMins = stats.durationSeconds / 60;

  const distanceCost = distanceKm * PRICING_CONFIG.costPerKm;
  const timeCost = durationMins * PRICING_CONFIG.costPerMinute;
  
  let total = PRICING_CONFIG.baseFare + distanceCost + timeCost + PRICING_CONFIG.bookingFee;
  
  // Apply Class Multiplier
  total = total * multiplier;

  // Ensure Minimum Fare
  return Math.max(Math.round(total / 100) * 100, PRICING_CONFIG.minimumFare);
}