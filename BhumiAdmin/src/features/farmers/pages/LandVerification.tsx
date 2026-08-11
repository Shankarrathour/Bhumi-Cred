import { useState } from 'react';
import { MapPin, CheckCircle, XCircle, RefreshCw, Map, Search, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useLandVerification, useVerifyLandParcel } from '../api/useFarmers';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import toast from 'react-hot-toast';

export const LandVerification = () => {
  const [search, setSearch] = useState('');
  const [rejectModal, setRejectModal] = useState<{ parcelId: string; farmerName: string } | null>(null);
  const [remarks, setRemarks] = useState('');

  const { data: parcels = [], isLoading, refetch, isFetching } = useLandVerification();
  const verifyMutation = useVerifyLandParcel();

  const filtered = parcels.filter(p => {
    const q = search.toLowerCase();
    return !q || [p.farmer_name, p.farmer_mobile, p.state, p.district, p.village].some(v => v?.toLowerCase().includes(q));
  });

  const handleVerify = async (parcelId: string, farmerName: string) => {
    try {
      await verifyMutation.mutateAsync({ parcelId, action: 'approved' });
      toast.success(`Land parcel for ${farmerName} verified successfully!`);
    } catch {
      toast.error('Failed to verify land parcel.');
    }
  };

  const handleReject = async () => {
    if (!rejectModal) return;
    if (!remarks.trim()) {
      toast.error('Please provide rejection remarks.');
      return;
    }
    try {
      await verifyMutation.mutateAsync({ parcelId: rejectModal.parcelId, action: 'rejected', remarks });
      toast.success(`Land parcel rejected for ${rejectModal.farmerName}.`);
      setRejectModal(null);
      setRemarks('');
    } catch {
      toast.error('Failed to reject land parcel.');
    }
  };

  return (
    <div className="space-y-6 page-enter pb-8" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      <PageHeader
        title="Land Verification Queue"
        description="GIS boundary verification for farmer land parcels. Review satellite-mapped boundaries before approving carbon project enrollment."
        badge={{ label: `${filtered.length} Parcels Pending`, variant: 'warning' }}
        icon={Map}
        actions={
          <button onClick={() => refetch()} className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer">
            <RefreshCw size={13} className={isFetching ? 'animate-spin' : ''} />
            Refresh
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="TOTAL PENDING" value={parcels.length} icon={Map} iconBg="#FFFBEB" iconColor="#F59E0B" loading={isLoading} />
        <KpiCard title="APPROVED TODAY" value={0} icon={CheckCircle} iconBg="#F0FDF4" iconColor="#16A34A" loading={isLoading} />
        <KpiCard title="REJECTED TODAY" value={0} icon={XCircle} iconBg="#FEF2F2" iconColor="#EF4444" loading={isLoading} />
        <KpiCard title="STATES COVERED" value={new Set(parcels.map(p => p.state)).size} icon={MapPin} iconBg="#EFF6FF" iconColor="#2563EB" loading={isLoading} />
      </div>

      {/* Search */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs">
        <div className="relative">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by farmer name, mobile, state, district, village..."
            className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] placeholder-[#94A3B8] outline-none focus:border-[#16A34A] focus:bg-white transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E8EDF5]">
                {['Farmer', 'Mobile', 'Location', 'Area (Acres)', 'Crop Type', 'Submitted', 'Actions'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-bold text-[#64748B] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="px-4 py-3">
                        <div className="h-4 bg-slate-100 animate-pulse rounded-lg" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-12 h-12 bg-[#F0FDF4] rounded-2xl flex items-center justify-center">
                        <CheckCircle size={24} className="text-[#16A34A]" />
                      </div>
                      <p className="text-[#64748B] font-medium">No parcels pending verification</p>
                      <p className="text-[#94A3B8] text-xs">All land parcels have been reviewed</p>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((parcel, i) => (
                  <motion.tr
                    key={parcel.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                    className="hover:bg-[#F8FAFC] transition-colors"
                  >
                    <td className="px-4 py-3">
                      <div className="font-semibold text-[#0F172A]">{parcel.farmer_name || '—'}</div>
                      <div className="text-[11px] text-[#94A3B8]">{parcel.farmer_public_id || parcel.farmer_id || ''}</div>
                    </td>
                    <td className="px-4 py-3 text-[#475569]">{parcel.farmer_mobile || '—'}</td>
                    <td className="px-4 py-3">
                      <div className="text-[#475569]">{parcel.village || '—'}</div>
                      <div className="text-[11px] text-[#94A3B8]">{parcel.district}, {parcel.state}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-[#0F172A]">{parcel.area_acres?.toFixed(2) || '—'}</td>
                    <td className="px-4 py-3 text-[#475569]">{parcel.crop_type || '—'}</td>
                    <td className="px-4 py-3 text-[#94A3B8] text-[11px]">
                      {parcel.created_at ? new Date(parcel.created_at).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleVerify(parcel.id, parcel.farmer_name || 'Farmer')}
                          disabled={verifyMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11px] font-semibold rounded-lg border border-[#BBF7D0] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <CheckCircle size={12} /> Verify
                        </button>
                        <button
                          onClick={() => setRejectModal({ parcelId: parcel.id, farmerName: parcel.farmer_name || 'Farmer' })}
                          disabled={verifyMutation.isPending}
                          className="flex items-center gap-1 px-3 py-1.5 bg-[#FEF2F2] hover:bg-[#FEE2E2] text-[#EF4444] text-[11px] font-semibold rounded-lg border border-[#FECACA] transition-colors cursor-pointer disabled:opacity-50"
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reject Modal */}
      <AnimatePresence>
        {rejectModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
            onClick={() => setRejectModal(null)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6"
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-[#FEF2F2] rounded-xl flex items-center justify-center">
                  <AlertTriangle size={20} className="text-[#EF4444]" />
                </div>
                <div>
                  <h3 className="font-bold text-[#0F172A]">Reject Land Parcel</h3>
                  <p className="text-[12px] text-[#64748B]">For: {rejectModal.farmerName}</p>
                </div>
              </div>
              <textarea
                value={remarks}
                onChange={e => setRemarks(e.target.value)}
                placeholder="Provide rejection reason (required)..."
                className="w-full p-3 border border-[#E2E8F0] rounded-xl text-[13px] resize-none h-24 focus:border-[#EF4444] outline-none mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setRejectModal(null); setRemarks(''); }}
                  className="flex-1 py-2.5 border border-[#E2E8F0] rounded-xl text-[13px] font-medium text-[#64748B] hover:bg-[#F8FAFC] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={verifyMutation.isPending}
                  className="flex-1 py-2.5 bg-[#EF4444] hover:bg-[#DC2626] text-white rounded-xl text-[13px] font-semibold cursor-pointer disabled:opacity-50"
                >
                  {verifyMutation.isPending ? 'Rejecting...' : 'Reject Parcel'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
