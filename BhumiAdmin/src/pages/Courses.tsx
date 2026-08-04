import React, { useState } from 'react';
import { useEcosystemStore } from '../store';
import { CarbonProject, CarbonProjectPhase } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  Leaf, 
  Plus, 
  Search, 
  Users, 
  PlusCircle, 
  Check,
  FileText,
  User,
  ShieldCheck,
  X,
  FileCheck
} from 'lucide-react';
import { cn } from '../utils/cn';

export const CoursesPage: React.FC = () => {
  const { carbonProjects, farmers, createCarbonProject, updateProjectPhase, addMRVReport } = useEcosystemStore();
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<CarbonProject | null>(null);

  // Form states for creating a project
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newManager, setNewManager] = useState('');
  const [newCreditsTarget, setNewCreditsTarget] = useState(50000);

  // Form states for adding MRV report
  const [isMRVOpen, setIsMRVOpen] = useState(false);
  const [auditor, setAuditor] = useState('');
  const [pdfName, setPdfName] = useState('');
  const [mrvStatus, setMrvStatus] = useState<'Verified' | 'Flagged'>('Verified');

  const filteredProjects = carbonProjects.filter(proj => 
    proj.title.toLowerCase().includes(search.toLowerCase()) ||
    proj.manager.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newDesc || !newManager) {
      toast.error('Please fill in all required fields.');
      return;
    }

    createCarbonProject({
      title: newTitle,
      description: newDesc,
      manager: newManager,
      totalCreditsTarget: newCreditsTarget,
      phase: 'Feasibility',
      startDate: new Date().toISOString().split('T')[0]
    });

    toast.success(`Voluntary carbon project published: ${newTitle}`);
    setIsCreateOpen(false);
    setNewTitle('');
    setNewDesc('');
    setNewManager('');
    setNewCreditsTarget(50000);
  };

  const handleAddMRVReport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject) return;
    if (!auditor || !pdfName) {
      toast.error('Please specify auditor and file name.');
      return;
    }

    addMRVReport(selectedProject.id, {
      auditor,
      date: new Date().toISOString().split('T')[0],
      pdfUrl: `/reports/${pdfName}`,
      status: mrvStatus
    });

    toast.success('MRV environmental inspection report submitted successfully.');
    setIsMRVOpen(false);
    setAuditor('');
    setPdfName('');
    
    // Refresh selection
    const updated = useEcosystemStore.getState().carbonProjects.find(p => p.id === selectedProject.id);
    if (updated) setSelectedProject(updated);
  };

  const handlePhaseShift = (projectId: string, nextPhase: CarbonProjectPhase) => {
    updateProjectPhase(projectId, nextPhase);
    toast.success(`Project phase advanced to ${nextPhase}.`);
    
    // Refresh selection
    const updated = useEcosystemStore.getState().carbonProjects.find(p => p.id === projectId);
    if (updated) setSelectedProject(updated);
  };

  return (
    <div className="space-y-5 pb-10 font-mono text-xs text-foreground select-none">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-border pb-4">
        <div>
          <h1 className="text-lg font-black uppercase tracking-wider leading-none">Carbon Projects MRV Center</h1>
          <p className="text-muted-foreground text-[8.5px] uppercase tracking-widest mt-2">
            Administer voluntary carbon offsets, update MRV environmental verification reports, and process voluntary credit issuance payouts.
          </p>
        </div>
        
        <button
          onClick={() => setIsCreateOpen(true)}
          className="cyber-button-primary self-start lg:self-center"
        >
          <Plus className="w-4 h-4 text-primary-foreground" />
          <span>Register Carbon Program</span>
        </button>
      </div>

      {/* Analytics widgets */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { title: 'Total Registered Projects', value: `${carbonProjects.length} Active Initiatives`, icon: Leaf },
          { title: 'Credits Generated (t)', value: `${carbonProjects.reduce((acc, curr) => acc + curr.creditsIssued, 0).toLocaleString('en-IN')} t Co2`, icon: ShieldCheck },
          { title: 'Assigned Farmers Count', value: `${farmers.filter(f => f.carbonCreditsGenerated > 0).length} Farmers Enrolled`, icon: Users }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={i} className="bg-card border border-border p-3.5 flex items-center justify-between shadow-sm">
              <div className="space-y-1">
                <span className="text-[7.5px] text-muted-foreground block tracking-widest uppercase">{stat.title}</span>
                <span className="text-xs font-black text-primary font-mono">{stat.value}</span>
              </div>
              <Icon className="w-5 h-5 text-primary shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Search Bar */}
      <div className="bg-card border border-border p-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-primary" />
          <input 
            type="text"
            placeholder="SEARCH ACTIVE VOLUNTARY CARBON INITIATIVES..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 bg-background border border-border rounded-none text-[9px] outline-none focus:border-primary/50 text-foreground"
          />
        </div>
      </div>

      {/* Grid Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        
        {/* Left: Carbon Projects List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredProjects.map(proj => (
            <div 
              key={proj.id}
              className="bg-card border border-border p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 transition-all hover:border-primary/40 shadow-sm"
            >
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "text-[7px] border font-black px-1.5 py-0.2 uppercase tracking-widest",
                    proj.phase === 'Credit Issuance' ? "bg-primary/5 border-primary/20 text-primary" : "bg-accent/5 border-accent/20 text-accent"
                  )}>
                    {proj.phase}
                  </span>
                  <span className="text-[8px] text-muted-foreground font-mono">{proj.id} • Target: {proj.totalCreditsTarget.toLocaleString('en-IN')} t</span>
                </div>
                <h3 className="text-[10px] font-black text-foreground tracking-wider uppercase leading-snug">{proj.title}</h3>
                
                {/* Horizontal Progress bar */}
                <div className="w-full bg-muted/40 h-1 border border-border/80 my-2">
                  <div className="bg-primary h-full shadow-[0_0_8px_rgba(0,255,135,0.6)]" style={{ width: `${proj.progressPercentage}%` }} />
                </div>

                <div className="flex items-center gap-4 text-[7.5px] text-muted-foreground font-black pt-1">
                  <span className="flex items-center gap-1">
                    <User className="w-3.5 h-3.5 text-primary" /> Manager: {proj.manager}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="w-3.5 h-3.5 text-primary" /> Enrolled: {proj.assignedFarmerIds.length} Farmers
                  </span>
                </div>
              </div>

              <button
                onClick={() => setSelectedProject(proj)}
                className="px-3.5 h-8 border border-primary text-primary hover:bg-primary/5 text-[8.5px] font-black uppercase shrink-0 rounded-none transition-colors"
              >
                OPEN CONSOLE
              </button>
            </div>
          ))}
        </div>

        {/* Right: Selected Project MRV Details Panel */}
        <div className="lg:col-span-1 bg-card border border-border p-4 h-[420px] flex flex-col justify-between shadow-sm">
          {selectedProject ? (
            <div className="flex-1 flex flex-col h-full overflow-hidden">
              {/* Header */}
              <div className="border-b border-border pb-2.5 shrink-0 flex items-start justify-between">
                <div>
                  <span className="text-[7.5px] bg-primary/10 border border-primary/20 text-primary font-black px-1.5 py-0.2">
                    MRV VERIFICATION LOGS
                  </span>
                  <h3 className="text-[10px] font-black text-foreground mt-2 uppercase max-w-[200px] truncate">{selectedProject.title}</h3>
                </div>
                <div className="text-[8.5px] text-primary font-black">{selectedProject.progressPercentage}%</div>
              </div>

              {/* Scrollable details */}
              <div className="flex-1 overflow-y-auto pt-3 space-y-4 pr-1 scrollbar-thin">
                
                {/* Phase advance control panel */}
                <div className="border border-border p-3 bg-muted/20">
                  <span className="text-[7px] text-muted-foreground block mb-2.5">PROJECT PHASE SWITCHBOARD</span>
                  
                  <div className="grid grid-cols-2 gap-2 text-center">
                    {(['Feasibility', 'Registration', 'Active MRV', 'Credit Issuance'] as CarbonProjectPhase[]).map(p => {
                      const isActive = selectedProject.phase === p;
                      return (
                        <button
                          key={p}
                          onClick={() => handlePhaseShift(selectedProject.id, p)}
                          disabled={isActive}
                          className={cn(
                            "py-1 text-[7.5px] border font-black uppercase",
                            isActive 
                              ? "bg-primary border-primary text-primary-foreground" 
                              : "border-border text-muted-foreground hover:bg-background hover:text-foreground"
                          )}
                        >
                          {p.split(' ')[0]}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* MRV audit report list */}
                <div className="space-y-2.5">
                  <div className="flex justify-between items-center border-b border-border pb-1">
                    <span className="text-[8.5px] font-black text-primary uppercase">Environmental Audit Reports</span>
                    <button 
                      onClick={() => setIsMRVOpen(true)}
                      className="text-primary text-[7.5px] font-black hover:underline flex items-center gap-1"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> UPLOAD REPORT
                    </button>
                  </div>

                  {selectedProject.mrvReports.length === 0 ? (
                    <p className="text-[7.5px] text-muted-foreground">No MRV field reports uploaded. Initiate satellite surveys above.</p>
                  ) : (
                    selectedProject.mrvReports.map((rpt, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 border border-border bg-muted/40 font-mono">
                        <div className="flex items-center gap-2 max-w-[80%] truncate">
                          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span className="text-[8px] text-foreground font-black uppercase truncate">{rpt.reportId} • {rpt.auditor}</span>
                        </div>
                        <span className={cn(
                          "text-[6.5px] border px-1",
                          rpt.status === 'Verified' ? "bg-primary/5 text-primary border-primary/20" : "bg-destructive/5 text-destructive border-destructive/20"
                        )}>{rpt.status}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center">
              <Leaf className="w-8 h-8 text-primary/30 opacity-60 mb-2.5 text-primary animate-pulse" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-foreground">Select Carbon Project</h3>
              <p className="text-[8.5px] text-muted-foreground uppercase font-bold mt-1 max-w-xs leading-normal">
                Click "Open Console" to audit tree plantations, upload dummy MRV reports, and trigger voluntary carbon credit issuances.
              </p>
            </div>
          )}
        </div>

      </div>

      {/* Carbon Project Builder Slide Drawer */}
      <AnimatePresence>
        {isCreateOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreateOpen(false)}
              className="fixed inset-0 z-40 bg-black/80"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col h-full font-mono text-[9px]"
            >
              {/* Header */}
              <div className="h-16 px-5 border-b border-border flex items-center justify-between bg-muted/10 flex-shrink-0 relative">
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-primary/20 shadow-[0_0_10px_rgba(0,255,135,0.4)]" />
                <div className="flex items-center gap-2.5">
                  <Leaf className="w-5 h-5 text-primary animate-pulse" />
                  <div>
                    <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest">Register Carbon Project</h3>
                    <p className="text-[7px] text-muted-foreground font-bold mt-1 uppercase">BhumiCred voluntary registries</p>
                  </div>
                </div>
                <button onClick={() => setIsCreateOpen(false)} className="p-1 hover:bg-muted text-muted-foreground border border-border">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleCreateProject} className="flex-1 overflow-y-auto p-5 space-y-4 uppercase font-bold tracking-wider">
                <div className="space-y-1">
                  <label className="text-[8px] text-muted-foreground block pl-0.5">Project Program Title</label>
                  <input 
                    type="text" 
                    value={newTitle} 
                    onChange={e => setNewTitle(e.target.value)}
                    placeholder="e.g. Karnal Agroforestry Carbon Sink"
                    required
                    className="w-full h-9 border border-border bg-background px-3 text-[9px] outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] text-muted-foreground block pl-0.5">Regional Manager</label>
                  <input 
                    type="text" 
                    value={newManager} 
                    onChange={e => setNewManager(e.target.value)}
                    placeholder="e.g. Dr. K. Raghavan"
                    required
                    className="w-full h-9 border border-border bg-background px-3 text-[9px] outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] text-muted-foreground block pl-0.5">Voluntary Carbon Credit Target (t)</label>
                  <input 
                    type="number" 
                    value={newCreditsTarget} 
                    onChange={e => setNewCreditsTarget(Number(e.target.value))}
                    required
                    className="w-full h-9 border border-border bg-background px-3 text-[9px] outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] text-muted-foreground block pl-0.5">Syllabus / Environmental Scope</label>
                  <textarea 
                    value={newDesc} 
                    onChange={e => setNewDesc(e.target.value)}
                    rows={4}
                    placeholder="Describe program goals and methods..."
                    required
                    className="w-full border border-border bg-background px-3 py-2 text-[9px] outline-none focus:border-primary/50 resize-none text-foreground"
                  />
                </div>
              </form>

              {/* Footer */}
              <div className="h-16 px-5 border-t border-border bg-card flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 h-9 border border-border text-[9px] font-black uppercase hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateProject}
                  className="cyber-button-primary h-9 px-4 text-[9px]"
                >
                  <Check className="w-4 h-4 text-primary-foreground" />
                  <span>Publish program</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* MRV File Upload Slide Drawer */}
      <AnimatePresence>
        {isMRVOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.6 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMRVOpen(false)}
              className="fixed inset-0 z-40 bg-black/80"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', bounce: 0, duration: 0.2 }}
              className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col h-full font-mono text-[9px]"
            >
              {/* Header */}
              <div className="h-16 px-5 border-b border-border flex items-center justify-between bg-muted/10 flex-shrink-0 relative">
                <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-primary/20 shadow-[0_0_10px_rgba(0,255,135,0.4)]" />
                <div className="flex items-center gap-2.5">
                  <FileCheck className="w-5 h-5 text-primary animate-pulse" />
                  <div>
                    <h3 className="text-[10px] font-black text-foreground uppercase tracking-widest">Upload MRV Report</h3>
                    <p className="text-[7px] text-muted-foreground font-bold mt-1 uppercase">Initiative: {selectedProject?.title}</p>
                  </div>
                </div>
                <button onClick={() => setIsMRVOpen(false)} className="p-1 hover:bg-muted text-muted-foreground border border-border">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form */}
              <form onSubmit={handleAddMRVReport} className="flex-1 overflow-y-auto p-5 space-y-4 uppercase font-bold tracking-wider">
                <div className="space-y-1">
                  <label className="text-[8px] text-muted-foreground block pl-0.5">Verification Auditor Agency</label>
                  <input 
                    type="text" 
                    value={auditor} 
                    onChange={e => setAuditor(e.target.value)}
                    placeholder="e.g. SGS India Climate Services"
                    required
                    className="w-full h-9 border border-border bg-background px-3 text-[9px] outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] text-muted-foreground block pl-0.5">Cryptographic PDF Filename</label>
                  <input 
                    type="text" 
                    value={pdfName} 
                    onChange={e => setPdfName(e.target.value)}
                    placeholder="e.g. mrv_inspection_karnal_v2.pdf"
                    required
                    className="w-full h-9 border border-border bg-background px-3 text-[9px] outline-none focus:border-primary/50 text-foreground"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[8px] text-muted-foreground block pl-0.5">MRV Compliance Status</label>
                  <select 
                    value={mrvStatus}
                    onChange={e => setMrvStatus(e.target.value as any)}
                    className="w-full h-9 border border-border bg-background px-3 text-[9px] outline-none focus:border-primary/50 font-bold text-foreground"
                  >
                    <option value="Verified">Verified Compliant (Green)</option>
                    <option value="Flagged">Flagged Discrepancy (Red)</option>
                  </select>
                </div>
              </form>

              {/* Footer */}
              <div className="h-16 px-5 border-t border-border bg-card flex items-center justify-end gap-3 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => setIsMRVOpen(false)}
                  className="px-4 h-9 border border-border text-[9px] font-black uppercase hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMRVReport}
                  className="cyber-button-primary h-9 px-4 text-[9px]"
                >
                  <Check className="w-4 h-4 text-primary-foreground" />
                  <span>Submit Audit Report</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};
export type { CarbonProjectPhase };
