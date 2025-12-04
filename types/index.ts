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
}