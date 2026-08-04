import React from 'react';
import { useEcosystemStore } from '../store';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  MapPin, 
  Bell, 
  Leaf, 
  ShieldAlert, 
  Activity,
  Award,
  DollarSign,
  TrendingUp,
  Grid,
  Calendar,
  Heart,
  User
} from 'lucide-react';

const BANNER_ASPECT_RATIO = "3 / 1";

export const MobileAppSimulator: React.FC<{ apiBanners?: any[] }> = ({ apiBanners }) => {
  const { cmsConfig, farmers } = useEcosystemStore();
  const activeBanners = apiBanners 
    ? apiBanners.filter(b => b.is_active) 
    : cmsConfig.banners.filter(b => b.isActive);
  const activeCampaigns = cmsConfig.featuredCampaigns.filter(c => c.isActive);

  // Take the first farmer as the active session in the mobile app for simulation
  const simulatedFarmer = farmers[0] || {
    name: "Gurdev Singh Dhillon",
    location: { village: "Karnal Khurd", block: "Gharaunda", state: "Haryana" },
    totalTrees: 840,
    carbonCreditsGenerated: 148.5,
    walletBalance: 42500,
    sustainabilityScore: 88
  };

  return (
    <div className="flex items-center justify-center p-4 select-none">
      <div 
        className="relative w-[280px] h-[560px] bg-[#050806] rounded-[40px] overflow-hidden border-[8px] border-slate-900 shadow-2xl ring-4 ring-[#142217]/40 flex flex-col font-mono text-[9px] text-[#00FF87] border-solid"
      >
        
        {/* 📱 Top iPhone Camera Notch Area */}
        <div className="absolute top-0 inset-x-0 h-6 bg-slate-950 z-50 flex justify-between px-6 pt-1 items-center text-[8px] font-bold text-white">
          <div>09:41</div>
          <div className="w-24 h-4.5 bg-slate-950 rounded-b-2xl absolute left-1/2 -translate-x-1/2 top-0 flex items-center justify-center">
            <div className="h-1 w-8 bg-slate-800 rounded-full mt-1 animate-pulse" />
          </div>
          <div className="flex items-center gap-1 font-sans">
            <span>📶</span>
            <span>🔋</span>
          </div>
        </div>
 
        {/* 🔍 Sticky App Navbar Header */}
        <div className="pt-7 bg-[#0b110d] border-b border-[#142217] shrink-0 shadow-md">
          {/* Location Bar */}
          <div className="px-3.5 py-1.5 flex justify-between items-center">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3 text-[#00FF87]" />
              <div>
                <div className="text-[6px] text-slate-400 font-bold leading-none uppercase">Geo-Node</div>
                <div className="text-[8px] font-black text-white leading-tight flex items-center gap-0.5 uppercase">
                  {simulatedFarmer.location.village}, {simulatedFarmer.location.state.substring(0, 2)}
                </div>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button className="h-6 w-6 rounded-none bg-black/40 flex items-center justify-center border border-[#142217] relative">
                <Bell className="h-3 w-3 text-[#00FF87]" />
                <span className="absolute top-1 right-1 h-1 w-1 bg-[#00FF87] rounded-none animate-ping" />
              </button>
            </div>
          </div>

          {/* Search box */}
          <div className="px-3.5 pb-2">
            <div className="bg-black/30 border border-[#142217] rounded-none h-7 px-2.5 flex items-center gap-2 text-slate-500">
              <Search className="h-3 w-3 text-slate-500" />
              <span className="text-[7px] font-medium text-slate-400">Search marketplace & tools...</span>
            </div>
          </div>

          {/* Emergency announcement banner from CMS */}
          <AnimatePresence>
            {cmsConfig.isMarqueeActive && cmsConfig.announcementMarquee && (
              <motion.div 
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="bg-[#142217] border-t border-[#00FF87]/20 px-3.5 py-1 text-[#00FF87] text-[7px] leading-tight overflow-hidden relative shadow-inner"
              >
                <div className="whitespace-nowrap animate-marquee flex items-center gap-1.5">
                  <ShieldAlert className="h-2.5 w-2.5 inline shrink-0" />
                  <span className="font-extrabold uppercase">{cmsConfig.announcementMarquee}</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 📜 Dynamic Home Viewport */}
        <div className="flex-1 overflow-y-auto bg-[#050806] pb-12 scrollbar-none space-y-4 pt-3">
          
          {/* 🌲 FARMER TELEMETRY HUD */}
          <div className="px-3.5">
            <div className="border border-[#142217] bg-[#0b110d] p-2.5 relative overflow-hidden">
              <div className="absolute top-0 right-0 bg-[#00FF87]/15 border-b border-l border-[#142217] text-[#00FF87] text-[5px] font-black px-1 uppercase tracking-widest">
                VERIFIED PROFILE
              </div>
              <h3 className="text-[8px] font-black text-white uppercase tracking-wider mb-2 border-b border-[#142217] pb-1">
                {simulatedFarmer.name}
              </h3>
              
              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="bg-black/35 border border-[#142217] p-1.5 flex flex-col justify-between">
                  <span className="text-[6px] text-slate-400 uppercase">Tree Canopy</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Leaf className="h-3 w-3 text-[#00FF87]" />
                    <span className="text-xs font-black text-white font-mono">{simulatedFarmer.totalTrees}</span>
                  </div>
                </div>

                <div className="bg-black/35 border border-[#142217] p-1.5 flex flex-col justify-between">
                  <span className="text-[6px] text-slate-400 uppercase">Carbon Credits</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Award className="h-3 w-3 text-[#00FF87]" />
                    <span className="text-xs font-black text-white font-mono">{simulatedFarmer.carbonCreditsGenerated} T</span>
                  </div>
                </div>

                <div className="bg-black/35 border border-[#142217] p-1.5 flex flex-col justify-between">
                  <span className="text-[6px] text-slate-400 uppercase">Cash Wallet</span>
                  <div className="flex items-center gap-1 mt-1">
                    <DollarSign className="h-3 w-3 text-[#00FF87]" />
                    <span className="text-xs font-black text-white font-mono">₹{simulatedFarmer.walletBalance}</span>
                  </div>
                </div>

                <div className="bg-black/35 border border-[#142217] p-1.5 flex flex-col justify-between">
                  <span className="text-[6px] text-slate-400 uppercase">Eco Score</span>
                  <div className="flex items-center gap-1 mt-1">
                    <Activity className="h-3 w-3 text-[#00FF87]" />
                    <span className="text-xs font-black text-white font-mono">{simulatedFarmer.sustainabilityScore}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 🖼️ DYNAMIC PROMOTIONAL BANNER */}
          <div className="px-3.5">
            <div style={{ aspectRatio: BANNER_ASPECT_RATIO }} className="relative w-full overflow-hidden border border-[#142217] bg-[#0b110d]">
              {activeBanners.length > 0 ? (
                <>
                  <img 
                    src={activeBanners[0].image_url || activeBanners[0].imageUrl} 
                    alt={activeBanners[0].title || "Promotional banner"}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover object-center" 
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent flex items-end p-2">
                    <div>
                      <div className="bg-[#00FF87] text-black text-[5px] font-black uppercase px-1 py-0.2 rounded-none w-max mb-0.5 tracking-widest">
                        NEWS BULLETIN
                      </div>
                      <h4 className="text-[8px] font-black text-white leading-tight tracking-tight truncate w-48">
                        {activeBanners[0].title}
                      </h4>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-[8px] text-slate-500 italic">
                  NO ACTIVE PROMOTIONS REGISTERED
                </div>
              )}
            </div>
          </div>

          {/* 🌲 DYNAMIC CATEGORIES FOR CLIMATE SERVICES */}
          <div className="px-3.5">
            <div className="flex items-center justify-between mb-1.5 border-b border-[#142217] pb-1">
              <h3 className="text-[7px] font-black text-white uppercase tracking-wider">ECOSYSTEM COMMANDS</h3>
              <button className="text-[6px] font-extrabold text-[#00FF87] uppercase">View Registry</button>
            </div>
            <div className="grid grid-cols-3 gap-1.5">
              {[
                { label: 'CANOPY SECURE', icon: '🌲', desc: 'Plantation Ins' },
                { label: 'GIS VERIFY', icon: '🗺️', desc: 'Audit Lands' },
                { label: 'B2B SEEDS', icon: '🏪', desc: 'Bio Fertilizers' }
              ].map((item, idx) => (
                <div
                  key={idx}
                  className="bg-[#0b110d] border border-[#142217] p-1 flex flex-col items-center text-center cursor-pointer active:scale-95 transition-transform"
                >
                  <span className="text-xs mb-0.5">{item.icon}</span>
                  <span className="text-[6px] font-black text-white leading-none tracking-tight">{item.label}</span>
                  <span className="text-[4.5px] text-slate-400 leading-none mt-0.5">{item.desc}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 🏆 ACTIVE CORPORATE ESG CAMPAIGNS (FROM CMS FEATURED CAMPAIGNS) */}
          <div className="px-3.5">
            <div className="flex items-center justify-between mb-1.5 border-b border-[#142217] pb-1">
              <h3 className="text-[7px] font-black text-white uppercase tracking-wider flex items-center gap-1">
                <TrendingUp className="h-2.5 w-2.5 text-[#00FF87]" /> FEATURED CAMPAIGNS
              </h3>
            </div>
            <div className="space-y-1.5">
              {activeCampaigns.slice(0, 2).map(campaign => (
                <div key={campaign.id} className="bg-[#0b110d] border border-[#142217] p-2 flex justify-between items-center">
                  <div className="flex-1 truncate mr-2">
                    <h4 className="text-[7px] font-bold text-white truncate uppercase">{campaign.title}</h4>
                    <p className="text-[5.5px] text-slate-400 truncate mt-0.5">{campaign.slogan}</p>
                  </div>
                  <span className="text-[6px] font-black bg-[#142217] text-[#00FF87] border border-[#00FF87]/20 px-1 py-0.5 shrink-0 uppercase tracking-tight">
                    ENGAGED
                  </span>
                </div>
              ))}
              {activeCampaigns.length === 0 && (
                <div className="text-[7px] text-slate-500 italic text-center py-1 bg-[#0b110d] border border-[#142217] border-dashed">
                  NO ACTIVE ESG CAMPAIGNS
                </div>
              )}
            </div>
          </div>

        </div>

        {/* 🧭 Bottom Bar Navigation */}
        <div className="absolute bottom-0 inset-x-0 h-10 bg-[#0b110d] border-t border-[#142217] flex justify-around items-center px-1 z-40">
          <div className="flex flex-col items-center cursor-pointer text-[#00FF87]">
            <Grid className="h-3.5 w-3.5" />
            <span className="text-[5.5px] font-black mt-0.5 uppercase tracking-tighter">Terminal</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-slate-300">
            <Calendar className="h-3.5 w-3.5" />
            <span className="text-[5.5px] font-bold mt-0.5 uppercase tracking-tighter">Contracts</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-slate-300">
            <div className="h-7 w-7 bg-[#142217] rounded-none -mt-4 flex items-center justify-center border border-[#00FF87]/30 text-[#00FF87]">
              <span className="text-xs">➕</span>
            </div>
            <span className="text-[5.5px] font-black mt-0.5 text-[#00FF87] uppercase tracking-tighter">Register</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-slate-300">
            <Heart className="h-3.5 w-3.5" />
            <span className="text-[5.5px] font-bold mt-0.5 uppercase tracking-tighter">Canopy</span>
          </div>
          <div className="flex flex-col items-center cursor-pointer text-slate-500 hover:text-slate-300">
            <User className="h-3.5 w-3.5" />
            <span className="text-[5.5px] font-bold mt-0.5 uppercase tracking-tighter">Profile</span>
          </div>
        </div>

        {/* Bottom Swipe Indicator */}
        <div className="absolute bottom-0.5 left-1/2 -translate-x-1/2 h-0.5 w-16 bg-[#142217] z-50" />

      </div>
    </div>
  );
};
