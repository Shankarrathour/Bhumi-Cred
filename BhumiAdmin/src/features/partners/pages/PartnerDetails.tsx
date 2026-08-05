import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, Card, CardContent, Button } from '@mui/material';
import { ArrowLeft, CheckCircle, XCircle } from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { colors } from '../../../theme/colors';

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

export const PartnerDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const partner = {
    id: id || 'PRT-1001',
    name: 'AgriCorp Solutions',
    type: 'Carbon Partner',
    gst: '22AAAAA0000A1Z5',
    status: 'Active',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/partners')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 bg-white"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{partner.name}</h1>
            <StatusBadge status="success" label={partner.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1">{partner.type} • GST: {partner.gst}</p>
        </div>
        <div className="flex-1"></div>
        <div className="space-x-2">
          <Button variant="outlined" color="error" startIcon={<XCircle size={18} />}>Suspend</Button>
          <Button variant="contained" sx={{ bgcolor: colors.primary.green, '&:hover': { bgcolor: '#15803d' } }} startIcon={<CheckCircle size={18} />}>Approve</Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Registration" />
          <Tab label="Agreement" />
          <Tab label="Projects" />
          <Tab label="Performance" />
          <Tab label="Commission" />
          <Tab label="Status Logs" />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <Typography color="text.secondary">Registration details and verification status.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={1}>
        <Typography color="text.secondary">Legal Agreements and MOUs.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={2}>
        <Typography color="text.secondary">Projects assigned to this Partner.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={3}>
        <Typography color="text.secondary">Performance KPIs and ratings.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={4}>
        <Typography color="text.secondary">Commission splits and wallet transactions.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={5}>
        <Typography color="text.secondary">Audit and status change logs.</Typography>
      </CustomTabPanel>
    </div>
  );
};
