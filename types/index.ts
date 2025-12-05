export type UserRole = 'passenger' | 'driver' | 'employee' | 'manager' | 'superadmin';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  phone_number: string | null;
  avatar_url?: string | null;
  role: UserRole;
  is_verified: boolean;
  is_online: boolean; // Driver specific status
  
  // Driver specifics
  vehicle_model?: string | null;
  vehicle_year?: string | null;
  vehicle_plate?: string | null;
  vehicle_color?: string | null;
  
  // Preferences
  preferences?: {
    notifications_enabled: boolean;
    email_updates: boolean;
  };
  
  created_at: string;
  updated_at?: string;
}

export interface Ride {
  id: string;
  driver_id: string;
  origin: string;
  destination: string;
  origin_lat: number;
  origin_lng: number;
  destination_lat: number;
  destination_lng: number;
  departure_time: string;
  total_seats: number;
  price_per_seat: number;
  status: 'scheduled' | 'active' | 'completed' | 'cancelled';
  driver_arrived: boolean;
  created_at: string;
  
  // Joins
  profiles?: Profile;
  bookings?: Booking[];
}

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: 'confirmed' | 'cancelled' | 'pending_payment';
  payment_method: 'card' | 'wallet' | 'cash';
  payment_status: 'paid' | 'pending' | 'failed';
  payment_reference?: string;
  created_at: string;
  
  // Joins
  profiles?: Profile; // Passenger details
  rides?: Ride;
}

export interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  wallet_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description: string;
  status: 'success' | 'failed' | 'pending';
  reference: string;
  created_at: string;
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