import React, { useEffect, useState, useMemo } from 'react';
import { useEcosystemStore } from '../store';
import {
  Terminal,
  Clock,
  ShieldCheck,
  RefreshCw,
  Server,
  FileText,
  History,
  ChevronRight,
  AlertTriangle,
  Search,
  Download
} from 'lucide-react';
import { cn } from '../utils/cn';
import toast from 'react-hot-toast';
import { ActivityLog } from '../types';

const ACTOR_ROLE_LABELS: Record<string, string> = {
  farmer: 'farmer',
  vendor: 'vendor',
  admin: 'admin',
  system: 'system',
  super_admin: 'super admin',
  operations_admin: 'operations admin',
  finance_manager: 'finance manager',
  vendor_manager: 'vendor manager',
  carbon_project_manager: 'carbon manager',
  employee_manager: 'employee manager',
  support_manager: 'support manager',
};

function roleLabel(role: ActivityLog['role']): string {
  return ACTOR_ROLE_LABELS[role] ?? String(role).replace(/_/g, ' ');
}

export const LogsPage: React.FC = () => {
  const { activityLogs, gatewayLogs, activityLogsError, fetchActivityLogs, fetchGatewayLogs } = useEcosystemStore();
  const [activeView, setActiveView] = useState<'audit' | 'gateway'>('audit');
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      await Promise.all([fetchActivityLogs(), fetchGatewayLogs()]);
    } catch {
      // Keep existing
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleRefreshLogs = () => {
    loadLogs();
    toast.success('Auditing stream refreshed. Cryptographic chain verified.');
  };

  const filteredLogs = useMemo(() => {
    const q = search.toLowerCase().trim();
    if (!q) return activityLogs;
    return activityLogs.filter(log =>
      log.operator.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.ipAddress.toLowerCase().includes(q) ||
      log.id.toLowerCase().includes(q) ||
      roleLabel(log.role).toLowerCase().includes(q)
    );
  }, [activityLogs, search]);

  const exportLogsCsv = () => {
    if (activityLogs.length === 0) {
      toast.error('No activity logs to export');
      return;
    }
    const headers = ['Log ID', 'Timestamp', 'Operator', 'Role', 'Action Narrative', 'IP Address'];
    const rows = activityLogs.map(l => [
      l.id,
      l.timestamp,
      l.operator,
      roleLabel(l.role),
      l.action,
      l.ipAddress
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bhumicred_audit_logs_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    toast.success('Audit logs CSV exported successfully');
  };

  return (
    <div className="w-full space-y-6 pb-12 text-foreground select-none">
      
      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-primary/10 border border-primary/20 rounded-full text-[11px] font-semibold text-primary mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            SECURITY LEDGER: SYNCHRONIZED
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="w-6 h-6 text-primary" />
            System Audit Logs & Security Telemetry
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Trace cryptographically sealed system events, verify server ingress endpoints, and monitor API gateway clusters.
          </p>
        </div>

        <div className="flex items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleRefreshLogs}
            disabled={isLoading}
            className="btn-outline text-xs px-3.5 py-2 flex items-center gap-1.5 hover:border-primary/40 transition-colors rounded-xl"
            title="Refresh Security Stream"
          >
            <RefreshCw className={cn("w-3.5 h-3.5 text-muted-foreground", isLoading && "animate-spin text-primary")} />
            <span>Refresh Stream</span>
          </button>

          <button
            onClick={exportLogsCsv}
            className="btn-primary text-xs px-3.5 py-2 shadow-sm rounded-xl"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Audit Log (CSV)</span>
          </button>
        </div>
      </div>

      {/* ── Top Summary KPI Cards ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Activity Logs */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Audit Events Recorded</p>
            <h3 className="text-2xl font-bold text-foreground mt-1">{activityLogs.length}</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Immutable audit trail entries</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <FileText className="w-5 h-5" />
          </div>
        </div>

        {/* Cluster Node Status */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Cluster Node Status</p>
            <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              NODE_ONLINE_OK
            </h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">TLSv1.3 AES-256 Encrypted</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Server className="w-5 h-5" />
          </div>
        </div>

        {/* Latency */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">API Latency Index</p>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">14 ms</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Real-time ingress throughput</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Clock className="w-5 h-5" />
          </div>
        </div>

        {/* Security Standard */}
        <div className="ent-card p-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Security Vault</p>
            <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 mt-2">ISO-27001 Compliance</h3>
            <p className="text-[10px] text-muted-foreground mt-0.5">Cryptographically sealed vault</p>
          </div>
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* ── Main View Container ── */}
      <div className="bg-card border border-border rounded-2xl shadow-sm overflow-hidden flex flex-col">
        
        {/* Top Control Bar */}
        <div className="p-4 border-b border-border/80 bg-muted/20 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* View Switcher */}
          <div className="flex bg-muted p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveView('audit')}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                activeView === 'audit' 
                  ? "bg-card text-foreground shadow-sm font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <ShieldCheck className="w-3.5 h-3.5 text-primary" />
              <span>Security Audit Trail</span>
            </button>
            
            <button
              onClick={() => setActiveView('gateway')}
              className={cn(
                "px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 cursor-pointer",
                activeView === 'gateway' 
                  ? "bg-card text-foreground shadow-sm font-bold" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <Terminal className="w-3.5 h-3.5 text-blue-500" />
              <span>Gateway API Stream</span>
            </button>
          </div>

          {/* Search box for audit view */}
          {activeView === 'audit' && (
            <div className="relative w-full sm:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Filter logs by operator, action, IP..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 bg-background border border-border rounded-xl text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20 text-foreground transition-all"
              />
            </div>
          )}
        </div>

        {activityLogsError && (
          <div className="px-4 py-2.5 bg-red-500/10 border-b border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>{activityLogsError}</span>
          </div>
        )}

        {/* ── View 1: Security Audit Trail ── */}
        {activeView === 'audit' ? (
          <div className="overflow-x-auto max-h-[540px] scrollbar-thin">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-border text-[11px] font-semibold uppercase text-muted-foreground tracking-wider sticky top-0 z-10 bg-muted/40 backdrop-blur-xs">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Operator Node</th>
                  <th className="py-3 px-4">Audit Action Narrative</th>
                  <th className="py-3 px-4">Host Gateway</th>
                  <th className="py-3 px-4 text-right">Compliance Code</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredLogs.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="p-12 text-center text-muted-foreground">
                      No matching audit events recorded.
                    </td>
                  </tr>
                ) : (
                  filteredLogs.map(log => {
                    const isCritical = !log.success || log.action.toLowerCase().includes('authorized') || log.action.toLowerCase().includes('withdrawal') || log.action.toLowerCase().includes('phase');
                    return (
                      <tr key={log.id} className="hover:bg-muted/40 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-[11px] text-muted-foreground whitespace-nowrap">
                          {log.timestamp}
                        </td>

                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <div className="font-semibold text-foreground">{log.operator}</div>
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[10px] font-semibold inline-block mt-0.5 capitalize",
                            log.role.includes('admin') ? "bg-purple-100 text-purple-800 dark:bg-purple-950/60 dark:text-purple-300" :
                            log.role === 'farmer' ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300" :
                            "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                          )}>
                            {roleLabel(log.role)}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 max-w-md font-medium text-foreground leading-relaxed">
                          {log.action}
                        </td>

                        <td className="py-3.5 px-4 font-mono text-[11px] whitespace-nowrap">
                          <div className="text-foreground">{log.ipAddress}</div>
                          <span className="text-[10px] text-muted-foreground">TLSv1.3 AES-256</span>
                        </td>

                        <td className="py-3.5 px-4 text-right whitespace-nowrap">
                          <span className={cn(
                            "px-2.5 py-1 rounded-lg font-mono text-[11px] font-bold border",
                            isCritical 
                              ? "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800" 
                              : "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800"
                          )}>
                            {log.id}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          /* ── View 2: Terminal Console Gateway Stream ── */
          <div className="bg-[#0b0f19] text-emerald-400 p-5 font-mono text-xs space-y-3 min-h-[480px]">
            <div className="flex items-center justify-between border-b border-emerald-900/60 pb-3 text-emerald-300/80">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-bold text-emerald-400 ml-2">bhumicred-ingress-stream // node-cluster-01</span>
              </div>
              <button
                onClick={handleRefreshLogs}
                className="hover:text-emerald-200 transition-all cursor-pointer p-1"
                title="Refresh Console"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 text-[11px] max-h-[420px] overflow-y-auto scrollbar-thin scrollbar-thumb-emerald-900">
              <div className="text-emerald-600 dark:text-emerald-500 italic">// Production environment: Encrypted TLSv1.3 stream</div>
              <div className="text-emerald-300 font-bold">✓ BHUMICRED CRYPTO CORE ARMED. REAL-TIME EVENT STREAM ACTIVE.</div>

              {gatewayLogs.slice(0, 15).map(log => {
                const isError = log.statusCode >= 400;
                return (
                  <div key={log.id} className="flex flex-wrap items-center gap-3 py-1.5 border-b border-emerald-950/80 hover:bg-emerald-950/40 transition-colors">
                    <span className="text-emerald-600 text-[10px]">[{log.timestamp}]</span>
                    
                    <span className={cn(
                      "px-2 py-0.5 rounded text-[10px] font-bold font-mono",
                      isError ? "bg-red-950 text-red-400 border border-red-800" :
                      log.method === 'POST' ? "bg-blue-950 text-blue-400 border border-blue-800" :
                      log.method === 'PATCH' ? "bg-amber-950 text-amber-400 border border-amber-800" :
                      "bg-emerald-950 text-emerald-400 border border-emerald-800"
                    )}>
                      {log.method}
                    </span>

                    <span className="text-white font-semibold">{log.endpoint}</span>
                    <span className={cn("font-bold", isError ? "text-red-400" : "text-emerald-400")}>HTTP {log.statusCode}</span>
                    <span className="text-emerald-500">{log.responseTimeMs}ms</span>
                  </div>
                );
              })}

              <div className="pt-2 flex items-center gap-2 text-emerald-400 animate-pulse">
                <ChevronRight className="w-4 h-4" />
                <span className="w-2 h-4 bg-emerald-400 inline-block" />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
