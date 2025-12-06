'use client';

import { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { APP_CONFIG, IMAGES } from '@/lib/constants';
import { Coordinates } from '@/types';

// --- Custom Icons for High-Fidelity UI ---

const pickupIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-black.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const dropoffIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// "Ghost Car" icon for simulated liquidity
const carIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3202/3202926.png', 
  iconSize: [32, 32],
  iconAnchor: [16, 16],
  className: 'transition-all duration-1000 ease-linear' // CSS transition for smooth movement
});

interface MapProps {
  pickup?: Coordinates;
  dropoff?: Coordinates;
  driverLocation?: Coordinates;
  ghostDrivers?: Coordinates[]; 
  routeCoordinates?: [number, number][];
  onPickupSelect?: (coords: Coordinates) => void;
  onDropoffSelect?: (coords: Coordinates) => void;
  selectionMode?: 'pickup' | 'dropoff' | null;
  interactive?: boolean;
}

// Handle map clicks for location selection
function LocationSelector({ onSelect }: { onSelect: (coords: Coordinates) => void }) {
  useMapEvents({
    click(e) {
      if (e && e.latlng) {
        onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

// Handle Map View Updates - Smart Auto-Zoom
function MapUpdater({ pickup, dropoff, driverLocation, routeCoordinates }: any) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const points: L.LatLngExpression[] = [];
    if (pickup?.lat) points.push([pickup.lat, pickup.lng]);
    if (dropoff?.lat) points.push([dropoff.lat, dropoff.lng]);
    if (driverLocation?.lat) points.push([driverLocation.lat, driverLocation.lng]);

    // Priority 1: Fit Route if it exists (Show context of trip)
    if (routeCoordinates && routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      map.fitBounds(bounds, { padding: [50, 50], animate: true });
      return;
    }

    // Priority 2: Fit Points (Pickup + Dropoff context)
    if (points.length > 0) {
      const bounds = L.latLngBounds(points);
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [100, 100], maxZoom: 16, animate: true });
      }
    }
  }, [pickup, dropoff, driverLocation, routeCoordinates, map]);

  return null;
}

export default function Map({ 
  pickup, 
  dropoff, 
  driverLocation, 
  ghostDrivers = [], 
  routeCoordinates, 
  onPickupSelect, 
  onDropoffSelect, 
  selectionMode,
  interactive = true
}: MapProps) {
  
  return (
    <div className="h-full w-full relative bg-slate-100 z-0">
      <MapContainer
        center={[APP_CONFIG.defaultCenter.lat, APP_CONFIG.defaultCenter.lng]}
        zoom={14}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={false} 
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {/* Selection Handlers */}
        {(selectionMode === 'pickup' && onPickupSelect) && <LocationSelector onSelect={onPickupSelect} />}
        {(selectionMode === 'dropoff' && onDropoffSelect) && <LocationSelector onSelect={onDropoffSelect} />}

        {/* Pickup Marker */}
        {pickup && pickup.lat && (
          <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon} zIndexOffset={100}>
            <Popup className="font-sans font-bold">Pickup Location</Popup>
          </Marker>
        )}

        {/* Dropoff Marker */}
        {dropoff && dropoff.lat && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={dropoffIcon} zIndexOffset={90}>
            <Popup className="font-sans font-bold">Destination</Popup>
          </Marker>
        )}

        {/* Real Driver (If assigned) */}
        {driverLocation && driverLocation.lat && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={carIcon} zIndexOffset={1000}>
            <Popup className="font-sans">Your Driver</Popup>
          </Marker>
        )}

        {/* Ghost Drivers (Background Availability) */}
        {ghostDrivers.map((ghost, idx) => (
          <Marker 
            key={`ghost-${idx}`} 
            position={[ghost.lat, ghost.lng]} 
            icon={carIcon} 
            opacity={0.6}
          />
        ))}

        {/* Route Line */}
        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline 
            positions={routeCoordinates} 
            color="#020617" // Brand Black
            weight={4} 
            opacity={0.8} 
            lineCap="round"
            lineJoin="round"
          />
        )}

        <MapUpdater pickup={pickup} dropoff={dropoff} driverLocation={driverLocation} routeCoordinates={routeCoordinates} />
      </MapContainer>
    </div>
  );
}