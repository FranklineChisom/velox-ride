// Helper functions for Geocoding (Address -> Coords) and Routing

export interface Coordinates {
  lat: number;
  lng: number;
}

// 1. Search for an address (Geocoding) using Nominatim
export async function searchLocation(query: string): Promise<Coordinates | null> {
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
        query
      )}&limit=1&countrycodes=ng` // Limiting to Nigeria
    );
    const data = await response.json();
    if (data && data.length > 0) {
      return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) };
    }
    return null;
  } catch (error) {
    console.error('Error searching location:', error);
    return null;
  }
}

// 2. Get Route between two points using OSRM
export async function getRoute(start: Coordinates, end: Coordinates): Promise<[number, number][] | null> {
  try {
    // OSRM expects: longitude,latitude
    const url = `https://router.project-osrm.org/route/v1/driving/${start.lng},${start.lat};${end.lng},${end.lat}?overview=full&geometries=geojson`;
    
    const response = await fetch(url);
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