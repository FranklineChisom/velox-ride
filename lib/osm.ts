import { Coordinates } from '@/types';

// 1. Search for an address (Geocoding) using Nominatim
export async function searchLocation(query: string): Promise<Coordinates | null> {
  if (!query) return null;

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=1&countrycodes=ng`, // Limiting to Nigeria
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
        },
      }
    );
    
    if (!response.ok) {
        console.warn(`Nominatim API returned error: ${response.status}`);
        return null;
    }

    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    // Gracefully handle network errors (e.g. blocked by extensions)
    console.error('Error searching location:', error);
    return null;
  }
}

// 2. Get Route between two points using OSRM
export async function getRoute(start: Coordinates, end: Coordinates): Promise<[number, number][] | null> {
  if (!start || !end) return null;

  try {
    // OSRM expects: longitude,latitude
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      // Return the coordinates [lat, lng] for drawing the polyline
      const coordinates = data.routes[0].geometry.coordinates;
      // OSRM returns [lng, lat], Leaflet needs [lat, lng], so we flip them
      return coordinates.map((coord: number[]) => [coord[1], coord[0]]);
    }
    return null;
  } catch (error) {
    console.error('Error getting route:', error);
    return null;
  }
}

// 3. Reverse Geocoding (Coords -> Address Name)
export async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
      {
        headers: {
            'Accept': 'application/json'
        }
      }
    );
    
    if (!response.ok) return "Pinned Location";

    const data = await response.json();
    // Return the display name, prefering the first part (usually street/place name)
    // You can adjust this to return data.display_name for the full address
    return data.display_name?.split(',')[0] || "Pinned Location"; 
  } catch (error) {
    console.error('Error reverse geocoding:', error);
    return "Pinned Location";
  }
}


export interface RoutingStats {
  distanceMeters: number;
  durationSeconds: number;
}

/**
 * Fetches real-world driving stats between two points.
 * Uses OSRM to account for road networks, one-way streets, etc.
 */
export async function getDrivingStats(start: Coordinates, end: Coordinates): Promise<RoutingStats | null> {
  try {
    // OSRM Table API is better for matrices, but Route is fine for 1-to-1
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=false`;
    
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    
    if (data.routes && data.routes.length > 0) {
      return {
        distanceMeters: data.routes[0].distance,
        durationSeconds: data.routes[0].duration
      };
    }
    return null;
  } catch (error) {
    console.error('Error getting driving stats:', error);
    return null;
  }
}