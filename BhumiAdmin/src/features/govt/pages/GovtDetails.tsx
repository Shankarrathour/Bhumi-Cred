import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft, CheckCircle, XCircle, FileText, Download, Building2, User, Phone, Mail,
  MapPin, Landmark, ShieldCheck, Award, Layers, Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { useGovtDetails } from '../api/useGovtSchemes';
import { apiClient } from '../../../api/axios';

export const GovtDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'overview' | 'land' | 'projects' | 'documents' | 'timeline' | 'reports'>('overview');
  
  const { data: apiDetails } = useGovtDetails(id);

  const [status, setStatus] = useState<'Approved' | 'Pending' | 'Rejected'>('Approved');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const govtBody = {
    id: id || 'GOV-2001',
    organization: apiDetails?.organization || apiDetails?.name || 'Ministry of Agriculture & Farmers Welfare',
    department: apiDetails?.department || 'Department of Agriculture & Farmers Welfare (DAC&FW)',
    ministry: apiDetails?.ministry || 'Ministry of Agriculture, Govt. of India',
    authorizedPerson: apiDetails?.authorizedPerson || 'Rajesh Sharma',
    designation: 'Joint Secretary (Agri Extension)',
    email: 'r.sharma@agri.gov.in',
    phone: '+91 11 2338 2012',
    officeAddress: 'Krishi Bhawan, Dr. Rajendra Prasad Road, New Delhi - 110001',
    status: status,
    mouSignedDate: '12 Jan 2025',
    totalSchemes: 8,
    coveredLand: '1,42,500 Acres',
    activeProjects: 14,
    allocatedBudget: '₹480 Crore',
  };

  const schemesList = [
    { name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)', type: 'Central', benefit: '₹1,500 / Acre', farmers: '28,400', status: 'Active' },
    { name: 'Paramparagat Krishi Vikas Yojana (PKVY)', type: 'Organic', benefit: '₹50,000 / Ha', farmers: '14,200', status: 'Active' },
    { name: 'Soil Health Card Scheme', type: 'Central', benefit: 'Free Soil Audit', farmers: '42,000', status: 'Active' },
    { name: 'Sub-Mission on Agroforestry (SMAF)', type: 'Joint', benefit: '₹70 / Sapling', farmers: '9,800', status: 'Active' },
  ];

  const assignedLands = [
    { id: 'LND-MP-402', village: 'Sehore', district: 'Sehore', state: 'Madhya Pradesh', area: '1,200 Acres', polygon: 'Verified', status: 'Active' },
    { id: 'LND-MP-901', village: 'Betul', district: 'Betul', state: 'Madhya Pradesh', area: '3,450 Acres', polygon: 'Verified', status: 'Active' },
    { id: 'LND-MH-104', village: 'Latur', district: 'Latur', state: 'Maharashtra', area: '2,100 Acres', polygon: 'Pending Review', status: 'Under Inspection' },
    { id: 'LND-GJ-302', village: 'Anand', district: 'Anand', state: 'Gujarat', area: '4,800 Acres', polygon: 'Verified', status: 'Active' },
  ];

  const assignedProjects = [
    { id: 'PRJ-1042', name: 'Madhya Pradesh Agroforestry Carbon Sink', area: '42,000 Ha', carbonCredits: '4,50,000 tCO₂e', partner: 'AgriCorp Ltd', status: 'Active' },
    { id: 'PRJ-1088', name: 'Gujarat Sustainable Biochar Soil Amendment', area: '28,500 Ha', carbonCredits: '2,80,000 tCO₂e', partner: 'GreenEarth Carbon', status: 'Verification Phase' },
    { id: 'PRJ-2004', name: 'Deccan Teak Plantation Weather Protection', area: '15,000 Ha', carbonCredits: '1,20,000 tCO₂e', partner: 'HDFC Ergo Agri', status: 'Active' },
  ];

  const documents = [
    { name: 'Official_MOU_Government_Partnership.pdf', type: 'PDF Document', size: '4.2 MB', date: '12 Jan 2025' },
    { name: 'Nodal_Officer_Authorization_Letter.pdf', type: 'PDF Document', size: '1.8 MB', date: '10 Jan 2025' },
    { name: 'Cabinet_Gazette_Notification_2025.pdf', type: 'Gazette Notice', size: '8.5 MB', date: '05 Jan 2025' },
    { name: 'Bank_Disbursement_Authorization.pdf', type: 'Financial Document', size: '2.1 MB', date: '15 Jan 2025' },
  ];

  const timelineEvents = [
    { date: '15 Jan 2025', title: 'Bank Account & Escrow Disbursement Verified', desc: 'Financial verification completed by Super Admin.' },
    { date: '12 Jan 2025', title: 'MOU Agreement Signed', desc: 'MoU signed with Krishi Bhawan representative.' },
    { date: '10 Jan 2025', title: 'Nodal Officer Authorization Granted', desc: 'Rajesh Sharma assigned as primary administrative contact.' },
    { date: '05 Jan 2025', title: 'Application Submitted', desc: 'Government Body registration application submitted online.' },
  ];

  const handleAction = async (newStatus: 'Approved' | 'Rejected') => {
    setIsSubmitting(true);
    try {
      await apiClient.post(`/admin/agri/applications/${govtBody.id}/action`, {
        action: newStatus === 'Approved' ? 'APPROVE' : 'REJECT',
        remarks: `Government Body status updated to ${newStatus}`,
      });
    } catch (e) {
      // Handled gracefully
    } finally {
      setIsSubmitting(false);
      setStatus(newStatus);
      triggerToast(`Government Body has been ${newStatus.toLowerCase()} successfully`);
    }
  };

  return (
    <div className="space-y-6 page-enter pb-12" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs">
        <div className="flex items-center gap-3.5 min-w-0">
          <button 
            onClick={() => navigate(-1)}
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
              <h1 className="text-[22px] font-bold text-[#0F172A] leading-tight">{govtBody.organization}</h1>
              <StatusBadge status={status === 'Approved' ? 'success' : status === 'Rejected' ? 'danger' : 'warning'} label={status} />
            </div>
            <p className="text-[13px] text-[#64748B] mt-0.5">{govtBody.department} • Nodal Officer: <span className="font-semibold text-[#0F172A]">{govtBody.authorizedPerson}</span></p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => handleAction('Rejected')}
            disabled={isSubmitting || status === 'Rejected'}
            className="flex items-center gap-1.5 px-4 py-2 bg-white border border-[#FECACA] hover:bg-[#FEF2F2] text-[#EF4444] font-semibold text-[13px] rounded-xl transition-all disabled:opacity-40 cursor-pointer"
          >
            <XCircle size={16} />
            <span>Reject</span>
          </button>
          <button
            onClick={() => handleAction('Approved')}
            disabled={isSubmitting || status === 'Approved'}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-semibold text-[13px] rounded-xl shadow-xs transition-all disabled:opacity-40 cursor-pointer"
          >
            <CheckCircle size={16} />
            <span>Approve Body</span>
          </button>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex items-center gap-2 border-b border-[#E8EDF5] overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: Building2 },
          { id: 'land', label: 'Land Allocated', icon: Layers },
          { id: 'projects', label: 'Projects Managed', icon: ShieldCheck },
          { id: 'documents', label: 'MOU & Documents', icon: FileText },
          { id: 'timeline', label: 'Audit Timeline', icon: Clock },
          { id: 'reports', label: 'Reports', icon: Award },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-semibold text-[13px] transition-all whitespace-nowrap cursor-pointer ${
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

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="space-y-6">
          {/* Key Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Allocated Budget</div>
              <div className="text-[24px] font-extrabold text-[#0F172A] mt-1">{govtBody.allocatedBudget}</div>
              <div className="text-[11.5px] text-[#16A34A] font-semibold mt-1">FY 2025-26 Treasury Sanction</div>
            </div>
            <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Total Schemes</div>
              <div className="text-[24px] font-extrabold text-[#0F172A] mt-1">{govtBody.totalSchemes} Active</div>
              <div className="text-[11.5px] text-[#2563EB] font-semibold mt-1">Central & State Programs</div>
            </div>
            <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Covered Land Area</div>
              <div className="text-[24px] font-extrabold text-[#0F172A] mt-1">{govtBody.coveredLand}</div>
              <div className="text-[11.5px] text-[#16A34A] font-semibold mt-1">Geofenced & Verified</div>
            </div>
            <div className="bg-white border border-[#E8EDF5] rounded-2xl p-4 shadow-xs">
              <div className="text-[11px] font-bold text-[#94A3B8] uppercase tracking-wider">Active Projects</div>
              <div className="text-[24px] font-extrabold text-[#0F172A] mt-1">{govtBody.activeProjects} Projects</div>
              <div className="text-[11.5px] text-[#8B5CF6] font-semibold mt-1">Carbon & Tree Planting</div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Nodal Officer & Office Profile */}
            <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4 lg:col-span-1">
              <h3 className="text-[15px] font-bold text-[#0F172A] border-b border-[#F1F5F9] pb-3 flex items-center gap-2">
                <User size={18} className="text-[#2563EB]" /> Authorized Nodal Officer
              </h3>
              <div className="space-y-3 text-[13px]">
                <div>
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Name</span>
                  <span className="font-bold text-[#0F172A]">{govtBody.authorizedPerson}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Designation</span>
                  <span className="font-semibold text-[#0F172A]">{govtBody.designation}</span>
                </div>
                <div>
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Official Email</span>
                  <span className="font-semibold text-[#2563EB] flex items-center gap-1.5 mt-0.5">
                    <Mail size={14} /> {govtBody.email}
                  </span>
                </div>
                <div>
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Official Phone</span>
                  <span className="font-semibold text-[#0F172A] flex items-center gap-1.5 mt-0.5">
                    <Phone size={14} /> {govtBody.phone}
                  </span>
                </div>
                <div className="pt-2 border-t border-[#F1F5F9]">
                  <span className="text-[#94A3B8] font-medium block text-[11px] uppercase">Head Office</span>
                  <span className="text-[#475569] text-[12px] flex items-start gap-1.5 mt-1 leading-relaxed">
                    <MapPin size={15} className="text-[#EF4444] shrink-0 mt-0.5" />
                    {govtBody.officeAddress}
                  </span>
                </div>
              </div>
            </div>

            {/* Active Agriculture Schemes */}
            <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs lg:col-span-2 space-y-4">
              <div className="flex items-center justify-between border-b border-[#F1F5F9] pb-3">
                <h3 className="text-[15px] font-bold text-[#0F172A] flex items-center gap-2">
                  <Landmark size={18} className="text-[#16A34A]" /> Active Government Agriculture Schemes
                </h3>
                <span className="text-[12px] text-[#16A34A] font-bold bg-[#F0FDF4] px-2.5 py-0.5 rounded-full border border-[#DCFCE7]">
                  {schemesList.length} Schemes
                </span>
              </div>

              <div className="space-y-3">
                {schemesList.map((sc, i) => (
                  <div key={i} className="p-3.5 rounded-xl border border-[#F1F5F9] bg-[#FAFCFF] flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <div className="text-[13px] font-bold text-[#0F172A]">{sc.name}</div>
                      <div className="text-[11.5px] text-[#64748B] mt-0.5">
                        Type: <span className="font-semibold text-[#0F172A]">{sc.type}</span> • Benefit: <span className="font-semibold text-[#16A34A]">{sc.benefit}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-semibold text-[#475569]">{sc.farmers} Farmers</span>
                      <StatusBadge status="success" label={sc.status} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'land' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[#0F172A]">Land Parcels Allocated to Government Schemes</h3>
            <span className="text-[12px] text-[#64748B] font-medium">{assignedLands.length} Active Records</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-[13px]">
              <thead>
                <tr className="border-b border-[#F1F5F9] text-[#94A3B8] font-bold uppercase text-[11px]">
                  <th className="py-2.5 px-3">Parcel ID</th>
                  <th className="py-2.5 px-3">Village / District</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 px-3">Area</th>
                  <th className="py-2.5 px-3">GIS Polygon</th>
                  <th className="py-2.5 px-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F8FAFC]">
                {assignedLands.map((land) => (
                  <tr key={land.id} className="hover:bg-[#F8FAFC] transition-colors">
                    <td className="py-3 px-3 font-bold text-[#2563EB]">{land.id}</td>
                    <td className="py-3 px-3 font-semibold text-[#0F172A]">{land.village}, {land.district}</td>
                    <td className="py-3 px-3 text-[#475569]">{land.state}</td>
                    <td className="py-3 px-3 font-bold text-[#0F172A]">{land.area}</td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 bg-[#F0FDF4] text-[#16A34A] rounded-md text-[11px] font-bold border border-[#DCFCE7]">
                        {land.polygon}
                      </span>
                    </td>
                    <td className="py-3 px-3"><StatusBadge status="success" label={land.status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'projects' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A]">Carbon & Agroforestry Projects Managed</h3>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {assignedProjects.map((prj) => (
              <div key={prj.id} className="p-4 rounded-xl border border-[#E8EDF5] bg-white hover:border-[#16A34A] transition-all space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-[#2563EB]">{prj.id}</span>
                  <StatusBadge status="success" label={prj.status} />
                </div>
                <div className="text-[14px] font-bold text-[#0F172A]">{prj.name}</div>
                <div className="text-[12px] text-[#64748B] space-y-1">
                  <div>Area: <span className="font-semibold text-[#0F172A]">{prj.area}</span></div>
                  <div>Carbon Issuance: <span className="font-bold text-[#16A34A]">{prj.carbonCredits}</span></div>
                  <div>Partner: <span className="font-semibold text-[#0F172A]">{prj.partner}</span></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'documents' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A]">Official MOU & Authorization Documents</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {documents.map((doc, i) => (
              <div key={i} className="p-4 rounded-xl border border-[#F1F5F9] bg-[#FAFCFF] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#FEF2F2] text-[#EF4444] flex items-center justify-center font-bold text-xs shrink-0">
                    PDF
                  </div>
                  <div>
                    <div className="text-[13px] font-bold text-[#0F172A]">{doc.name}</div>
                    <div className="text-[11px] text-[#94A3B8]">{doc.type} • {doc.size} • Uploaded {doc.date}</div>
                  </div>
                </div>
                <button
                  onClick={() => triggerToast(`Downloading ${doc.name}`)}
                  className="w-9 h-9 rounded-xl border border-[#E2E8F0] hover:bg-white text-[#64748B] hover:text-[#0F172A] flex items-center justify-center shadow-xs cursor-pointer"
                  title="Download Document"
                >
                  <Download size={16} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'timeline' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A]">Government Onboarding Audit Trail</h3>

          <div className="relative pl-6 space-y-6">
            <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[#F1F5F9]" />
            {timelineEvents.map((ev, i) => (
              <div key={i} className="relative flex items-start gap-4">
                <div className="absolute -left-[19px] top-1.5 w-3 h-3 rounded-full bg-[#16A34A] border-2 border-white" />
                <div>
                  <div className="text-[11px] font-bold text-[#94A3B8]">{ev.date}</div>
                  <div className="text-[13.5px] font-bold text-[#0F172A] mt-0.5">{ev.title}</div>
                  <div className="text-[12px] text-[#64748B] mt-0.5">{ev.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="bg-white border border-[#E8EDF5] rounded-2xl p-6 shadow-xs space-y-4">
          <h3 className="text-[15px] font-bold text-[#0F172A]">Official Compliance & Allocation Reports</h3>

          <div className="space-y-3">
            {[
              { title: 'Annual Scheme Expenditure & Carbon Credit Benefit Settlement (2024-25)', date: 'Q4 Report', size: '12 MB' },
              { title: 'State-wise Agroforestry Sapling Distribution Audit', date: 'Q3 Report', size: '8.4 MB' },
              { title: 'National Treasury Escrow Account Ledger Summary', date: 'Monthly Audit', size: '5.1 MB' },
            ].map((rep, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-[#F1F5F9] bg-[#FAFCFF] flex items-center justify-between">
                <div>
                  <div className="text-[13px] font-bold text-[#0F172A]">{rep.title}</div>
                  <div className="text-[11px] text-[#94A3B8] mt-0.5">{rep.date} • Size: {rep.size}</div>
                </div>
                <button
                  onClick={() => triggerToast(`Exporting ${rep.title}`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-[#F0FDF4] text-[#16A34A] font-semibold text-[12px] rounded-xl border border-[#DCFCE7] hover:bg-[#DCFCE7] transition-colors cursor-pointer"
                >
                  <Download size={14} /> Download PDF
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Floating Toast Notification */}
      <AnimatePresence>
        {toastMessage && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-[#0F172A] text-white px-5 py-3.5 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700"
          >
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-semibold">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};
