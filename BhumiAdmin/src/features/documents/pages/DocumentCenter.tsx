import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, CheckCircle, XCircle, RefreshCw, Eye, Download, Search, ShieldCheck } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { FilterBar } from '../../../components/ui/FilterBar';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Grid } from '@mui/material';

const MOCK_DOCUMENTS = [
  { id: 'DOC-9001', entity: 'Farmer', entityName: 'Ramesh Kumar', type: 'Aadhaar', uploadedAt: '12 Aug 2025, 09:30 AM', status: 'Pending Review' },
  { id: 'DOC-9002', entity: 'Partner', entityName: 'AgriCorp', type: 'Agreement', uploadedAt: '11 Aug 2025, 14:15 PM', status: 'Approved' },
  { id: 'DOC-9003', entity: 'Government', entityName: 'Dept of Agri', type: 'MOU', uploadedAt: '10 Aug 2025, 11:00 AM', status: 'Approved' },
  { id: 'DOC-9004', entity: 'Farmer', entityName: 'Suresh Patel', type: 'Land Registry', uploadedAt: '09 Aug 2025, 16:45 PM', status: 'Rejected' },
];

export const DocumentCenter: React.FC = () => {
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const [previewDoc, setPreviewDoc] = useState<any>(null);

  const filtered = MOCK_DOCUMENTS.filter(doc => {
    const q = search.toLowerCase();
    const matchSearch = !q || doc.entityName.toLowerCase().includes(q) || doc.type.toLowerCase().includes(q) || doc.id.toLowerCase().includes(q);
    const matchEntity = !entityFilter || doc.entity === entityFilter;
    const matchStatus = !statusFilter || doc.status === statusFilter;
    return matchSearch && matchEntity && matchStatus;
  });

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="Document Center & OCR"
        description="Centralized repository for all KYC, Legal, and Compliance documents with AI OCR verification."
        icon={FileText}
        iconColor="#6366F1"
        actions={
          <button className="btn btn-primary btn-sm gap-1.5"><RefreshCw size={14} /> Refresh</button>
        }
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Documents" value={15420} icon={FileText} iconBg="#EEF2FF" iconColor="#6366F1" />
        <KpiCard title="Pending Review" value={34} icon={Search} iconBg="#FFFBEB" iconColor="#F59E0B" />
        <KpiCard title="AI OCR Verified" value={12500} icon={ShieldCheck} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="Rejected" value={42} icon={XCircle} iconBg="#FEF2F2" iconColor="#EF4444" />
      </div>

      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9]">
          <FilterBar
            search={search} onSearchChange={setSearch}
            searchPlaceholder="Search by document ID, name, type..."
            filters={[
              {
                key: 'entity', label: 'Entity Type', value: entityFilter, onChange: setEntityFilter,
                options: [
                  { label: 'Farmer', value: 'Farmer' },
                  { label: 'Government', value: 'Government' },
                  { label: 'Partner', value: 'Partner' }
                ]
              },
              {
                key: 'status', label: 'Status', value: statusFilter, onChange: setStatusFilter,
                options: [
                  { label: 'Pending Review', value: 'Pending Review' },
                  { label: 'Approved', value: 'Approved' },
                  { label: 'Rejected', value: 'Rejected' }
                ]
              }
            ]}
            onExport={() => {}} onRefresh={() => {}} resultCount={filtered.length}
          />
        </div>

        <div className="overflow-x-auto">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Document ID</th>
                <th>Entity Type</th>
                <th>Entity Name</th>
                <th>Document Type</th>
                <th>Uploaded At</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={7}><EmptyState icon={FileText} title="No documents found" /></td></tr>
              ) : (
                filtered.map((doc, i) => (
                  <motion.tr key={doc.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }}>
                    <td className="font-mono text-[#64748B] text-[12px]">{doc.id}</td>
                    <td className="font-medium text-[#0F172A]">{doc.entity}</td>
                    <td className="text-[#64748B]">{doc.entityName}</td>
                    <td className="font-medium text-[#0F172A]">{doc.type}</td>
                    <td className="text-[#64748B] text-[12px]">{doc.uploadedAt}</td>
                    <td>
                      <StatusBadge 
                        label={doc.status} 
                        variant={doc.status === 'Approved' ? 'success' : doc.status === 'Rejected' ? 'danger' : 'warning'} 
                        size="sm" 
                      />
                    </td>
                    <td className="text-right space-x-2">
                      <button onClick={() => setPreviewDoc(doc)} className="btn btn-ghost btn-icon btn-sm"><Eye size={14} /></button>
                      <button className="btn btn-ghost btn-icon btn-sm"><Download size={14} /></button>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mock OCR Preview Modal */}
      <Dialog open={!!previewDoc} onClose={() => setPreviewDoc(null)} maxWidth="md" fullWidth>
        <DialogTitle className="flex justify-between items-center border-b pb-3">
          <div className="font-bold text-lg flex items-center gap-2">
            <FileText className="text-indigo-600" />
            Document Verification: {previewDoc?.type}
          </div>
          <StatusBadge label="AI Scanned" variant="success" />
        </DialogTitle>
        <DialogContent className="pt-5 bg-gray-50">
          <Grid container spacing={4}>
            {/* Left side: Image Preview Mock */}
            <Grid item xs={12} md={7}>
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-400">
                <Typography color="text.secondary">Document Image Preview Placeholder</Typography>
              </div>
            </Grid>
            {/* Right side: OCR Results Mock */}
            <Grid item xs={12} md={5}>
              <Typography variant="h6" className="font-bold mb-4">OCR Extracted Data</Typography>
              <div className="space-y-4">
                <div className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500">Name</div>
                    <div className="font-medium">{previewDoc?.entityName}</div>
                  </div>
                  <CheckCircle size={16} className="text-green-500" />
                </div>
                <div className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center">
                  <div>
                    <div className="text-xs text-gray-500">Document ID Number</div>
                    <div className="font-medium font-mono">XXXX-XXXX-1234</div>
                  </div>
                  <CheckCircle size={16} className="text-green-500" />
                </div>
                <div className="bg-white p-3 rounded-lg border shadow-sm flex justify-between items-center border-red-200">
                  <div>
                    <div className="text-xs text-red-500">Address (Mismatch)</div>
                    <div className="font-medium text-sm">123 Farm Road, District A</div>
                  </div>
                  <XCircle size={16} className="text-red-500" />
                </div>
                <div className="p-3 bg-yellow-50 text-yellow-800 rounded-lg text-sm border border-yellow-200">
                  <strong>AI Alert:</strong> The address in the document does not exactly match the registration address. Manual review required.
                </div>
              </div>
            </Grid>
          </Grid>
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
