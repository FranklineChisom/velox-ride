export type UserRole = 'passenger' | 'driver' | 'employee' | 'manager' | 'superadmin';
// Added 'GUARANTOR_DETAILS' to the flow
export type OnboardingStep = 'PROFILE_DETAILS' | 'PHONE_VERIFICATION' | 'IDENTITY_VERIFICATION' | 'VEHICLE_DETAILS' | 'GUARANTOR_DETAILS' | 'DOCUMENTS_UPLOAD' | 'AWAITING_APPROVAL' | 'COMPLETED';
export type DocStatus = 'missing' | 'pending' | 'verified' | 'rejected' | 'expired';

export interface Profile {
  id: string;
  email: string;
  role: UserRole;
  full_name: string | null;
  phone_number: string | null;
  phone_verified: boolean; 
  avatar_url?: string | null;
  
  // Compliance & State
  onboarding_step: OnboardingStep;
  is_verified: boolean; 
  is_suspended: boolean; 
  
  created_at: string;
  updated_at?: string;
  address?: string;
  is_online: boolean; 
  
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
}

export interface Vehicle {
  id: string;
  driver_id: string;
  make: string;
  model: string;
  year: string;
  color: string;
  plate_number: string;
  is_active: boolean; 
  inspection_status: DocStatus;
}

export interface ComplianceRecord {
  id: string;
  user_id: string;
  document_type: 'drivers_license' | 'vehicle_insurance' | 'road_worthiness' | 'nin_slip' | 'background_check_consent';
  document_url: string; 
  status: DocStatus;
  expiry_date?: string;
  rejection_reason?: string;
  reviewed_by?: string; 
  updated_at: string;
}

// NEW: Guarantor Table
export interface Guarantor {
  id: string;
  driver_id: string;
  full_name: string;
  phone_number: string;
  relationship: string;
  address: string;
  is_verified: boolean;
}

// Helper type for the Review Dashboard
export interface DriverApplication {
  profile: Profile;
  vehicle: Vehicle | null;
  guarantor: Guarantor | null;
  documents: ComplianceRecord[];
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
  actual_start_time?: string;
  actual_end_time?: string;
  created_at: string;
  profiles?: Profile;
  bookings?: Booking[];
}

export interface Booking {
  id: string;
  ride_id: string;
  passenger_id: string;
  seats_booked: number;
  status: 'confirmed' | 'cancelled' | 'pending_payment' | 'completed';
  payment_method: 'card' | 'wallet' | 'cash';
  payment_status: 'paid' | 'pending' | 'failed';
  payment_reference?: string;
  created_at: string;
  profiles?: Profile; 
  rides?: Ride;
}

export interface RideWithBookings extends Ride {
  bookings: (Booking & {
    profiles: Profile; 
  })[];
}

export interface BookingWithRide extends Booking {
  rides: Ride & {
    profiles: Profile; 
  };
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

export interface SavedPlace {
  id: string;
  user_id: string;
  label: string;
  address: string;
  lat: number;
  lng: number;
}

export interface SearchHistoryItem {
  id: string;
  user_id: string;
  origin_name?: string;
  destination_name: string;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  created_at: string;
}

export interface Message {
  id: string;
  booking_id: string;
  sender_id: string;
  content: string;
  is_read: boolean;
  created_at: string;
}

export interface EmergencyContact {
  id: string;
  user_id: string;
  name: string;
  phone_number: string;
  relationship: string;
}