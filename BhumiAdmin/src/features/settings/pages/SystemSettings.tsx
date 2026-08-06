import React, { useState } from 'react';
import { Settings, Save, Shield, Globe, CreditCard, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button, TextField, Switch, FormControlLabel, Snackbar, Alert } from '@mui/material';
import { usePlatformInfo, useSaveSettings, SettingsPayload } from '../api/useSettings';

export const SystemSettings = () => {
  const { data: platformInfo } = usePlatformInfo();
  const { mutate: saveSettings, isPending, isSuccess, isError, reset } = useSaveSettings();

  const [form, setForm] = useState<SettingsPayload>({
    platform_name: 'BhumiCred Enterprise',
    support_email: 'admin@bhumicred.com',
    carbon_price: '1500',
    razorpay_key: 'rzp_test_123456',
    payout_webhook: 'secret_abc123',
    auto_payouts: true,
    require_mfa: true,
    force_password_reset: true,
  });

  const handleChange = (field: keyof SettingsPayload, value: string | boolean) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    saveSettings(form);
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Global System Settings"
        description="Configure API keys, payment gateways, and core platform behavior."
        icon={Settings}
        actions={
          <Button
            variant="contained"
            color="primary"
            startIcon={isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            onClick={handleSave}
            disabled={isPending}
          >
            {isPending ? 'Saving…' : 'Save Changes'}
          </Button>
        }
      />

      {/* Live platform info from API */}
      {platformInfo && (
        <div className="ent-card p-4 flex flex-wrap gap-6 items-center text-sm">
          <span className="text-slate-500 font-medium">Platform Overview (live):</span>
          <span className="font-medium text-slate-700">
            🛒 Products: <strong>{platformInfo.product_summary?.total_products ?? '—'}</strong>
          </span>
          <span className="font-medium text-slate-700">
            ⏳ Pending: <strong>{platformInfo.product_summary?.pending_approval ?? '—'}</strong>
          </span>
          <span className="font-medium text-slate-700">
            👥 Vendors: <strong>{platformInfo.vendor_summary?.total_vendors ?? '—'}</strong>
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* General Config */}
        <div className="ent-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Globe size={20} /> General Config
          </h3>
          <TextField
            fullWidth label="Platform Name" size="small"
            value={form.platform_name}
            onChange={e => handleChange('platform_name', e.target.value)}
          />
          <TextField
            fullWidth label="Support Email" size="small"
            value={form.support_email}
            onChange={e => handleChange('support_email', e.target.value)}
          />
          <TextField
            fullWidth label="Default Carbon Pricing (₹/tCO₂e)" size="small" type="number"
            value={form.carbon_price}
            onChange={e => handleChange('carbon_price', e.target.value)}
          />
        </div>

        {/* Payment Gateway */}
        <div className="ent-card p-6 space-y-4">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <CreditCard size={20} /> Payment Gateway
          </h3>
          <TextField
            fullWidth label="Razorpay API Key" type="password" size="small"
            value={form.razorpay_key}
            onChange={e => handleChange('razorpay_key', e.target.value)}
          />
          <TextField
            fullWidth label="Payout Webhook Secret" type="password" size="small"
            value={form.payout_webhook}
            onChange={e => handleChange('payout_webhook', e.target.value)}
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.auto_payouts}
                onChange={e => handleChange('auto_payouts', e.target.checked)}
                color="success"
              />
            }
            label="Enable Auto-Payouts for Verified Claims"
          />
        </div>

        {/* Security & MFA */}
        <div className="ent-card p-6 space-y-4 lg:col-span-2">
          <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
            <Shield size={20} /> Security & MFA
          </h3>
          <FormControlLabel
            control={
              <Switch
                checked={form.require_mfa}
                onChange={e => handleChange('require_mfa', e.target.checked)}
                color="primary"
              />
            }
            label="Require MFA for all Super Admins"
          />
          <FormControlLabel
            control={
              <Switch
                checked={form.force_password_reset}
                onChange={e => handleChange('force_password_reset', e.target.checked)}
                color="primary"
              />
            }
            label="Force Password Reset Every 90 Days"
          />
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
              Changes to security policies will require all active sessions to re-authenticate immediately upon saving.
            </p>
          </div>
        </div>
      </div>

      {/* Success Toast */}
      <Snackbar
        open={isSuccess}
        autoHideDuration={4000}
        onClose={reset}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="success" onClose={reset} icon={<CheckCircle size={18} />}>
          Settings saved successfully!
        </Alert>
      </Snackbar>

      {/* Error Toast (endpoint not yet available) */}
      <Snackbar
        open={isError}
        autoHideDuration={5000}
        onClose={reset}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert severity="warning" onClose={reset} icon={<AlertCircle size={18} />}>
          Settings endpoint not yet available — changes logged to console.
        </Alert>
      </Snackbar>
    </div>
  );
};
