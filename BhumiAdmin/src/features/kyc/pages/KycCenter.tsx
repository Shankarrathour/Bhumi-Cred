import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, UserCheck, X, Check, AlertTriangle, FileText, Image as ImageIcon } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { Button, IconButton, Chip } from '@mui/material';
import toast from 'react-hot-toast';

import { useKycRequests, useApproveKyc, useRejectKyc } from '../api/useKyc';

export const KycCenter = () => {
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const { data: kycRequests = [], isLoading } = useKycRequests();
  const approveMutation = useApproveKyc();
  const rejectMutation = useRejectKyc();

  const handleApprove = () => {
    if (!selectedRequest) return;
    approveMutation.mutate(selectedRequest.id, {
      onSuccess: () => {
        toast.success('KYC Approved');
        setSelectedRequest(null);
      }
    });
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    rejectMutation.mutate({ farmerId: selectedRequest.id, reason: 'Manual Rejection' }, {
      onSuccess: () => {
        toast.error('KYC Rejected');
        setSelectedRequest(null);
      }
    });
  };

  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="KYC & Identity Verification"
        description="Verify farmer and partner identities, review OCR extracted documents, and ensure compliance."
        icon={ShieldCheck}
        badge={{ label: '2 Pending', variant: 'warning' }}
      />

      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9] flex justify-between items-center bg-[#FAFBFC]">
          <h3 className="font-semibold text-slate-800 flex items-center gap-2"><UserCheck size={18}/> Verification Queue</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Type</th>
                <th>Applicant Name</th>
                <th>Submission Date</th>
                <th>OCR Confidence</th>
                <th>Status</th>
                <th className="text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={7} className="text-center py-8">Loading KYC Requests...</td></tr>
              ) : kycRequests.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8">No Pending KYC Requests</td></tr>
              ) : kycRequests.map((req, i) => (
                <motion.tr key={req.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                  <td className="font-mono text-sm text-slate-500">{req.id.slice(0, 8)}</td>
                  <td><Chip label={req.type} size="small" variant="outlined" color={req.type === 'Farmer' ? 'success' : 'primary'} /></td>
                  <td className="font-semibold text-slate-800">{req.name}</td>
                  <td className="text-slate-500 text-sm">{new Date(req.submitDate).toLocaleDateString()}</td>
                  <td>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div className={`h-full ${req.score > 80 ? 'bg-green-500' : req.score > 60 ? 'bg-yellow-500' : 'bg-red-500'}`} style={{ width: `${req.score}%` }} />
                      </div>
                      <span className="text-xs font-medium">{req.score}%</span>
                    </div>
                  </td>
                  <td>
                    <StatusBadge label={req.status} variant={req.status === 'Approved' ? 'success' : req.status === 'Rejected' ? 'danger' : 'warning'} size="sm" />
                  </td>
                  <td className="text-right">
                    <Button variant="outlined" size="small" onClick={() => setSelectedRequest(req)}>Review</Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <AnimatePresence>
        {selectedRequest && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 0.4 }} exit={{ opacity: 0 }} onClick={() => setSelectedRequest(null)} className="fixed inset-0 bg-black z-40" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 220 }} className="fixed top-0 right-0 h-full w-[600px] max-w-full bg-slate-50 shadow-2xl z-50 flex flex-col border-l border-slate-200">
              <div className="p-5 border-b border-slate-200 bg-white flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">Review KYC: {selectedRequest.name}</h3>
                  <p className="text-sm text-slate-500">{selectedRequest.id} • {selectedRequest.type}</p>
                </div>
                <IconButton onClick={() => setSelectedRequest(null)}><X size={20} /></IconButton>
              </div>
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><ImageIcon size={16}/> Document Image</h4>
                    <div className="h-48 bg-slate-100 rounded-lg flex items-center justify-center border-2 border-dashed border-slate-300">
                      <p className="text-sm text-slate-400">Aadhaar Card Preview</p>
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <h4 className="text-sm font-semibold text-slate-800 mb-2 flex items-center gap-2"><FileText size={16}/> Extracted Data</h4>
                    <div className="space-y-3 text-sm">
                      <div><span className="text-slate-500">Name:</span> <span className="font-medium">{selectedRequest.name}</span></div>
                      <div><span className="text-slate-500">ID Number:</span> <span className="font-medium">XXXX-XXXX-1234</span></div>
                      <div><span className="text-slate-500">DOB:</span> <span className="font-medium">01/01/1980</span></div>
                      <div><span className="text-slate-500">Match Score:</span> <span className="font-medium text-green-600">{selectedRequest.score}%</span></div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-xl border border-yellow-200 flex items-start gap-3">
                  <AlertTriangle size={20} className="text-yellow-600 shrink-0" />
                  <p className="text-sm text-yellow-800">Please verify that the document image clearly matches the extracted data before approving. Rejections require a reason.</p>
                </div>
              </div>
              <div className="p-5 border-t border-slate-200 bg-white flex justify-end gap-3 shrink-0">
                <Button variant="outlined" color="error" startIcon={<X size={18} />} onClick={handleReject} disabled={rejectMutation.isPending}>Reject</Button>
                <Button variant="contained" color="success" startIcon={<Check size={18} />} onClick={handleApprove} disabled={approveMutation.isPending}>Approve Identity</Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
