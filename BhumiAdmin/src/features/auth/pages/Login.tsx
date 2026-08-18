import React, { useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Leaf, Lock, Mail, ChevronRight, Shield, BarChart3, Globe2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { login } from '../../../store/slices/authSlice';
import { loginApi } from '../api/authApi';
import { setAdminTokens } from '../../../api/apiClient';

const FEATURES = [
  { icon: Globe2,    title: 'Command Center',    desc: 'Real-time satellite & drone monitoring' },
  { icon: BarChart3, title: 'Carbon Registry',   desc: 'End-to-end tCO2e tracking & issuance' },
  { icon: Shield,    title: 'Enterprise Security', desc: 'Role-based access for 11 admin types' },
];

const DEMO_ACCOUNTS = [
  { label: 'Super Admin',    email: 'superadmin@bhumicred.com',     password: 'Superadmin@1234' },
  { label: 'Finance Mgr.',   email: 'financemanager@bhumicred.com', password: 'Finance@1234'    },
  { label: 'Carbon Mgr.',    email: 'carbonmanager@bhumicred.com',  password: 'Carbon@1234'     },
];

export const Login = () => {
  const [email, setEmail]       = useState('superadmin@bhumicred.com');
  const [password, setPassword] = useState('Superadmin@1234');
  const [showPwd, setShowPwd]   = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const dispatch   = useDispatch();
  const navigate   = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    setLoading(true);
    setError('');

    try {
      const response = await loginApi({ email, password });
      setAdminTokens(response.tokens.access_token, response.tokens.refresh_token);
      localStorage.setItem('token', response.tokens.access_token);
      localStorage.setItem('refreshToken', response.tokens.refresh_token);
      localStorage.setItem('admin_access_token', response.tokens.access_token);
      localStorage.setItem('admin_refresh_token', response.tokens.refresh_token);
      dispatch(login({
        token: response.tokens.access_token,
        user: {
          id: response.admin.id,
          name: response.admin.name,
          email: response.admin.email,
          role: response.admin.role as any,
          permissions: [],
        },
      }));
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.detail || err?.response?.data?.message || err.message || 'Login failed.';
      setError(typeof msg === 'string' ? msg : 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemo = (acc: typeof DEMO_ACCOUNTS[0]) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  return (
    <div className="min-h-screen flex bg-[#F8FAFC]">

      {/* ── Left brand panel ── */}
      <motion.div
        initial={{ x: -30, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.4 }}
        className="hidden lg:flex flex-col justify-between w-[480px] shrink-0 bg-[#0F172A] p-10 relative overflow-hidden"
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#16A34A] rounded-full -translate-y-1/2 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-[#2563EB] rounded-full translate-y-1/2 -translate-x-1/4" />
        </div>

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-12">
            <div className="w-10 h-10 bg-[#16A34A] rounded-[12px] flex items-center justify-center">
              <Leaf size={20} className="text-white" />
            </div>
            <div>
              <div className="text-white text-[18px] font-700" style={{ fontWeight: 700 }}>BhumiCred</div>
              <div className="text-[#64748B] text-[11px]">Enterprise Console</div>
            </div>
          </div>

          <h1 className="text-[32px] font-700 text-white leading-tight mb-4" style={{ fontWeight: 700 }}>
            India's Leading<br />
            <span className="text-[#16A34A]">Carbon Agriculture</span><br />
            Operations Platform
          </h1>
          <p className="text-[#94A3B8] text-[14px] leading-relaxed mb-10">
            Manage 45,000+ farmers, 1.2M tCO2e of carbon credits, land parcels, and the full agri-finance ecosystem from one unified console.
          </p>

          {/* Feature list */}
          <div className="space-y-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="flex items-center gap-3"
              >
                <div className="w-9 h-9 rounded-[10px] bg-white/8 flex items-center justify-center shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }}>
                  <f.icon size={16} className="text-[#16A34A]" />
                </div>
                <div>
                  <div className="text-[13px] font-600 text-white" style={{ fontWeight: 600 }}>{f.title}</div>
                  <div className="text-[11.5px] text-[#64748B]">{f.desc}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer stats */}
        <div className="relative z-10 grid grid-cols-3 gap-4 pt-8 border-t border-white/10">
          {[{ v: '45K+', l: 'Farmers' }, { v: '1.2M', l: 'tCO2e' }, { v: '₹12.8Cr', l: 'Platform Wallet' }].map(s => (
            <div key={s.l}>
              <div className="text-[18px] font-700 text-white" style={{ fontWeight: 700 }}>{s.v}</div>
              <div className="text-[11px] text-[#64748B]">{s.l}</div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* ── Right login form ── */}
      <div className="flex-1 flex items-center justify-center p-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35, delay: 0.1 }}
          className="w-full max-w-[400px]"
        >
          {/* Mobile logo */}
          <div className="flex items-center gap-2.5 mb-8 lg:hidden">
            <div className="w-8 h-8 bg-[#16A34A] rounded-[10px] flex items-center justify-center">
              <Leaf size={16} className="text-white" />
            </div>
            <span className="text-[16px] font-700 text-[#0F172A]" style={{ fontWeight: 700 }}>BhumiCred</span>
          </div>

          <div className="mb-7">
            <h2 className="text-[24px] font-700 text-[#0F172A] mb-1" style={{ fontWeight: 700 }}>Sign in</h2>
            <p className="text-[13.5px] text-[#64748B]">Access the Enterprise Operations Platform</p>
          </div>

          {/* Demo account quick-fill */}
          <div className="mb-5">
            <p className="text-[11.5px] text-[#94A3B8] mb-2 font-500" style={{ fontWeight: 500 }}>DEMO ACCOUNTS</p>
            <div className="flex gap-2 flex-wrap">
              {DEMO_ACCOUNTS.map(acc => (
                <button
                  key={acc.email}
                  type="button"
                  onClick={() => fillDemo(acc)}
                  className="text-[11.5px] px-3 py-1.5 rounded-[8px] border border-[#E2E8F0] bg-white text-[#64748B] hover:border-[#16A34A] hover:text-[#16A34A] hover:bg-[#F0FDF4] transition-all"
                >
                  {acc.label}
                </button>
              ))}
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-[12.5px] font-500 text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>
                Email address <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@bhumicred.com"
                  className="ent-input pl-9"
                  id="login-email"
                  autoComplete="email"
                  required
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <label className="block text-[12.5px] font-500 text-[#374151] mb-1.5" style={{ fontWeight: 500 }}>
                Password <span className="text-[#EF4444]">*</span>
              </label>
              <div className="relative">
                <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••"
                  className="ent-input pl-9 pr-10"
                  id="login-password"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B]"
                >
                  {showPwd ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-2 p-3 bg-[#FEF2F2] border border-[#FECACA] rounded-[10px]"
              >
                <div className="w-4 h-4 rounded-full bg-[#EF4444] flex items-center justify-center shrink-0">
                  <span className="text-white text-[10px] font-700" style={{ fontWeight: 700 }}>!</span>
                </div>
                <p className="text-[12.5px] text-[#DC2626]">{error}</p>
              </motion.div>
            )}

            {/* Submit */}
            <button
              type="submit"
              id="login-submit"
              disabled={loading}
              className="w-full btn btn-primary justify-center h-10 text-[14px] font-600 mt-2"
              style={{ fontWeight: 600, height: 44 }}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Signing in...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  Sign in <ChevronRight size={16} />
                </div>
              )}
            </button>
          </form>

          {/* Footer */}
          <div className="mt-6 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <div className="live-dot" />
              <span className="text-[11.5px] text-[#94A3B8]">System operational</span>
            </div>
            <span className="text-[11px] text-[#CBD5E1]">v1.0.0 · 2026</span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
