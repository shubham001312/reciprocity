import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

function getColor(count) {
  if (count >= 1000) return '#DC2626';
  if (count >= 500) return '#7C2D5F';
  if (count >= 100) return '#A8862F';
  return '#0891B2';
}

function getRadius(count) {
  if (count >= 1000) return 22;
  if (count >= 500) return 18;
  if (count >= 100) return 14;
  if (count >= 50) return 10;
  return 7;
}

function FlyToState({ center, zoom }) {
  const map = useMap();
  useEffect(() => {
    if (center) map.flyTo(center, zoom || 7, { duration: 1.5 });
  }, [center, zoom, map]);
  return null;
}

export default function CollegeMap({ markers, selectedState, onSelectState }) {
  return (
    <MapContainer
      center={[20.59, 78.96]}
      zoom={5}
      style={{ height: '100%', width: '100%' }}
      scrollWheelZoom={true}
      zoomControl={true}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {selectedState && <FlyToState center={[selectedState.lat, selectedState.lng]} zoom={7} />}
      {markers.map(m => (
        <CircleMarker
          key={m.state}
          center={[m.lat, m.lng]}
          radius={getRadius(m.count)}
          pathOptions={{
            fillColor: getColor(m.count),
            fillOpacity: 0.6,
            color: getColor(m.count),
            weight: 2,
          }}
          eventHandlers={{
            click: () => onSelectState(m),
          }}
        >
          <Popup>
            <div style={{ minWidth: '200px', fontFamily: 'Inter, system-ui, sans-serif' }}>
              <h3 style={{ fontSize: '15px', fontWeight: 600, marginBottom: '8px', color: '#1A1B1E' }}>{m.state}</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                <span style={{ color: '#6B7280' }}>Total Colleges</span>
                <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700 }}>{m.count.toLocaleString()}</span>
              </div>
              {m.registered > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: '#6B7280' }}>On Platform</span>
                  <span style={{ fontFamily: 'IBM Plex Mono', fontWeight: 700, color: '#0891B2' }}>{m.registered}</span>
                </div>
              )}
              {m.topTypes && m.topTypes.length > 0 && (
                <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid #E5E7EB' }}>
                  <div style={{ fontSize: '10px', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Top Types</div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px', marginTop: '4px' }}>
                    {m.topTypes.map(t => (
                      <span key={t.name} style={{ padding: '2px 6px', background: '#F0EDE6', borderRadius: '4px', fontSize: '10px', fontFamily: 'IBM Plex Mono' }}>{t.name} ({t.count})</span>
                    ))}
                  </div>
                </div>
              )}
              <a href={`/colleges?state=${encodeURIComponent(m.state)}`}
                style={{ display: 'block', marginTop: '10px', textAlign: 'center', padding: '6px 12px', background: '#0891B2', color: 'white', fontSize: '12px', fontWeight: 500, borderRadius: '8px', textDecoration: 'none' }}>
                View Colleges →
              </a>
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </MapContainer>
  );
}
