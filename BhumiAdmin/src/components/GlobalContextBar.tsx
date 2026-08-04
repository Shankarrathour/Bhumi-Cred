import React from 'react';
import { useAdminStore, useEcosystemStore } from '../store';
import { MapPin, Building2, Landmark, Map, ShieldAlert, Check } from 'lucide-react';
import { cn } from '../utils/cn';

export const GlobalContextBar: React.FC = () => {
  const {
    activeRole,
    activeState,
    activeDistrict,
    activeBlock,
    activeVillage,
    setActiveState,
    setActiveDistrict,
    setActiveBlock,
    setActiveVillage
  } = useAdminStore();
  const { statesAndDistricts: STATES_AND_DISTRICTS, districtBlocks: DISTRICT_BLOCKS, blockVillages: BLOCK_VILLAGES } = useEcosystemStore(
    (s) => s.locationTree
  );

  const farmers = useEcosystemStore((s) => s.farmers);

  const isStateLocked    = activeRole !== 'super_admin';
  const isDistrictLocked = ['district_admin', 'block_admin', 'gram_admin', 'carbon_project_manager', 'operations_admin'].includes(activeRole);
  const isBlockLocked    = ['block_admin', 'gram_admin', 'carbon_project_manager', 'operations_admin'].includes(activeRole);
  const isVillageLocked  = ['gram_admin', 'carbon_project_manager', 'operations_admin'].includes(activeRole);

  const states = React.useMemo(() => {
    const set = new Set<string>();
    Object.keys(STATES_AND_DISTRICTS).forEach(s => set.add(s));
    farmers.forEach(f => { if (f.location?.state) set.add(f.location.state); });
    ['Madhya Pradesh', 'Uttar Pradesh', 'Haryana', 'Arunachal Pradesh'].forEach(s => set.add(s));
    return ['All States', ...Array.from(set).sort()];
  }, [STATES_AND_DISTRICTS, farmers]);

  const districts = React.useMemo(() => {
    const set = new Set<string>();
    if (activeState && activeState !== 'All States') {
      (STATES_AND_DISTRICTS[activeState] || []).forEach(d => set.add(d));
      farmers.filter(f => f.location?.state === activeState).forEach(f => { if (f.location?.district) set.add(f.location.district); });
    } else {
      Object.values(STATES_AND_DISTRICTS).flat().forEach(d => set.add(d));
      farmers.forEach(f => { if (f.location?.district) set.add(f.location.district); });
      ['Anuppur', 'Hoshangabad', 'East Kameng', 'Sehore', 'Karnal', 'Varanasi'].forEach(d => set.add(d));
    }
    return ['All Districts', ...Array.from(set).sort()];
  }, [activeState, STATES_AND_DISTRICTS, farmers]);

  const blocks = React.useMemo(() => {
    const set = new Set<string>();
    if (activeDistrict && activeDistrict !== 'All Districts') {
      (DISTRICT_BLOCKS[activeDistrict] || []).forEach(b => set.add(b));
      farmers.filter(f => f.location?.district === activeDistrict).forEach(f => { if (f.location?.block) set.add(f.location.block); });
    } else {
      Object.values(DISTRICT_BLOCKS).flat().forEach(b => set.add(b));
      farmers.forEach(f => { if (f.location?.block) set.add(f.location.block); });
      ['Jaithari', 'Pushprajgarh', 'Babai', 'Sehore', 'Gharaunda', 'Harahua'].forEach(b => set.add(b));
    }
    return ['All Blocks', ...Array.from(set).sort()];
  }, [activeDistrict, DISTRICT_BLOCKS, farmers]);

  const villages = React.useMemo(() => {
    const set = new Set<string>();
    if (activeBlock && activeBlock !== 'All Blocks') {
      (BLOCK_VILLAGES[activeBlock] || []).forEach(v => set.add(v));
      farmers.filter(f => f.location?.block === activeBlock).forEach(f => { if (f.location?.village) set.add(f.location.village); });
    } else {
      Object.values(BLOCK_VILLAGES).flat().forEach(v => set.add(v));
      farmers.forEach(f => { if (f.location?.village) set.add(f.location.village); });
      ['Keshwa', 'Amarkantak', 'Unknown', 'Pipariya', 'Chautala', 'Rampur'].forEach(v => set.add(v));
    }
    return ['All Villages', ...Array.from(set).sort()];
  }, [activeBlock, BLOCK_VILLAGES, farmers]);

  const isRestricted = isStateLocked || isDistrictLocked;

  const pill = (locked: boolean) => cn(
    "flex items-center gap-1.5 border border-border rounded-[10px] px-2.5 h-9 bg-card transition-colors hover:border-primary/40 flex-shrink-0",
    locked ? "opacity-60 cursor-not-allowed" : ""
  );

  const selectCls = "bg-transparent border-none outline-none text-foreground font-medium text-[13px] cursor-pointer disabled:cursor-not-allowed max-w-[120px]";

  return (
    <div className="bg-card border-b border-border h-[52px] flex items-center gap-3 px-4 md:px-6 flex-shrink-0 overflow-x-auto">

      {/* Label */}
      <div className="flex items-center gap-1.5 text-primary font-semibold text-[13px] shrink-0 whitespace-nowrap">
        <span className="h-2 w-2 rounded-full bg-primary animate-pulse flex-shrink-0" />
        <span className="hidden sm:block">GIS MONITORING RANGE:</span>
      </div>

      {/* Filters row */}
      <div className="flex items-center gap-2 flex-1">

        {/* State */}
        <div className={pill(isStateLocked)}>
          <Landmark className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <select
            disabled={isStateLocked}
            value={activeState}
            onChange={(e) => { setActiveState(e.target.value); setActiveDistrict('All Districts'); setActiveBlock('All Blocks'); setActiveVillage('All Villages'); }}
            className={selectCls}
          >
            {isStateLocked
              ? <option value={activeState} className="bg-card text-foreground">{activeState}</option>
              : states.map(s => <option key={s} value={s} className="bg-card text-foreground">{s}</option>)
            }
          </select>
        </div>

        {/* District */}
        <div className={pill(isDistrictLocked)}>
          <MapPin className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <select
            disabled={isDistrictLocked}
            value={activeDistrict}
            onChange={(e) => { setActiveDistrict(e.target.value); setActiveBlock('All Blocks'); setActiveVillage('All Villages'); }}
            className={selectCls}
          >
            {isDistrictLocked
              ? <option value={activeDistrict} className="bg-card text-foreground">{activeDistrict}</option>
              : districts.map(d => <option key={d} value={d} className="bg-card text-foreground">{d}</option>)
            }
          </select>
        </div>

        {/* Block */}
        <div className={pill(isBlockLocked)}>
          <Building2 className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <select
            disabled={isBlockLocked}
            value={activeBlock}
            onChange={(e) => { setActiveBlock(e.target.value); setActiveVillage('All Villages'); }}
            className={selectCls}
          >
            {isBlockLocked
              ? <option value={activeBlock} className="bg-card text-foreground">{activeBlock}</option>
              : blocks.map(b => <option key={b} value={b} className="bg-card text-foreground">{b}</option>)
            }
          </select>
        </div>

        {/* Village */}
        <div className={pill(isVillageLocked)}>
          <Map className="h-3.5 w-3.5 text-primary flex-shrink-0" />
          <select
            disabled={isVillageLocked}
            value={activeVillage}
            onChange={(e) => setActiveVillage(e.target.value)}
            className={selectCls}
          >
            {isVillageLocked
              ? <option value={activeVillage} className="bg-card text-foreground">{activeVillage}</option>
              : villages.map(v => <option key={v} value={v} className="bg-card text-foreground">{v}</option>)
            }
          </select>
        </div>

        {/* Status badge — right */}
        <div className="ml-auto flex-shrink-0">
          {isRestricted ? (
            <div className="flex items-center gap-1.5 bg-warning/10 border border-warning/30 text-warning font-medium px-2.5 py-1 rounded-lg text-[12px] whitespace-nowrap">
              <ShieldAlert className="h-3.5 w-3.5 animate-pulse flex-shrink-0" />
              <span className="hidden sm:block">Role Restricted</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 bg-primary/10 border border-primary/30 text-primary font-medium px-2.5 py-1 rounded-lg text-[12px] whitespace-nowrap">
              <Check className="h-3.5 w-3.5 flex-shrink-0" />
              <span className="hidden sm:block">Central Geographic Audit</span>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
