// Centralized type definitions

export type UserRole = 'passenger' | 'driver' | 'employee' | 'superadmin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: UserRole;
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
  // Foreign key relations might not be present in the raw table type, 
  // but we handle them in the Join types below.
}

// Type for a Ride that includes the Driver's profile details
export interface RideWithDriver extends Ride {
  profiles: Pick<Profile, 'full_name' | 'phone_number'> | null;
}

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: 'confirmed' | 'cancelled';
  created_at: string;
}

// Type for a Booking that includes the Ride details
export interface BookingWithRide extends Booking {
  rides: Ride | null;
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