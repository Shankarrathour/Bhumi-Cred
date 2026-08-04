import React, { useState, useEffect } from 'react';
import { useEcosystemStore, useAuthStore } from '../store';
import { SupportTicket, TicketStatus } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import toast from 'react-hot-toast';
import { 
  User, 
  ChevronRight, 
  Send, 
  Search,
  X,
  MessageSquare,
  Clock,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { cn } from '../utils/cn';

export const SupportPage: React.FC = () => {
  const { supportTickets, fetchSupportTickets, addTicketResponse, updateTicketStatus } = useEcosystemStore();
  const { user } = useAuthStore();

  const [isLoading, setIsLoading] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      await fetchSupportTickets();
    } catch {
      // Keep existing
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const [activeTab, setActiveTab] = useState<'Open' | 'In Progress' | 'Resolved'>('Open');
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [replyText, setReplyText] = useState('');
  const [search, setSearch] = useState('');

  const filteredTickets = supportTickets.filter(t => {
    if (activeTab === 'Open' && t.status !== 'Open') return false;
    if (activeTab === 'In Progress' && t.status !== 'In Progress') return false;
    if (activeTab === 'Resolved' && t.status !== 'Resolved') return false;

    const query = search.toLowerCase().trim();
    if (!query) return true;

    return (
      t.subject.toLowerCase().includes(query) ||
      t.userName.toLowerCase().includes(query) ||
      t.id.toLowerCase().includes(query) ||
      t.userType.toLowerCase().includes(query)
    );
  });

  const handleAddResponse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTicket || !replyText.trim()) return;

    addTicketResponse(
      selectedTicket.id,
      user?.name || 'Support Admin',
      replyText.trim()
    );

    toast.success('Reply appended to support thread.');
    setReplyText('');

    const updated = useEcosystemStore.getState().supportTickets.find(t => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  const changeStatus = (status: TicketStatus) => {
    if (!selectedTicket) return;
    updateTicketStatus(selectedTicket.id, status);
    toast.success(`Ticket status updated to ${status}`);
    
    const updated = useEcosystemStore.getState().supportTickets.find(t => t.id === selectedTicket.id);
    if (updated) setSelectedTicket(updated);
  };

  // Metrics
  const openCount = supportTickets.filter(t => t.status === 'Open').length;
  const inProgressCount = supportTickets.filter(t => t.status === 'In Progress').length;
  const resolvedCount = supportTickets.filter(t => t.status === 'Resolved').length;

  return (
    <div className="w-full space-y-6 pb-12 text-foreground select-none">
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            SUPPORT DESK CRM: ACTIVE
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MessageSquare className="w-6 h-6 text-primary" />
            Support Desk & Case CRM
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Resolve citizen complaints, manage vendor inquiries, and audit support escalations.
          </p>
        </div>

        <button
          onClick={loadData}
          disabled={isLoading}
          className="btn-outline text-xs px-3.5 py-2 flex items-center gap-1.5 self-start md:self-auto hover:border-primary/40 transition-colors rounded-xl"
        >
          <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isLoading && "animate-spin text-primary")} />
          <span>Refresh Desk</span>
        </button>
      </div>

      {/* ── Top Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Open Tickets</p>
            <h3 className="text-2xl font-bold text-amber-600 dark:text-amber-400 mt-1">{openCount}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Awaiting initial admin response</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400">
            <AlertCircle className="w-5 h-5" />
          </div>
        </div>

        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">In Progress</p>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{inProgressCount}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Active thread correspondence</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Resolved Cases</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-1">{resolvedCount}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Successfully closed tickets</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Main Work Area ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Tickets Queue (7 cols) */}
        <div className="lg:col-span-7 bg-card border border-border rounded-2xl flex flex-col overflow-hidden shadow-sm min-h-[520px]">
          
          {/* Header Bar & Search */}
          <div className="p-4 border-b border-border/80 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between gap-2">
              <div className="flex bg-muted p-1 rounded-xl">
                {(['Open', 'In Progress', 'Resolved'] as const).map(tab => {
                  const count = tab === 'Open' ? openCount : tab === 'In Progress' ? inProgressCount : resolvedCount;
                  return (
                    <button
                      key={tab}
                      onClick={() => {
                        setActiveTab(tab);
                        setSelectedTicket(null);
                      }}
                      className={cn(
                        "px-3 py-1.5 text-xs font-semibold rounded-lg transition-all",
                        activeTab === tab 
                          ? "bg-card text-foreground shadow-sm font-bold" 
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab} ({count})
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search ticket subject, ID, user name..."
                className="w-full pl-9 pr-4 py-2 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground transition-all"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button
                  onClick={() => setSearch('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* List Content */}
          <div className="flex-1 overflow-y-auto divide-y divide-border/60 max-h-[480px] scrollbar-thin">
            {filteredTickets.length === 0 ? (
              <div className="text-center py-20 text-muted-foreground px-4">
                <HelpCircle className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-medium">No support tickets found in "{activeTab}"</p>
              </div>
            ) : (
              filteredTickets.map(ticket => {
                const isSelected = selectedTicket?.id === ticket.id;
                return (
                  <div
                    key={ticket.id}
                    onClick={() => setSelectedTicket(ticket)}
                    className={cn(
                      "p-4 hover:bg-muted/40 cursor-pointer transition-all flex items-center justify-between gap-3 border-l-4",
                      isSelected ? "border-l-primary bg-primary/5 shadow-2xs" : "border-l-transparent"
                    )}
                  >
                    <div className="flex items-center gap-3.5 min-w-0 flex-1">
                      <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold text-xs shrink-0">
                        {ticket.userName.charAt(0).toUpperCase()}
                      </div>

                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-[11px] font-semibold text-muted-foreground">{ticket.id}</span>
                          <span className={cn(
                            "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                            ticket.priority === 'Critical' ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" :
                            ticket.priority === 'High' ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" :
                            "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                          )}>
                            {ticket.priority}
                          </span>
                          <span className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground">
                            {ticket.userType}
                          </span>
                        </div>

                        <h4 className="text-xs font-bold text-foreground truncate">{ticket.subject}</h4>

                        <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1 font-medium text-foreground">
                            <User className="w-3.5 h-3.5 text-muted-foreground" />
                            {ticket.userName}
                          </span>
                          <span>•</span>
                          <span>{ticket.createdDate}</span>
                        </div>
                      </div>
                    </div>

                    <ChevronRight className={cn("w-4 h-4 text-muted-foreground transition-transform shrink-0", isSelected && "translate-x-0.5 text-primary")} />
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Ticket Details & Thread (5 cols) */}
        <div className="lg:col-span-5 bg-card border border-border rounded-2xl shadow-sm overflow-hidden min-h-[520px] flex flex-col relative">
          <AnimatePresence mode="wait">
            {selectedTicket ? (
              <motion.div
                key={selectedTicket.id}
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col justify-between"
              >
                {/* Header */}
                <div className="p-4 border-b border-border bg-muted/20 flex items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-bold text-primary">{selectedTicket.id}</span>
                      <span className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] font-semibold",
                        selectedTicket.priority === 'Critical' ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" :
                        selectedTicket.priority === 'High' ? "bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-300" :
                        "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      )}>
                        {selectedTicket.priority}
                      </span>
                    </div>
                    <h3 className="text-xs font-bold text-foreground mt-1 line-clamp-1">{selectedTicket.subject}</h3>
                  </div>

                  <button
                    onClick={() => setSelectedTicket(null)}
                    className="p-1.5 rounded-lg border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body Details */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[380px] scrollbar-thin">
                  {/* User Profile Card */}
                  <div className="bg-background border border-border rounded-xl p-3.5 space-y-1.5 text-xs">
                    <div className="flex items-center gap-1.5 text-primary font-semibold border-b border-border/60 pb-1.5 mb-2">
                      <UserCheck className="w-4 h-4" />
                      Requester Info
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User Name:</span>
                      <span className="font-medium text-foreground">{selectedTicket.userName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">User Type:</span>
                      <span className="font-medium text-foreground">{selectedTicket.userType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date Logged:</span>
                      <span className="font-medium text-foreground">{selectedTicket.createdDate}</span>
                    </div>
                  </div>

                  {/* Citizen Message */}
                  <div className="bg-primary/5 border border-primary/20 rounded-xl p-3.5 space-y-1 text-xs">
                    <span className="text-[11px] font-semibold text-primary block">Citizen / Merchant Inquiry:</span>
                    <p className="text-foreground leading-relaxed font-medium">"{selectedTicket.message}"</p>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => changeStatus('In Progress')}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                        selectedTicket.status === 'In Progress' 
                          ? "bg-blue-600 text-white border-blue-600 shadow-sm" 
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <Clock className="w-3.5 h-3.5" /> Mark In Progress
                    </button>
                    <button
                      onClick={() => changeStatus('Resolved')}
                      className={cn(
                        "py-2 px-3 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                        selectedTicket.status === 'Resolved' 
                          ? "bg-emerald-600 text-white border-emerald-600 shadow-sm" 
                          : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                      )}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" /> Resolve Case
                    </button>
                  </div>

                  {/* Thread History */}
                  <div className="space-y-2 pt-2 border-t border-border">
                    <span className="text-[11px] font-semibold text-muted-foreground block">Correspondence Audit Thread ({selectedTicket.responses.length})</span>
                    
                    {selectedTicket.responses.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-2">No response replies recorded yet.</p>
                    ) : (
                      selectedTicket.responses.map((resp, idx) => (
                        <div key={idx} className="bg-background border border-border rounded-xl p-3 text-xs space-y-1">
                          <div className="flex justify-between items-center border-b border-border/50 pb-1 text-[11px]">
                            <span className="font-semibold text-primary">{resp.sender}</span>
                            <span className="text-muted-foreground">{resp.date}</span>
                          </div>
                          <p className="text-foreground leading-relaxed mt-1">{resp.message}</p>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Footer Reply Form */}
                <form onSubmit={handleAddResponse} className="p-3 border-t border-border bg-muted/20 flex items-center gap-2">
                  <input
                    required
                    type="text"
                    placeholder="Type support reply..."
                    className="flex-1 py-2 px-3.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground transition-all"
                    value={replyText}
                    onChange={e => setReplyText(e.target.value)}
                  />
                  <button
                    type="submit"
                    className="h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </motion.div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3">
                  <HelpCircle className="w-6 h-6" />
                </div>
                <h4 className="text-xs font-bold text-foreground">No Ticket Selected</h4>
                <p className="text-xs text-muted-foreground mt-1 max-w-[200px]">Select an active support ticket from the list to manage replies and status.</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
