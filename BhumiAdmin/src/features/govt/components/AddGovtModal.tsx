import React, { useState } from 'react';
import {
  X, Building2, MapPin, User, FileText, Upload,
  CheckCircle2, Loader2
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useCreateGovtOrg, useUploadDocument, OrgType } from '../api/useGovtApi';

interface AddGovtModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AddGovtModal: React.FC<AddGovtModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3 | 4>(1);

  // Form State
  const [formData, setFormData] = useState({
    org_id: '',
    org_name: '',
    org_type: 'state_department' as OrgType,
    department: '',
    registration_code: '',
    state: '',
    district: '',
    block_tehsil: '',
    village_ward: '',
    building: '',
    street: '',
    city: '',
    pincode: '',
    contact_email: '',
    contact_phone: '',

    authorized_person_name: '',
    authorized_person_designation: '',
    authorized_person_email: '',
    authorized_person_phone: '',

    nodal_person_name: '',
    nodal_person_designation: '',
    nodal_person_email: '',
    nodal_person_phone: '',

    mou_document_url: '',
    authority_document_url: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isUploadingMou, setIsUploadingMou] = useState(false);
  const [isUploadingAuth, setIsUploadingAuth] = useState(false);

  const createMutation = useCreateGovtOrg();
  const uploadMutation = useUploadDocument();

  if (!isOpen) return null;

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone: string) => /^[6-9]\d{9}$/.test(phone);
  const validatePincode = (pin: string) => /^\d{6}$/.test(pin);

  const validateStep1 = () => {
    const errs: Record<string, string> = {};
    if (!formData.org_id.trim()) errs.org_id = 'Registration Code / Org ID is required';
    if (!formData.org_name.trim()) errs.org_name = 'Organization Name is required';
    if (!formData.department.trim()) errs.department = 'Department is required';
    if (!formData.contact_email.trim()) errs.contact_email = 'Contact Email is required';
    else if (!validateEmail(formData.contact_email)) errs.contact_email = 'Invalid email address';
    if (!formData.contact_phone.trim()) errs.contact_phone = 'Contact Phone is required';
    else if (!validatePhone(formData.contact_phone)) errs.contact_phone = 'Phone must be 10-digit Indian mobile number';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep2 = () => {
    const errs: Record<string, string> = {};
    if (!formData.state.trim()) errs.state = 'State is required';
    if (!formData.district.trim()) errs.district = 'District is required';
    if (!formData.street.trim()) errs.street = 'Street address is required';
    if (!formData.city.trim()) errs.city = 'City is required';
    if (!formData.pincode.trim()) errs.pincode = 'Pincode is required';
    else if (!validatePincode(formData.pincode)) errs.pincode = 'Pincode must be 6 digits';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep3 = () => {
    const errs: Record<string, string> = {};
    if (!formData.authorized_person_name.trim()) errs.authorized_person_name = 'Authorized Person Name is required';
    if (!formData.authorized_person_designation.trim()) errs.authorized_person_designation = 'Designation is required';
    if (!formData.authorized_person_email.trim()) errs.authorized_person_email = 'Email is required';
    else if (!validateEmail(formData.authorized_person_email)) errs.authorized_person_email = 'Invalid email';
    if (!formData.authorized_person_phone.trim()) errs.authorized_person_phone = 'Phone is required';
    else if (!validatePhone(formData.authorized_person_phone)) errs.authorized_person_phone = 'Invalid 10-digit phone';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const validateStep4 = () => {
    const errs: Record<string, string> = {};
    if (!formData.nodal_person_name.trim()) errs.nodal_person_name = 'Nodal Officer Name is required';
    if (!formData.nodal_person_designation.trim()) errs.nodal_person_designation = 'Designation is required';
    if (!formData.nodal_person_email.trim()) errs.nodal_person_email = 'Email is required';
    else if (!validateEmail(formData.nodal_person_email)) errs.nodal_person_email = 'Invalid email';
    if (!formData.nodal_person_phone.trim()) errs.nodal_person_phone = 'Phone is required';
    else if (!validatePhone(formData.nodal_person_phone)) errs.nodal_person_phone = 'Invalid 10-digit phone';

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleNext = () => {
    if (activeStep === 1 && validateStep1()) setActiveStep(2);
    else if (activeStep === 2 && validateStep2()) setActiveStep(3);
    else if (activeStep === 3 && validateStep3()) setActiveStep(4);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: 'mou' | 'auth') => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (field === 'mou') setIsUploadingMou(true);
    else setIsUploadingAuth(true);

    try {
      const res = await uploadMutation.mutateAsync(file);
      const url = res.document_url || res.url;
      if (field === 'mou') {
        setFormData((prev) => ({ ...prev, mou_document_url: url }));
        toast.success('MoU Document uploaded successfully!');
      } else {
        setFormData((prev) => ({ ...prev, authority_document_url: url }));
        toast.success('Authority Letter uploaded successfully!');
      }
    } catch (err: any) {
      toast.error('File upload failed. Please try again.');
    } finally {
      if (field === 'mou') setIsUploadingMou(false);
      else setIsUploadingAuth(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateStep4()) return;

    const payload = {
      org_id: formData.org_id,
      org_name: formData.org_name,
      org_type: formData.org_type,
      department: formData.department,
      registration_code: formData.registration_code || undefined,
      jurisdiction_level: 'state' as any,
      state: formData.state,
      district: formData.district,
      block_tehsil: formData.block_tehsil || undefined,
      village_ward: formData.village_ward || undefined,
      headquarters_address: {
        building: formData.building || undefined,
        street: formData.street,
        city: formData.city,
        district: formData.district,
        state: formData.state,
        pincode: formData.pincode,
      },
      contact_email: formData.contact_email,
      contact_phone: formData.contact_phone,

      authorized_person_name: formData.authorized_person_name,
      authorized_person_designation: formData.authorized_person_designation,
      authorized_person_email: formData.authorized_person_email,
      authorized_person_phone: formData.authorized_person_phone,

      nodal_person_name: formData.nodal_person_name,
      nodal_person_designation: formData.nodal_person_designation,
      nodal_person_email: formData.nodal_person_email,
      nodal_person_phone: formData.nodal_person_phone,

      mou_document_url: formData.mou_document_url || undefined,
      authority_document_url: formData.authority_document_url || undefined,
    };

    try {
      await createMutation.mutateAsync(payload);
      toast.success('Government Body onboarding submitted successfully!');
      onSuccess?.();
      onClose();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || 'Failed to register Government Organization.';
      toast.error(msg);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0F172A]/70 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#E8EDF5] overflow-hidden my-8">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#F8FAFC] border-b border-[#E8EDF5] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#EFF6FF] text-[#2563EB] border border-[#DBEAFE] flex items-center justify-center">
              <Building2 size={20} />
            </div>
            <div>
              <h2 className="text-[17px] font-bold text-[#0F172A]">Add Government Body</h2>
              <p className="text-[12px] text-[#64748B]">Register state department, ministry, or nodal body</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg hover:bg-[#E2E8F0] text-[#64748B] hover:text-[#0F172A] flex items-center justify-center transition-colors cursor-pointer border-0 bg-transparent"
          >
            <X size={18} />
          </button>
        </div>

        {/* Stepper Tabs */}
        <div className="flex items-center border-b border-[#E8EDF5] bg-[#FAFCFF] px-6 py-2.5">
          {[
            { step: 1, label: 'Org Details', icon: Building2 },
            { step: 2, label: 'Location', icon: MapPin },
            { step: 3, label: 'Authorized Officer', icon: User },
            { step: 4, label: 'Nodal Contact & MoU', icon: FileText },
          ].map((s) => {
            const Icon = s.icon;
            const isActive = activeStep === s.step;
            const isDone = activeStep > s.step;
            return (
              <button
                key={s.step}
                type="button"
                onClick={() => {
                  if (s.step === 1 || (s.step === 2 && validateStep1()) || (s.step === 3 && validateStep1() && validateStep2()) || (s.step === 4 && validateStep1() && validateStep2() && validateStep3())) {
                    setActiveStep(s.step as any);
                  }
                }}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 text-[12px] font-bold transition-all border-b-2 cursor-pointer bg-transparent ${
                  isActive
                    ? 'border-[#2563EB] text-[#2563EB]'
                    : isDone
                    ? 'border-transparent text-[#16A34A]'
                    : 'border-transparent text-[#94A3B8]'
                }`}
              >
                <Icon size={14} />
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* STEP 1: ORGANIZATION DETAILS */}
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Org Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={formData.org_type}
                    onChange={(e) => handleInputChange('org_type', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB]"
                  >
                    <option value="state_department">State Department</option>
                    <option value="ministry">Ministry</option>
                    <option value="district_collectorate">District Collectorate</option>
                    <option value="ngo_nodal_body">NGO / Nodal Body</option>
                    <option value="panchayat_raj">Panchayat Raj</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Registration Code / Org ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GOV-MP-AGRI-001"
                    value={formData.org_id}
                    onChange={(e) => handleInputChange('org_id', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.org_id ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.org_id && <p className="text-[11px] text-red-500 mt-1">{errors.org_id}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                  Organization Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. MP Department of Farmers Welfare & Agriculture Development"
                  value={formData.org_name}
                  onChange={(e) => handleInputChange('org_name', e.target.value)}
                  className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                    errors.org_name ? 'border-red-500' : 'border-[#E2E8F0]'
                  }`}
                />
                {errors.org_name && <p className="text-[11px] text-red-500 mt-1">{errors.org_name}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Department Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Agriculture Extension & Horticulture"
                    value={formData.department}
                    onChange={(e) => handleInputChange('department', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.department ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.department && <p className="text-[11px] text-red-500 mt-1">{errors.department}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Local Body Gazette Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. GAZ-MP-2025"
                    value={formData.registration_code}
                    onChange={(e) => handleInputChange('registration_code', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Official Contact Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. director.agri@mp.gov.in"
                    value={formData.contact_email}
                    onChange={(e) => handleInputChange('contact_email', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.contact_email ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.contact_email && <p className="text-[11px] text-red-500 mt-1">{errors.contact_email}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Official Mobile / Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={formData.contact_phone}
                    onChange={(e) => handleInputChange('contact_phone', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.contact_phone ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.contact_phone && <p className="text-[11px] text-red-500 mt-1">{errors.contact_phone}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: LOCATION & JURISDICTION */}
          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    State <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Madhya Pradesh"
                    value={formData.state}
                    onChange={(e) => handleInputChange('state', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.state ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.state && <p className="text-[11px] text-red-500 mt-1">{errors.state}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    District <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bhopal"
                    value={formData.district}
                    onChange={(e) => handleInputChange('district', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.district ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.district && <p className="text-[11px] text-red-500 mt-1">{errors.district}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Block / Tehsil
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Huzur"
                    value={formData.block_tehsil}
                    onChange={(e) => handleInputChange('block_tehsil', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Village / Ward
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Vidhya Nagar Ward 42"
                    value={formData.village_ward}
                    onChange={(e) => handleInputChange('village_ward', e.target.value)}
                    className="w-full px-3 py-2 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                  Street Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Krishi Bhawan, Main Road"
                  value={formData.street}
                  onChange={(e) => handleInputChange('street', e.target.value)}
                  className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                    errors.street ? 'border-red-500' : 'border-[#E2E8F0]'
                  }`}
                />
                {errors.street && <p className="text-[11px] text-red-500 mt-1">{errors.street}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    City <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bhopal"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.city ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.city && <p className="text-[11px] text-red-500 mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Pincode <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 462003"
                    value={formData.pincode}
                    onChange={(e) => handleInputChange('pincode', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.pincode ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.pincode && <p className="text-[11px] text-red-500 mt-1">{errors.pincode}</p>}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: AUTHORIZED PERSON */}
          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#EFF6FF] border border-[#DBEAFE] text-[12px] text-[#1E40AF]">
                Provide details of the Senior Executive / Secretary signing the MoU on behalf of the Government Body.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Authorized Person Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Rajesh Sharma"
                    value={formData.authorized_person_name}
                    onChange={(e) => handleInputChange('authorized_person_name', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.authorized_person_name ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.authorized_person_name && <p className="text-[11px] text-red-500 mt-1">{errors.authorized_person_name}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Joint Secretary (Agri Extension)"
                    value={formData.authorized_person_designation}
                    onChange={(e) => handleInputChange('authorized_person_designation', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.authorized_person_designation ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.authorized_person_designation && <p className="text-[11px] text-red-500 mt-1">{errors.authorized_person_designation}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Official Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. r.sharma@agri.gov.in"
                    value={formData.authorized_person_email}
                    onChange={(e) => handleInputChange('authorized_person_email', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.authorized_person_email ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.authorized_person_email && <p className="text-[11px] text-red-500 mt-1">{errors.authorized_person_email}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Official Mobile <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={formData.authorized_person_phone}
                    onChange={(e) => handleInputChange('authorized_person_phone', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.authorized_person_phone ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.authorized_person_phone && <p className="text-[11px] text-red-500 mt-1">{errors.authorized_person_phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                  Upload Authorization Letter (PDF/Doc)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] rounded-xl text-[12px] font-bold text-[#0F172A] cursor-pointer transition-colors">
                    {isUploadingAuth ? <Loader2 size={15} className="animate-spin text-[#2563EB]" /> : <Upload size={15} />}
                    <span>{isUploadingAuth ? 'Uploading...' : 'Choose File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={(e) => handleFileUpload(e, 'auth')}
                      className="hidden"
                    />
                  </label>
                  {formData.authority_document_url ? (
                    <span className="text-[12px] text-[#16A34A] font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> Authority Letter Uploaded
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#94A3B8]">PDF, DOC, or Image up to 15MB</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: NODAL CONTACT & MOU */}
          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="p-3 rounded-xl bg-[#F0FDF4] border border-[#DCFCE7] text-[12px] text-[#166534]">
                Specify Nodal Officer for day-to-day scheme administration and upload signed MoU.
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Nodal Officer Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Dr. Vikramaditya Singh"
                    value={formData.nodal_person_name}
                    onChange={(e) => handleInputChange('nodal_person_name', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.nodal_person_name ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.nodal_person_name && <p className="text-[11px] text-red-500 mt-1">{errors.nodal_person_name}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Designation <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Director (Horticulture)"
                    value={formData.nodal_person_designation}
                    onChange={(e) => handleInputChange('nodal_person_designation', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.nodal_person_designation ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.nodal_person_designation && <p className="text-[11px] text-red-500 mt-1">{errors.nodal_person_designation}</p>}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Nodal Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. nodal.singh@mp.gov.in"
                    value={formData.nodal_person_email}
                    onChange={(e) => handleInputChange('nodal_person_email', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.nodal_person_email ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.nodal_person_email && <p className="text-[11px] text-red-500 mt-1">{errors.nodal_person_email}</p>}
                </div>

                <div>
                  <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                    Nodal Phone <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9876543210"
                    value={formData.nodal_person_phone}
                    onChange={(e) => handleInputChange('nodal_person_phone', e.target.value)}
                    className={`w-full px-3 py-2 bg-[#F8FAFC] border rounded-xl text-[13px] text-[#0F172A] outline-none focus:border-[#2563EB] ${
                      errors.nodal_person_phone ? 'border-red-500' : 'border-[#E2E8F0]'
                    }`}
                  />
                  {errors.nodal_person_phone && <p className="text-[11px] text-red-500 mt-1">{errors.nodal_person_phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-bold text-[#475569] uppercase mb-1">
                  Upload Official MoU Document (PDF/Doc)
                </label>
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 px-4 py-2 bg-[#F1F5F9] hover:bg-[#E2E8F0] border border-[#CBD5E1] rounded-xl text-[12px] font-bold text-[#0F172A] cursor-pointer transition-colors">
                    {isUploadingMou ? <Loader2 size={15} className="animate-spin text-[#2563EB]" /> : <Upload size={15} />}
                    <span>{isUploadingMou ? 'Uploading...' : 'Choose MoU File'}</span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,image/*"
                      onChange={(e) => handleFileUpload(e, 'mou')}
                      className="hidden"
                    />
                  </label>
                  {formData.mou_document_url ? (
                    <span className="text-[12px] text-[#16A34A] font-bold flex items-center gap-1">
                      <CheckCircle2 size={14} /> MoU Document Uploaded
                    </span>
                  ) : (
                    <span className="text-[11px] text-[#94A3B8]">Signed MoU Agreement PDF</span>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#E8EDF5] flex items-center justify-between">
            {activeStep > 1 ? (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as any)}
                className="px-4 py-2 border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] text-[13px] font-bold rounded-xl cursor-pointer"
              >
                Back
              </button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-[#CBD5E1] hover:bg-[#F8FAFC] text-[#475569] text-[13px] font-bold rounded-xl cursor-pointer"
              >
                Cancel
              </button>

              {activeStep < 4 ? (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-5 py-2 bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-bold rounded-xl cursor-pointer shadow-xs border-0"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={createMutation.isPending}
                  className="px-6 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white text-[13px] font-bold rounded-xl cursor-pointer shadow-xs border-0 flex items-center gap-1.5 disabled:opacity-50"
                >
                  {createMutation.isPending && <Loader2 size={15} className="animate-spin" />}
                  <span>Submit Organization</span>
                </button>
              )}
            </div>
          </div>
        </form>

      </div>
    </div>
  );
};
