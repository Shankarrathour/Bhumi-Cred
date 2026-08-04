import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useEcosystemStore, useAdminStore } from '../store';
import { Farmer } from '../types';
import adminApi, { API_BASE_URL } from '../api/apiClient';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Search, 
  Phone, 
  X, 
  Check, 
  Plus,
  MapPin, 
  Download,
  Ban,
  User,
  Leaf,
  Edit3,
  Trees,
  ChevronRight,
  ChevronLeft,
  Copy,
  RefreshCw,
  AlertCircle,
  Sparkles,
  Filter,
  CheckCircle2,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { cn } from '../utils/cn';

// Status tabs configuration
const STATUS_TABS = [
  { id: 'All', label: 'All Farmers' },
  { id: 'Pending', label: 'Pending' },
  { id: 'Under Review', label: 'Under Review' },
  { id: 'Approved', label: 'Approved' },
  { id: 'Blocked', label: 'Blocked' },
  { id: 'Rejected', label: 'Rejected' },
];

export const UsersPage: React.FC = () => {
  // State for search and filtering
  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [activeTab, setActiveTab] = useState<string>('All');
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize] = useState<number>(12);

  // Pagination & Async UI state
  const [totalRecords, setTotalRecords] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Drawer state
  const [selectedFarmer, setSelectedFarmer] = useState<Farmer | null>(null);
  const [editingScore, setEditingScore] = useState<number>(0);
  const [isEditingScore, setIsEditingScore] = useState(false);

  // Carbon project assignment inside drawer
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [assignLandAcres, setAssignLandAcres] = useState<string>('');
  const [assignTreeCount, setAssignTreeCount] = useState<string>('0');
  const [realProjects, setRealProjects] = useState<any[]>([]);

  // Stores
  const { farmers, fetchFarmers, fetchLands, carbonProjects, fetchCarbonProjects, updateFarmerSustainabilityScore } = useEcosystemStore();
  const { activeState, activeDistrict, activeBlock, activeVillage, resetScope } = useAdminStore();

  // Debounce search input (300ms)
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchInput.trim());
      setCurrentPage(1); // Reset page on new search
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Map active status tab to backend query parameters
  const statusQueryParams = useMemo(() => {
    switch (activeTab) {
      case 'Pending':
        return { kyc_status: 'pending', is_active: undefined };
      case 'Under Review':
        return { kyc_status: 'under_review', is_active: undefined };
      case 'Approved':
        return { kyc_status: 'approved', is_active: undefined };
      case 'Rejected':
        return { kyc_status: 'rejected', is_active: undefined };
      case 'Blocked':
        return { kyc_status: undefined, is_active: false };
      case 'All':
      default:
        return { kyc_status: undefined, is_active: undefined };
    }
  }, [activeTab]);

  // Main API data loader
  const loadFarmerData = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetchFarmers({
        page: currentPage,
        limit: pageSize,
        search: debouncedSearch,
        state: activeState,
        district: activeDistrict,
        kyc_status: statusQueryParams.kyc_status,
        is_active: statusQueryParams.is_active,
      });

      setTotalRecords(res.total);
      setTotalPages(res.totalPages);
    } catch (err: any) {
      console.error('[UsersPage] Load farmers error:', err);
      setErrorMsg(err.message || 'Failed to fetch farmers data. Please check backend server.');
    } finally {
      setIsLoading(false);
    }
  }, [fetchFarmers, currentPage, pageSize, debouncedSearch, activeState, activeDistrict, statusQueryParams]);

  // Trigger data load on filter / search / pagination change
  useEffect(() => {
    loadFarmerData();
  }, [loadFarmerData]);

  // Fetch carbon projects for audit drawer assignment dropdown
  useEffect(() => {
    fetchCarbonProjects();
    adminApi.get('/admin/projects')
      .then((res) => {
        const list = Array.isArray(res.data) ? res.data : (res.data?.data || []);
        setRealProjects(list.filter((p: any) => p.is_active ?? true));
      })
      .catch(() => setRealProjects([]));
  }, [fetchCarbonProjects]);

  const availableProjects = useMemo(() => {
    const apiList = (realProjects || []).map((p: any) => ({
      id: p.project_id || p.id,
      title: p.title || p.name || 'Carbon Project',
    }));
    const storeList = (carbonProjects || []).map((p: any) => ({
      id: p.id || p.project_id,
      title: p.title || p.name || 'Carbon Project',
    }));

    const combined = [...apiList, ...storeList];
    const map = new Map<string, { id: string; title: string }>();
    for (const item of combined) {
      if (item.id && !map.has(item.id)) {
        map.set(item.id, item);
      }
    }
    return Array.from(map.values());
  }, [realProjects, carbonProjects]);

  // Filter list locally for block/village if specified in GIS bar
  const filteredDisplayList = useMemo(() => {
    return farmers.filter((farmer) => {
      // Village & Block client filter if specified in GIS bar
      if (activeBlock !== 'All Blocks' && farmer.location?.block && farmer.location.block !== activeBlock) {
        return false;
      }
      if (activeVillage !== 'All Villages' && farmer.location?.village && farmer.location.village !== activeVillage) {
        return false;
      }
      return true;
    });
  }, [farmers, activeBlock, activeVillage]);

  // Reset all filters & search
  const handleResetAllFilters = () => {
    setSearchInput('');
    setDebouncedSearch('');
    setActiveTab('All');
    setCurrentPage(1);
    resetScope();
  };

  // CSV Export
  const handleExportCSV = () => {
    const escapeCell = (value: string | number): string => {
      const str = String(value ?? '');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str.replace(/"/g, '""')}"`;
      }
      return str;
    };

    const headers = [
      'Farmer ID',
      'System ID',
      'Name',
      'Phone',
      'Village',
      'Block',
      'District',
      'State',
      'KYC Status',
      'Total Acreage (acres)',
      'Total Trees',
      'Sustainability Score (%)',
      'Carbon Credits (t)',
      'Wallet Balance (INR)',
    ];

    const rows = filteredDisplayList.map((f) => [
      escapeCell(f.farmerId || 'N/A'),
      escapeCell(f.id),
      escapeCell(f.name),
      escapeCell(f.phone),
      escapeCell(f.location?.village || ''),
      escapeCell(f.location?.block || ''),
      escapeCell(f.location?.district || ''),
      escapeCell(f.location?.state || ''),
      escapeCell(f.kycStatus),
      escapeCell(f.totalAcreage),
      escapeCell(f.totalTrees),
      escapeCell(f.sustainabilityScore),
      escapeCell(f.carbonCreditsGenerated),
      escapeCell(f.walletBalance),
    ].join(','));

    const csvContent = [headers.map(escapeCell).join(','), ...rows].join('\r\n');
    const today = new Date().toISOString().split('T')[0];
    const filename = `bhumi_farmers_directory_${today}.csv`;

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success('Farmers directory exported to CSV successfully!');
  };

  // Block / Unblock action on card
  const handleToggleBlockCard = async (farmer: Farmer) => {
    const isCurrentlyBlocked = farmer.isActive === false || farmer.kycStatus === 'Blocked';
    const actionUrl = isCurrentlyBlocked ? `/admin/farmers/${farmer.id}/unblock` : `/admin/farmers/${farmer.id}/block`;
    
    try {
      await adminApi.put(actionUrl);
      toast.success(`Farmer ${isCurrentlyBlocked ? 'unblocked' : 'blocked'} successfully.`);
      await loadFarmerData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || `Failed to ${isCurrentlyBlocked ? 'unblock' : 'block'} farmer.`);
    }
  };

  // Drawer state & actions  // Detail state for farmer identity & KYC review
  const emptyDetail = {
    email: null,
    aadhaar_number: null,
    pan_number: null,
    aadhaar_url: null,
    pan_url: null,
    kyc_status: null,
    is_active: null,
    kyc_remarks: null,
    kyc_reviewed_by: null,
    kyc_reviewed_at: null,
    loading: false,
  };

  const [farmerDetail, setFarmerDetail] = useState<{
    email: string | null;
    aadhaar_number: string | null;
    pan_number: string | null;
    aadhaar_url: string | null;
    pan_url: string | null;
    kyc_status: string | null;
    is_active: boolean | null;
    kyc_remarks: string | null;
    kyc_reviewed_by: string | null;
    kyc_reviewed_at: string | null;
    loading: boolean;
  }>(emptyDetail);

  const [kycActionLoading, setKycActionLoading] = useState<'approve' | 'reject' | 'block' | 'unblock' | null>(null);

  // KYC Manual Editing State
  const [isEditingKyc, setIsEditingKyc] = useState(false);
  const [kycForm, setKycForm] = useState({
    aadhaar_number: '',
    pan_number: '',
    aadhaar_url: '',
    pan_url: '',
  });
  const [savingKyc, setSavingKyc] = useState(false);

  // Land Parcel Creation State
  const [landSurveyNumber, setLandSurveyNumber] = useState('');
  const [landAreaAcres, setLandAreaAcres] = useState('');
  const [landCropType, setLandCropType] = useState('Agricultural Land');
  const [landSoilType, setLandSoilType] = useState('Black Soil');
  const [registeringLand, setRegisteringLand] = useState(false);

  const closeFarmerDrawer = () => {
    setSelectedFarmer(null);
    setFarmerDetail(emptyDetail);
    setKycActionLoading(null);
    setIsEditingKyc(false);
  };

  const loadFarmerDetail = async (farmerId: string) => {
    const [detailRes, identityRes] = await Promise.allSettled([
      adminApi.get(`/admin/farmers/${farmerId}`),
      adminApi.get(`/admin/farmers/${farmerId}/identity`),
    ]);
    const detail = detailRes.status === 'fulfilled' ? detailRes.value.data?.data : null;
    const identity = identityRes.status === 'fulfilled' ? identityRes.value.data?.data : null;
    setFarmerDetail({
      email: detail?.email ?? null,
      aadhaar_number: identity?.aadhaar_number ?? detail?.identity_number ?? selectedFarmer?.kycDocuments?.aadharNumber ?? null,
      pan_number: identity?.pan_number ?? selectedFarmer?.kycDocuments?.panNumber ?? null,
      aadhaar_url: identity?.aadhaar_url ?? detail?.id_proof_url ?? selectedFarmer?.kycDocuments?.proofUrl ?? null,
      pan_url: identity?.pan_url ?? null,
      kyc_status: detail?.kyc_status ?? null,
      is_active: detail?.is_active ?? null,
      kyc_remarks: detail?.kyc_remarks ?? null,
      kyc_reviewed_by: detail?.kyc_reviewed_by ?? null,
      kyc_reviewed_at: detail?.kyc_reviewed_at ?? null,
      loading: false,
    });
  };

  const openFarmerDrawer = async (farmer: Farmer) => {
    setSelectedFarmer(farmer);
    setEditingScore(farmer.sustainabilityScore);
    setIsEditingScore(false);
    setIsEditingKyc(false);
    setFarmerDetail({ ...emptyDetail, loading: true });
    try {
      await loadFarmerDetail(farmer.id);
    } catch {
      setFarmerDetail(emptyDetail);
    }
  };

  const startKycEdit = () => {
    setKycForm({
      aadhaar_number: farmerDetail.aadhaar_number || selectedFarmer?.kycDocuments?.aadharNumber || '',
      pan_number: farmerDetail.pan_number || selectedFarmer?.kycDocuments?.panNumber || '',
      aadhaar_url: farmerDetail.aadhaar_url || selectedFarmer?.kycDocuments?.proofUrl || '',
      pan_url: farmerDetail.pan_url || '',
    });
    setIsEditingKyc(true);
  };

  const handleSaveIdentity = async () => {
    if (!selectedFarmer) return;
    setSavingKyc(true);
    try {
      await adminApi.put(`/admin/farmers/${selectedFarmer.id}/identity`, kycForm);
      toast.success('Identity details updated successfully!');
      setIsEditingKyc(false);
      await loadFarmerDetail(selectedFarmer.id);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update identity details.');
    } finally {
      setSavingKyc(false);
    }
  };

  const handleApproveKYC = async (farmerId: string) => {
    setKycActionLoading('approve');
    try {
      await adminApi.put(`/admin/farmers/${farmerId}/approve`);
      toast.success('Farmer KYC approved successfully.');
      await loadFarmerDetail(farmerId);
      await loadFarmerData();
      setSelectedFarmer((prev) => (prev ? { ...prev, kycStatus: 'Approved' } : null));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to approve farmer.');
    } finally {
      setKycActionLoading(null);
    }
  };

  const handleRejectKYC = async (farmerId: string) => {
    setKycActionLoading('reject');
    try {
      await adminApi.put(`/admin/farmers/${farmerId}/reject`, { kyc_remarks: 'Rejected by admin verification' });
      toast.success('Farmer KYC rejected.');
      await loadFarmerDetail(farmerId);
      await loadFarmerData();
      setSelectedFarmer((prev) => (prev ? { ...prev, kycStatus: 'Rejected' } : null));
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to reject farmer.');
    } finally {
      setKycActionLoading(null);
    }
  };

  const handleSaveScore = (farmerId: string) => {
    updateFarmerSustainabilityScore(farmerId, editingScore);
    toast.success(`Farmer sustainability score updated to ${editingScore}%.`);
    setIsEditingScore(false);
    if (selectedFarmer?.id === farmerId) {
      setSelectedFarmer((prev) => (prev ? { ...prev, sustainabilityScore: editingScore } : null));
    }
  };

  const handleAssignProject = async (farmerId: string) => {
    if (!selectedProjectId) {
      toast.error('Select a carbon project first');
      return;
    }
    try {
      await adminApi.post(`/admin/projects/${selectedProjectId}/assign`, {
        farmer_id: farmerId,
        land_area_acres: Number(assignLandAcres) || 1.0,
        tree_count: Number(assignTreeCount) || 0,
      });
      toast.success('Farmer successfully assigned to carbon project.');
      setSelectedProjectId('');
      setAssignLandAcres('');
      setAssignTreeCount('0');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to assign project');
    }
  };

  // Tree Tagging Creation State
  const [treeSpecies, setTreeSpecies] = useState('Teak');
  const [treeCountInput, setTreeCountInput] = useState('10');
  const [taggingTrees, setTaggingTrees] = useState(false);

  const handleTagTrees = async (farmerId: string) => {
    if (!treeCountInput || Number(treeCountInput) <= 0) {
      toast.error('Tree count must be greater than 0');
      return;
    }
    setTaggingTrees(true);
    try {
      await adminApi.post('/admin/tree-registrations', {
        farmer_id: farmerId,
        tree_name: `${treeSpecies} Plantation Shield`,
        tree_species: treeSpecies,
        tree_count: Number(treeCountInput),
        tree_age: 12,
        plantation_year: 2026,
        village: selectedFarmer?.location?.village || 'Anuppur',
        district: selectedFarmer?.location?.district || 'Anuppur',
        state: selectedFarmer?.location?.state || 'Madhya Pradesh',
        insurance_required: true,
      });
      toast.success(`${treeCountInput} ${treeSpecies} trees tagged! Sent to Tree Insurance Audit.`);
      setTreeCountInput('10');
      await loadFarmerData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to tag trees');
    } finally {
      setTaggingTrees(false);
    }
  };

  const handleRegisterLand = async (farmerId: string) => {
    if (!landSurveyNumber || !landAreaAcres) {
      toast.error('Survey Number & Area in Acres are required');
      return;
    }
    setRegisteringLand(true);
    try {
      await adminApi.post('/admin/lands', {
        farmer_id: farmerId,
        survey_number: landSurveyNumber.trim(),
        area_acres: Number(landAreaAcres),
        crop_type: landCropType,
        soil_type: landSoilType,
        state: selectedFarmer?.location?.state || 'Madhya Pradesh',
        district: selectedFarmer?.location?.district || 'Indore',
      });
      toast.success(`Land Parcel (Survey: ${landSurveyNumber}) registered! Sent to GIS Verification.`);
      setLandSurveyNumber('');
      setLandAreaAcres('');
      await fetchLands();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to register land parcel');
    } finally {
      setRegisteringLand(false);
    }
  };

  return (
    <div className="space-y-6 pb-12 font-sans bg-background min-h-screen text-foreground select-none px-1 transition-colors">
      
      {/* 🟢 1. Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card border border-border p-5 rounded-xl shadow-xs transition-colors">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-foreground tracking-tight">Farmers Registry</h1>
            <span className="bg-primary/10 text-primary text-xs font-semibold px-2.5 py-0.5 rounded-full border border-primary/20">
              {totalRecords} Registered
            </span>
          </div>
          <p className="text-muted-foreground text-xs mt-1">
            Audit farmer profiles, verify KYC identity, track ecological sustainability scores, and assign carbon initiatives.
          </p>
        </div>
        
        <button
          onClick={handleExportCSV}
          className="inline-flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-4 py-2.5 rounded-lg shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Export Directory (CSV)</span>
        </button>
      </div>

      {/* 🔍 2. Search & Status Filter Tabs Control Bar */}
      <div className="bg-card border border-border p-4 rounded-xl shadow-xs space-y-4 transition-colors">
        
        {/* Active GIS Filter Notice Banner */}
        {activeState !== 'All States' && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-lg px-3.5 py-2.5 flex items-center justify-between gap-3 text-xs text-amber-700 dark:text-amber-300">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span>
                <strong>GIS Location Filter Active:</strong> Showing farmers in <strong>{activeState}</strong>
                {activeDistrict !== 'All Districts' && `, ${activeDistrict}`}
                {activeBlock !== 'All Blocks' && `, ${activeBlock}`}
              </span>
            </div>
            <button
              onClick={() => resetScope()}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500/30 rounded-lg text-xs font-semibold text-amber-800 dark:text-amber-200 transition-colors flex items-center gap-1.5 shrink-0 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Show All States (All Farmers)</span>
            </button>
          </div>
        )}

        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-primary" />
            <input 
              type="text"
              placeholder="Search by farmer name, farmer ID, mobile, village, block, district, state..."
              className="w-full pl-10 pr-9 py-2.5 bg-muted/50 border border-border rounded-lg text-xs font-medium text-foreground placeholder:text-muted-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setDebouncedSearch(searchInput.trim());
                  setCurrentPage(1);
                }
              }}
            />
            {searchInput && (
              <button 
                onClick={() => setSearchInput('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Refresh Button */}
          <button
            onClick={() => loadFarmerData()}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-2.5 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg transition-all disabled:opacity-50 border border-border"
            title="Refresh list"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", isLoading && "animate-spin text-primary")} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none border-t border-border pt-3">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mr-1 shrink-0 flex items-center gap-1">
            <Filter className="w-3 h-3 text-primary" /> Status:
          </span>
          {STATUS_TABS.map((tab) => {
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id);
                  setCurrentPage(1);
                }}
                className={cn(
                  "px-3.5 py-1.5 text-xs font-medium rounded-lg transition-all shrink-0 cursor-pointer",
                  isActive 
                    ? "bg-primary text-primary-foreground shadow-xs font-semibold" 
                    : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground border border-border/50"
                )}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* ⚠️ 3. Error Banner (if API error occurs) */}
      {errorMsg && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex items-center justify-between text-destructive text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <span>{errorMsg}</span>
          </div>
          <button 
            onClick={() => loadFarmerData()} 
            className="px-3 py-1 bg-destructive text-destructive-foreground rounded-md text-xs font-medium hover:bg-destructive/90 transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* 🎴 4. Farmer Cards Grid / Skeletons / Empty State */}
      {isLoading ? (
        // Skeleton Loader
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 space-y-4 animate-pulse">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="h-4 bg-muted rounded-md w-1/2"></div>
                  <div className="h-3 bg-muted/60 rounded-md w-1/3"></div>
                </div>
                <div className="h-5 bg-muted rounded-full w-16"></div>
              </div>
              <div className="space-y-2 pt-2">
                <div className="h-3 bg-muted/60 rounded-md w-3/4"></div>
                <div className="h-3 bg-muted/60 rounded-md w-2/3"></div>
              </div>
              <div className="grid grid-cols-2 gap-2 pt-2">
                <div className="h-12 bg-muted/40 rounded-lg"></div>
                <div className="h-12 bg-muted/40 rounded-lg"></div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredDisplayList.length === 0 ? (
        // Empty State
        <div className="bg-card border border-border border-dashed rounded-xl p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <h3 className="text-base font-semibold text-foreground">No Farmers Found</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            No farmer records match your current search term or filter criteria. Try clearing search or resetting GIS bounds.
          </p>
          <button
            onClick={handleResetAllFilters}
            className="inline-flex items-center gap-1.5 bg-primary/10 text-primary hover:bg-primary/20 font-medium text-xs px-4 py-2 rounded-lg border border-primary/20 transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Reset All Filters</span>
          </button>
        </div>
      ) : (
        // Farmer Cards Grid
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDisplayList.map((farmer) => {
            const isBlocked = farmer.isActive === false || farmer.kycStatus === 'Blocked';
            return (
              <motion.div
                layout
                key={farmer.id}
                className={cn(
                  "bg-card border rounded-xl p-5 flex flex-col justify-between transition-all duration-200 hover:shadow-md relative group",
                  isBlocked ? "border-border/60 bg-muted/30 opacity-80" : "border-border hover:border-primary/40"
                )}
              >
                <div className="space-y-3.5">
                  {/* Card Header: Name & Status Badge */}
                  <div className="flex items-start justify-between border-b border-border pb-3">
                    <div className="space-y-0.5">
                      <h3 className="font-bold text-sm text-foreground group-hover:text-primary transition-colors leading-snug">
                        {farmer.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-xs text-primary font-mono font-semibold">
                        <span>{farmer.farmerId || 'N/A'}</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(farmer.id);
                            toast.success('System ID copied!');
                          }}
                          className="text-muted-foreground hover:text-primary transition-colors"
                          title="Copy System ID"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    <span className={cn(
                      "text-[10px] font-bold px-2.5 py-0.5 rounded-full border tracking-wide uppercase",
                      farmer.kycStatus === 'Approved' ? "bg-primary/10 text-primary border-primary/20" :
                      farmer.kycStatus === 'Pending' ? "bg-amber-500/10 text-amber-500 border-amber-500/20" :
                      farmer.kycStatus === 'Under Review' ? "bg-blue-500/10 text-blue-500 border-blue-500/20" :
                      "bg-destructive/10 text-destructive border-destructive/20"
                    )}>
                      {farmer.kycStatus}
                    </span>
                  </div>

                  {/* Metadata Fields */}
                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex items-start gap-2">
                      <MapPin className="h-3.5 w-3.5 text-primary shrink-0 mt-0.5" />
                      <span className="line-clamp-1 text-foreground">
                        {farmer.location?.village || 'Village'}, {farmer.location?.block || 'Block'}, {farmer.location?.district || 'District'}, {farmer.location?.state || 'State'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-primary shrink-0" />
                      <span className="font-medium text-foreground">{farmer.phone}</span>
                    </div>

                    <div className="flex items-center gap-3 pt-1 text-foreground font-medium text-xs">
                      <div className="flex items-center gap-1">
                        <Leaf className="h-3.5 w-3.5 text-primary" />
                        <span>Score: <strong className="text-primary font-bold">{farmer.sustainabilityScore}%</strong></span>
                      </div>
                      <span className="text-muted-foreground/50">•</span>
                      <div className="flex items-center gap-1">
                        <Trees className="h-3.5 w-3.5 text-primary" />
                        <span>Trees: <strong className="text-primary font-bold">{farmer.totalTrees}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Carbon Credits & Wallet Balance Blocks */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border">
                    <div className="bg-muted/40 p-2.5 rounded-lg border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">CARBON CREDITS</span>
                      <span className="text-xs font-bold text-primary font-mono">{farmer.carbonCreditsGenerated} t</span>
                    </div>
                    <div className="bg-muted/40 p-2.5 rounded-lg border border-border">
                      <span className="text-[10px] text-muted-foreground uppercase tracking-wider block font-semibold">WALLET BALANCE</span>
                      <span className="text-xs font-bold text-primary font-mono">₹{farmer.walletBalance.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>

                {/* Card Action Footer */}
                <div className="flex items-center justify-between gap-2 mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => handleToggleBlockCard(farmer)}
                    className={cn(
                      "px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors border cursor-pointer",
                      isBlocked
                        ? "border-primary/30 bg-primary/10 text-primary hover:bg-primary/20"
                        : "border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20"
                    )}
                  >
                    {isBlocked ? (
                      <>
                        <Check className="h-3.5 w-3.5" /> Unblock
                      </>
                    ) : (
                      <>
                        <Ban className="h-3.5 w-3.5" /> Block Farmer
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => openFarmerDrawer(farmer)}
                    className="px-3.5 py-1.5 bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs rounded-lg flex items-center gap-1 shadow-xs transition-all cursor-pointer"
                  >
                    <span>Audit Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 📄 5. Server-side Pagination Footer */}
      {!isLoading && totalPages > 1 && (
        <div className="bg-card border border-border rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-muted-foreground shadow-xs">
          <div>
            Showing <strong className="text-foreground">{((currentPage - 1) * pageSize) + 1}</strong> to{' '}
            <strong className="text-foreground">{Math.min(currentPage * pageSize, totalRecords)}</strong> of{' '}
            <strong className="text-foreground">{totalRecords}</strong> farmers
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-border rounded-lg hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Previous Page"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <span className="font-semibold text-foreground px-2">
              Page {currentPage} of {totalPages}
            </span>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-border rounded-lg hover:bg-muted text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              title="Next Page"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* 📂 6. Farmer Audit Profile Side Drawer */}
      <AnimatePresence>
        {selectedFarmer && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              onClick={closeFarmerDrawer}
              className="fixed inset-0 z-40 bg-black/60"
            />
            
            {/* Drawer Window */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.25 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-lg bg-card border-l border-border shadow-2xl flex flex-col h-full font-sans text-xs text-foreground"
            >
              {/* Drawer Header */}
              <div className="p-5 border-b border-border flex items-center justify-between bg-muted/40">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg flex items-center justify-center shadow-xs font-bold text-sm">
                    <User className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-foreground">Farmer Audit Hub</h3>
                    <p className="text-primary font-semibold text-xs mt-0.5">
                      ID: {selectedFarmer.farmerId || 'N/A'}
                    </p>
                  </div>
                </div>

                <button 
                  onClick={closeFarmerDrawer}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Scrollable Audit Fields */}
              <div className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar">

                {/* System ID Copy Banner */}
                <div className="bg-primary/10 border border-primary/20 p-3 rounded-lg flex items-center justify-between">
                  <div>
                    <span className="text-[10px] text-primary uppercase font-bold block">SYSTEM ID</span>
                    <span className="text-xs font-mono font-bold text-foreground">{selectedFarmer.id}</span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(selectedFarmer.id);
                      toast.success('System ID copied!');
                    }}
                    className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground font-medium text-xs rounded-md shadow-xs hover:bg-primary/90 transition-colors"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>

                {/* Identity & Contact Details */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-xs">
                  <h4 className="font-bold text-xs text-primary uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                    <User className="w-4 h-4" /> Personal & Geographic Profile
                  </h4>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Full Name</span>
                      <span className="font-bold text-foreground">{selectedFarmer.name}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Phone</span>
                      <span className="font-semibold text-foreground">{selectedFarmer.phone}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Email</span>
                      <span className="font-medium text-foreground">{farmerDetail.email || 'N/A'}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Registered Date</span>
                      <span className="font-medium text-foreground">{selectedFarmer.registeredDate}</span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-border">
                      <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Full Address</span>
                      <span className="font-medium text-foreground">
                        {selectedFarmer.location?.village || 'Village'}, {selectedFarmer.location?.block || 'Block'}, {selectedFarmer.location?.district || 'District'}, {selectedFarmer.location?.state || 'State'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* KYC Identity Verification Deeds */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> KYC Verification Deeds
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-primary">{selectedFarmer.kycStatus}</span>
                      {!isEditingKyc && (
                        <button
                          onClick={startKycEdit}
                          className="text-[11px] font-semibold text-primary hover:underline flex items-center gap-1 border border-primary/20 bg-primary/5 px-2 py-0.5 rounded-md cursor-pointer"
                        >
                          <Edit3 className="w-3 h-3" /> Edit KYC
                        </button>
                      )}
                    </div>
                  </div>

                  {isEditingKyc ? (
                    <div className="space-y-3 p-3 bg-muted/30 border border-primary/20 rounded-lg">
                      <div className="font-bold text-xs text-foreground">Update Farmer Identity Details</div>
                      
                      <div className="space-y-2 text-xs">
                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Aadhaar Number</label>
                          <input
                            type="text"
                            placeholder="e.g. 9876-5432-1098"
                            value={kycForm.aadhaar_number}
                            onChange={(e) => setKycForm(f => ({ ...f, aadhaar_number: e.target.value }))}
                            className="w-full mt-1 px-3 py-1.5 bg-background border border-border rounded-md font-mono text-xs text-foreground outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">PAN Number</label>
                          <input
                            type="text"
                            placeholder="e.g. ABCDE1234F"
                            value={kycForm.pan_number}
                            onChange={(e) => setKycForm(f => ({ ...f, pan_number: e.target.value }))}
                            className="w-full mt-1 px-3 py-1.5 bg-background border border-border rounded-mono text-xs text-foreground outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">Aadhaar Document URL</label>
                          <input
                            type="text"
                            placeholder="https://... or /uploads/..."
                            value={kycForm.aadhaar_url}
                            onChange={(e) => setKycForm(f => ({ ...f, aadhaar_url: e.target.value }))}
                            className="w-full mt-1 px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground outline-none focus:border-primary"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-muted-foreground uppercase">PAN Document URL</label>
                          <input
                            type="text"
                            placeholder="https://... or /uploads/..."
                            value={kycForm.pan_url}
                            onChange={(e) => setKycForm(f => ({ ...f, pan_url: e.target.value }))}
                            className="w-full mt-1 px-3 py-1.5 bg-background border border-border rounded-md text-xs text-foreground outline-none focus:border-primary"
                          />
                        </div>
                      </div>

                      <div className="flex justify-end gap-2 pt-2 border-t border-border">
                        <button
                          onClick={() => setIsEditingKyc(false)}
                          disabled={savingKyc}
                          className="px-3 py-1 bg-muted text-muted-foreground hover:text-foreground font-semibold text-xs rounded-md cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleSaveIdentity}
                          disabled={savingKyc}
                          className="px-3 py-1 bg-primary text-primary-foreground font-bold text-xs rounded-md shadow-xs hover:bg-primary/90 flex items-center gap-1 cursor-pointer"
                        >
                          {savingKyc ? <RefreshCw className="w-3 h-3 animate-spin" /> : <CheckCircle2 className="w-3 h-3" />}
                          Save Identity
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-semibold block">Aadhaar Number</span>
                          <span className="font-mono font-bold text-foreground">
                            {farmerDetail.aadhaar_number || selectedFarmer.kycDocuments.aadharNumber || 'N/A'}
                          </span>
                        </div>
                        <div>
                          <span className="text-muted-foreground text-[10px] uppercase font-semibold block">PAN Number</span>
                          <span className="font-mono font-bold text-foreground">
                            {farmerDetail.pan_number || selectedFarmer.kycDocuments.panNumber || 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="bg-muted/40 border border-border rounded-md p-3 space-y-2">
                        {farmerDetail.loading ? (
                          <span className="text-xs text-muted-foreground">Loading document links...</span>
                        ) : (
                          <>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-muted-foreground font-medium">Aadhaar Document:</span>
                              {(farmerDetail.aadhaar_url || selectedFarmer?.kycDocuments?.proofUrl) ? (
                                <a
                                  href={(farmerDetail.aadhaar_url || selectedFarmer?.kycDocuments?.proofUrl)?.startsWith('/uploads')
                                    ? `${API_BASE_URL}${farmerDetail.aadhaar_url || selectedFarmer?.kycDocuments?.proofUrl}`
                                    : (farmerDetail.aadhaar_url || selectedFarmer?.kycDocuments?.proofUrl)}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary font-bold hover:underline"
                                >
                                  View Aadhaar
                                </a>
                              ) : (
                                <span className="text-muted-foreground italic">Not Uploaded</span>
                              )}
                            </div>

                            <div className="flex items-center justify-between text-xs border-t border-border pt-2">
                              <span className="text-muted-foreground font-medium">PAN Document:</span>
                              {farmerDetail.pan_url ? (
                                <a
                                  href={farmerDetail.pan_url.startsWith('/uploads') ? `${API_BASE_URL}${farmerDetail.pan_url}` : farmerDetail.pan_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-primary font-bold hover:underline"
                                >
                                  View PAN
                                </a>
                              ) : (
                                <span className="text-muted-foreground italic">Not Uploaded</span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                    </>
                  )}

                  {/* Actions inside drawer */}
                  <div className="flex items-center gap-2 pt-2">
                    {selectedFarmer.kycStatus !== 'Approved' && (
                      <button
                        onClick={() => handleApproveKYC(selectedFarmer.id)}
                        disabled={kycActionLoading !== null}
                        className="flex-1 py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg shadow-xs transition-all disabled:opacity-50"
                      >
                        {kycActionLoading === 'approve' ? 'Approving...' : 'Approve KYC'}
                      </button>
                    )}

                    {selectedFarmer.kycStatus !== 'Rejected' && (
                      <button
                        onClick={() => handleRejectKYC(selectedFarmer.id)}
                        disabled={kycActionLoading !== null}
                        className="px-4 py-2 border border-destructive/30 text-destructive bg-destructive/10 hover:bg-destructive/20 font-bold text-xs rounded-lg transition-all disabled:opacity-50"
                      >
                        {kycActionLoading === 'reject' ? 'Rejecting...' : 'Reject'}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sustainability Score Editor */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between border-b border-border pb-2">
                    <h4 className="font-bold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4" /> Ecological Sustainability Score
                    </h4>
                    <span className="font-bold text-sm text-primary">{selectedFarmer.sustainabilityScore}%</span>
                  </div>

                  {!isEditingScore ? (
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground text-xs">Sustainability score determines carbon credit eligibility.</span>
                      <button
                        onClick={() => setIsEditingScore(true)}
                        className="px-3 py-1.5 border border-border hover:bg-muted text-xs font-semibold text-primary rounded-md flex items-center gap-1"
                      >
                        <Edit3 className="w-3.5 h-3.5" /> Edit Score
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-3 pt-1">
                      <div className="flex items-center gap-3">
                        <input 
                          type="range" 
                          min="0" 
                          max="100" 
                          value={editingScore}
                          onChange={(e) => setEditingScore(Number(e.target.value))}
                          className="flex-1 h-2 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
                        />
                        <span className="font-mono font-bold text-sm text-primary w-10 text-right">{editingScore}%</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleSaveScore(selectedFarmer.id)}
                          className="flex-1 py-1.5 bg-primary text-primary-foreground font-semibold text-xs rounded-md shadow-xs hover:bg-primary/90 transition-colors"
                        >
                          Save New Score
                        </button>
                        <button
                          onClick={() => setIsEditingScore(false)}
                          className="px-3 py-1.5 border border-border text-muted-foreground text-xs font-semibold rounded-md hover:bg-muted transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Carbon Initiative Enrolment */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-xs">
                  <h4 className="font-bold text-xs text-primary uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                    <Trees className="w-4 h-4" /> Carbon Initiative Enrolment
                  </h4>

                  <div className="space-y-2">
                    <select
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary cursor-pointer"
                      value={selectedProjectId}
                      onChange={(e) => setSelectedProjectId(e.target.value)}
                    >
                      <option value="" className="bg-card text-foreground">Select Carbon Project...</option>
                      {availableProjects.map((proj) => (
                        <option key={proj.id} value={proj.id} className="bg-card text-foreground">
                          {proj.title}
                        </option>
                      ))}
                    </select>

                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Land Acres" 
                        className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
                        value={assignLandAcres}
                        onChange={(e) => setAssignLandAcres(e.target.value)}
                      />
                      <input 
                        type="number" 
                        placeholder="Trees Count" 
                        className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
                        value={assignTreeCount}
                        onChange={(e) => setAssignTreeCount(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={() => handleAssignProject(selectedFarmer.id)}
                      className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2"
                    >
                      <span>Assign to Project</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 🗺️ Register Land Parcel for GIS Audit */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-xs">
                  <h4 className="font-bold text-xs text-primary uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                    <MapPin className="w-4 h-4" /> Register Land Parcel (GIS Audit)
                  </h4>

                  <div className="space-y-2">
                    <input 
                      type="text" 
                      placeholder="Survey / Khasra No. (e.g. 94810336)" 
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary font-mono"
                      value={landSurveyNumber}
                      onChange={(e) => setLandSurveyNumber(e.target.value)}
                    />

                    <div className="flex gap-2">
                      <input 
                        type="number" 
                        placeholder="Area (Acres e.g. 5.0)" 
                        className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
                        value={landAreaAcres}
                        onChange={(e) => setLandAreaAcres(e.target.value)}
                      />
                      <input 
                        type="text" 
                        placeholder="Crop Type (e.g. Wheat)" 
                        className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
                        value={landCropType}
                        onChange={(e) => setLandCropType(e.target.value)}
                      />
                    </div>

                    <select
                      value={landSoilType}
                      onChange={(e) => setLandSoilType(e.target.value)}
                      className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary cursor-pointer"
                    >
                      <option value="Black Soil" className="bg-card text-foreground">Black Soil</option>
                      <option value="Alluvial Soil" className="bg-card text-foreground">Alluvial Soil</option>
                      <option value="Red Soil" className="bg-card text-foreground">Red Soil</option>
                      <option value="Loamy Soil" className="bg-card text-foreground">Loamy Soil</option>
                    </select>

                    <button
                      onClick={() => handleRegisterLand(selectedFarmer.id)}
                      disabled={registeringLand}
                      className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2 cursor-pointer disabled:opacity-50"
                    >
                      {registeringLand ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                      <span>{registeringLand ? 'Registering...' : 'Register & Send to GIS Verification'}</span>
                    </button>
                  </div>
                </div>

                {/* 🌲 Tag Trees & Issue Insurance Shield */}
                <div className="bg-card border border-border rounded-lg p-4 space-y-3 shadow-xs">
                  <h4 className="font-bold text-xs text-primary uppercase tracking-wider border-b border-border pb-2 flex items-center gap-1.5">
                    <Trees className="w-4 h-4" /> Tag Trees & Issue Insurance Shield
                  </h4>

                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <select
                        value={treeSpecies}
                        onChange={(e) => setTreeSpecies(e.target.value)}
                        className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary cursor-pointer"
                      >
                        <option value="Teak" className="bg-card text-foreground">Teak (Sagwan)</option>
                        <option value="Neem" className="bg-card text-foreground">Neem</option>
                        <option value="Mahogany" className="bg-card text-foreground">Mahogany</option>
                        <option value="Bamboo" className="bg-card text-foreground">Bamboo</option>
                        <option value="Sandalwood" className="bg-card text-foreground">Sandalwood</option>
                      </select>

                      <input 
                        type="number" 
                        placeholder="Tree Count (e.g. 10)" 
                        className="flex-1 bg-muted/50 border border-border rounded-lg px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
                        value={treeCountInput}
                        onChange={(e) => setTreeCountInput(e.target.value)}
                      />
                    </div>

                    <button
                      onClick={() => handleTagTrees(selectedFarmer.id)}
                      disabled={taggingTrees}
                      className="w-full py-2 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-lg shadow-xs transition-colors flex items-center justify-center gap-1.5 mt-2 cursor-pointer disabled:opacity-50"
                    >
                      {taggingTrees ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <ShieldCheck className="w-3.5 h-3.5" />}
                      <span>{taggingTrees ? 'Tagging...' : 'Tag Trees & Send to Tree Insurance Audit'}</span>
                    </button>
                  </div>
                </div>

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
