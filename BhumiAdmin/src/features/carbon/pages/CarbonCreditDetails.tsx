import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, Cloud, ShieldCheck, DollarSign, Download, Sparkles,
  Handshake, Cpu, CheckCircle2, FileText
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import toast from 'react-hot-toast';

export const CarbonCreditDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'buyer' | 'mrv' | 'retirement'>('overview');

  const safeId = id || 'CRD-9001';

  const batch = {
    id: safeId,
    batchId: `BCH-CRD-${safeId.slice(-4).toUpperCase()}`,
    projectName: 'MP Agroforestry Carbon Sink Drive',
    projectCode: 'PRJ-1042',
    vintageYear: 2025,
    treeSpecies: 'Teak & Bamboo',
    location: 'Sehore, Madhya Pradesh',
    totalVolumeTco2: 150000,
    creditsIssued: 150000,
    creditsSold: 120000,
    creditsAvailable: 30000,
    buyerName: 'AgriCorp Offtaker Solutions Pvt Ltd',
    buyerPan: 'AAACP9012K',
    pricePerTco2Usd: 18.5,
    totalRevenueLakhs: 222.0,
    farmerShareLakhs: 155.4,
    verificationStandard: 'Verra VM0042 Standard',
    verraSerial: 'VRA-2025-MP-1042-880912-9901',
    mrvConfidenceScore: 98.5,
    status: 'Issued',
  };

  const handleRetireCredits = () => {
    toast.success(`Retired ${batch.creditsAvailable.toLocaleString()} tCO₂e Carbon Credits under certificate RET-2026-8801!`);
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── HEADER & CONTROL BAR ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => navigate('/carbon')}
            className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all cursor-pointer"
            title="Back to Carbon Registry"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center text-[#16A34A] shrink-0">
            <Cloud size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-[18px] font-bold text-[#0F172A]">{batch.projectName}</h1>
              <span className="font-mono text-[11px] font-bold text-[#2563EB] bg-[#EFF6FF] px-2.5 py-0.5 rounded-md border border-[#DBEAFE]">
                {batch.batchId}
              </span>
              <StatusBadge label={batch.status} variant="success" size="sm" />
            </div>
            <p className="text-[12px] text-[#64748B] mt-0.5 flex items-center gap-2">
              <span>Vintage {batch.vintageYear}</span> • <span>{batch.location}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button onClick={() => toast.success('Downloading Official Verra Credit Certificate')} className="btn btn-secondary btn-sm gap-1.5 cursor-pointer">
            <Download size={14} /> Download Certificate
          </button>
          <button onClick={handleRetireCredits} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
            <Sparkles size={14} /> Retire Credits
          </button>
        </div>
      </div>

      {/* ── KPI METRIC CARDS ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="TOTAL BATCH VOLUME" value={`${batch.totalVolumeTco2.toLocaleString()} tCO₂e`} icon={Cloud} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="CREDITS SOLD" value={`${batch.creditsSold.toLocaleString()} tCO₂e`} icon={CheckCircle2} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="AVAILABLE FOR SALE" value={`${batch.creditsAvailable.toLocaleString()} tCO₂e`} icon={Sparkles} iconBg="#FFFBEB" iconColor="#D97706" />
        <KpiCard title="TOTAL REVENUE" value={`₹${batch.totalRevenueLakhs} Lakhs`} icon={DollarSign} iconBg="#FEF2F2" iconColor="#EF4444" />
      </div>

      {/* ── INTERACTIVE TABS NAV ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-1.5 shadow-xs flex items-center gap-1">
        {[
          { id: 'overview', label: '1. Batch Overview & Metadata', icon: FileText },
          { id: 'buyer', label: '2. Buyer & Trading Contract', icon: Handshake },
          { id: 'mrv', label: '3. MRV Proof & Satellite Data', icon: Cpu },
          { id: 'retirement', label: '4. Retirement & Offsetting', icon: ShieldCheck },
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7] shadow-xs'
                  : 'text-[#64748B] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon size={14} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ── TAB 1: BATCH OVERVIEW ── */}
      {activeTab === 'overview' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <FileText size={18} className="text-[#16A34A]" /> Registry Metadata & Verra Verification
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Verra Registry Serial</span>
              <p className="text-[13.5px] font-mono font-bold text-[#2563EB]">{batch.verraSerial}</p>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Verification Protocol</span>
              <p className="text-[13.5px] font-bold text-[#0F172A]">{batch.verificationStandard}</p>
            </div>
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Unit Price</span>
              <p className="text-[13.5px] font-bold text-[#16A34A]">${batch.pricePerTco2Usd} / tCO₂e</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 2: BUYER & TRADING ── */}
      {activeTab === 'buyer' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <Handshake size={18} className="text-[#2563EB]" /> Corporate Offtaker Buyer Contract
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#64748B]">Buyer Enterprise Name</span>
              <p className="text-[14px] font-bold text-[#0F172A]">{batch.buyerName}</p>
              <span className="text-[11px] font-mono text-[#64748B]">PAN: {batch.buyerPan}</span>
            </div>
            <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#16A34A]">Quantity Offtaken</span>
              <p className="text-[20px] font-extrabold text-[#16A34A]">{batch.creditsSold.toLocaleString()} tCO₂e</p>
            </div>
            <div className="p-4 bg-[#EFF6FF] border border-[#DBEAFE] rounded-xl space-y-1">
              <span className="text-[11px] font-bold text-[#2563EB]">Farmer Distribution (70%)</span>
              <p className="text-[20px] font-extrabold text-[#2563EB]">₹{batch.farmerShareLakhs} Lakhs</p>
            </div>
          </div>
        </div>
      )}

      {/* ── TAB 3: MRV PROOF ── */}
      {activeTab === 'mrv' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
            <Cpu size={18} className="text-[#16A34A]" /> Satellite Biomass & Telemetry Verification Proof
          </h3>

          <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-xl flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-[#16A34A]">AI Drone MRV Audit Confidence</span>
              <p className="text-[22px] font-extrabold text-[#16A34A]">{batch.mrvConfidenceScore}% Verified</p>
            </div>
            <StatusBadge label="Audit Passed" variant="success" size="md" />
          </div>
        </div>
      )}

      {/* ── TAB 4: RETIREMENT CERTIFICATE ── */}
      {activeTab === 'retirement' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-4">
            <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
              <ShieldCheck size={18} className="text-[#16A34A]" /> Offsetting & Retirement Certificate
            </h3>
            <button onClick={() => toast.success('Downloading Official Retirement PDF Certificate')} className="btn btn-primary btn-sm gap-1.5 cursor-pointer">
              <Download size={14} /> Download Retirement Certificate
            </button>
          </div>

          <div className="p-4 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl space-y-1">
            <span className="text-[11px] font-bold text-[#64748B]">Retirement Certificate Serial</span>
            <p className="text-[14px] font-mono font-bold text-[#2563EB]">RET-2026-8801-MP-AGRI</p>
            <p className="text-[12px] text-[#64748B]">Permanently retired on behalf of {batch.buyerName} for Scope 3 emissions offset.</p>
          </div>
        </div>
      )}

    </div>
  );
};
