import React from 'react';
import { Settings, Save, Shield, Globe, CreditCard } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button, TextField, Switch, FormControlLabel } from '@mui/material';

export const SystemSettings = () => {
  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Global System Settings"
        description="Configure API keys, payment gateways, and core platform behavior."
        icon={Settings}
        actions={<Button variant="contained" color="primary" startIcon={<Save size={16}/>}>Save Changes</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="ent-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Globe size={20}/> General Config</h3>
          <TextField fullWidth label="Platform Name" defaultValue="BhumiCred Enterprise" size="small" />
          <TextField fullWidth label="Support Email" defaultValue="admin@bhumicred.com" size="small" />
          <TextField fullWidth label="Default Carbon Pricing (₹/tCO₂e)" defaultValue="1500" size="small" type="number" />
        </div>

        <div className="ent-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><CreditCard size={20}/> Payment Gateway</h3>
          <TextField fullWidth label="Razorpay API Key" type="password" defaultValue="rzp_test_123456" size="small" />
          <TextField fullWidth label="Payout Webhook Secret" type="password" defaultValue="secret_abc123" size="small" />
          <FormControlLabel control={<Switch defaultChecked color="success" />} label="Enable Auto-Payouts for Verified Claims" />
        </div>

        <div className="ent-card p-6 space-y-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2"><Shield size={20}/> Security & MFA</h3>
          <FormControlLabel control={<Switch defaultChecked color="primary" />} label="Require MFA for all Super Admins" />
          <FormControlLabel control={<Switch defaultChecked color="primary" />} label="Force Password Reset Every 90 Days" />
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">Changes to security policies will require all active sessions to re-authenticate immediately upon saving.</p>
          </div>
        </div>
      </div>
    </div>
  );
};
