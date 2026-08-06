import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, CheckCircle, XCircle, RefreshCw, Eye, Download, Search, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';
import { useFarmerDocuments, FarmerDocument } from '../api/useDocuments';

const kycStatusLabel = (status: string): string => {
  switch (status) {
    case 'verified': return 'Approved';
    case 'rejected': return 'Rejected';
    case 'submitted': return 'Pending Review';
    case 'pending': return 'Pending';
    default: return 'Not Started';
  }
};

const kycVariant = (status: string): 'success' | 'danger' | 'warning' | 'gray' => {
  switch (status) {
    case 'verified': return 'success';
    case 'rejected': return 'danger';
    case 'submitted': return 'warning';
    default: return 'gray';
  }
};

export const DocumentCenter: React.FC = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [previewDoc, setPreviewDoc] = useState<FarmerDocument | null>(null);

  const { data, isLoading, isError, refetch } = useFarmerDocuments();
  const farmers = data?.items ?? [];

  const filtered = farmers.filter(f => {
    const q = search.toLowerCase();
    const matchSearch = !q || (f.full_name ?? '').toLowerCase().includes(q) || f.mobile.includes(q);
    const label = kycStatusLabel(f.kyc_status);
    const matchStatus = !statusFilter || label === statusFilter;
    return matchSearch && matchStatus;
  });

  const totalDocs = data?.total ?? 0;
  const pending = farmers.filter(f => f.kyc_status === 'submitted' || f.kyc_status === 'pending').length;
  const approved = farmers.filter(f => f.kyc_status === 'verified').length;
  const rejected = farmers.filter(f => f.kyc_status === 'rejected').length;

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Document Center & OCR"
        description="Centralized repository for all KYC, Legal, and Compliance documents with AI OCR verification."
        icon={FileText}
        iconColor="#6366F1"
        actions={
          <button className="btn btn-secondary btn-sm gap-1.5" onClick={() => refetch()}>
            <RefreshCw size={14} /> Refresh
          </button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Documents" value={totalDocs} icon={FileText} iconBg="#EEF2FF" iconColor="#6366F1" />
        <KpiCard title="Pending Review" value={pending} icon={Search} iconBg="#FFFBEB" iconColor="#F59E0B" />
        <KpiCard title="AI OCR Verified" value={approved} icon={ShieldCheck} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="Rejected" value={rejected} icon={XCircle} iconBg="#FEF2F2" iconColor="#EF4444" />
      </div>

      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search} onSearchChange={setSearch}
            searchPlaceholder="Search by farmer name or mobile..."
            filters={[
              {
                key: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter,
                options: [
                  { label: 'Pending Review', value: 'Pending Review' },
                  { label: 'Approved', value: 'Approved' },
                  { label: 'Rejected', value: 'Rejected' },
                ]
              }
            ]}
            onExport={() => {}} onRefresh={() => refetch()} resultCount={filtered.length}
          />
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-slate-400">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading documents…</span>
          </div>
        )}

        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-3 py-16">
            <AlertCircle size={24} className="text-red-400" />
            <p className="text-sm text-slate-500">Failed to load documents.</p>
            <button className="btn btn-secondary btn-sm" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {!isLoading && !isError && (
          <div className="overflow-x-auto">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Farmer Name</th>
                  <th>Mobile</th>
                  <th>Document Type</th>
                  <th>Upload Status</th>
                  <th>State / District</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState icon={FileText} title="No documents found" /></td></tr>
                ) : (
                  filtered.map((farmer, i) => (
                    <motion.tr
                      key={farmer.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <td className="font-medium text-[#0F172A]">{farmer.full_name ?? '—'}</td>
                      <td className="font-mono text-[#64748B] text-[12px]">{farmer.mobile}</td>
                      <td className="font-medium text-[#0F172A]">Aadhaar / PAN / Land Record</td>
                      <td>
                        <StatusBadge
                          label={kycStatusLabel(farmer.kyc_status)}
                          variant={kycVariant(farmer.kyc_status)}
                          size="sm"
                        />
                      </td>
                      <td className="text-[#64748B] text-sm">
                        {[farmer.state, farmer.district].filter(Boolean).join(', ') || '—'}
                      </td>
                      <td className="text-right space-x-2">
                        <button onClick={() => setPreviewDoc(farmer)} className="btn btn-ghost btn-icon btn-sm">
                          <Eye size={14} />
                        </button>
                        <button className="btn btn-ghost btn-icon btn-sm">
                          <Download size={14} />
                        </button>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Preview Modal */}
      <Dialog open={!!previewDoc} onClose={() => setPreviewDoc(null)} maxWidth="md" fullWidth>
        <DialogTitle className="flex justify-between items-center border-b pb-3">
          <div className="font-bold text-lg flex items-center gap-2">
            <FileText className="text-indigo-600" />
            Document Verification: {previewDoc?.full_name}
          </div>
          <StatusBadge label="AI Scanned" variant="success" />
        </DialogTitle>
        <DialogContent className="pt-5 bg-gray-50">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-7">
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400">
                <Typography color="text.secondary">Document Image Preview Placeholder</Typography>
              </div>
            </div>
            <div className="md:col-span-5">
              <Typography variant="h6" className="font-bold mb-4">OCR Extracted Data</Typography>
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500">Name</div>
                    <div className="font-medium">{previewDoc?.full_name ?? '—'}</div>
                  </div>
                  <CheckCircle size={16} className="text-green-500" />
                </div>
                <div className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500">KYC Status</div>
                    <div className="font-medium">
                      {previewDoc ? kycStatusLabel(previewDoc.kyc_status) : '—'}
                    </div>
                  </div>
                  <CheckCircle size={16} className="text-green-500" />
                </div>
                <div className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500">Location</div>
                    <div className="font-medium">
                      {previewDoc
                        ? [previewDoc.state, previewDoc.district].filter(Boolean).join(', ') || '—'
                        : '—'}
                    </div>
                  </div>
                  <CheckCircle size={16} className="text-green-500" />
                </div>
              </div>
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-4 border-t">
          <Button onClick={() => setPreviewDoc(null)} color="inherit">Cancel</Button>
          <Button variant="outlined" color="warning">Request Re-upload</Button>
          <Button variant="outlined" color="error" startIcon={<XCircle size={16} />}>Reject</Button>
          <Button variant="contained" color="success" startIcon={<CheckCircle size={16} />}>Approve</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};
