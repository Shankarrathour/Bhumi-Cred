import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, Button } from '@mui/material';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
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

export const InsuranceDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const policy = {
    id: id || 'INS-800101',
    name: 'Teak Tree Weather Guard',
    status: 'Active',
    provider: 'HDFC ERGO Agri',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/insurance')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 bg-white"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{policy.name}</h1>
            <StatusBadge status="success" label={policy.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1">{policy.id} • Provider: {policy.provider}</p>
        </div>
        <div className="flex-1"></div>
        <div className="space-x-2">
          <Button variant="outlined" color="primary">Export Policy Document</Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Policy Info" />
          <Tab label="Enrolled Farmers" />
          <Tab label="Claims" />
          <Tab label="Weather Data" />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <Typography color="text.secondary">Detailed premium, coverage, and terms of the policy.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={1}>
        <Typography color="text.secondary">List of farmers covered under this specific policy.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={2}>
        <Typography color="text.secondary">Submitted claims, processing status, and payouts.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={3}>
        <Typography color="text.secondary">Live weather data triggers mapped against the policy parameters.</Typography>
      </CustomTabPanel>
    </div>
  );
};
