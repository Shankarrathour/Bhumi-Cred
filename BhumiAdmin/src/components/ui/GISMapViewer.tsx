import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Polygon, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { LatLngExpression } from 'leaflet';
import { colors } from '../../theme/colors';

interface GISMapViewerProps {
  center: LatLngExpression;
  zoom?: number;
  polygons?: {
    id: string;
    positions: LatLngExpression[];
    color?: string;
    popupInfo?: React.ReactNode;
  }[];
  height?: string | number;
}

export const GISMapViewer: React.FC<GISMapViewerProps> = ({ 
  center, 
  zoom = 15, 
  polygons = [],
  height = '400px'
}) => {
  // Bulletproof LatLng validation to prevent Leaflet map crashes
  const validCenter: LatLngExpression = useMemo(() => {
    if (Array.isArray(center) && typeof center[0] === 'number' && typeof center[1] === 'number' && !isNaN(center[0]) && !isNaN(center[1])) {
      return center;
    }
    return [23.0225, 77.0124];
  }, [center]);

  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
      <MapContainer 
        center={validCenter} 
        zoom={zoom} 
        scrollWheelZoom={false} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        {polygons.map((poly) => (
          <Polygon 
            key={poly.id}
            pathOptions={{ 
              color: poly.color || colors.primary.green, 
              fillColor: poly.color || colors.primary.green,
              fillOpacity: 0.4
            }} 
            positions={poly.positions}
          >
            {poly.popupInfo && (
              <Popup>
                {poly.popupInfo}
              </Popup>
            )}
          </Polygon>
        ))}
      </MapContainer>
    </div>
  );
};
