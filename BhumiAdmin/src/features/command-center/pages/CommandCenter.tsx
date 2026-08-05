import React, { useState } from 'react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import {
  Globe2, Sprout, CloudRain, Flame, Activity, TrendingUp, AlertTriangle, Layers, Map, Eye, ShieldCheck, RefreshCw
} from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useFarmers } from '../../farmers/api/useFarmers';
import { useInsurance } from '../../insurance/api/useInsurance';

const ACTIVE_REGIONS = [
  { id: 1, pos: [22.9734, 78.6569], state: 'Madhya Pradesh', stats: '1,200 Acres Verified', type: 'high-pot', color: '#16A34A' },
  { id: 2, pos: [19.7515, 75.7139], state: 'Maharashtra', stats: 'Forest Fire Alert', type: 'fire', color: '#EF4444' },
  { id: 3, pos: [22.2587, 71.1924], state: 'Gujarat', stats: 'Heavy Rainfall Alert', type: 'rain', color: '#F59E0B' },
  { id: 4, pos: [21.2787, 81.8661], state: 'Chhattisgarh', stats: 'New Plantation (500 Trees)', type: 'plantation', color: '#2563EB' },
];

export const CommandCenter = () => {
  const [mapTile, setMapTile] = useState<'carto-dark' | 'carto-light' | 'satellite'>('carto-light');
  const { data: farmersData } = useFarmers(1, 1);
  const { data: insuranceData } = useInsurance();

  const farmerCount = farmersData?.total ?? 45231;
  const insuranceCount = insuranceData?.data?.length ?? 12450;

  const tileUrls = {
    'carto-light': 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    'carto-dark': 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    'satellite': 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  };

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="GIS Command Center"
        description="Real-time geo-spatial intelligence, live weather alerts, satellite plot tracking and telemetry."
        badge={{ label: 'Live GIS Feed', variant: 'success' }}
        icon={Globe2}
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMapTile('carto-light')}
              className={`btn btn-sm ${mapTile === 'carto-light' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Terrain
            </button>
            <button
              onClick={() => setMapTile('satellite')}
              className={`btn btn-sm ${mapTile === 'satellite' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Satellite
            </button>
            <button
              onClick={() => setMapTile('carto-dark')}
              className={`btn btn-sm ${mapTile === 'carto-dark' ? 'btn-primary' : 'btn-secondary'}`}
            >
              Dark GIS
            </button>
          </div>
        }
      />

      {/* Main Map Box + Right Floating Drawer */}
      <div className="relative w-full h-[640px] ent-card overflow-hidden">
        <MapContainer
          center={[20.5937, 78.9629]}
          zoom={5}
          zoomControl={true}
          className="w-full h-full z-0"
        >
          <TileLayer
            url={tileUrls[mapTile]}
            attribution='&copy; <a href="https://carto.com/">CartoDB</a>'
          />

          {ACTIVE_REGIONS.map((region) => (
            <CircleMarker
              key={region.id}
              center={region.pos as any}
              radius={10}
              pathOptions={{ color: region.color, fillColor: region.color, fillOpacity: 0.8 }}
            >
              <Popup>
                <div className="p-1">
                  <div className="font-bold text-[13px] text-slate-900">{region.state}</div>
                  <div className="text-[12px] text-slate-600 mt-1">{region.stats}</div>
                </div>
              </Popup>
            </CircleMarker>
          ))}
        </MapContainer>

        {/* Floating Telemetry Stats Widget */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="absolute top-4 right-4 w-[300px] bg-white/95 backdrop-blur border border-[#E2E8F0] rounded-[16px] p-4 shadow-xl z-10 space-y-4"
        >
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
            <div className="flex items-center gap-2">
              <Activity size={16} className="text-[#16A34A]" />
              <span className="text-[13px] font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>Live Telemetry</span>
            </div>
            <StatusBadge label="Active" variant="success" size="sm" />
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-[#64748B]">Farmers Registered</span>
              <span className="font-600 text-[#0F172A]" style={{ fontWeight: 600 }}>{farmerCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-[#64748B]">Active Carbon Projects</span>
              <span className="font-600 text-[#16A34A]" style={{ fontWeight: 600 }}>89 Projects</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-[#64748B]">Policies Active</span>
              <span className="font-600 text-[#2563EB]" style={{ fontWeight: 600 }}>{insuranceCount.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between text-[12.5px]">
              <span className="text-[#64748B]">Satellite Pass Rate</span>
              <span className="font-600 text-[#8B5CF6]" style={{ fontWeight: 600 }}>98.4%</span>
            </div>
          </div>

          <div className="pt-2 border-t border-[#F1F5F9]">
            <div className="text-[11px] font-600 uppercase text-[#94A3B8] mb-2" style={{ fontWeight: 600 }}>Region Alerts</div>
            <div className="space-y-2">
              {ACTIVE_REGIONS.map(r => (
                <div key={r.id} className="flex items-center justify-between text-[11.5px] p-2 rounded-[8px] bg-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                    <span className="text-[#0F172A] font-500" style={{ fontWeight: 500 }}>{r.state}</span>
                  </div>
                  <span className="text-[#64748B] text-[11px] truncate max-w-[110px]">{r.stats}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
