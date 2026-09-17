import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Download, Building2, User, Phone, Mail,
  MapPin, Landmark, ShieldCheck, Award, Layers, Clock, HelpCircle, Loader2, Edit3, AlertCircle
} from 'lucide-react';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useGovtOrgDetails, useUpdateGovtOrgStatus } from '../api/useGovtApi';
import { ClarificationModal } from '../components/ClarificationModal';
import toast from 'react-hot-toast';

export const GovtDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'land' | 'projects' | 'documents' | 'timeline' | 'reports'>('overview');
  const [clarificationModalMode, setClarificationModalMode] = useState<'request' | 'resubmit' | null>(null);

  const { data: org, isLoading, isError, refetch } = useGovtOrgDetails(id);
  const updateStatusMutation = useUpdateGovtOrgStatus();

  if (isLoading) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3 text-[#64748B]">
        <Loader2 size={36} className="animate-spin text-[#2563EB]" />
        <p className="text-[14px] font-bold">Loading Government Body profile...</p>
      </div>
    );
  }

  if (isError || !org) {
    return (
      <div className="p-16 flex flex-col items-center justify-center space-y-3 text-[#EF4444]">
        <AlertCircle size={36} />
        <p className="text-[14px] font-bold">Government Body record not found.</p>
        <button onClick={() => navigate('/govt')} className="btn btn-secondary btn-sm">
          Return to Directory
        </button>
      </div>
    );
  }

  const handleApprove = async () => {
    if (!window.confirm(`Are you sure you want to APPROVE ${org.org_name}?`)) return;
    try {
      await updateStatusMutation.mutateAsync({
        id: org.id,
        payload: { action: 'APPROVE', remarks: 'Government Body approved by Super Admin.' },
      });
      toast.success(`${org.org_name} has been APPROVED successfully!`);
    } catch (err) {
      toast.error('Failed to approve Government Body.');
    }
  };

  const handleReject = async () => {
    const reason = window.prompt(`Enter rejection reason for ${org.org_name}:`);
    if (reason === null) return;
    if (!reason.trim()) {
      toast.error('Rejection reason is required.');
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: org.id,
        payload: { action: 'REJECT', rejection_reason: reason.trim() },
      });
      toast.success(`${org.org_name} has been REJECTED.`);
    } catch (err) {
      toast.error('Failed to reject Government Body.');
    }
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return 'success';
      case 'PENDING':
        return 'warning';
      case 'CLARIFICATION_REQUIRED':
        return 'info';
      case 'REJECTED':
        return 'danger';
      default:
        return 'neutral';
    }
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <button
            onClick={() => navigate('/govt')}
            className="w-10 h-10 rounded-xl border border-[#E2E8F0] bg-white flex items-center justify-center text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC] transition-all shadow-xs cursor-pointer"
            title="Go Back"
          >
            <ArrowLeft size={18} />
          </button>
          <div className="w-11 h-11 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] flex items-center justify-center text-[#2563EB] shrink-0">
            <Landmark size={22} />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight">{org.org_name}</h1>
              <StatusBadge
                status={getStatusVariant(org.approval_status) as any}
                label={org.approval_status.replace('_', ' ')}
              />
            </div>
            <p className="text-[13px] text-[#64748B] mt-0.5">
              Code: <span className="font-mono font-bold text-[#0F172A]">{org.org_id}</span> • Department: <span className="font-semibold text-[#0F172A]">{org.department || 'General'}</span> • Nodal Officer: <span className="font-semibold text-[#0F172A]">{org.nodal_person_name || 'N/A'}</span>
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          {org.approval_status === 'CLARIFICATION_REQUIRED' && (
            <button
              onClick={() => setClarificationModalMode('resubmit')}
              className="flex items-center gap-1.5 px-4 py-2 bg-[#FFFBEB] hover:bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D] font-bold text-[13px] rounded-xl transition-all cursor-pointer"
            >
              <Edit3 size={15} />
              <span>Update & Resubmit</span>
            </button>
          )}

          <button
            onClick={() => setClarificationModalMode('request')}
            disabled={updateStatusMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#F5F3FF] hover:bg-[#DDD6FE] text-[#7C3AED] border border-[#DDD6FE] font-bold text-[13px] rounded-xl transition-all cursor-pointer disabled:opacity-40"
          >
            <HelpCircle size={15} />
            <span>Request Clarification</span>
          </button>

          <button
            onClick={handleReject}
            disabled={updateStatusMutation.isPending || org.approval_status === 'REJECTED'}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#FECACA] hover:bg-[#FEF2F2] text-[#EF4444] font-semibold text-[13px] rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            <XCircle size={16} />
            <span>Reject</span>
          </button>

          <button
            onClick={handleApprove}
            disabled={updateStatusMutation.isPending || org.approval_status === 'APPROVED'}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-[13px] rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer border-0"
          >
            {updateStatusMutation.isPending ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <CheckCircle size={16} />
            )}
            <span>Approve Body</span>
          </button>
        </div>
      </div>

      {/* Clarification Alert Banner */}
      {org.approval_status === 'CLARIFICATION_REQUIRED' && (
        <div className="p-4 rounded-2xl bg-[#FFFBEB] border border-[#FDE68A] flex items-start gap-3 shadow-xs">
          <HelpCircle size={20} className="text-[#D97706] shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-[14px] font-bold text-[#92400E]">Clarification Requested by Super Admin</h4>
            <p className="text-[12.5px] text-[#B45309] mt-1">{org.clarification_notes || 'Please update missing details and MoU verification documents.'}</p>
          </div>
          <button
            onClick={() => setClarificationModalMode('resubmit')}
            className="px-3.5 py-1.5 bg-[#D97706] hover:bg-[#B45309] text-white font-bold text-[12px] rounded-xl cursor-pointer border-0 shadow-xs"
          >
            Edit & Resubmit Profile
          </button>
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#E8EDF5] overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview & Profile', icon: Building2 },
          { id: 'land', label: 'Land Allocated', icon: Layers },
          { id: 'projects', label: 'Projects Managed', icon: ShieldCheck },
          { id: 'documents', label: 'MoU & Documents', icon: FileText },
          { id: 'timeline', label: 'Audit Timeline', icon: Clock },
          { id: 'reports', label: 'Compliance Reports', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[13px] transition-all whitespace-nowrap cursor-pointer border-0 bg-transparent ${
                isActive
                  ? 'bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]'
                  : 'text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]'
              }`}
            >
              <Icon size={16} className={isActive ? 'text-[#16A34A]' : 'text-[#94A3B8]'} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: OVERVIEW */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Organization Info Box */}
            <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4 lg:col-span-1">
              <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
                <Building2 size={18} className="text-[#2563EB]" /> Organization Profile
              </h3>
              <div className="space-y-3 text-[13px]">
                <div>
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Org Type</span>
                  <span className="font-bold text-[#0F172A] capitalize">{(org.org_type || '').replace('_', ' ')}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Department</span>
                  <span className="font-semibold text-[#0F172A]">{org.department || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Registration Code</span>
                  <span className="font-semibold font-mono text-[#0F172A]">{org.registration_code || org.org_id}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Jurisdiction</span>
                  <span className="font-semibold text-[#0F172A] capitalize">{org.jurisdiction_level} ({org.state})</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Official Email</span>
                  <span className="font-semibold text-[#2563EB] flex items-center gap-1.5 mt-0.5">
                    <Mail size={14} /> {org.contact_email}
                  </span>
                </div>
                <div>
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Official Phone</span>
                  <span className="font-semibold text-[#0F172A] flex items-center gap-1.5 mt-0.5">
                    <Phone size={14} /> {org.contact_phone}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#F1F5F9]">
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Headquarters Address</span>
                  <span className="text-[#475569] text-[12px] flex items-start gap-1.5 mt-1 leading-relaxed">
                    <MapPin size={15} className="text-[#EF4444] shrink-0 mt-0.5" />
                    {org.headquarters_address ? (
                      `${org.headquarters_address.street}, ${org.headquarters_address.city}, ${org.headquarters_address.district}, ${org.headquarters_address.state} - ${org.headquarters_address.pincode}`
                    ) : (
                      `${org.district}, ${org.state}`
                    )}
                  </span>
                </div>
              </div>
            </div>

            {/* Personnel Breakdown */}
            <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-6">
              
              {/* Authorized Executive */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center gap-2">
                  <User size={18} className="text-[#16A34A]" /> Authorized Executive Officer
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] bg-[#FAFCFF] p-4 rounded-xl border border-[#F1F5F9]">
                  <div>
                    <span className="text-[#94A3B8] block text-[11px] uppercase font-semibold">Full Name</span>
                    <span className="font-bold text-[#0F172A]">{org.authorized_person_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px] uppercase font-semibold">Designation</span>
                    <span className="font-semibold text-[#0F172A]">{org.authorized_person_designation || 'Executive'}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px] uppercase font-semibold">Official Email</span>
                    <span className="font-semibold text-[#2563EB]">{org.authorized_person_email || org.contact_email}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px] uppercase font-semibold">Mobile</span>
                    <span className="font-semibold font-mono text-[#0F172A]">{org.authorized_person_phone || org.contact_phone}</span>
                  </div>
                </div>
              </div>

              {/* Nodal Officer */}
              <div className="space-y-3">
                <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-2 flex items-center gap-2">
                  <User size={18} className="text-[#8B5CF6]" /> Assigned Administrative Nodal Officer
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[13px] bg-[#FAFCFF] p-4 rounded-xl border border-[#F1F5F9]">
                  <div>
                    <span className="text-[#94A3B8] block text-[11px] uppercase font-semibold">Full Name</span>
                    <span className="font-bold text-[#0F172A]">{org.nodal_person_name || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px] uppercase font-semibold">Designation</span>
                    <span className="font-semibold text-[#0F172A]">{org.nodal_person_designation || 'Nodal Officer'}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px] uppercase font-semibold">Email</span>
                    <span className="font-semibold text-[#2563EB]">{org.nodal_person_email || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-[#94A3B8] block text-[11px] uppercase font-semibold">Mobile</span>
                    <span className="font-semibold font-mono text-[#0F172A]">{org.nodal_person_phone || 'N/A'}</span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* TAB 4: DOCUMENTS */}
      {activeTab === 'documents' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A]">Official MoU & Authorization Documents</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* MoU File */}
            <div className="p-4 rounded-xl border border-[#F1F5F9] bg-[#FAFCFF] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] flex items-center justify-center font-bold text-xs shrink-0">
                  MoU
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0F172A]">Official MoU Agreement</div>
                  <div className="text-[11px] text-[#94A3B8]">Partnership MoU Document</div>
                </div>
              </div>
              {org.mou_document_url ? (
                <a
                  href={org.mou_document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#EFF6FF] text-[#2563EB] font-bold text-[12px] rounded-xl hover:bg-[#DBEAFE] transition-colors"
                >
                  <Download size={14} /> Open Document
                </a>
              ) : (
                <span className="text-[11px] text-[#94A3B8] font-medium">Not Uploaded</span>
              )}
            </div>

            {/* Authority Letter */}
            <div className="p-4 rounded-xl border border-[#F1F5F9] bg-[#FAFCFF] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F0FDF4] text-[#16A34A] flex items-center justify-center font-bold text-xs shrink-0">
                  DOC
                </div>
                <div>
                  <div className="text-[13px] font-bold text-[#0F172A]">Authorization Letter</div>
                  <div className="text-[11px] text-[#94A3B8]">Gazette & Nodal Designation</div>
                </div>
              </div>
              {org.authority_document_url ? (
                <a
                  href={org.authority_document_url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0FDF4] text-[#16A34A] font-bold text-[12px] rounded-xl hover:bg-[#DCFCE7] transition-colors"
                >
                  <Download size={14} /> Open Document
                </a>
              ) : (
                <span className="text-[11px] text-[#94A3B8] font-medium">Not Uploaded</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: TIMELINE */}
      {activeTab === 'timeline' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A]">Government Organization Approval Audit Trail</h3>

          <div className="relative pl-6 space-y-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[#F1F5F9]" />
            {org.audit_trail && org.audit_trail.length > 0 ? (
              org.audit_trail.map((ev, i) => (
                <div key={i} className="relative flex items-start gap-4">
                  <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-[#2563EB] border-2 border-white" />
                  <div>
                    <div className="text-[11px] font-bold text-[#94A3B8]">{ev.timestamp}</div>
                    <div className="text-[13.5px] font-bold text-[#0F172A] mt-0.5">{ev.action} • {ev.actor}</div>
                    <div className="text-[12px] text-[#64748B] mt-0.5">{ev.remarks}</div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-[12.5px] text-[#94A3B8]">No audit log entries recorded yet.</div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2, 3, 6 Fallbacks */}
      {(activeTab === 'land' || activeTab === 'projects' || activeTab === 'reports') && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-8 shadow-xs text-center text-[#64748B] space-y-2">
          <Building2 size={28} className="mx-auto text-[#94A3B8]" />
          <h4 className="text-[14px] font-bold text-[#0F172A]">Module Partition Verified</h4>
          <p className="text-[12px]">All land allotments and state projects for {org.org_name} are persisted directly under Org ID: {org.org_id}.</p>
        </div>
      )}

      {/* Clarification Modal */}
      {clarificationModalMode && (
        <ClarificationModal
          isOpen={Boolean(clarificationModalMode)}
          onClose={() => setClarificationModalMode(null)}
          org={org}
          mode={clarificationModalMode}
          onSuccess={() => refetch()}
        />
      )}

    </div>
  );
};
