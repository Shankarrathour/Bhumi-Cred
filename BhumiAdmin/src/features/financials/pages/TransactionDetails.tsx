import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Tabs, Tab, Box, Typography, Button } from '@mui/material';
import { ArrowLeft, CheckCircle, Receipt } from 'lucide-react';
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

export const TransactionDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tabValue, setTabValue] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const transaction = {
    id: id || 'TXN-987654321',
    farmer: 'F-12345',
    amount: '₹12,500',
    status: 'pending',
  };

  return (
    <div className="space-y-6">
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
            <h1 className="text-2xl font-bold text-slate-900">Withdrawal Request</h1>
            <StatusBadge status="warning" label={transaction.status} />
          </div>
          <p className="text-slate-500 text-sm mt-1">{transaction.id} • Farmer: {transaction.farmer} • Amount: {transaction.amount}</p>
        </div>
        <div className="flex-1"></div>
        <div className="space-x-2">
          <Button variant="outlined" color="error">Reject</Button>
          <Button variant="contained" color="success" startIcon={<CheckCircle size={16} />}>Approve Payout</Button>
        </div>
      </div>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab label="Overview" />
          <Tab label="Bank Details" />
          <Tab label="Audit Trail" />
        </Tabs>
      </Box>

      <CustomTabPanel value={tabValue} index={0}>
        <Typography color="text.secondary">Amount requested, relevant dates, and current processing status.</Typography>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={1}>
        <div className="space-y-4">
          <Typography color="text.secondary">Linked account information and verification status.</Typography>
          <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg max-w-sm">
            <div className="flex items-center gap-2 mb-2">
              <Receipt size={18} className="text-gray-500" />
              <span className="font-semibold text-gray-700">HDFC Bank</span>
            </div>
            <Typography variant="body2" className="text-gray-600">A/C: ************1234</Typography>
            <Typography variant="body2" className="text-gray-600">IFSC: HDFC0001234</Typography>
          </div>
        </div>
      </CustomTabPanel>
      <CustomTabPanel value={tabValue} index={2}>
        <Typography color="text.secondary">Complete history of approval/rejection notes by administrators.</Typography>
      </CustomTabPanel>
    </div>
  );
};
