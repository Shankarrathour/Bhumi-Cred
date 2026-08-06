import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, Card, CardContent, Grid, Button, Divider, Avatar } from '@mui/material';
import { ArrowLeft, CheckCircle, XCircle, Map, CreditCard, Leaf } from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { colors } from '../../../theme/colors';
import { useFarmerDetail } from '../api/useFarmers';
import { Skeleton } from '@mui/material';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      className="py-6"
    >
      {value === index && (
        <Box>
          {children}
        </Box>
      )}
    </div>
  );
}

export const FarmerProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const { data: farmerDetail, isLoading } = useFarmerDetail(id);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton variant="rectangular" width="100%" height={80} />
        <Skeleton variant="rectangular" width="100%" height={200} />
        <Skeleton variant="rectangular" width="100%" height={400} />
      </div>
    );
  }

  if (!farmerDetail) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <h2 className="text-xl font-semibold text-gray-700">Farmer Not Found</h2>
        <Button className="mt-4" onClick={() => navigate('/farmers')}>Go Back to Directory</Button>
      </div>
    );
  }

  // Format data for UI
  const farmer = {
    id: farmerDetail.farmer_id || farmerDetail.id,
    name: farmerDetail.full_name || 'N/A',
    mobile: farmerDetail.mobile,
    village: farmerDetail.village || 'N/A',
    district: farmerDetail.district || 'N/A',
    state: farmerDetail.state || 'N/A',
    totalLand: `${farmerDetail.total_acreage} Acres`,
    projects: 'N/A', // Will connect to projects later
    status: farmerDetail.kyc_status,
    kycStatus: farmerDetail.kyc_status,
    walletBalance: `₹${farmerDetail.wallet_balance?.toLocaleString() || 0}`,
    registeredDate: new Date(farmerDetail.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }),
    totalTrees: farmerDetail.total_trees,
    carbonCredits: `${farmerDetail.carbon_credits_generated} tCO2e`,
  };

  return (
    <div className="space-y-6">
      {/* Header & Back Button */}
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 bg-white"
          title="Go Back"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{farmer.name}</h1>
            <StatusBadge status={farmer.status === 'APPROVED' ? 'success' : 'warning'} label={farmer.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1">Farmer ID: {farmer.id} • Registered: {farmer.registeredDate}</p>
        </div>
        <div className="flex-1"></div>
        <div className="space-x-2">
          <Button variant="outlined" color="error" startIcon={<XCircle size={18} />}>Reject</Button>
          <Button variant="contained" sx={{ bgcolor: colors.primary.green, '&:hover': { bgcolor: '#15803d' } }} startIcon={<CheckCircle size={18} />}>Approve Farmer</Button>
        </div>
      </div>

      {/* Profile Overview Card */}
      <Card>
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-gray-200">
            <div className="p-6 flex items-center space-x-4 md:w-1/3">
              <Avatar sx={{ width: 64, height: 64, bgcolor: colors.primary.green, fontSize: '24px' }}>
                {farmer.name.substring(0, 2).toUpperCase()}
              </Avatar>
              <div>
                <Typography variant="h6" className="font-bold text-gray-900">{farmer.name}</Typography>
                <Typography variant="body2" color="text.secondary">{farmer.mobile}</Typography>
                <Typography variant="body2" color="text.secondary" className="mt-1">{farmer.village}, {farmer.state}</Typography>
              </div>
            </div>
            <div className="p-6 flex flex-row items-center justify-around flex-1 bg-gray-50/50">
              <div className="text-center">
                <Typography variant="body2" color="text.secondary" className="mb-1 flex items-center justify-center"><Map size={16} className="mr-1"/> Total Land</Typography>
                <Typography variant="h6" className="font-bold text-gray-900">{farmer.totalLand}</Typography>
              </div>
              <div className="text-center">
                <Typography variant="body2" color="text.secondary" className="mb-1 flex items-center justify-center"><Leaf size={16} className="mr-1"/> Projects</Typography>
                <Typography variant="h6" className="font-bold text-gray-900">{farmer.projects}</Typography>
              </div>
              <div className="text-center">
                <Typography variant="body2" color="text.secondary" className="mb-1 flex items-center justify-center"><CreditCard size={16} className="mr-1"/> Wallet</Typography>
                <Typography variant="h6" className="font-bold text-green-600">{farmer.walletBalance}</Typography>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" aria-label="farmer profile tabs">
          <Tab label="Overview" />
          <Tab label="Personal Details" />
          <Tab label="KYC" />
          <Tab label="Bank" />
          <Tab label="Land Parcels" />
          <Tab label="Projects" />
          <Tab label="Carbon" />
          <Tab label="Insurance" />
          <Tab label="Wallet" />
          <Tab label="Marketplace" />
          <Tab label="Support Tickets" />
          <Tab label="Activity Timeline" />
          <Tab label="Documents" />
        </Tabs>
      </Box>

      {/* Tab Panels */}
      <CustomTabPanel value={tabValue} index={0}>
        <Grid container spacing={6}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" className="font-bold mb-4">Quick Summary</Typography>
            <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">KYC Status</span>
                <span className="font-medium text-orange-600">{farmer.kycStatus}</span>
              </div>
              <div className="flex justify-between py-2 border-b border-gray-100">
                <span className="text-gray-500">Total Trees Planted</span>
                <span className="font-medium">{farmer.totalTrees}</span>
              </div>
              <div className="flex justify-between py-2">
                <span className="text-gray-500">Carbon Credits Generated</span>
                <span className="font-medium text-green-600">{farmer.carbonCredits}</span>
              </div>
            </div>
          </Grid>
          <Grid size={{ xs: 12, md: 6 }}>
            <Typography variant="h6" className="font-bold mb-4">Activity Timeline</Typography>
            <div className="relative pl-4 border-l-2 border-gray-200 space-y-6">
              <div className="relative">
                <div className="absolute -left-[21px] bg-gray-200 h-3 w-3 rounded-full border-2 border-white"></div>
                <p className="text-sm text-gray-500 mb-1">Yesterday, 14:30</p>
                <p className="font-medium text-gray-900">Uploaded Aadhaar Document</p>
              </div>
              <div className="relative">
                <div className="absolute -left-[21px] bg-green-500 h-3 w-3 rounded-full border-2 border-white"></div>
                <p className="text-sm text-gray-500 mb-1">12 Aug 2025, 09:15</p>
                <p className="font-medium text-gray-900">Registered on Platform</p>
              </div>
            </div>
          </Grid>
        </Grid>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={1}>
        <Typography color="text.secondary">Personal details form placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={2}>
        <Typography color="text.secondary">KYC Verification interface placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={3}>
        <Typography color="text.secondary">Bank details placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={4}>
        <Typography color="text.secondary">Land Parcels placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={5}>
        <Typography color="text.secondary">Projects placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={6}>
        <Typography color="text.secondary">Carbon Credits placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={7}>
        <Typography color="text.secondary">Insurance Policies placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={8}>
        <Typography color="text.secondary">Wallet and Transactions placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={9}>
        <Typography color="text.secondary">Marketplace Orders placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={10}>
        <Typography color="text.secondary">Support Tickets placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={11}>
        <Typography color="text.secondary">Activity Timeline placeholder.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={12}>
        <Typography color="text.secondary">Documents placeholder.</Typography>
      </CustomTabPanel>
    </div>
  );
};
