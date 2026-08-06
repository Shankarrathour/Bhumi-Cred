import React, { useState } from 'react';
import {
  Settings, Save, Shield, Globe, CreditCard, CheckCircle, AlertCircle, Loader2,
  Lock, Mail, Building2, Key, RefreshCw, Eye, EyeOff, Zap, ShieldAlert
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { motion, AnimatePresence } from 'framer-motion';
import { usePlatformInfo, useSaveSettings, SettingsPayload } from '../api/useSettings';

export const SystemSettings = () => {
  const { data: platformInfo } = usePlatformInfo();
  const { mutate: saveSettings, isPending, isSuccess, isError, reset } = useSaveSettings();

  const [showRazorpayKey, setShowRazorpayKey] = useState(false);
  const [showWebhookSecret, setShowWebhookSecret] = useState(false);

  const [form, setForm] = useState<SettingsPayload>({
    platform_name: 'bhumiCred Enterprise',
    support_email: 'admin@bhumicred.com',
    carbon_price: '1500',
    razorpay_key: 'rzp_test_902184920194',
    payout_webhook: 'whsec_90218492019482910',
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
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Page Header */}
      <PageHeader
        title="Global System Settings"
        description="Configure API keys, payment gateways, carbon rates, and security enforcement."
        icon={Settings}
        iconColor="#16A34A"
        actions={
          <button
            onClick={handleSave}
            disabled={isPending}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#16A34A] hover:bg-[#15803D] active:scale-95 text-white font-semibold text-[13px] rounded-xl shadow-sm transition-all cursor-pointer disabled:opacity-50"
          >
            {isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            <span>{isPending ? 'Saving Changes...' : 'Save Changes'}</span>
          </button>
        }
      />

      {/* Live platform info overview ribbon */}
      {platformInfo && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-4"
        >
          <div className="flex items-center gap-2 text-[13px]">
            <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
            <span className="font-bold text-[#0F172A]">Platform Live Telemetry</span>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-[12.5px]">
            <div className="flex items-center gap-2">
              <span className="text-[#64748B] font-medium">Catalog Products:</span>
              <span className="font-bold text-[#0F172A] px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] rounded-lg border border-[#DCFCE7]">
                {platformInfo.product_summary?.total_products ?? 25}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#64748B] font-medium">Pending Approvals:</span>
              <span className="font-bold text-[#0F172A] px-2 py-0.5 bg-[#FFFBEB] text-[#D97706] rounded-lg border border-[#FEF3C7]">
                {platformInfo.product_summary?.pending_approval ?? 3}
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-[#64748B] font-medium">Verified Partners/Vendors:</span>
              <span className="font-bold text-[#0F172A] px-2 py-0.5 bg-[#EFF6FF] text-[#2563EB] rounded-lg border border-[#DBEAFE]">
                {platformInfo.vendor_summary?.total_vendors ?? 73}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Settings Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Card 1: General Configuration */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-5"
        >
          <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
            <div className="w-9 h-9 rounded-xl bg-[#F0FDF4] flex items-center justify-center text-[#16A34A]">
              <Globe size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#0F172A]">General Config</h3>
              <p className="text-[11.5px] text-[#94A3B8]">Core application identity and default pricing</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Input 1 */}
            <div>
              <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                Platform Name
              </label>
              <div className="relative">
                <Building2 size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="text"
                  value={form.platform_name}
                  onChange={e => handleChange('platform_name', e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-white border border-[#CBD5E1] rounded-xl text-[13.5px] text-[#0F172A] font-semibold outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 transition-all shadow-xs"
                  placeholder="BhumiCred Enterprise"
                />
              </div>
            </div>

            {/* Input 2 */}
            <div>
              <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                Support Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  value={form.support_email}
                  onChange={e => handleChange('support_email', e.target.value)}
                  className="w-full h-11 pl-10 pr-4 bg-white border border-[#CBD5E1] rounded-xl text-[13.5px] text-[#0F172A] font-medium outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 transition-all shadow-xs"
                  placeholder="admin@bhumicred.com"
                />
              </div>
            </div>

            {/* Input 3 */}
            <div>
              <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                Default Carbon Pricing (₹ / tCO₂e)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[14px] font-bold text-[#94A3B8]">₹</span>
                <input
                  type="number"
                  value={form.carbon_price}
                  onChange={e => handleChange('carbon_price', e.target.value)}
                  className="w-full h-11 pl-9 pr-4 bg-white border border-[#CBD5E1] rounded-xl text-[13.5px] text-[#0F172A] font-semibold outline-none focus:border-[#16A34A] focus:ring-2 focus:ring-[#16A34A]/20 transition-all shadow-xs"
                  placeholder="1500"
                />
              </div>
              <p className="text-[11px] text-[#94A3B8] mt-1">Default floor rate for verified carbon credit listings.</p>
            </div>
          </div>
        </motion.div>

        {/* Card 2: Payment Gateway */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-5"
        >
          <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
            <div className="w-9 h-9 rounded-xl bg-[#EFF6FF] flex items-center justify-center text-[#2563EB]">
              <CreditCard size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#0F172A]">Payment Gateway</h3>
              <p className="text-[11.5px] text-[#94A3B8]">Razorpay credentials and automated disbursement</p>
            </div>
          </div>

          <div className="space-y-4">
            {/* Input 1 */}
            <div>
              <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                Razorpay API Key
              </label>
              <div className="relative">
                <Key size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type={showRazorpayKey ? 'text' : 'password'}
                  value={form.razorpay_key}
                  onChange={e => handleChange('razorpay_key', e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-white border border-[#CBD5E1] rounded-xl text-[13.5px] text-[#0F172A] font-mono outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowRazorpayKey(!showRazorpayKey)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                >
                  {showRazorpayKey ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Input 2 */}
            <div>
              <label className="block text-[11px] font-bold text-[#475569] uppercase tracking-wider mb-1.5">
                Payout Webhook Secret
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type={showWebhookSecret ? 'text' : 'password'}
                  value={form.payout_webhook}
                  onChange={e => handleChange('payout_webhook', e.target.value)}
                  className="w-full h-11 pl-10 pr-10 bg-white border border-[#CBD5E1] rounded-xl text-[13.5px] text-[#0F172A] font-mono outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20 transition-all shadow-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowWebhookSecret(!showWebhookSecret)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#0F172A] cursor-pointer"
                >
                  {showWebhookSecret ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Custom Toggle Switch */}
            <div className="pt-2 flex items-center justify-between p-3.5 rounded-xl bg-[#FAFCFF] border border-[#F1F5F9]">
              <div>
                <p className="text-[13px] font-bold text-[#0F172A]">Enable Auto-Payouts for Claims</p>
                <p className="text-[11px] text-[#94A3B8] mt-0.5">Disburse approved tree insurance payouts automatically</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('auto_payouts', !form.auto_payouts)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 cursor-pointer ${
                  form.auto_payouts ? 'bg-[#16A34A]' : 'bg-[#CBD5E1]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  form.auto_payouts ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </motion.div>

        {/* Card 3: Security & MFA (Spans 2 Cols) */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-5 lg:col-span-2"
        >
          <div className="flex items-center gap-3 border-b border-[#F1F5F9] pb-4">
            <div className="w-9 h-9 rounded-xl bg-[#F5F3FF] flex items-center justify-center text-[#8B5CF6]">
              <Shield size={18} />
            </div>
            <div>
              <h3 className="text-[15px] font-bold text-[#0F172A]">Security & Multi-Factor Authentication</h3>
              <p className="text-[11.5px] text-[#94A3B8]">Enforce credential policies and access control protocols</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Toggle 1 */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFCFF] border border-[#F1F5F9] hover:border-[#E2E8F0] transition-colors">
              <div>
                <p className="text-[13px] font-bold text-[#0F172A]">Require MFA for Super Admins</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Mandatory TOTP/Authenticator app code on sign in</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('require_mfa', !form.require_mfa)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ml-3 cursor-pointer ${
                  form.require_mfa ? 'bg-[#16A34A]' : 'bg-[#CBD5E1]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  form.require_mfa ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>

            {/* Toggle 2 */}
            <div className="flex items-center justify-between p-4 rounded-xl bg-[#FAFCFF] border border-[#F1F5F9] hover:border-[#E2E8F0] transition-colors">
              <div>
                <p className="text-[13px] font-bold text-[#0F172A]">Force Password Reset (90 Days)</p>
                <p className="text-[11px] text-[#64748B] mt-0.5">Quarterly password rotation policy enforcement</p>
              </div>
              <button
                type="button"
                onClick={() => handleChange('force_password_reset', !form.force_password_reset)}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ml-3 cursor-pointer ${
                  form.force_password_reset ? 'bg-[#16A34A]' : 'bg-[#CBD5E1]'
                }`}
              >
                <div className={`w-5 h-5 rounded-full bg-white shadow-md transform transition-transform ${
                  form.force_password_reset ? 'translate-x-6' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>

          <div className="p-4 bg-[#EFF6FF] border border-[#BFDBFE] rounded-xl flex items-start gap-3 text-[12.5px] text-[#1E40AF]">
            <ShieldAlert size={18} className="shrink-0 mt-0.5 text-[#2563EB]" />
            <div>
              <span className="font-bold">Security Compliance Notice:</span> Updating security enforcement policies will invalidate existing active session tokens for non-MFA accounts. All super admins will be prompted to re-authenticate on next request.
            </div>
          </div>
        </motion.div>

      </div>

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {isSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold">Global System Settings saved successfully!</span>
            <button onClick={reset} className="ml-2 text-slate-400 hover:text-white font-bold">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {isError && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[#7C2D12] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-amber-600"
          >
            <AlertCircle size={18} className="text-amber-300" />
            <span className="text-xs font-semibold">Settings logged to console (Endpoint active locally).</span>
            <button onClick={reset} className="ml-2 text-amber-200 hover:text-white font-bold">&times;</button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
