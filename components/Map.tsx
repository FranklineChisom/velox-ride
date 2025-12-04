'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

const iconUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png';
const iconRetinaUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png';
const shadowUrl = 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png';

const customIcon = new L.Icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

interface Coordinates {
  lat: number;
  lng: number;
}

interface MapProps {
  pickup?: Coordinates;
  dropoff?: Coordinates;
  routeCoordinates?: [number, number][];
  onPickupSelect?: (coords: Coordinates) => void;
  onDropoffSelect?: (coords: Coordinates) => void;
  selectionMode?: 'pickup' | 'dropoff' | null;
}

function LocationSelector({ onSelect }: { onSelect: (coords: Coordinates) => void }) {
  useMapEvents({
    click(e) {
      onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

function MapUpdater({ pickup, dropoff }: { pickup?: Coordinates; dropoff?: Coordinates }) {
  const map = useMap();
  useEffect(() => {
    if (pickup && dropoff) {
      const bounds = L.latLngBounds([
        [pickup.lat, pickup.lng],
        [dropoff.lat, dropoff.lng],
      ]);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else if (pickup) {
      map.flyTo([pickup.lat, pickup.lng], 14);
    }
  }, [pickup, dropoff, map]);
  return null;
}

export default function Map({ pickup, dropoff, routeCoordinates, onPickupSelect, onDropoffSelect, selectionMode }: MapProps) {
  const defaultCenter = { lat: 9.0765, lng: 7.3986 }; // Abuja

  return (
    // 'map-dark-mode' class triggers CSS filters in globals.css for the midnight look
    <div className="h-full w-full rounded-none overflow-hidden z-0 relative map-dark-mode bg-[#020617]">
      <MapContainer
        center={[defaultCenter.lat, defaultCenter.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <TileLayer
          attribution='&copy; OSM contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {selectionMode === 'pickup' && onPickupSelect && (
          <LocationSelector onSelect={onPickupSelect} />
        )}
        {selectionMode === 'dropoff' && onDropoffSelect && (
          <LocationSelector onSelect={onDropoffSelect} />
        )}

        {pickup && (
          <Marker position={[pickup.lat, pickup.lng]} icon={customIcon}>
            <Popup>Pickup Location</Popup>
          </Marker>
        )}

        {dropoff && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={customIcon}>
            <Popup>Dropoff Location</Popup>
          </Marker>
        )}

        {routeCoordinates && (
          // Gold route line
          <Polyline positions={routeCoordinates} color="#E2B93B" weight={5} opacity={0.8} />
        )}

        <MapUpdater pickup={pickup} dropoff={dropoff} />
      </MapContainer>
      
      {selectionMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-velox-navy border border-velox-gold text-white px-4 py-2 rounded-full text-sm font-bold shadow-xl animate-bounce">
          Tap map to select {selectionMode}
        </div>
      )}
    </div>
  );
}