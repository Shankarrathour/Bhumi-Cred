import React, { useState, useEffect } from 'react';
import { useEcosystemStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Image as ImageIcon, 
  Plus, 
  Link as LinkIcon, 
  ToggleLeft, 
  ToggleRight, 
  X, 
  Save, 
  Smartphone, 
  AlertTriangle,  
  Trash, 
  Sparkles, 
  Megaphone,
  ShieldCheck,
  Copy,
  Edit,
  CloudLightning
} from 'lucide-react';
import { cn } from '../utils/cn';
import { MobileAppSimulator } from '../components/MobileAppSimulator';
import { UserDashboardCMS } from '../components/UserDashboardCMS';
import toast from 'react-hot-toast';
import adminApi from '../api/apiClient';
import Cropper from 'react-easy-crop';
import 'react-easy-crop/react-easy-crop.css';
import getCroppedImg from '../utils/cropImage';

export const CMSPage: React.FC = () => {
  const { cmsConfig, fetchCMSConfig, updateAnnouncementMarquee} = useEcosystemStore();

  useEffect(() => {
    fetchCMSConfig();
  }, []);

  const [activeTab, setActiveTab] = useState<'marquee' | 'banners' | 'campaigns' |'user-dashboard'| 'tree_plans' | 'climate_risk_insurance'>('marquee');

  // Local state for adding banner
  const [isBannerDrawerOpen, setIsBannerDrawerOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [bannerTitle, setBannerTitle] = useState('');
  const [bannerImageUrl, setBannerImageUrl] = useState('');
  const [bannerLinkUrl, setBannerLinkUrl] = useState('/programs');
  const [isBannerImageValid, setIsBannerImageValid] = useState<boolean | null>(null);
  const [debouncedImageUrl, setDebouncedImageUrl] = useState('');

  const [sourceMode, setSourceMode] = useState<'url' | 'upload'>('upload');
  
  // Crop states
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const onCropComplete = (_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
      if (!validTypes.includes(file.type)) {
        toast.error('Invalid file format. Only JPG, PNG, WEBP are supported.');
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File exceeds 5MB limit.');
        return;
      }
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result?.toString() || null);
        setIsCropping(true);
      });
      reader.readAsDataURL(file);
    }
  };

  const handleConfirmCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;
    try {
      setIsUploading(true);
      setUploadProgress(0);
      
      const croppedImage = await getCroppedImg(imageSrc, croppedAreaPixels);
      if (!croppedImage) throw new Error('Failed to crop image');

      const formData = new FormData();
      formData.append('file', croppedImage, 'banner.webp');
      
      const res = await adminApi.post('/uploads/image?folder=banners', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (progressEvent) => {
          if (progressEvent.total) {
            const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            setUploadProgress(percentCompleted);
          }
        }
      });
      
      if (res.data.image_url) {
        setBannerImageUrl(res.data.image_url);
        setIsBannerImageValid(true);
        toast.success('Image cropped and uploaded successfully!');
        setIsCropping(false);
        setImageSrc(null);
      }
    } catch (e) {
      console.error(e);
      toast.error('Image upload failed. Please try again.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Debounce the image URL input
  useEffect(() => {
    let isCancelled = false;
    const handler = setTimeout(() => {
      if (!isCancelled) {
        setDebouncedImageUrl(bannerImageUrl);
        if (bannerImageUrl) {
          setIsBannerImageValid(null); // Reset to loading state
        }
      }
    }, 500);
    return () => {
      isCancelled = true;
      clearTimeout(handler);
    };
  }, [bannerImageUrl]);

  // Local state for adding campaign
  const [isCampaignDrawerOpen, setIsCampaignDrawerOpen] = useState(false);
  const [campaignTitle, setCampaignTitle] = useState('');
  const [campaignSlogan, setCampaignSlogan] = useState('');

  // Marquee local cache
  const [marqueeText, setMarqueeText] = useState(cmsConfig.announcementMarquee);
  const [marqueeActive, setMarqueeActive] = useState(cmsConfig.isMarqueeActive);

  // Tree Plans State
  const [apiTreePlans, setApiTreePlans] = useState<any[]>([]);
  const [activeTreePlanTab, setActiveTreePlanTab] = useState<'single_tree' | 'green_family'>('single_tree');
  const [isTreePlanDrawerOpen, setIsTreePlanDrawerOpen] = useState(false);
  const [editingTreePlanId, setEditingTreePlanId] = useState<string | null>(null);
  
  const [treePlanFormData, setTreePlanFormData] = useState({
    plan_name: '',
    price: 0,
    billing_cycle: 'yearly',
    cover: 0,
    badge_text: '',
    badge_color: '#34D399',
    description: '',
    priority: 0,
    is_active: true
  });

  const [apiBanners, setApiBanners] = useState<any[]>([]);

  // Climate Risk Tree Insurance State — independent from Tree Plans above.
  // Backs the Farmer App's Add Land -> Step 6 -> Climate Risk Tree Insurance cards.
  const [apiClimateRiskCards, setApiClimateRiskCards] = useState<any[]>([]);
  const [isClimateRiskDrawerOpen, setIsClimateRiskDrawerOpen] = useState(false);
  const [editingClimateRiskId, setEditingClimateRiskId] = useState<string | null>(null);
  const [climateRiskFormData, setClimateRiskFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    features: '',
    price: 0,
    button_text: '',
    badge: '',
    display_order: 0,
    is_active: true
  });

  const fetchBanners = async () => {
    try {
      const response = await adminApi.get('/admin/banners');
      setApiBanners(response.data);
    } catch (err) {
      console.error('Failed to fetch banners', err);
    }
  };

  const fetchClimateRiskCards = async () => {
    try {
      const res = await adminApi.get('/admin/climate-risk-insurance');
      if (res.data.success) {
        setApiClimateRiskCards(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch Climate Risk Tree Insurance cards', err);
    }
  };

  const handleOpenAddClimateRiskCard = () => {
    setEditingClimateRiskId(null);
    setClimateRiskFormData({
      title: '',
      subtitle: '',
      description: '',
      features: '',
      price: 0,
      button_text: '',
      badge: '',
      display_order: 0,
      is_active: true
    });
    setIsClimateRiskDrawerOpen(true);
  };

  const handleEditClimateRiskCardClick = (card: any) => {
    setEditingClimateRiskId(card._id);
    setClimateRiskFormData({
      title: card.title,
      subtitle: card.subtitle || '',
      description: card.description,
      features: (card.features || []).join('\n'),
      price: card.price,
      button_text: card.button_text || '',
      badge: card.badge || '',
      display_order: card.display_order,
      is_active: card.is_active
    });
    setIsClimateRiskDrawerOpen(true);
  };

  const handleSaveClimateRiskCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        ...climateRiskFormData,
        features: climateRiskFormData.features
          .split('\n')
          .map(f => f.trim())
          .filter(f => f.length > 0),
      };
      if (editingClimateRiskId) {
        await adminApi.put(`/admin/climate-risk-insurance/${editingClimateRiskId}`, payload);
        toast.success('Climate Risk Tree Insurance card updated successfully!');
      } else {
        await adminApi.post('/admin/climate-risk-insurance', payload);
        toast.success('Climate Risk Tree Insurance card created successfully!');
      }
      setIsClimateRiskDrawerOpen(false);
      fetchClimateRiskCards();
    } catch (err) {
      toast.error('Failed to save Climate Risk Tree Insurance card.');
    }
  };

  const handleDeleteClimateRiskCard = async (id: string) => {
    try {
      await adminApi.delete(`/admin/climate-risk-insurance/${id}`);
      toast.success('Climate Risk Tree Insurance card removed.');
      fetchClimateRiskCards();
    } catch (err) {
      toast.error('Failed to delete Climate Risk Tree Insurance card.');
    }
  };

  const handleToggleClimateRiskCard = async (id: string, currentStatus: boolean) => {
    try {
      await adminApi.put(`/admin/climate-risk-insurance/${id}`, { is_active: !currentStatus });
      fetchClimateRiskCards();
    } catch (err) {
      toast.error('Failed to update status.');
    }
  };

  useEffect(() => {
    fetchBanners();
    fetchTreePlans();
    fetchClimateRiskCards();
  }, []);

  const fetchTreePlans = async () => {
    try {
      const res = await adminApi.get('/admin/tree-plans');
      if (res.data.success) {
        setApiTreePlans(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch tree plans', err);
    }
  };

  const handleOpenAddTreePlan = () => {
    setEditingTreePlanId(null);
    setTreePlanFormData({
      plan_name: '',
      price: 0,
      billing_cycle: 'yearly',
      cover: 0,
      badge_text: '',
      badge_color: '#34D399',
      description: '',
      priority: 0,
      is_active: true
    });
    setIsTreePlanDrawerOpen(true);
  };

  const handleEditTreePlanClick = (plan: any) => {
    setEditingTreePlanId(plan._id);
    setTreePlanFormData({
      plan_name: plan.plan_name,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      cover: plan.cover,
      badge_text: plan.badge_text,
      badge_color: plan.badge_color,
      description: plan.description,
      priority: plan.priority,
      is_active: plan.is_active
    });
    setIsTreePlanDrawerOpen(true);
  };

  const getCategoryColor = (category: string) => {
    const c = category.toLowerCase();
    if (c.includes('small farmer')) return '#34D399';
    if (c.includes('recommended')) return '#F97316';
    if (c.includes('agroforestry')) return '#14B8A6';
    if (c.includes('elite')) return '#EF4444';
    if (c.includes('heritage')) return '#A855F7';
    return '#34D399';
  };

  const handleSaveTreePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = { 
        ...treePlanFormData, 
        plan_type: activeTreePlanTab,
        badge_color: getCategoryColor(treePlanFormData.badge_text),
        billing_cycle: 'yearly',
        priority: 0,
        is_active: editingTreePlanId ? treePlanFormData.is_active : true
      };
      if (editingTreePlanId) {
        await adminApi.put(`/admin/tree-plans/${editingTreePlanId}`, payload);
        toast.success('Tree plan updated successfully!');
      } else {
        await adminApi.post('/admin/tree-plans', payload);
        toast.success('New tree plan appended successfully!');
      }
      setIsTreePlanDrawerOpen(false);
      fetchTreePlans();
    } catch (err) {
      toast.error('Failed to save tree plan.');
    }
  };

  const handleToggleTreePlan = async (id: string, currentStatus: boolean) => {
    try {
      await adminApi.put(`/admin/tree-plans/${id}`, { is_active: !currentStatus });
      fetchTreePlans();
      toast.success('Tree plan visibility toggled!');
    } catch (err) {
      toast.error('Failed to toggle tree plan.');
    }
  };

  const handleDeleteTreePlan = async (id: string) => {
    if (!confirm('Are you sure you want to delete this plan?')) return;
    try {
      await adminApi.delete(`/admin/tree-plans/${id}`);
      fetchTreePlans();
      toast.success('Tree plan deleted from database.');
    } catch (err) {
      toast.error('Failed to delete tree plan.');
    }
  };

  const handleDuplicateTreePlan = async (id: string) => {
    try {
      await adminApi.post(`/admin/tree-plans/${id}/duplicate`);
      fetchTreePlans();
      toast.success('Tree plan duplicated!');
    } catch (err) {
      toast.error('Failed to duplicate plan.');
    }
  };

  const handleSaveBanner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bannerTitle || !bannerImageUrl || !bannerLinkUrl) return;
    if (isBannerImageValid !== true) {
      toast.error('Please provide a valid image URL that loads successfully.');
      return;
    }

    try {
      const payload = {
        title: bannerTitle,
        image_url: bannerImageUrl,
        link_url: bannerLinkUrl,
        is_active: true
      };
      
      if (editingBannerId) {
        await adminApi.put(`/admin/banners/${editingBannerId}`, payload);
        toast.success('Banner updated successfully!');
      } else {
        await adminApi.post('/admin/banners', payload);
        toast.success('Promotional environmental banner appended to active mobile carousel!');
      }
      
      setIsBannerDrawerOpen(false);
      setEditingBannerId(null);
      setBannerTitle('');
      setBannerImageUrl('');
      setBannerLinkUrl('/programs');
      setIsBannerImageValid(null);
      setSourceMode('upload');
      fetchBanners();
    } catch (err) {
      toast.error(editingBannerId ? 'Failed to update banner.' : 'Failed to create banner.');
    }
  };

  const handleEditBannerClick = (banner: any) => {
    setEditingBannerId(banner.id);
    setBannerTitle(banner.title);
    setBannerImageUrl(banner.image_url);
    setBannerLinkUrl(banner.link_url);
    setIsBannerImageValid(true);
    setSourceMode('url');
    setIsBannerDrawerOpen(true);
  };

  const handleOpenAddDrawer = () => {
    setEditingBannerId(null);
    setBannerTitle('');
    setBannerImageUrl('');
    setBannerLinkUrl('/programs');
    setIsBannerImageValid(null);
    setSourceMode('upload');
    setIsBannerDrawerOpen(true);
  };

  const handleToggleBanner = async (id: string, currentStatus: boolean) => {
    try {
      await adminApi.put(`/admin/banners/${id}`, { is_active: !currentStatus });
      fetchBanners();
      toast.success('Banner visibility toggled successfully!');
    } catch (err) {
      toast.error('Failed to toggle banner.');
    }
  };

  const handleDeleteBanner = async (id: string) => {
    try {
      await adminApi.delete(`/admin/banners/${id}`);
      fetchBanners();
      toast.success('Promotional banner deleted from database.');
    } catch (err) {
      toast.error('Failed to delete banner.');
    }
  };

  const handleSaveMarquee = () => {
    updateAnnouncementMarquee(marqueeText, marqueeActive);
    toast.success('Global network announcement marquee dispatched!');
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignTitle || !campaignSlogan) return;

    const newCampaign = {
      id: `CMP-00${cmsConfig.featuredCampaigns.length + 1}`,
      title: campaignTitle,
      slogan: campaignSlogan,
      isActive: true
    };

    useEcosystemStore.setState((state) => ({
      cmsConfig: {
        ...state.cmsConfig,
        featuredCampaigns: [...state.cmsConfig.featuredCampaigns, newCampaign]
      }
    }));

    setIsCampaignDrawerOpen(false);
    setCampaignTitle('');
    setCampaignSlogan('');
    toast.success('Corporate ESG Campaign added to featured feed!');
  };

  const handleToggleCampaign = (id: string) => {
    useEcosystemStore.setState((state) => ({
      cmsConfig: {
        ...state.cmsConfig,
        featuredCampaigns: state.cmsConfig.featuredCampaigns.map(c => 
          c.id === id ? { ...c, isActive: !c.isActive } : c
        )
      }
    }));
    toast.success('Campaign target audience feed toggled!');
  };

  const handleDeleteCampaign = (id: string) => {
    useEcosystemStore.setState((state) => ({
      cmsConfig: {
        ...state.cmsConfig,
        featuredCampaigns: state.cmsConfig.featuredCampaigns.filter(c => c.id !== id)
      }
    }));
    toast.success('Campaign removed from listing.');
  };

  return (
    <div className="pb-12 text-foreground font-sans space-y-6">
      {/* Header section */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2.5">
            <Smartphone className="w-6 h-6 text-primary" /> Portal CMS &amp; App Control Console
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure mobile farmer application layout, dispatch environmental marquees, upload promotional banners, and coordinate active ESG campaigns.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* 🖥️ LEFT PANE: Controls Interface (8 cols) */}
        <div className="xl:col-span-8 space-y-6 bg-card border border-border rounded-xl p-6 shadow-sm relative font-sans">
          
          {/* Top tabs row */}
          <div className="flex flex-wrap gap-1.5 p-1.5 bg-muted/40 border border-border rounded-xl w-full select-none">
            <button
              onClick={() => setActiveTab('marquee')}
              className={cn(
                "px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all rounded-lg cursor-pointer shrink-0",
                activeTab === 'marquee' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Megaphone className="w-4 h-4" /> Network Marquee
            </button>
            <button
              onClick={() => setActiveTab('banners')}
              className={cn(
                "px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all rounded-lg cursor-pointer shrink-0",
                activeTab === 'banners' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <ImageIcon className="w-4 h-4" /> Mobile Banners
            </button>
            <button
              onClick={() => setActiveTab('tree_plans')}
              className={cn(
                "px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all rounded-lg cursor-pointer shrink-0",
                activeTab === 'tree_plans' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <ShieldCheck className="w-4 h-4" /> Tree Insurance Plans
            </button>
            <button
              onClick={() => setActiveTab('climate_risk_insurance')}
              className={cn(
                "px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all rounded-lg cursor-pointer shrink-0",
                activeTab === 'climate_risk_insurance' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <CloudLightning className="w-4 h-4" /> Climate Risk Tree Insurance
            </button>
            <button
              onClick={() => setActiveTab('campaigns')}
              className={cn(
                "px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all rounded-lg cursor-pointer shrink-0",
                activeTab === 'campaigns' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Sparkles className="w-4 h-4" /> ESG Campaigns
            </button>
            <button
              onClick={() => setActiveTab('user-dashboard')}
              className={cn(
                "px-3.5 py-2 text-xs font-semibold flex items-center gap-1.5 transition-all rounded-lg cursor-pointer shrink-0",
                activeTab === 'user-dashboard' 
                  ? "bg-primary text-primary-foreground font-bold shadow-sm" 
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              <Smartphone className="w-4 h-4" /> User Dashboard
            </button>
          </div>

          {/* Tab Content Wrapper */}
          <div className="mt-4 pt-4 border-t border-border">
            <AnimatePresence mode="wait">
              {/* 🚨 MARQUEE BROADCAST TAB */}
              {activeTab === 'marquee' && (
                <motion.div
                  key="marquee"
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 font-sans"
                >
                  <div className="p-4 bg-primary/10 border border-primary/20 rounded-xl flex gap-3 text-primary mb-4 leading-relaxed">
                    <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-xs font-bold text-foreground">Global Broadcast Protocol</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Publishes an active green alert crawler marquee immediately below the mobile application top navigation header. Use for pricing updates or regional plantation incentives.</div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between border border-border p-4 bg-muted/20 rounded-xl">
                      <label className="text-xs font-bold text-foreground">Crawler Status</label>
                      <button onClick={() => setMarqueeActive(!marqueeActive)} className="cursor-pointer">
                        {marqueeActive ? <ToggleRight className="w-8 h-8 text-primary" /> : <ToggleLeft className="w-8 h-8 text-muted-foreground" />}
                      </button>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-semibold text-muted-foreground block">Announcements / Narrative Alert Text</label>
                      <textarea 
                        className="w-full p-3 border border-border rounded-xl text-xs bg-background text-foreground min-h-[100px] outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 font-sans"
                        value={marqueeText}
                        onChange={e => setMarqueeText(e.target.value)}
                        placeholder="e.g. CRITICAL STATE SUBSIDY LAUNCHED FOR TREES..."
                      />
                    </div>

                    <button 
                      onClick={handleSaveMarquee}
                      className="w-full py-2.5 bg-primary text-primary-foreground hover:bg-primary/90 text-xs font-bold rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                    >
                      <Save className="w-4 h-4" /> Dispatch Marquee Updates
                    </button>
                  </div>
                </motion.div>
              )}

              {/* 🖼️ BANNERS TAB */}
              {activeTab === 'banners' && (
                <motion.div
                  key="banners"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 font-sans"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-foreground">Farmer Application Banners Pool</h3>
                    <button 
                      className="h-9 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                      onClick={handleOpenAddDrawer}
                    >
                      <Plus className="w-4 h-4" /> Append Banner
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {apiBanners.length === 0 && (
                      <div className="col-span-full p-8 border border-dashed border-border bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium">
                        No promotional banners configured.
                      </div>
                    )}
                    {apiBanners.map(banner => (
                      <div key={banner.id} className={cn("border bg-card rounded-xl overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md", banner.is_active ? "border-border" : "opacity-60 border-dashed border-border")}>
                        <div style={{ aspectRatio: 2.2 }} className="relative bg-slate-950 border-b border-border overflow-hidden p-0.5">
                          <img 
                            src={banner.image_url || banner.imageUrl} 
                            alt={banner.title || "Promotional banner"} 
                            loading="lazy" 
                            className="w-full h-full object-contain object-center rounded-lg" 
                          />
                          <div className="absolute top-2 right-2 flex gap-1.5">
                            <button 
                              onClick={() => handleToggleBanner(banner.id, banner.is_active)}
                              className="p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-lg text-foreground hover:bg-background transition-colors cursor-pointer"
                              title={banner.is_active ? "Deactivate" : "Activate"}
                            >
                              {banner.is_active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            <button 
                              onClick={() => handleEditBannerClick(banner)}
                              className="p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-lg text-foreground hover:bg-background transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteBanner(banner.id)}
                              className="p-1.5 bg-background/80 backdrop-blur-sm border border-border rounded-lg text-destructive hover:bg-background transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                          {!banner.is_active && (
                            <span className="absolute bottom-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-md border text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-950 dark:text-rose-400 dark:border-rose-800">
                              INACTIVE
                            </span>
                          )}
                        </div>
                        <div className="p-3.5 bg-card flex-1 flex flex-col justify-between">
                          <h4 className="text-xs font-bold text-foreground line-clamp-2" title={banner.title}>{banner.title}</h4>
                          <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground mt-2 truncate font-mono">
                            <LinkIcon className="w-3.5 h-3.5 text-primary shrink-0" /> 
                            <span className="truncate">{banner.link_url}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 🛡️ TREE INSURANCE PLANS TAB */}
              {activeTab === 'tree_plans' && (
                <motion.div
                  key="tree_plans"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 font-sans"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-foreground">Tree Insurance Cover Plans</h3>
                    <button 
                      className="h-9 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                      onClick={handleOpenAddTreePlan}
                    >
                      <Plus className="w-4 h-4" /> Append Plan
                    </button>
                  </div>

                  {/* Sub Tabs */}
                  <div className="flex space-x-2 border-b border-border pb-2">
                    <button
                      onClick={() => setActiveTreePlanTab('single_tree')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeTreePlanTab === 'single_tree' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      Single Tree Shield
                    </button>
                    <button
                      onClick={() => setActiveTreePlanTab('green_family')}
                      className={`px-4 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                        activeTreePlanTab === 'green_family' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                    >
                      Green Family Cover
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {apiTreePlans.filter(p => p.plan_type === activeTreePlanTab).length === 0 && (
                      <div className="col-span-full p-8 border border-dashed border-border bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium">
                        No plans configured for this category.
                      </div>
                    )}
                    {apiTreePlans.filter(p => p.plan_type === activeTreePlanTab).map(plan => (
                      <div key={plan._id} className={cn("border bg-card rounded-xl overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md", plan.is_active ? "border-border" : "opacity-60 border-dashed border-border")}>
                        <div className="p-4 border-b border-border relative bg-muted/20">
                          <div className="absolute top-3 right-3 flex gap-1">
                            <button 
                              onClick={() => handleToggleTreePlan(plan._id, plan.is_active)}
                              className="p-1.5 bg-background border border-border rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title={plan.is_active ? "Deactivate" : "Activate"}
                            >
                              {plan.is_active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            <button 
                              onClick={() => handleDuplicateTreePlan(plan._id)}
                              className="p-1.5 bg-background border border-border rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Duplicate"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleEditTreePlanClick(plan)}
                              className="p-1.5 bg-background border border-border rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteTreePlan(plan._id)}
                              className="p-1.5 bg-background border border-border rounded-lg text-destructive hover:bg-muted transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                          
                          <div className="pr-24 space-y-1">
                            <h4 className="text-sm font-bold text-foreground">{plan.plan_name}</h4>
                            <div className="text-xs text-primary font-bold">₹{plan.price} / {plan.billing_cycle}</div>
                            <div className="text-xs text-muted-foreground font-medium">Cover: ₹{plan.cover}</div>
                          </div>
                          
                          <div className="mt-3">
                             <span 
                               className="px-2.5 py-0.5 text-[11px] rounded-full font-semibold border" 
                               style={{ backgroundColor: `${plan.badge_color}15`, borderColor: `${plan.badge_color}30`, color: plan.badge_color }}
                             >
                                {plan.badge_text}
                             </span>
                          </div>
                        </div>
                        <div className="p-4 bg-card flex-1">
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            "{plan.description}"
                          </p>
                          <div className="mt-3 text-[11px] text-muted-foreground font-semibold">
                            Priority: {plan.priority}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ⛈️ CLIMATE RISK TREE INSURANCE TAB */}
              {activeTab === 'climate_risk_insurance' && (
                <motion.div
                  key="climate_risk_insurance"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 font-sans"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-foreground">Climate Risk Tree Insurance</h3>
                    <button
                      className="h-9 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                      onClick={handleOpenAddClimateRiskCard}
                    >
                      <Plus className="w-4 h-4" /> Append Card
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    {apiClimateRiskCards.length === 0 && (
                      <div className="col-span-full p-8 border border-dashed border-border bg-muted/20 rounded-xl flex items-center justify-center text-muted-foreground text-xs font-medium">
                        No Climate Risk Tree Insurance cards configured.
                      </div>
                    )}
                    {apiClimateRiskCards.map(card => (
                      <div key={card._id} className={cn("border bg-card rounded-xl overflow-hidden flex flex-col shadow-sm transition-all hover:shadow-md", card.is_active ? "border-border" : "opacity-60 border-dashed border-border")}>
                        <div className="p-4 border-b border-border relative bg-muted/20">
                          <div className="absolute top-3 right-3 flex gap-1">
                            <button
                              onClick={() => handleToggleClimateRiskCard(card._id, card.is_active)}
                              className="p-1.5 bg-background border border-border rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title={card.is_active ? "Deactivate" : "Activate"}
                            >
                              {card.is_active ? <ToggleRight className="w-4 h-4 text-primary" /> : <ToggleLeft className="w-4 h-4 text-muted-foreground" />}
                            </button>
                            <button
                              onClick={() => handleEditClimateRiskCardClick(card)}
                              className="p-1.5 bg-background border border-border rounded-lg text-foreground hover:bg-muted transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteClimateRiskCard(card._id)}
                              className="p-1.5 bg-background border border-border rounded-lg text-destructive hover:bg-muted transition-colors cursor-pointer"
                              title="Remove"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>

                          <div className="pr-24 space-y-1">
                            <h4 className="text-sm font-bold text-foreground">{card.title}</h4>
                            {card.subtitle && (
                              <div className="text-xs text-muted-foreground font-medium">{card.subtitle}</div>
                            )}
                            <div className="text-xs text-primary font-bold">₹{card.price}</div>
                          </div>

                          {card.badge && (
                            <div className="mt-3">
                               <span className="px-2.5 py-0.5 text-[11px] rounded-full font-semibold border bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-400 dark:border-emerald-800">
                                  {card.badge}
                               </span>
                            </div>
                          )}
                        </div>
                        <div className="p-4 bg-card flex-1">
                          <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                            "{card.description}"
                          </p>
                          <div className="mt-3 text-[11px] text-muted-foreground font-semibold">
                            Display Order: {card.display_order}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* 🏆 CAMPAIGNS TAB */}
              {activeTab === 'campaigns' && (
                <motion.div
                  key="campaigns"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-6 font-sans"
                >
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-bold text-foreground">Featured ESG Community Campaigns</h3>
                    <button 
                      onClick={() => setIsCampaignDrawerOpen(true)}
                      className="h-9 px-4 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs flex items-center gap-2 transition-all cursor-pointer shadow-sm"
                    >
                      <Plus className="w-4 h-4" /> Create Campaign
                    </button>
                  </div>

                  <div className="space-y-3">
                    {cmsConfig.featuredCampaigns.map(campaign => (
                      <div 
                        key={campaign.id} 
                        className={cn(
                          "border p-4 bg-card rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm transition-all",
                          campaign.isActive ? "border-border" : "border-border border-dashed opacity-60"
                        )}
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[11px] font-mono bg-muted text-muted-foreground border border-border px-2 py-0.5 rounded-md font-semibold">{campaign.id}</span>
                            <h4 className="text-xs font-bold text-foreground">{campaign.title}</h4>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 font-medium">"{campaign.slogan}"</p>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <button 
                            onClick={() => handleToggleCampaign(campaign.id)}
                            className="px-3 py-1.5 rounded-lg border border-border hover:bg-muted text-foreground flex items-center gap-1 text-xs font-semibold cursor-pointer transition-all"
                          >
                            {campaign.isActive ? "Dismiss Feed" : "Publish Feed"}
                          </button>
                          <button 
                            onClick={() => handleDeleteCampaign(campaign.id)}
                            className="p-1.5 border border-border hover:bg-muted text-destructive rounded-lg cursor-pointer transition-all"
                            title="Delete"
                          >
                            <Trash className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {cmsConfig.featuredCampaigns.length === 0 && (
                      <div className="text-center p-8 border border-dashed border-border bg-muted/20 rounded-xl text-muted-foreground text-xs font-medium">
                        No ESG campaigns registered in the portal system.
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

              {/* USER DASHBOARD TAB */}
              {activeTab === 'user-dashboard' && (
                <UserDashboardCMS />
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* 📱 RIGHT PANE: Interactive Phone Frame (4 cols, sticky) */}
        <div className="xl:col-span-4 sticky top-6 bg-card border border-border rounded-xl p-5 flex flex-col items-center shadow-sm font-sans">
          <div className="text-center p-3 w-full border-b border-border bg-muted/20 rounded-lg mb-4">
            <div className="text-xs font-bold text-primary flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" /> Client Telemetry Preview
            </div>
          </div>
          <MobileAppSimulator />
          <div className="text-xs text-muted-foreground p-2 text-center mt-3 leading-relaxed">
            All CMS switches synchronise instantly with local mobile devices via persistent Zustand.
          </div>
        </div>
      </div>

      {isCropping && imageSrc && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-sm flex flex-col justify-center items-center p-4 sm:p-8">
          <div className="bg-card border border-border rounded-2xl w-full max-w-4xl h-full max-h-[80vh] flex flex-col shadow-2xl relative overflow-hidden font-sans">
            {/* Header */}
            <div className="p-4 bg-muted/30 border-b border-border flex justify-between items-center text-foreground shrink-0">
              <h3 className="font-bold text-foreground text-sm">Crop Image (3:1)</h3>
              {isUploading && (
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground font-semibold">Uploading {uploadProgress}%</span>
                  <div className="w-24 bg-muted h-1.5 rounded-full overflow-hidden">
                    <div className="bg-primary h-1.5 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                  </div>
                </div>
              )}
            </div>
            
            {/* Cropper Body */}
            <div className="relative flex-1 bg-black/80">
              <Cropper
                image={imageSrc}
                crop={crop}
                zoom={zoom}
                aspect={3 / 1}
                onCropChange={setCrop}
                onCropComplete={onCropComplete}
                onZoomChange={setZoom}
                objectFit="horizontal-cover"
              />
            </div>
            
            {/* Footer */}
            <div className="p-4 bg-card border-t border-border flex flex-col sm:flex-row items-center gap-4 shrink-0">
              <div className="flex-1 flex items-center gap-4 w-full">
                <span className="text-xs font-semibold text-muted-foreground w-12">Zoom</span>
                <input type="range" value={zoom} min={1} max={3} step={0.1} onChange={(e) => setZoom(Number(e.target.value))} className="w-full max-w-xs accent-primary" />
              </div>
              <div className="flex gap-3 w-full sm:w-auto justify-end mt-4 sm:mt-0">
                <button disabled={isUploading} type="button" onClick={() => { setIsCropping(false); setImageSrc(null); }} className="px-4 h-9 border border-border hover:bg-muted text-xs font-semibold rounded-lg disabled:opacity-50 transition-all cursor-pointer">Cancel</button>
                <button disabled={isUploading} type="button" onClick={handleConfirmCrop} className="px-5 h-9 bg-primary text-primary-foreground font-bold text-xs hover:bg-primary/90 disabled:opacity-50 shadow-sm rounded-lg transition-all cursor-pointer">
                  {isUploading ? 'Uploading...' : 'Crop & Continue'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Drawer for creating a banner */}
      <AnimatePresence>
        {isBannerDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 cursor-pointer"
              onClick={() => setIsBannerDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 shadow-2xl flex flex-col text-foreground font-sans text-xs"
            >
              <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                  <ImageIcon className="w-5 h-5 text-primary" /> {editingBannerId ? 'Edit Home Banner' : 'Append Home Banner'}
                </h2>
                <button onClick={() => setIsBannerDrawerOpen(false)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveBanner} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Banner Narrative / Label Title *</label>
                  <input required type="text" placeholder="e.g. Monsoon Plantation Drive" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={bannerTitle} onChange={e => setBannerTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex gap-4 mb-2">
                    <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                      <input type="radio" name="sourceMode" checked={sourceMode === 'upload'} onChange={() => setSourceMode('upload')} className="accent-primary" /> Upload Image
                    </label>
                    <label className="flex items-center gap-2 text-xs font-semibold text-foreground cursor-pointer">
                      <input type="radio" name="sourceMode" checked={sourceMode === 'url'} onChange={() => setSourceMode('url')} className="accent-primary" /> Image URL
                    </label>
                  </div>

                  {sourceMode === 'url' && (
                    <input required type="url" placeholder="https://images.unsplash.com/..." className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={bannerImageUrl} onChange={e => setBannerImageUrl(e.target.value)} />
                  )}

                  {sourceMode === 'upload' && (
                    <div className="relative border-2 border-dashed border-border p-6 bg-muted/20 rounded-xl flex flex-col items-center justify-center text-center cursor-pointer hover:border-primary/50 transition-colors">
                      <input type="file" accept="image/jpeg,image/png,image/webp,image/jpg" className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" onChange={onFileChange} disabled={isUploading} />
                      <ImageIcon className="w-8 h-8 text-muted-foreground mb-2" />
                      <div className="text-xs font-bold text-foreground">Drag image here or Browse Files</div>
                      <div className="text-[11px] text-muted-foreground mt-0.5">Supports JPG, PNG, WEBP (Max 5MB)</div>
                    </div>
                  )}

                  {isUploading && (
                    <div className="w-full mt-2">
                      <div className="text-xs text-muted-foreground mb-1 font-semibold">Uploading image... {uploadProgress}%</div>
                      <div className="w-full bg-muted h-1.5 rounded-full overflow-hidden">
                        <div className="bg-primary h-1.5 transition-all duration-300" style={{ width: `${uploadProgress}%` }} />
                      </div>
                    </div>
                  )}
                </div>

                {debouncedImageUrl && (
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-muted-foreground block">Live Preview</label>
                    <div style={{ aspectRatio: 3 }} className="w-full bg-muted border border-border rounded-xl relative flex items-center justify-center overflow-hidden">
                      <img 
                        key={debouncedImageUrl}
                        src={debouncedImageUrl} 
                        alt={bannerTitle || "Promotional banner preview"}
                        loading="lazy"
                        className={cn("w-full h-full object-cover object-center transition-opacity", isBannerImageValid === true ? "opacity-100" : "opacity-0")}
                        onLoad={() => setIsBannerImageValid(true)}
                        onError={() => setIsBannerImageValid(false)}
                      />
                      
                      {isBannerImageValid === null && (
                        <div className="absolute inset-0 bg-muted animate-pulse flex items-center justify-center">
                           <span className="text-primary text-xs font-bold">Loading...</span>
                        </div>
                      )}
                      
                      {isBannerImageValid === false && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/80">
                          <span className="text-destructive font-semibold text-xs">Unable to load image.</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Direct Mapping Hyperlink *</label>
                  <input required type="text" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={bannerLinkUrl} onChange={e => setBannerLinkUrl(e.target.value)} />
                </div>
                
                <div className="flex justify-end gap-3 pt-5 border-t border-border mt-auto">
                  <button type="button" onClick={() => setIsBannerDrawerOpen(false)} className="px-4 h-9 border border-border hover:bg-muted text-xs font-semibold rounded-lg transition-all cursor-pointer">Cancel</button>
                  <button 
                    type="submit" 
                    disabled={!bannerTitle || !bannerImageUrl || !bannerLinkUrl || isBannerImageValid !== true}
                    className={cn(
                      "px-5 h-9 font-bold text-xs flex items-center gap-1.5 rounded-lg shadow-sm transition-all cursor-pointer", 
                      (!bannerTitle || !bannerImageUrl || !bannerLinkUrl || isBannerImageValid !== true) 
                        ? "bg-muted text-muted-foreground cursor-not-allowed border border-border" 
                        : "bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <Save className="w-4 h-4" /> {editingBannerId ? 'Save Changes' : 'Push Live'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Drawer for creating a campaign */}
      <AnimatePresence>
        {isCampaignDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 cursor-pointer"
              onClick={() => setIsCampaignDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 shadow-2xl flex flex-col text-foreground font-sans text-xs"
            >
              <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                  <Sparkles className="w-5 h-5 text-primary" /> Design ESG Campaign
                </h2>
                <button onClick={() => setIsCampaignDrawerOpen(false)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleCreateCampaign} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Campaign Title *</label>
                  <input required type="text" placeholder="e.g. Pune Bamboo Carbon Program" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={campaignTitle} onChange={e => setCampaignTitle(e.target.value)} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Slogan / Narrative Slogan *</label>
                  <input required type="text" placeholder="e.g. Offsetting corporate footprints..." className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={campaignSlogan} onChange={e => setCampaignSlogan(e.target.value)} />
                </div>
                
                <div className="flex justify-end gap-3 pt-5 border-t border-border mt-auto">
                  <button type="button" onClick={() => setIsCampaignDrawerOpen(false)} className="px-4 h-9 border border-border hover:bg-muted text-xs font-semibold rounded-lg transition-all cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
                    <Save className="w-4 h-4" /> Provision Campaign
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Drawer for Tree Plans */}
      <AnimatePresence>
        {isTreePlanDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 cursor-pointer"
              onClick={() => setIsTreePlanDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 shadow-2xl flex flex-col text-foreground font-sans text-xs"
            >
              <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                  <ShieldCheck className="w-5 h-5 text-primary" /> {editingTreePlanId ? 'Edit Plan' : 'Append Plan'}
                </h2>
                <button onClick={() => setIsTreePlanDrawerOpen(false)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveTreePlan} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Plan Name *</label>
                  <input required type="text" placeholder="e.g. Green Shield Basic" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={treePlanFormData.plan_name} onChange={e => setTreePlanFormData({...treePlanFormData, plan_name: e.target.value})} />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">Plan Value (₹/Year) *</label>
                    <input required type="number" placeholder="49" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={treePlanFormData.price} onChange={e => setTreePlanFormData({...treePlanFormData, price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">Cover Amount (₹) *</label>
                    <input required type="number" placeholder="1500" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={treePlanFormData.cover} onChange={e => setTreePlanFormData({...treePlanFormData, cover: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Category *</label>
                  <input required type="text" placeholder="e.g. Small Farmer Favourite" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={treePlanFormData.badge_text} onChange={e => setTreePlanFormData({...treePlanFormData, badge_text: e.target.value})} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Description *</label>
                  <textarea required maxLength={200} placeholder="Plan description..." className="w-full p-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans min-h-[80px]" value={treePlanFormData.description} onChange={e => setTreePlanFormData({...treePlanFormData, description: e.target.value})} />
                </div>

                {/* Live Preview Card */}
                <div className="mt-4 pt-4 border-t border-border">
                  <label className="text-xs font-semibold text-muted-foreground block mb-2">Live Preview (Mobile UI)</label>
                  <div className="bg-muted/30 border border-border rounded-xl p-4 flex flex-col font-sans">
                    <div className="flex items-center mb-2">
                      <div className="w-4 h-4 rounded-full border-2 border-emerald-500 flex items-center justify-center mr-2">
                         <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-bold text-foreground">{treePlanFormData.plan_name || 'Plan Name'}</div>
                        {treePlanFormData.badge_text && (
                          <div className="self-start px-2 py-0.5 rounded-full mt-1" style={{ backgroundColor: `${getCategoryColor(treePlanFormData.badge_text)}20` }}>
                            <div className="text-[10px] font-semibold" style={{ color: getCategoryColor(treePlanFormData.badge_text) }}>{treePlanFormData.badge_text}</div>
                          </div>
                        )}
                      </div>
                      <div className="items-end text-right">
                        <div className="text-xs font-bold text-foreground">₹{treePlanFormData.price || 0}/Yr</div>
                        <div className="text-[10px] font-semibold text-muted-foreground mt-0.5">Cover: ₹{treePlanFormData.cover || 0}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground leading-relaxed pl-6">
                      {treePlanFormData.description || 'Description goes here...'}
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-border mt-auto">
                  <button type="button" onClick={() => setIsTreePlanDrawerOpen(false)} className="px-4 h-9 border border-border hover:bg-muted text-xs font-semibold rounded-lg transition-all cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
                    <Save className="w-4 h-4" /> {editingTreePlanId ? 'Save Changes' : 'Push Live'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add Drawer for Climate Risk Tree Insurance */}
      <AnimatePresence>
        {isClimateRiskDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-40 cursor-pointer"
              onClick={() => setIsClimateRiskDrawerOpen(false)}
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-card border-l border-border z-50 shadow-2xl flex flex-col text-foreground font-sans text-xs"
            >
              <div className="p-5 border-b border-border bg-muted/30 flex justify-between items-center">
                <h2 className="text-base font-bold flex items-center gap-2 text-foreground">
                  <CloudLightning className="w-5 h-5 text-primary" /> {editingClimateRiskId ? 'Edit Card' : 'Append Card'}
                </h2>
                <button onClick={() => setIsClimateRiskDrawerOpen(false)} className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer"><X className="w-5 h-5" /></button>
              </div>

              <form onSubmit={handleSaveClimateRiskCard} className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Title *</label>
                  <input required type="text" placeholder="e.g. Single Sapling Protector" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={climateRiskFormData.title} onChange={e => setClimateRiskFormData({...climateRiskFormData, title: e.target.value})} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Subtitle</label>
                  <input type="text" placeholder="Optional subtitle" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={climateRiskFormData.subtitle} onChange={e => setClimateRiskFormData({...climateRiskFormData, subtitle: e.target.value})} />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">Price (₹) *</label>
                    <input required type="number" placeholder="12" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={climateRiskFormData.price} onChange={e => setClimateRiskFormData({...climateRiskFormData, price: Number(e.target.value)})} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-foreground block">Display Order</label>
                    <input type="number" placeholder="0" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={climateRiskFormData.display_order} onChange={e => setClimateRiskFormData({...climateRiskFormData, display_order: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Badge</label>
                  <input type="text" placeholder="e.g. Per Tree Basic" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={climateRiskFormData.badge} onChange={e => setClimateRiskFormData({...climateRiskFormData, badge: e.target.value})} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Button Text</label>
                  <input type="text" placeholder="e.g. Select Plan" className="w-full h-9 px-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans" value={climateRiskFormData.button_text} onChange={e => setClimateRiskFormData({...climateRiskFormData, button_text: e.target.value})} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Description *</label>
                  <textarea required placeholder="Card description..." className="w-full p-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans min-h-[80px]" value={climateRiskFormData.description} onChange={e => setClimateRiskFormData({...climateRiskFormData, description: e.target.value})} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block">Features (one per line)</label>
                  <textarea placeholder={"e.g.\nCovers fire damage\nCovers pest attacks"} className="w-full p-3 border border-border bg-background text-foreground outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 rounded-lg text-xs font-sans min-h-[80px]" value={climateRiskFormData.features} onChange={e => setClimateRiskFormData({...climateRiskFormData, features: e.target.value})} />
                </div>

                <div className="flex justify-end gap-3 pt-5 border-t border-border mt-auto">
                  <button type="button" onClick={() => setIsClimateRiskDrawerOpen(false)} className="px-4 h-9 border border-border hover:bg-muted text-xs font-semibold rounded-lg transition-all cursor-pointer">Cancel</button>
                  <button type="submit" className="px-5 h-9 bg-primary text-primary-foreground hover:bg-primary/90 font-bold rounded-lg text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer">
                    <Save className="w-4 h-4" /> {editingClimateRiskId ? 'Save Changes' : 'Push Live'}
                  </button>
                </div>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
};
