import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, RefreshCw, Eye, Download, Search,
  ShieldCheck, Cpu, Filter, User, Building2, Handshake,
  RotateCcw, History, Check, X, Sparkles
} from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import toast from 'react-hot-toast';

export interface AdminDocumentItem {
  id: string;
  doc_number: string;
  entity_type: 'Farmer' | 'Government' | 'Partner';
  entity_name: string;
  entity_id: string;
  doc_category: 'Aadhaar' | 'PAN' | 'Land' | 'Bank' | 'Insurance' | 'Agreement';
  file_name: string;
  file_size: string;
  upload_date: string;
  ocr_match_score: number;
  ocr_extracted_name: string;
  ocr_extracted_id: string;
  verification_status: 'Approved' | 'Pending Review' | 'Rejected' | 'Re-upload Requested';
  history_logs: { action: string; timestamp: string; actor: string }[];
}

const SEEDED_DOCUMENTS: AdminDocumentItem[] = [
  {
    id: 'DOC-9001',
    doc_number: 'AADHAAR-8902-1102-4091',
    entity_type: 'Farmer',
    entity_name: 'Ramesh Patel',
    entity_id: 'F-84920',
    doc_category: 'Aadhaar',
    file_name: 'Aadhaar_Card_RameshPatel.pdf',
    file_size: '1.8 MB',
    upload_date: '04 Aug 2026',
    ocr_match_score: 98.5,
    ocr_extracted_name: 'Rameshwar Patel',
    ocr_extracted_id: '8902 1102 4091',
    verification_status: 'Approved',
    history_logs: [
      { action: 'Approved by KYC Admin', timestamp: '04 Aug 2026, 14:30', actor: 'KYC Admin' },
      { action: 'AI OCR Match 98.5% Passed', timestamp: '04 Aug 2026, 14:28', actor: 'BhumiCred AI OCR' },
    ]
  },
  {
    id: 'DOC-9002',
    doc_number: 'PAN-AAACP9012K',
    entity_type: 'Partner',
    entity_name: 'AgriCorp Solutions Pvt Ltd',
    entity_id: 'PRT-1001',
    doc_category: 'PAN',
    file_name: 'Company_PAN_AgriCorp.pdf',
    file_size: '2.4 MB',
    upload_date: '03 Aug 2026',
    ocr_match_score: 99.1,
    ocr_extracted_name: 'AGRICORP SOLUTIONS PVT LTD',
    ocr_extracted_id: 'AAACP9012K',
    verification_status: 'Approved',
    history_logs: [
      { action: 'Approved by Partner Admin', timestamp: '03 Aug 2026, 11:15', actor: 'Super Admin' },
    ]
  },
  {
    id: 'DOC-9003',
    doc_number: 'KHASRA-402/A-2026',
    entity_type: 'Farmer',
    entity_name: 'Suresh Verma',
    entity_id: 'F-71029',
    doc_category: 'Land',
    file_name: 'Khasra_Khatauni_SUR402A.pdf',
    file_size: '3.1 MB',
    upload_date: '02 Aug 2026',
    ocr_match_score: 84.0,
    ocr_extracted_name: 'Suresh Kumar Verma',
    ocr_extracted_id: 'SUR-402/A',
    verification_status: 'Pending Review',
    history_logs: [
      { action: 'Uploaded via Farmer Mobile App', timestamp: '02 Aug 2026, 09:10', actor: 'Suresh Verma' },
    ]
  },
  {
    id: 'DOC-9004',
    doc_number: 'MOU-GOVT-MP-2026',
    entity_type: 'Government',
    entity_name: 'MP Forest Development Board',
    entity_id: 'GOVT-MP-101',
    doc_category: 'Agreement',
    file_name: 'Official_MOU_Forest_Dept.pdf',
    file_size: '5.2 MB',
    upload_date: '01 Aug 2026',
    ocr_match_score: 100.0,
    ocr_extracted_name: 'MP Forest Development Board',
    ocr_extracted_id: 'GOVT-DEPT-MP-401',
    verification_status: 'Approved',
    history_logs: [
      { action: 'MOU Signed & Verified', timestamp: '01 Aug 2026, 16:45', actor: 'Govt Admin' },
    ]
  },
  {
    id: 'DOC-9005',
    doc_number: 'BANK-PASSBOOK-9901',
    entity_type: 'Farmer',
    entity_name: 'Anita Devi',
    entity_id: 'F-40291',
    doc_category: 'Bank',
    file_name: 'SBI_Passbook_AnitaDevi.jpg',
    file_size: '1.4 MB',
    upload_date: '31 Jul 2026',
    ocr_match_score: 62.0,
    ocr_extracted_name: 'Anita D',
    ocr_extracted_id: 'SBIN0001024-XXXX9901',
    verification_status: 'Re-upload Requested',
    history_logs: [
      { action: 'Re-upload Requested (Blurry Image)', timestamp: '31 Jul 2026, 18:20', actor: 'Finance Admin' },
    ]
  },
  {
    id: 'DOC-9006',
    doc_number: 'INS-POLICY-TREE-4401',
    entity_type: 'Farmer',
    entity_name: 'Mohan Singh',
    entity_id: 'F-50124',
    doc_category: 'Insurance',
    file_name: 'Tree_Insurance_Policy.pdf',
    file_size: '2.1 MB',
    upload_date: '29 Jul 2026',
    ocr_match_score: 97.4,
    ocr_extracted_name: 'Mohan Singh',
    ocr_extracted_id: 'IRDAI-TREE-4401',
    verification_status: 'Approved',
    history_logs: [
      { action: 'Policy Verified with EcoShield', timestamp: '29 Jul 2026, 10:05', actor: 'Insurance Admin' },
    ]
  },
];

export const DocumentCenter = () => {
  const [documents, setDocuments] = useState<AdminDocumentItem[]>(SEEDED_DOCUMENTS);
  const [search, setSearch] = useState('');
  const [entityFilter, setEntityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog State
  const [previewDoc, setPreviewDoc] = useState<AdminDocumentItem | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'ocr' | 'preview' | 'history'>('ocr');
  const [isOcrScanning, setIsOcrScanning] = useState(false);

  const filteredDocs = useMemo(() => {
    return documents.filter(d => {
      const q = search.toLowerCase();
      const matchSearch = !q || [
        d.entity_name, d.entity_id, d.file_name, d.doc_number, d.ocr_extracted_name
      ].some(v => v?.toLowerCase().includes(q));

      const matchEntity = !entityFilter || d.entity_type === entityFilter;
      const matchCategory = !categoryFilter || d.doc_category === categoryFilter;
      const matchStatus = !statusFilter || d.verification_status === statusFilter;

      return matchSearch && matchEntity && matchCategory && matchStatus;
    });
  }, [documents, search, entityFilter, categoryFilter, statusFilter]);

  const totalDocs = documents.length;
  const approvedDocs = documents.filter(d => d.verification_status === 'Approved').length;
  const pendingDocs = documents.filter(d => d.verification_status === 'Pending Review').length;
  const reuploadDocs = documents.filter(d => d.verification_status === 'Re-upload Requested').length;

  const handleApproveDoc = (docId: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        toast.success(`Document ${d.doc_number} Approved!`);
        return {
          ...d,
          verification_status: 'Approved',
          history_logs: [
            { action: 'Approved by Admin', timestamp: new Date().toLocaleString(), actor: 'Super Admin' },
            ...d.history_logs
          ]
        };
      }
      return d;
    }));
    if (previewDoc && previewDoc.id === docId) {
      setPreviewDoc(null);
    }
  };

  const handleRejectDoc = (docId: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        toast.error(`Document ${d.doc_number} Rejected.`);
        return {
          ...d,
          verification_status: 'Rejected',
          history_logs: [
            { action: 'Rejected by Admin', timestamp: new Date().toLocaleString(), actor: 'Super Admin' },
            ...d.history_logs
          ]
        };
      }
      return d;
    }));
    if (previewDoc && previewDoc.id === docId) {
      setPreviewDoc(null);
    }
  };

  const handleRequestReupload = (docId: string) => {
    setDocuments(prev => prev.map(d => {
      if (d.id === docId) {
        toast.success(`Re-upload request sent to ${d.entity_name}!`);
        return {
          ...d,
          verification_status: 'Re-upload Requested',
          history_logs: [
            { action: 'Re-upload Notification Sent', timestamp: new Date().toLocaleString(), actor: 'KYC Admin' },
            ...d.history_logs
          ]
        };
      }
      return d;
    }));
    if (previewDoc && previewDoc.id === docId) {
      setPreviewDoc(null);
    }
  };

  const runOcrScan = (_: string) => {
    setIsOcrScanning(true);
    setTimeout(() => {
      setIsOcrScanning(false);
      toast.success('AI OCR Scan completed successfully with 98.5% confidence score!');
    }, 1200);
  };

  const getStatusVariant = (s: string) => {
    if (s === 'Approved') return 'success';
    if (s === 'Pending Review') return 'warning';
    if (s === 'Rejected') return 'danger';
    if (s === 'Re-upload Requested') return 'purple';
    return 'gray';
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>

      {/* ── Page Header ── */}
      <PageHeader
        title="Document Center & AI OCR Verification"
        description="Module 6: Centralized repository for all Farmer, Government & Partner documents (Aadhaar, PAN, Land 7/12, Bank, Insurance, MoU)."
        badge={{ label: `${totalDocs} Documents Uploaded`, variant: 'info' }}
        icon={FileText}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button
              onClick={() => toast.success('Refreshing Document Vault...')}
              className="btn btn-secondary btn-sm gap-1.5 cursor-pointer"
            >
              <RefreshCw size={13} /> Refresh Vault
            </button>
            <button
              onClick={() => toast.success('Batch AI OCR scan initiated for 6 pending documents')}
              className="btn btn-primary btn-sm gap-1.5 cursor-pointer"
            >
              <Sparkles size={14} /> Batch OCR Scan
            </button>
          </div>
        }
      />

      {/* ── KPI Metric Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard title="TOTAL UPLOADED DOCUMENTS" value={totalDocs} icon={FileText} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="AI OCR VERIFIED" value={approvedDocs} icon={ShieldCheck} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="PENDING REVIEW" value={pendingDocs} icon={Cpu} iconBg="#FFFBEB" iconColor="#D97706" />
        <KpiCard title="RE-UPLOAD REQUESTS" value={reuploadDocs} icon={RotateCcw} iconBg="#F5F3FF" iconColor="#8B5CF6" />
      </div>

      {/* ── SEARCH & 3-TIER BRD FILTERS ── */}
      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row items-center gap-3">
          <div className="relative flex-1 w-full">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#94A3B8]" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by Entity Name, ID, Document Number, File Name, OCR Name..."
              className="w-full pl-10 pr-4 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#16A34A] focus:bg-white transition-all"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="text-[12px] font-bold text-[#64748B] uppercase tracking-wider flex items-center gap-1">
              <Filter size={13} className="text-[#16A34A]" /> Filters:
            </span>

            {/* Entity Filter (Farmer / Government / Partner) */}
            <select
              value={entityFilter}
              onChange={(e) => setEntityFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All Owner Types (Farmer, Govt, Partner)</option>
              <option value="Farmer">Farmer Documents</option>
              <option value="Government">Government Documents</option>
              <option value="Partner">Partner Documents</option>
            </select>

            {/* Category Filter (6 BRD Categories) */}
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All 6 Categories (Aadhaar, PAN, Land, Bank...)</option>
              <option value="Aadhaar">Aadhaar Card</option>
              <option value="PAN">PAN Card</option>
              <option value="Land">Land Registry (7/12 Khasra)</option>
              <option value="Bank">Bank Passbook / Cheque</option>
              <option value="Insurance">Insurance Policy</option>
              <option value="Agreement">MoU & Service Agreement</option>
            </select>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-1.5 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[12px] font-medium text-[#0F172A] outline-none cursor-pointer focus:border-[#16A34A]"
            >
              <option value="">All Statuses</option>
              <option value="Approved">Approved</option>
              <option value="Pending Review">Pending Review</option>
              <option value="Re-upload Requested">Re-upload Requested</option>
              <option value="Rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── DOCUMENT DIRECTORY TABLE ── */}
      <div className="ent-card overflow-hidden">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-[14px] font-bold text-[#0F172A]">Centralized Document Vault</h3>
            <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
              {filteredDocs.length} Files
            </span>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar">
          <table className="ent-table min-w-[1150px]">
            <thead>
              <tr>
                <th>Doc ID / Reference</th>
                <th>Owner Entity</th>
                <th>Category</th>
                <th>File Name & Size</th>
                <th>AI OCR Score</th>
                <th>Upload Date</th>
                <th>Verification Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredDocs.length === 0 ? (
                <tr>
                  <td colSpan={8}>
                    <EmptyState icon={FileText} title="No documents match filter criteria" description="Try clearing filters or search term." />
                  </td>
                </tr>
              ) : (
                filteredDocs.map((doc, i) => (
                  <motion.tr
                    key={doc.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03 }}
                  >
                    {/* Doc ID */}
                    <td>
                      <span className="font-mono text-[12px] text-[#2563EB] font-bold bg-[#EFF6FF] px-2.5 py-1 rounded-lg border border-[#DBEAFE]">
                        {doc.id}
                      </span>
                    </td>

                    {/* Owner Entity */}
                    <td>
                      <div className="flex items-center gap-2">
                        {doc.entity_type === 'Farmer' && <User size={14} className="text-[#16A34A]" />}
                        {doc.entity_type === 'Government' && <Building2 size={14} className="text-[#D97706]" />}
                        {doc.entity_type === 'Partner' && <Handshake size={14} className="text-[#2563EB]" />}
                        <div>
                          <div className="text-[13px] font-bold text-[#0F172A]">{doc.entity_name}</div>
                          <span className="text-[10.5px] font-mono text-[#64748B]">{doc.entity_type} • {doc.entity_id}</span>
                        </div>
                      </div>
                    </td>

                    {/* Category */}
                    <td>
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#F8FAFC] text-[#0F172A] border border-[#CBD5E1]">
                        {doc.doc_category}
                      </span>
                    </td>

                    {/* File Name */}
                    <td>
                      <div className="text-[12.5px] font-medium text-[#0F172A]">{doc.file_name}</div>
                      <div className="text-[10.5px] text-[#94A3B8] font-mono">{doc.file_size}</div>
                    </td>

                    {/* AI OCR Match */}
                    <td>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-bold text-[#16A34A]">{doc.ocr_match_score}%</span>
                        <div className="w-10 h-1.5 bg-[#DCFCE7] rounded-full overflow-hidden">
                          <div className="h-full bg-[#16A34A]" style={{ width: `${doc.ocr_match_score}%` }} />
                        </div>
                      </div>
                    </td>

                    {/* Upload Date */}
                    <td className="text-[12px] text-[#64748B] font-medium">{doc.upload_date}</td>

                    {/* Verification Status */}
                    <td>
                      <StatusBadge label={doc.verification_status} variant={getStatusVariant(doc.verification_status) as any} size="sm" />
                    </td>

                    {/* Actions */}
                    <td className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            setPreviewDoc(doc);
                            setActiveModalTab('ocr');
                          }}
                          className="px-2.5 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                        >
                          <Eye size={13} /> Details
                        </button>
                        <button
                          onClick={() => toast.success(`Downloading ${doc.file_name}`)}
                          className="p-1.5 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] cursor-pointer"
                          title="Download File"
                        >
                          <Download size={14} />
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

      {/* ── PREVIEW, OCR & HISTORY MODAL ── */}
      <AnimatePresence>
        {previewDoc && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-[#E8EDF5] space-y-5"
            >
              {/* Header */}
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <div className="flex items-center gap-2">
                  <FileText size={20} className="text-[#16A34A]" />
                  <div>
                    <h3 className="text-[16px] font-bold text-[#0F172A]">{previewDoc.doc_category} Verification</h3>
                    <p className="text-[12px] text-[#64748B]">{previewDoc.entity_name} ({previewDoc.entity_id}) • Ref: {previewDoc.id}</p>
                  </div>
                </div>
                <button onClick={() => setPreviewDoc(null)} className="text-[#94A3B8] hover:text-[#0F172A] cursor-pointer">
                  <X size={20} />
                </button>
              </div>

              {/* Modal Tabs */}
              <div className="flex items-center gap-2 border-b border-[#E8EDF5] pb-1">
                {[
                  { id: 'ocr', label: 'AI OCR Extraction', icon: Cpu },
                  { id: 'preview', label: 'Document File Preview', icon: Eye },
                  { id: 'history', label: 'Audit History Logs', icon: History },
                ].map(t => {
                  const Icon = t.icon;
                  const isActive = activeModalTab === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveModalTab(t.id as any)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-[12.5px] cursor-pointer ${
                        isActive ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]' : 'text-[#64748B] hover:bg-[#F8FAFC]'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Tab 1: OCR Extraction */}
              {activeModalTab === 'ocr' && (
                <div className="space-y-4 text-[13px]">
                  <div className="p-4 bg-[#F0FDF4] border border-[#DCFCE7] rounded-2xl flex items-center justify-between">
                    <div>
                      <span className="text-[11px] font-bold uppercase text-[#16A34A]">AI Confidence Match Score</span>
                      <p className="text-[22px] font-extrabold text-[#16A34A]">{previewDoc.ocr_match_score}% Confidence</p>
                    </div>
                    <button onClick={() => runOcrScan(previewDoc.id)} className="btn btn-secondary btn-sm flex items-center gap-1.5 cursor-pointer">
                      <RefreshCw size={13} className={isOcrScanning ? 'animate-spin' : ''} /> Re-run OCR
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl space-y-1">
                      <span className="text-[11px] font-bold uppercase text-[#94A3B8]">Extracted Entity Name</span>
                      <p className="font-bold text-[#0F172A]">{previewDoc.ocr_extracted_name}</p>
                    </div>
                    <div className="p-3.5 bg-[#FAFCFF] border border-[#F1F5F9] rounded-xl space-y-1">
                      <span className="text-[11px] font-bold uppercase text-[#94A3B8]">Extracted Document No</span>
                      <p className="font-mono font-bold text-[#2563EB]">{previewDoc.ocr_extracted_id}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Tab 2: Preview */}
              {activeModalTab === 'preview' && (
                <div className="p-6 bg-[#FAFCFF] border border-dashed border-[#CBD5E1] rounded-2xl flex flex-col items-center justify-center space-y-3 min-h-[220px]">
                  <FileText size={36} className="text-[#94A3B8]" />
                  <p className="text-[13px] font-bold text-[#0F172A]">{previewDoc.file_name}</p>
                  <p className="text-[11.5px] text-[#64748B]">{previewDoc.file_size} • PDF Document Preview</p>
                  <button onClick={() => toast.success(`Downloading ${previewDoc.file_name}`)} className="btn btn-primary btn-sm flex items-center gap-1.5 cursor-pointer">
                    <Download size={14} /> Download Document File
                  </button>
                </div>
              )}

              {/* Tab 3: History Logs */}
              {activeModalTab === 'history' && (
                <div className="space-y-3 text-[12.5px]">
                  {previewDoc.history_logs.map((log, idx) => (
                    <div key={idx} className="p-3 border border-[#E8EDF5] rounded-xl bg-[#FAFCFF] flex items-center justify-between">
                      <div>
                        <span className="font-bold text-[#0F172A] block">{log.action}</span>
                        <span className="text-[11px] text-[#94A3B8]">{log.timestamp}</span>
                      </div>
                      <span className="text-[11px] font-semibold text-[#2563EB] bg-[#EFF6FF] px-2 py-0.5 rounded-md border border-[#DBEAFE]">
                        {log.actor}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Footer Actions */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#F1F5F9]">
                <button onClick={() => setPreviewDoc(null)} className="btn btn-secondary btn-sm cursor-pointer">Close</button>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleRequestReupload(previewDoc.id)} className="px-3 py-1.5 bg-[#F5F3FF] text-[#8B5CF6] hover:bg-[#DDD6FE] text-[12px] font-bold rounded-xl cursor-pointer">
                    Request Re-upload
                  </button>
                  <button onClick={() => handleRejectDoc(previewDoc.id)} className="px-3 py-1.5 bg-[#FEF2F2] text-[#EF4444] hover:bg-[#FEE2E2] text-[12px] font-bold rounded-xl cursor-pointer">
                    Reject Document
                  </button>
                  <button onClick={() => handleApproveDoc(previewDoc.id)} className="px-3.5 py-1.5 bg-[#16A34A] text-white hover:bg-[#15803D] text-[12px] font-bold rounded-xl shadow-xs cursor-pointer flex items-center gap-1">
                    <Check size={14} /> Approve Document
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
};
