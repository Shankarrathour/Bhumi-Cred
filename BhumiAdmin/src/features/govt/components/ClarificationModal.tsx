import React, { useState } from 'react';
import { X, HelpCircle, Send, Loader2, Edit3 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useUpdateGovtOrgStatus, useUpdateGovtOrg, GovtOrganizationItem } from '../api/useGovtApi';

interface ClarificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  org: GovtOrganizationItem;
  mode: 'request' | 'resubmit';
  onSuccess?: () => void;
}

export const ClarificationModal: React.FC<ClarificationModalProps> = ({
  isOpen,
  onClose,
  org,
  mode,
  onSuccess,
}) => {
  const [notes, setNotes] = useState(org.clarification_notes || '');
  const [department, setDepartment] = useState(org.department || '');
  const [contactEmail, setContactEmail] = useState(org.contact_email || '');
  const [contactPhone, setContactPhone] = useState(org.contact_phone || '');
  const [nodalName, setNodalName] = useState(org.nodal_person_name || '');
  const [nodalPhone, setNodalPhone] = useState(org.nodal_person_phone || '');

  const updateStatusMutation = useUpdateGovtOrgStatus();
  const updateOrgMutation = useUpdateGovtOrg();

  if (!isOpen) return null;

  const handleRequestClarification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!notes.trim()) {
      toast.error('Please enter clarification notes detailing what information is required.');
      return;
    }

    try {
      await updateStatusMutation.mutateAsync({
        id: org.id,
        payload: {
          action: 'CLARIFICATION_REQUIRED',
          clarification_notes: notes.trim(),
        },
      });
      toast.success('Clarification requested from Government Body successfully!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error('Failed to request clarification.');
    }
  };

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateOrgMutation.mutateAsync({
        id: org.id,
        payload: {
          department,
          contact_email: contactEmail,
          contact_phone: contactPhone,
          nodal_person_name: nodalName,
          nodal_person_phone: nodalPhone,
          resubmit: true,
        },
      });
      toast.success('Updated information resubmitted for Super Admin approval!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      toast.error('Failed to resubmit updated information.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/70 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#E8EDF5] overflow-hidden">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#FFFBEB] border-b border-[#FDE68A] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FEF3C7] text-[#D97706] border border-[#FCD34D] flex items-center justify-center">
              {mode === 'request' ? <HelpCircle size={20} /> : <Edit3 size={20} />}
            </div>
            <div>
              <h3 className="text-[16px] font-bold text-[#92400E]">
                {mode === 'request' ? 'Request Clarification' : 'Update & Resubmit Profile'}
              </h3>
              <p className="text-[11.5px] text-[#B45309]">{org.org_name} ({org.org_id})</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#FDE68A] text-[#92400E] flex items-center justify-center transition-colors border-0 bg-transparent cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        {mode === 'request' ? (
          <form onSubmit={handleRequestClarification} className="p-6 space-y-4">
            <div className="text-[13px] text-[#475569]">
              Specify missing or unverified information. The Government Nodal Officer will receive a notification and prompt to update their submission.
            </div>

            <div>
              <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                Clarification Instructions / Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Please re-upload signed MoU PDF with official government seal and verify Nodal Officer official email address."
                className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#D97706] resize-none"
              />
            </div>

            <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#CBD5E1] text-[#475569] text-[13px] font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateStatusMutation.isPending}
                className="px-5 py-2 bg-[#D97706] hover:bg-[#B45309] text-white text-[13px] font-bold rounded-xl cursor-pointer border-0 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {updateStatusMutation.isPending ? (
                  <Loader2 size={15} className="animate-spin" />
                ) : (
                  <Send size={15} />
                )}
                <span>Send Clarification Request</span>
              </button>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResubmit} className="p-6 space-y-4">
            {org.clarification_notes && (
              <div className="p-3 bg-[#FFFBEB] border border-[#FDE68A] rounded-xl text-[12px] text-[#B45309]">
                <strong>Admin Clarification Note:</strong> {org.clarification_notes}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">Department</label>
                <input
                  type="text"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">Official Email</label>
                  <input
                    type="email"
                    value={contactEmail}
                    onChange={(e) => setContactEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">Official Phone</label>
                  <input
                    type="text"
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">Nodal Officer Name</label>
                  <input
                    type="text"
                    value={nodalName}
                    onChange={(e) => setNodalName(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">Nodal Phone</label>
                  <input
                    type="text"
                    value={nodalPhone}
                    onChange={(e) => setNodalPhone(e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] outline-none"
                  />
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-[#F1F5F9] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#CBD5E1] text-[#475569] text-[13px] font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={updateOrgMutation.isPending}
                className="px-5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-[13px] font-bold rounded-xl cursor-pointer border-0 flex items-center gap-1.5 shadow-xs disabled:opacity-50"
              >
                {updateOrgMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                <span>Resubmit for Approval</span>
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
};
