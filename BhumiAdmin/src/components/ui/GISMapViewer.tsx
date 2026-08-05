import React from 'react';
import { MapContainer, TileLayer, Polygon, Popup, useMap } from 'react-leaflet';
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

// Fix for leaflet marker icon issues in React if needed later, but we are primarily using Polygons here.

export const GISMapViewer: React.FC<GISMapViewerProps> = ({ 
  center, 
  zoom = 15, 
  polygons = [],
  height = '400px'
}) => {
  return (
    <div style={{ height, width: '100%', borderRadius: '12px', overflow: 'hidden', border: '1px solid #E5E7EB' }}>
      <MapContainer 
        center={center} 
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
