export type UserRole = 'passenger' | 'driver' | 'employee' | 'manager' | 'superadmin';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  address?: string; // New field
  role: UserRole;
  is_verified: boolean;
  avatar_url?: string;
  preferences?: {
    email_updates: boolean;
    sms_notifications: boolean;
    security_alerts: boolean;
  };
  license_number?: string;
  vehicle_model?: string;
  vehicle_year?: string;
  vehicle_plate?: string;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  relationship: string;
}

export interface Review {
  id: string;
  ride_id?: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string;
  created_at: string;
  profiles?: Profile; // reviewer details
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
}

export interface RideWithDriver extends Ride {
  profiles: Pick<Profile, 'full_name' | 'phone_number' | 'is_verified' | 'avatar_url'> | null;
}

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: 'confirmed' | 'cancelled' | 'pending_payment';
  payment_method: 'card' | 'wallet' | 'cash';
  payment_status: 'paid' | 'pending';
  payment_reference?: string;
  created_at: string;
}

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
  reference?: string;
  status: 'success' | 'failed' | 'pending';
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