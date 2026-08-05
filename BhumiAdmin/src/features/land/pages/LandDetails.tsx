import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, Card, CardContent, Grid, Button } from '@mui/material';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Layers, MapPin } from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { GISMapViewer } from '../../../components/ui/GISMapViewer';
import { colors } from '../../../theme/colors';
import { LatLngExpression } from 'leaflet';
import { useLandVerificationQueue } from '../api/useLand';
import { CircularProgress } from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} className="py-6" {...other}>
      {value === index && <Box>{children}</Box>}
    </div>
  );
}

export const LandDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const { data: queueData, isLoading, error } = useLandVerificationQueue();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><CircularProgress /></div>;
  }

  const liveLand = queueData?.find(l => l.id === id);

  const landData = {
    id: id || 'LND-5001',
    farmer: liveLand?.farmer_name || 'Unknown',
    area: liveLand ? `${liveLand.area_acres} Acres` : 'Unknown',
    village: liveLand?.village || 'Unknown',
    district: liveLand?.district || 'Unknown',
    state: liveLand?.state || 'Unknown',
    soilType: 'Black Cotton', // Mapped from backend later if available
    trees: (liveLand as any)?.tree_stock_count || '0',
    aiStatus: liveLand?.verification_status === 'pending' ? 'Pending Review' : 'Verified',
    gisStatus: (liveLand?.verification_status || 'PENDING').toUpperCase()
  };

  // Extract polygon coordinates if available
  const center: LatLngExpression = liveLand?.coordinates 
    ? [liveLand.coordinates.lat, liveLand.coordinates.lng] 
    : [23.0225, 72.5714];

  const mockPolygon: LatLngExpression[] = liveLand?.boundary_polygon 
    ? liveLand.boundary_polygon.map(p => [p.lat, p.lng] as LatLngExpression)
    : [
      [23.0220, 72.5710],
      [23.0230, 72.5710],
      [23.0230, 72.5720],
      [23.0220, 72.5720]
    ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/land')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 bg-white"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">Land Parcel: {landData.id}</h1>
            <StatusBadge status={landData.gisStatus === 'APPROVED' ? 'success' : 'warning'} label={landData.gisStatus} />
          </div>
          <p className="text-slate-500 text-sm mt-1">Owned by {landData.farmer} • {landData.village}, {landData.district}</p>
        </div>
        <div className="flex-1"></div>
        <div className="space-x-2">
          <Button variant="outlined" color="error" startIcon={<XCircle size={18} />}>Reject Land</Button>
          <Button variant="contained" sx={{ bgcolor: colors.primary.green, '&:hover': { bgcolor: '#15803d' } }} startIcon={<CheckCircle size={18} />}>Approve Land</Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Overview" />
          <Tab label="Map" />
          <Tab label="GIS" />
          <Tab label="Photos" />
          <Tab label="Ownership" />
          <Tab label="History" />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, lg: 8 }}>
            <Card className="h-full">
              <CardContent className="p-0 h-full relative">
                {/* AI Warning Overlay Example */}
                {landData.aiStatus === 'Duplicate Suspected' && (
                  <div className="absolute top-4 left-4 z-[400] bg-red-100 border border-red-300 text-red-800 px-4 py-2 rounded-lg shadow-md flex items-center">
                    <AlertTriangle size={18} className="mr-2" />
                    <strong>AI Alert:</strong> Possible overlapping polygon detected (98% match).
                  </div>
                )}
                
                {/* Floating Map Controls */}
                <div className="absolute top-4 right-4 z-[400] flex flex-col space-y-2">
                  <Button variant="contained" size="small" className="bg-white text-gray-800 hover:bg-gray-100 border border-gray-300 shadow-md">
                    <Layers size={16} className="mr-2" /> Layers
                  </Button>
                  <Button variant="contained" size="small" className="bg-white text-gray-800 hover:bg-gray-100 border border-gray-300 shadow-md">
                    <MapPin size={16} className="mr-2" /> Plot
                  </Button>
                </div>

                <GISMapViewer 
                  center={center} 
                  polygons={[
                    {
                      id: '1',
                      positions: mockPolygon,
                      color: landData.aiStatus === 'Verified' ? colors.primary.green : colors.status.danger,
                      popupInfo: (
                        <div>
                          <strong>{landData.id}</strong><br/>
                          Area: {landData.area}
                        </div>
                      )
                    }
                  ]}
                  height="600px" 
                />
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <div className="space-y-6">
              <Typography variant="h6" className="font-bold">Land Summary</Typography>
              
              <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-4 shadow-sm">
                <div className="flex flex-col">
                  <span className="text-gray-500 text-sm">Total Area Verified</span>
                  <span className="font-semibold text-lg">{landData.area}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-sm">Soil Type</span>
                  <span className="font-medium text-gray-900">{landData.soilType}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-gray-500 text-sm">Tree Count (Drone Estimate)</span>
                  <span className="font-medium text-gray-900">{landData.trees} Trees</span>
                </div>
              </div>

              <Typography variant="h6" className="font-bold mt-6 mb-4">Verification Check</Typography>
              <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                 <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Polygon Geometry Check</span>
                    <CheckCircle size={18} className="text-green-500" />
                 </div>
                 <div className="flex items-center justify-between py-2 border-b border-gray-100">
                    <span className="text-gray-600">Duplicate Overlap Check</span>
                    {landData.aiStatus === 'Verified' ? (
                      <CheckCircle size={18} className="text-green-500" />
                    ) : (
                      <XCircle size={18} className="text-red-500" />
                    )}
                 </div>
                 <div className="flex items-center justify-between py-2">
                    <span className="text-gray-600">Government Record Match</span>
                    <CheckCircle size={18} className="text-green-500" />
                 </div>
              </div>
            </div>
          </Grid>
        </Grid>
      </CustomTabPanel>

      <CustomTabPanel value={tabValue} index={1}>
        <Typography color="text.secondary">Map View placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={2}>
        <Typography color="text.secondary">GIS Analysis placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={3}>
        <Typography color="text.secondary">Photos placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={4}>
        <Typography color="text.secondary">Ownership Documents placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={5}>
        <Typography color="text.secondary">History & Audit Logs placeholder.</Typography>
      </CustomTabPanel>
    </div>
  );
};
