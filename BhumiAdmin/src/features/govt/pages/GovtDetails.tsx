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

export const GovtDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const govtBody = {
    id: id || 'GOV-2001',
    organization: 'Ministry of Agriculture',
    department: 'Department of Agriculture & Farmers Welfare',
    authorizedPerson: 'Rajesh Sharma',
    status: 'Approved',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/govt')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 bg-white"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{govtBody.organization}</h1>
            <StatusBadge status="success" label={govtBody.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1">{govtBody.department} • Authorized Person: {govtBody.authorizedPerson}</p>
        </div>
        <div className="flex-1"></div>
        <div className="space-x-2">
          <Button variant="outlined" color="error" startIcon={<XCircle size={18} />}>Reject</Button>
          <Button variant="contained" sx={{ bgcolor: colors.primary.green, '&:hover': { bgcolor: '#15803d' } }} startIcon={<CheckCircle size={18} />}>Approve</Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="Land" />
          <Tab label="Projects" />
          <Tab label="Documents" />
          <Tab label="Timeline" />
          <Tab label="Reports" />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <Typography color="text.secondary">Overview of Government Body placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={1}>
        <Typography color="text.secondary">Land assigned to this Government Body.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={2}>
        <Typography color="text.secondary">Projects managed by this Government Body.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={3}>
        <Typography color="text.secondary">Uploaded Documents (MOU, Authorization Letters).</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={4}>
        <Typography color="text.secondary">Activity Timeline placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={5}>
        <Typography color="text.secondary">Generated Reports placeholder.</Typography>
      </CustomTabPanel>
    </div>
  );
};
