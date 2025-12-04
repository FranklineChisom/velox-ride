// Centralized configuration and static assets

export const APP_CONFIG = {
  name: 'Veluxeride',
  currency: '₦',
  defaultCenter: { lat: 9.0765, lng: 7.3986 }, // Abuja
  // Safely access env var or fall back to empty string
  paystackPublicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY || '', 
};

export const LINKS = {
  appStore: "https://apps.apple.com/us/app/Veluxeride/id123456789",
  playStore: "https://play.google.com/store/apps/details?id=com.Veluxeride.app",
};

export const PAYMENT_METHODS = {
  CARD: 'card',
  WALLET: 'wallet',
  CASH: 'cash',
};

export const IMAGES = {
  hero: "https://images.unsplash.com/photo-1554223090-7e482851df45?q=80&w=2940&auto=format&fit=crop",
  phoneMockup: "https://images.unsplash.com/photo-1512428559087-560fa5db7df7?auto=format&fit=crop&q=80&w=800",
  driverHero: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=2940",
  passengerHero: "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070",
  safetyHero: "https://images.unsplash.com/photo-1549923746-c502d488b3ea?q=80&w=2071",
  authDriver: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&q=80&w=2000",
  authPassenger: "https://images.unsplash.com/photo-1556122071-e404eaedb77f?auto=format&fit=crop&q=80&w=2000",
  
  // UI Assets
  mapMarkerIcon: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  mapMarkerIconRetina: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  mapMarkerShadow: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
  mapTileLayer: "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
};

export const TEXT_CONTENT = {
  safetyBadgeTitle: "Safety Verified",
  safetyBadgeText: "Every trip is insured.",
  footerDesc: "Making urban transportation affordable, safe, and predictable for everyone in Nigeria.",
  copyright: "© 2025 Veluxeride Nigeria. All rights reserved.",
};

// --- Navigation Structures ---

export const NAV_LINKS = {
  main: [
    { label: 'Ride', href: '/ride' },
    { label: 'Drive', href: '/drive' },
    { label: 'Business', href: '/business' },
    { label: 'Safety', href: '/safety' },
  ],
  company: [
    { label: 'About us', href: '/about' },
    { label: 'Careers', href: '/careers' },
    { label: 'Press', href: '/press' },
  ],
  support: [
    { label: 'Help Center', href: '/help' },
    { label: 'Trust & Safety', href: '/safety' },
    { label: 'Terms of Service', href: '/terms' },
  ],
  legal: [
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
  ],
};

// Passenger Dashboard Nav
export const PASSENGER_NAV = [
  { label: 'Home', href: '/passenger', icon: 'Home' },
  { label: 'My Trips', href: '/passenger/trips', icon: 'Clock' },
  { label: 'Wallet', href: '/passenger/wallet', icon: 'CreditCard' },
  { label: 'Settings', href: '/passenger/settings', icon: 'Settings' },
  { label: 'Support', href: '/passenger/support', icon: 'HelpCircle' },
];

// Driver Dashboard Nav
export const DRIVER_NAV = [
  { label: 'Dashboard', href: '/driver', icon: 'Home' },
  { label: 'Trips', href: '/driver/trips', icon: 'Map' },
  { label: 'Earnings', href: '/driver/earnings', icon: 'DollarSign' },
  { label: 'Settings', href: '/driver/settings', icon: 'Settings' },
];

// Employee/Staff Nav
export const STAFF_NAV = [
  { label: 'Overview', href: '/staff', icon: 'LayoutDashboard' },
  { label: 'User Support', href: '/staff/users', icon: 'Users' },
  { label: 'Ride Monitor', href: '/staff/rides', icon: 'Activity' },
];

// Manager Nav
export const MANAGER_NAV = [
  { label: 'Dashboard', href: '/manager', icon: 'LayoutDashboard' },
  { label: 'User Management', href: '/manager', icon: 'Users' },
  { label: 'Ride Oversight', href: '/manager/rides', icon: 'Activity' },
];

// Superadmin Nav
export const ADMIN_NAV = [
  { label: 'Master View', href: '/admin', icon: 'Shield' },
  { label: 'Financials', href: '/admin/finance', icon: 'BarChart' },
  { label: 'Staff Management', href: '/admin/staff', icon: 'Briefcase' },
  { label: 'System Health', href: '/admin/system', icon: 'Server' },
];