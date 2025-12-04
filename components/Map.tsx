'use client';

import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { APP_CONFIG, IMAGES } from '@/lib/constants';
import { Coordinates } from '@/types';

// Fix for default marker icons
const customIcon = new L.Icon({
  iconUrl: IMAGES.mapMarkerIcon,
  iconRetinaUrl: IMAGES.mapMarkerIconRetina,
  shadowUrl: IMAGES.mapMarkerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
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
      if (e && e.latlng) {
        onSelect({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function MapUpdater({ pickup, dropoff }: { pickup?: Coordinates; dropoff?: Coordinates }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;

    if (pickup && dropoff) {
      // Valid check before bounds
      if (pickup.lat && pickup.lng && dropoff.lat && dropoff.lng) {
        const bounds = L.latLngBounds([
          [pickup.lat, pickup.lng],
          [dropoff.lat, dropoff.lng],
        ]);
        if (bounds.isValid()) {
            map.fitBounds(bounds, { padding: [50, 50], maxZoom: 15 });
        }
      }
    } else if (pickup && pickup.lat && pickup.lng) {
      map.flyTo([pickup.lat, pickup.lng], 15, { animate: true, duration: 1 });
    } else if (dropoff && dropoff.lat && dropoff.lng) {
      map.flyTo([dropoff.lat, dropoff.lng], 15, { animate: true, duration: 1 });
    }
  }, [pickup, dropoff, map]);

  return null;
}

export default function Map({ pickup, dropoff, routeCoordinates, onPickupSelect, onDropoffSelect, selectionMode }: MapProps) {
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
            <Popup>Pickup</Popup>
          </Marker>
        )}

        {dropoff && dropoff.lat && (
          <Marker position={[dropoff.lat, dropoff.lng]} icon={customIcon}>
            <Popup>Dropoff</Popup>
          </Marker>
        )}

        {routeCoordinates && routeCoordinates.length > 0 && (
          <Polyline positions={routeCoordinates} color="#000000" weight={4} opacity={0.7} />
        )}

        <MapUpdater pickup={pickup} dropoff={dropoff} />
      </MapContainer>
    </div>
  );
}