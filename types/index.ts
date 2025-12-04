// Centralized type definitions

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: 'passenger' | 'driver';
  created_at: string;
}

export interface Ride {
  id: string;
  driver_id: string;
  origin: string;
  destination: string;
  departure_time: string;
  total_seats: number;
  price_per_seat: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  profiles?: Profile; // For joining driver details
}

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: 'confirmed' | 'cancelled';
  rides?: Ride; // For joining ride details
  created_at: string;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  created_at: string;
}

export interface SavedPlace {
  id: string;
  user_id: string;
  label: string;
  address: string;
  lat?: number;
  lng?: number;
}

// Location & Maps
export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Suggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
}

export interface SearchHistoryItem {
  id: string;
  destination_name: string;
  origin_name?: string;
  origin_lat?: number;
  origin_lng?: number;
  destination_lat?: number;
  destination_lng?: number;
  created_at?: string;
}