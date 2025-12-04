'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { APP_CONFIG, IMAGES } from '@/lib/constants';
import { Coordinates } from '@/types';

// Standard Marker
const customIcon = new L.Icon({
  iconUrl: IMAGES.mapMarkerIcon,
  iconRetinaUrl: IMAGES.mapMarkerIconRetina,
  shadowUrl: IMAGES.mapMarkerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
});

// Driver/Car Marker (Using a distinct visual if available, otherwise reuse with distinct popup)
// For a car icon, we'd typically import a specific asset. Using a slightly modified standard icon for now.
const driverIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/75/75780.png', // Simple Car Icon
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  popupAnchor: [0, -10],
  className: 'driver-marker'
});

interface MapProps {
  pickup?: Coordinates;
  dropoff?: Coordinates;
  driverLocation?: Coordinates; // New Prop
  routeCoordinates?: [number, number][];
  onPickupSelect?: (coords: Coordinates) => void;
  onDropoffSelect?: (coords: Coordinates) => void;
  selectionMode?: 'pickup' | 'dropoff' | null;
}

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

function MapUpdater({ pickup, dropoff, driverLocation, routeCoordinates }: { pickup?: Coordinates; dropoff?: Coordinates; driverLocation?: Coordinates; routeCoordinates?: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    const points: L.LatLngExpression[] = [];
    if (pickup && pickup.lat) points.push([pickup.lat, pickup.lng]);
    if (dropoff && dropoff.lat) points.push([dropoff.lat, dropoff.lng]);
    if (driverLocation && driverLocation.lat) points.push([driverLocation.lat, driverLocation.lng]);

    // 1. Priority: Fit Route if available
    if (routeCoordinates && routeCoordinates.length > 0) {
      const bounds = L.latLngBounds(routeCoordinates);
      // Extend bounds to include driver if visible
      if (driverLocation) bounds.extend([driverLocation.lat, driverLocation.lng]);
      
      if (bounds.isValid()) {
        map.fitBounds(bounds, { padding: [80, 80], animate: true });
      }
      return;
    }

    // 2. Fit points bounds
    if (points.length > 1) {
      const bounds = L.latLngBounds(points);
      if (bounds.isValid()) {
          map.fitBounds(bounds, { padding: [80, 80], maxZoom: 15, animate: true });
      }
      return;
    } 
    
    // 3. Fly to single point
    if (points.length === 1) {
      map.flyTo(points[0] as L.LatLngTuple, 16, { animate: true, duration: 1.5 });
    }
  }, [pickup, dropoff, driverLocation, routeCoordinates, map]);

  return null;
}

export default function Map({ pickup, dropoff, driverLocation, routeCoordinates, onPickupSelect, onDropoffSelect, selectionMode }: MapProps) {
  return (
    <div className="h-full w-full relative bg-slate-50 z-0">
      <MapContainer
        center={[APP_CONFIG.defaultCenter.lat, APP_CONFIG.defaultCenter.lng]}
        zoom={12}
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
          url={IMAGES.mapTileLayer}
        />

        {(selectionMode === 'pickup' && onPickupSelect) && <LocationSelector onSelect={onPickupSelect} />}
        {(selectionMode === 'dropoff' && onDropoffSelect) && <LocationSelector onSelect={onDropoffSelect} />}

        {pickup && pickup.lat && (
          <Marker position={[pickup.lat, pickup.lng]} icon={customIcon}>
            <Popup>Pickup Point</Popup>
          </Marker>
        )}

        {dropoff && dropoff.lat && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={customIcon}>
            <Popup>Destination</Popup>
          </Marker>
        )}

        {driverLocation && driverLocation.lat && (
          <Marker position={[driverLocation.lat, driverLocation.lng]} icon={driverIcon} zIndexOffset={1000}>
            <Popup>Driver</Popup>
          </Marker>
        )}

        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#000000" weight={4} opacity={0.7} />
        )}

        <MapUpdater pickup={pickup} dropoff={dropoff} driverLocation={driverLocation} routeCoordinates={routeCoordinates} />
      </MapContainer>
    </div>
  );
}