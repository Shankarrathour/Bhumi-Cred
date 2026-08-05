import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, Button, Rating } from '@mui/material';
import { ArrowLeft, Edit } from 'lucide-react';
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

export const ProductDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const product = {
    id: id || 'PRD-101',
    name: 'Organic Neem Fertilizer 50kg',
    status: 'Approved',
    vendor: 'AgriCorp',
    price: 1500,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-4">
        <button 
          onClick={() => navigate('/marketplace')}
          className="p-2 hover:bg-gray-100 rounded-full transition-colors border border-gray-200 bg-white"
        >
          <ArrowLeft size={20} className="text-gray-600" />
        </button>
        <div>
          <div className="flex items-center space-x-3">
            <h1 className="text-2xl font-bold text-slate-900">{product.name}</h1>
            <StatusBadge status="success" label={product.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1">{product.id} • Vendor: {product.vendor} • ₹{product.price}</p>
        </div>
        <div className="flex-1"></div>
        <div className="space-x-2">
          <Button variant="outlined" startIcon={<Edit size={16} />}>Edit Product</Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="Inventory" />
          <Tab label="Reviews" />
          <Tab label="Vendor Details" />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <Typography color="text.secondary">SKU, category, pricing, and rich description.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={1}>
        <Typography color="text.secondary">Stock levels, warehouse locations, and restock alerts.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={2}>
        <div className="space-y-4">
          <Typography color="text.secondary">Customer ratings and reviews.</Typography>
          <div className="flex items-center gap-2">
            <Rating value={4.5} precision={0.5} readOnly />
            <span className="text-sm text-slate-600">(128 reviews)</span>
          </div>
        </div>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={3}>
        <Typography color="text.secondary">Associated vendor profile and performance metrics.</Typography>
      </CustomTabPanel>
    </div>
  );
};
