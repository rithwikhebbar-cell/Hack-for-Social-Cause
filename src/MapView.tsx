import { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

type Location = {
  lat: number;
  lng: number;
};

function LocationSelector({
  onSelect,
}: {
  onSelect: (location: Location) => void;
}) {
  useMapEvents({
    click(event) {
      onSelect({
        lat: event.latlng.lat,
        lng: event.latlng.lng,
      });
    },
  });

  return null;
}


export default function MapView() {
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [roads, setRoads] = useState<any[]>([]);
  const [loadingRoads, setLoadingRoads] = useState(false);
  const [roadError, setRoadError] = useState('');
  async function fetchRoads(lat: number, lng: number) {
  setLoadingRoads(true);
  setRoadError('');
  setRoads([]);

  const query = `
    [out:json][timeout:25];
    way(around:500,${lat},${lng})["highway"];
    out geom;
  `;

  try {
    const response = await fetch(
      'https://overpass-api.de/api/interpreter',
      {
        method: 'POST',
        body: `data=${encodeURIComponent(query)}`,
      }
    );

    if (!response.ok) {
      throw new Error(`Request failed: ${response.status}`);
    }

    const data = await response.json();
    setRoads(data.elements ?? []);
  } catch {
    setRoadError('Could not load roads. Please try again.');
  } finally {
    setLoadingRoads(false);
  }
}
  return (
    <div style={{ height: '100vh', width: '100%' }}>
      <MapContainer
        center={[12.2958, 76.6394]}
        zoom={13}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <LocationSelector
            onSelect={(location) => {
                setSelectedLocation(location);
                fetchRoads(location.lat, location.lng);
            }}
        />
        {roads.map((road) => {
            if (!road.geometry) return null;
            const positions: [number, number][] = road.geometry.map(
                (point: { lat: number; lon: number }) => [point.lat, point.lon]
            );
            return (
                <Polyline
                    key={road.id}
                    positions={positions}
                    pathOptions={{ color: '#00a86b', weight: 4 }}
                />
            );
        })}

        {selectedLocation && (
          <Marker position={[selectedLocation.lat, selectedLocation.lng]}>
            <Popup>Selected location</Popup>
          </Marker>
        )}
      </MapContainer>

      <div
        style={{
          position: 'absolute',
          top: 80,
          left: 20,
          zIndex: 1000,
          background: 'white',
          color: '#111827',
          padding: 12,
          borderRadius: 8,
        }}
      >
        <strong>Hack-for-Social-Cause | Location Selector</strong>
        <p>
            {loadingRoads
            ? 'Loading nearby roads...'
            : roadError
            ? roadError
            : `Road segments found: ${roads.length}`}
        </p>
        <p>
          {selectedLocation
            ? `Lat: ${selectedLocation.lat.toFixed(5)}, Lng: ${selectedLocation.lng.toFixed(5)}`
            : 'Click the map to select a location.'}
        </p>
      </div>
    </div>
  );
}