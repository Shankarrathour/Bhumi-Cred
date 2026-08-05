import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, Button } from '@mui/material';
import { ArrowLeft, Leaf, ShieldAlert } from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';

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

export const CarbonCreditDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const batch = {
    id: id || 'BCH-XYZ',
    project: 'Agri Plantation',
    status: 'Issued',
    volume: '24.5K tCO₂e'
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/carbon')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 bg-white"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{batch.project}</h1>
            <StatusBadge status="success" label={batch.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1">{batch.id} • Volume: {batch.volume}</p>
        </div>
        <div className="flex-1"></div>
        <div className="space-x-2">
          <Button variant="contained" color="success" startIcon={<Leaf size={16} />}>Issue Certificates</Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="Retirement & Trading" />
          <Tab label="MRV Audit" />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <Typography color="text.secondary">General project data, vintage, and registry link.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={1}>
        <Typography color="text.secondary">Trading history on marketplace and retirement certificates.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={2}>
        <div className="space-y-4">
          <Typography color="text.secondary">MRV logs that verified this credit batch.</Typography>
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <ShieldAlert size={20} className="text-green-600" />
            <Typography variant="body2" className="text-green-800 font-medium">Audit Passed: Biomass sensors confirm sequestered amount.</Typography>
          </div>
        </div>
      </CustomTabPanel>
    </div>
  );
};
