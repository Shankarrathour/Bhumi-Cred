import React, { useState } from 'react';
import { STATES_AND_DISTRICTS, DISTRICT_BLOCKS } from '../data/mockData';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Plus, 
  Calculator, 
  Building, 
  MapPin, 
  Save, 
  Trash,
  X
} from 'lucide-react';
import toast from 'react-hot-toast';

interface GovernmentScheme {
  id: string;
  name: string;
  code: string;
  department: string;
  subsidyPercentage: number;
  allocatedBudget: number;
  remainingBudget: number;
  saplingsProvided?: number;
}

interface SchemeAllocation {
  id: string;
  schemeId: string;
  schemeName: string;
  state: string;
  district: string;
  block: string;
  targetAcreage: number;
  budgetAllocated: number;
  enrolledFarmers: number;
}

export const ReportBuilderPage: React.FC = () => {
  // Mock initial Government Schemes
  const [schemes, setSchemes] = useState<GovernmentScheme[]>([
    { id: 'SCH-001', name: 'Sub-Mission on Agroforestry (SMAF) Sapling Distribution', code: 'SMAF-2026', department: 'Ministry of Agriculture', subsidyPercentage: 50, allocatedBudget: 1500000, remainingBudget: 1200000, saplingsProvided: 50000 },
    { id: 'SCH-002', name: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) Solar Pump Scheme', code: 'PMKSY-SOLAR', department: 'Ministry of New & Renewable Energy', subsidyPercentage: 60, allocatedBudget: 4500000, remainingBudget: 3875000 },
    { id: 'SCH-003', name: 'National Bamboo Mission (NBM) Cultivation Support', code: 'NBM-DECCAN', department: 'National Bamboo Mission', subsidyPercentage: 40, allocatedBudget: 2500000, remainingBudget: 2500000, saplingsProvided: 30000 },
    { id: 'SCH-004', name: 'Paramparagat Krishi Vikas Yojana (PKVY) Soil Bio-Fertilizer Subsidy', code: 'PKVY-BIO', department: 'Ministry of Agriculture', subsidyPercentage: 75, allocatedBudget: 1800000, remainingBudget: 1450000 }
  ]);

  // Mock initial regional allocations
  const [allocations, setAllocations] = useState<SchemeAllocation[]>([
    { id: 'ALL-001', schemeId: 'SCH-001', schemeName: 'Sub-Mission on Agroforestry (SMAF) Sapling Distribution', state: 'Haryana', district: 'Karnal', block: 'Gharaunda', targetAcreage: 150, budgetAllocated: 300000, enrolledFarmers: 12 },
    { id: 'ALL-002', schemeId: 'SCH-002', schemeName: 'Pradhan Mantri Krishi Sinchayee Yojana (PMKSY) Solar Pump Scheme', state: 'Uttar Pradesh', district: 'Varanasi', block: 'Harahua', targetAcreage: 80, budgetAllocated: 625000, enrolledFarmers: 6 },
    { id: 'ALL-003', schemeId: 'SCH-004', schemeName: 'Paramparagat Krishi Vikas Yojana (PKVY) Soil Bio-Fertilizer Subsidy', state: 'Karnataka', district: 'Mysuru', block: 'Hunsur', targetAcreage: 200, budgetAllocated: 350000, enrolledFarmers: 18 }
  ]);

  // Drawer for adding new allocation
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState('SCH-001');
  const [selectedState, setSelectedState] = useState('Haryana');
  const [selectedDistrict, setSelectedDistrict] = useState('Karnal');
  const [selectedBlock, setSelectedBlock] = useState('Gharaunda');
  const [targetAcreage, setTargetAcreage] = useState(100);
  const [budgetToAllocate, setBudgetToAllocate] = useState(250000);

  const districts = STATES_AND_DISTRICTS[selectedState] || [];
  const blocks = DISTRICT_BLOCKS[selectedDistrict] || [];

  const handleStateChange = (state: string) => {
    setSelectedState(state);
    const firstDist = STATES_AND_DISTRICTS[state]?.[0] || '';
    setSelectedDistrict(firstDist);
    setSelectedBlock(DISTRICT_BLOCKS[firstDist]?.[0] || '');
  };

  const handleDistrictChange = (dist: string) => {
    setSelectedDistrict(dist);
    setSelectedBlock(DISTRICT_BLOCKS[dist]?.[0] || '');
  };

  const handleCommitAllocation = (e: React.FormEvent) => {
    e.preventDefault();
    const scheme = schemes.find(s => s.id === selectedSchemeId);
    if (!scheme) return;

    if (budgetToAllocate > scheme.remainingBudget) {
      toast.error('Allocation budget exceeds remaining scheme funds!');
      return;
    }

    // Add allocation
    const newAllocation: SchemeAllocation = {
      id: `ALL-00${allocations.length + 1}`,
      schemeId: selectedSchemeId,
      schemeName: scheme.name,
      state: selectedState,
      district: selectedDistrict,
      block: selectedBlock,
      targetAcreage,
      budgetAllocated: budgetToAllocate,
      enrolledFarmers: 0
    };

    setAllocations([...allocations, newAllocation]);

    // Subtract from remaining budget
    setSchemes(schemes.map(s => 
      s.id === selectedSchemeId 
        ? { ...s, remainingBudget: s.remainingBudget - budgetToAllocate }
        : s
    ));

    setIsDrawerOpen(false);
    toast.success('Central government scheme targets successfully allotted to target block!');
  };

  const handleDeleteAllocation = (id: string, schemeId: string, budget: number) => {
    setAllocations(allocations.filter(a => a.id !== id));
    setSchemes(schemes.map(s => 
      s.id === schemeId 
        ? { ...s, remainingBudget: s.remainingBudget + budget }
        : s
    ));
    toast.success('Sub-district allotment revoked. Funds restored to central scheme pool.');
  };

  return (
    <div className="space-y-6 pb-10 text-white font-mono uppercase tracking-wider text-xs">
      {/* Header */}
      <div>
        <h1 className="text-xl font-black uppercase text-[#00FF87] tracking-widest leading-none">Government Subsidies & Schemes Allocation</h1>
        <p className="text-slate-400 text-xs font-bold uppercase tracking-wider mt-2.5">
          Allot central climate subsidies, assign block-level reforestation acreage targets, and monitor farmer scheme enrollments.
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {schemes.map(s => (
          <div key={s.id} className="bg-[#0b110d] border border-[#142217] p-4 relative overflow-hidden">
            <span className="absolute top-2 right-2 text-[6px] bg-[#00FF87]/15 border border-[#00FF87]/20 text-[#00FF87] px-1 py-0.2">
              {s.code}
            </span>
            <div className="text-[7.5px] text-slate-500 font-bold">{s.department}</div>
            <h4 className="text-[9px] font-black text-white mt-1 border-b border-[#142217] pb-1.5 truncate pr-8">{s.name}</h4>
            
            <div className="grid grid-cols-2 gap-2 mt-3 text-[8px]">
              <div>
                <span className="text-slate-400">Total Funds</span>
                <div className="text-[10px] font-black text-white mt-0.5">₹{(s.allocatedBudget / 100000).toFixed(1)}L</div>
              </div>
              <div>
                <span className="text-slate-400">Available</span>
                <div className="text-[10px] font-black text-[#00FF87] mt-0.5">₹{(s.remainingBudget / 100000).toFixed(1)}L</div>
              </div>
            </div>
            
            <div className="mt-3.5 bg-black/45 h-1 w-full border border-[#142217] relative">
              <div 
                className="bg-[#00FF87] h-full" 
                style={{ width: `${(s.remainingBudget / s.allocatedBudget) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 items-start">
        
        {/* Allocations Table (2 cols) */}
        <div className="xl:col-span-2 bg-[#0b110d] border border-[#142217] p-6 relative">
          <div className="absolute top-3 right-3 text-[7px] bg-[#00FF87]/10 text-[#00FF87] font-black tracking-widest px-2 py-0.5 border border-[#00FF87]/20">
            ALLOTMENT INDEX
          </div>

          <div className="border-b border-[#142217] pb-3 flex items-center justify-between text-[#00FF87] mb-4">
            <div className="flex items-center gap-2">
              <Building className="w-5 h-5" />
              <h3 className="text-xs font-black uppercase tracking-widest text-white">Active Block Allocations & Targets</h3>
            </div>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="px-3.5 py-2 bg-[#142217] border border-[#00FF87]/20 hover:border-[#00FF87]/40 text-[#00FF87] text-[10px] font-bold flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> ALLOT SCHEME TARGET
            </button>
          </div>

          <div className="overflow-x-auto bg-black/25 border border-[#142217]">
            <table className="w-full text-left text-[9px] border-collapse">
              <thead className="bg-[#0b110d] border-b border-[#142217] text-[#00FF87] tracking-wider">
                <tr>
                  <th className="px-4 py-3">SCHEME / CODE</th>
                  <th className="px-4 py-3">TARGET AREA</th>
                  <th className="px-4 py-3">BUDGET DISBURSED</th>
                  <th className="px-4 py-3">ACREAGE TARGET</th>
                  <th className="px-4 py-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#142217] font-medium text-slate-300">
                {allocations.map(alloc => (
                  <tr key={alloc.id} className="hover:bg-[#142217]/25">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white uppercase truncate max-w-[180px]">{alloc.schemeName}</div>
                      <div className="text-[7.5px] text-slate-400 mt-1 uppercase font-mono tracking-normal">
                        NODE: {alloc.state} &gt; {alloc.district} &gt; {alloc.block}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-[#00FF87]" />
                        <span>{alloc.block.toUpperCase()} Block</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-white font-mono font-black">₹{alloc.budgetAllocated.toLocaleString()}</td>
                    <td className="px-4 py-3 text-slate-300 font-mono">{alloc.targetAcreage} Acres</td>
                    <td className="px-4 py-3 text-right">
                      <button 
                        onClick={() => handleDeleteAllocation(alloc.id, alloc.schemeId, alloc.budgetAllocated)}
                        className="p-1.5 border border-[#142217] bg-[#0b110d] hover:border-[#00FF87]/30 text-rose-500"
                        title="Revoke Block Target"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Dynamic Target Calculation Terminal (1 col) */}
        <div className="bg-[#0b110d] border border-[#142217] p-5 space-y-4">
          <div className="border-b border-[#142217] pb-3 flex items-center gap-2 text-[#00FF87]">
            <Calculator className="w-4.5 h-4.5" />
            <h3 className="text-xs font-black uppercase tracking-widest text-white">Target Simulator</h3>
          </div>

          <div className="space-y-4 text-[9px] text-slate-400 leading-normal">
            <div className="p-3 bg-black/45 border border-[#142217]">
              <span className="text-[#00FF87] font-black uppercase">Agroforestry Formula:</span>
              <p className="mt-1 normal-case font-mono leading-relaxed">
                Total Reforestation Carbon yield is simulated at 5.4 Tonnes CO2 sequestered per acre annually under standard crop parameters.
              </p>
            </div>

            <div className="bg-black/35 border border-[#142217] p-4 flex flex-col justify-between">
              <span className="uppercase text-slate-400">Total Program Target Acreage</span>
              <span className="text-xl font-mono font-black text-white mt-2">
                {allocations.reduce((sum, a) => sum + a.targetAcreage, 0)} ACRES
              </span>
            </div>

            <div className="bg-black/35 border border-[#142217] p-4 flex flex-col justify-between">
              <span className="uppercase text-slate-400">Total Disbursed Subsidies</span>
              <span className="text-xl font-mono font-black text-[#00FF87] mt-2">
                ₹{allocations.reduce((sum, a) => sum + a.budgetAllocated, 0).toLocaleString()}
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Drawer for creating Scheme Allocation */}
      <AnimatePresence>
        {isDrawerOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/85 z-40 cursor-pointer"
              onClick={() => setIsDrawerOpen(false)}
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[#050806] border-l border-[#142217] z-50 shadow-2xl flex flex-col font-mono text-white"
            >
              <div className="p-6 border-b border-[#142217] bg-[#0b110d] flex justify-between items-center">
                <h2 className="text-sm font-black flex items-center gap-2 uppercase tracking-widest text-[#00FF87]">
                  <Plus className="h-5 w-5" /> ALLOT SCHEME BUDGET
                </h2>
                <button onClick={() => setIsDrawerOpen(false)} className="p-1.5 hover:bg-[#142217] border border-[#142217]"><X className="h-5 w-5" /></button>
              </div>

              <form onSubmit={handleCommitAllocation} className="flex-1 overflow-y-auto p-6 space-y-5 text-xs">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block pl-0.5">Select Nodal Subsidy Scheme *</label>
                  <select 
                    className="w-full p-3 border border-[#142217] bg-black/45 text-slate-300 outline-none focus:border-[#00FF87]/50 rounded-none font-bold uppercase bg-[#050806]" 
                    value={selectedSchemeId} 
                    onChange={e => setSelectedSchemeId(e.target.value)}
                  >
                    {schemes.map(s => (
                      <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block pl-0.5">State *</label>
                  <select 
                    className="w-full p-3 border border-[#142217] bg-black/45 text-slate-300 outline-none focus:border-[#00FF87]/50 rounded-none font-bold uppercase bg-[#050806]" 
                    value={selectedState} 
                    onChange={e => handleStateChange(e.target.value)}
                  >
                    {Object.keys(STATES_AND_DISTRICTS).map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block pl-0.5">District *</label>
                  <select 
                    className="w-full p-3 border border-[#142217] bg-black/45 text-slate-300 outline-none focus:border-[#00FF87]/50 rounded-none font-bold uppercase bg-[#050806]" 
                    value={selectedDistrict} 
                    onChange={e => handleDistrictChange(e.target.value)}
                  >
                    {districts.map(d => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block pl-0.5">Block *</label>
                  <select 
                    className="w-full p-3 border border-[#142217] bg-black/45 text-slate-300 outline-none focus:border-[#00FF87]/50 rounded-none font-bold uppercase bg-[#050806]" 
                    value={selectedBlock} 
                    onChange={e => setSelectedBlock(e.target.value)}
                  >
                    {blocks.map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block pl-0.5">Target Reforestation Acreage *</label>
                  <input required type="number" className="w-full p-3 border border-[#142217] bg-black/45 text-white outline-none focus:border-[#00FF87]/50 rounded-none font-bold text-xs" value={targetAcreage} onChange={e => setTargetAcreage(Number(e.target.value))} />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold uppercase text-slate-400 block pl-0.5">Budget Allocation Amount (INR) *</label>
                  <input required type="number" className="w-full p-3 border border-[#142217] bg-black/45 text-[#00FF87] outline-none focus:border-[#00FF87]/50 rounded-none font-bold text-xs font-mono" value={budgetToAllocate} onChange={e => setBudgetToAllocate(Number(e.target.value))} />
                </div>
                
                <div className="flex justify-end gap-2.5 pt-6 border-t border-[#142217] mt-auto">
                  <button type="button" onClick={() => setIsDrawerOpen(false)} className="px-4 py-2 border border-[#142217] hover:bg-[#142217] font-bold rounded-none uppercase">Cancel</button>
                  <button type="submit" className="px-5 py-2.5 bg-[#142217] hover:bg-[#1f3323] text-[#00FF87] border border-[#00FF87]/30 font-black flex items-center gap-1 shadow rounded-none uppercase">
                    <Save className="h-4 w-4" /> COMMIT ALLOTMENT
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
