'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { APP_CONFIG, IMAGES } from '@/lib/constants';
import { Coordinates } from '@/types';

const customIcon = new L.Icon({
  iconUrl: IMAGES.mapMarkerIcon,
  iconRetinaUrl: IMAGES.mapMarkerIconRetina,
  shadowUrl: IMAGES.mapMarkerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});

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
  return (
    <div className="h-full w-full relative bg-velox-light">
      <MapContainer
        center={[APP_CONFIG.defaultCenter.lat, APP_CONFIG.defaultCenter.lng]}
        zoom={13}
        style={{ height: '100%', width: '100%', background: '#F8FAFC' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={IMAGES.mapTileLayer}
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
          // Gold Route Line for brand consistency
          <Polyline positions={routeCoordinates} color="#F59E0B" weight={5} opacity={0.8} />
        )}

        <MapUpdater pickup={pickup} dropoff={dropoff} />
      </MapContainer>
      
      {selectionMode && (
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-[1000] bg-velox-black text-white px-6 py-2.5 rounded-full text-sm font-semibold shadow-xl animate-bounce">
          Tap map to select {selectionMode}
        </div>
      )}
    </div>
  );
}