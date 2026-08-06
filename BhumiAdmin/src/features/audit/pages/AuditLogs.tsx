import React, { useState } from 'react';
import { ClipboardList, RefreshCw, AlertCircle, Loader2, ShieldCheck, Globe, Filter } from 'lucide-react';
import { motion } from 'framer-motion';
import { PageHeader } from '../../../components/ui/PageHeader';
import { StatusBadge } from '../../../components/ui/StatusBadge';
import { KpiCard } from '../../../components/ui/KpiCard';
import { EmptyState } from '../../../components/ui/EmptyState';
import { useAuditLogs, useGatewayLogs } from '../api/useAuditLogs';

type TabType = 'security' | 'gateway';

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'medium' });
  } catch {
    return String(iso);
  }
};

export const AuditLogs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('security');
  const [page, setPage] = useState(1);

  const auditQuery = useAuditLogs(page, 50);
  const gatewayQuery = useGatewayLogs(page, 50);

  const isLoading = activeTab === 'security' ? auditQuery.isLoading : gatewayQuery.isLoading;
  const isError   = activeTab === 'security' ? auditQuery.isError   : gatewayQuery.isError;
  const refetch   = activeTab === 'security' ? auditQuery.refetch   : gatewayQuery.refetch;

  const securityLogs = auditQuery.data?.data ?? [];
  const gatewayLogs  = gatewayQuery.data?.data ?? [];
  const total  = activeTab === 'security' ? (auditQuery.data?.total ?? 0)  : (gatewayQuery.data?.total ?? 0);
  const pages  = activeTab === 'security' ? (auditQuery.data?.pages ?? 1)  : (gatewayQuery.data?.pages ?? 1);

  // KPI counts from security logs
  const successCount = securityLogs.filter(l => l?.success === true).length;
  const failCount    = securityLogs.filter(l => l?.success === false).length;

  return (
    <div className="space-y-5 page-enter">
      <PageHeader
        title="System Audit Logs"
        description="Immutable record of all administrative actions, data mutations, and security events."
        icon={ClipboardList}
        actions={
          <button className="btn btn-secondary btn-sm gap-1.5" onClick={() => refetch()}>
            <RefreshCw size={13} /> Refresh
          </button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <KpiCard title="Total Events" value={total} icon={ClipboardList} iconBg="#EEF2FF" iconColor="#6366F1" />
        <KpiCard title="Successful Actions" value={successCount} icon={ShieldCheck} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="Failed Actions" value={failCount} icon={AlertCircle} iconBg="#FEF2F2" iconColor="#EF4444" />
        <KpiCard title="Total Pages" value={pages} icon={Filter} iconBg="#FFFBEB" iconColor="#F59E0B" />
      </div>

      {/* Tab Switcher */}
      <div className="flex gap-2">
        {([['security', 'Security Events', ShieldCheck], ['gateway', 'API Gateway Stream', Globe]] as const).map(([key, label, Icon]) => (
          <button
            key={key}
            onClick={() => { setActiveTab(key); setPage(1); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-indigo-600 text-white shadow'
                : 'bg-white text-[#64748B] border border-[#E2E8F0] hover:border-indigo-300'
            }`}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      <div className="ent-card overflow-hidden">
        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-[#64748B]">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Loading audit logs...</span>
          </div>
        )}

        {/* Error */}
        {isError && !isLoading && (
          <div className="flex flex-col items-center justify-center gap-2 py-16 text-red-500">
            <AlertCircle size={24} />
            <p className="text-sm font-medium">Failed to load logs from server</p>
            <button className="btn btn-secondary btn-sm mt-1" onClick={() => refetch()}>Retry</button>
          </div>
        )}

        {/* Security Audit Table */}
        {!isLoading && !isError && activeTab === 'security' && (
          <div className="overflow-x-auto">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Action</th>
                  <th>Actor</th>
                  <th>Actor Type</th>
                  <th>Role</th>
                  <th>IP Address</th>
                  <th>Status</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {securityLogs.length === 0 ? (
                  <tr><td colSpan={7}><EmptyState icon={ClipboardList} title="No audit events found" /></td></tr>
                ) : (
                  securityLogs.map((log, i) => (
                    <motion.tr key={log.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                      <td className="font-medium text-[#0F172A] text-sm">
                        {log.action ? String(log.action).replace(/_/g, ' ') : 'Action'}
                      </td>
                      <td className="text-[#64748B] text-sm font-medium">{log.actor_name || 'System'}</td>
                      <td>
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
                          {log.actor_type || 'admin'}
                        </span>
                      </td>
                      <td className="font-mono text-xs text-[#64748B]">{log.actor_role || '—'}</td>
                      <td className="font-mono text-xs text-[#94A3B8]">{log.ip_address || '—'}</td>
                      <td>
                        <StatusBadge
                          label={log.success ? 'Success' : 'Failed'}
                          variant={log.success ? 'success' : 'danger'}
                          size="sm"
                        />
                      </td>
                      <td className="text-xs text-[#64748B] whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Gateway Stream Table */}
        {!isLoading && !isError && activeTab === 'gateway' && (
          <div className="overflow-x-auto">
            <table className="ent-table">
              <thead>
                <tr>
                  <th>Method</th>
                  <th>Path</th>
                  <th>Status Code</th>
                  <th className="text-right">Response Time</th>
                  <th>Error</th>
                  <th>Timestamp</th>
                </tr>
              </thead>
              <tbody>
                {gatewayLogs.length === 0 ? (
                  <tr><td colSpan={6}><EmptyState icon={Globe} title="No gateway logs found" /></td></tr>
                ) : (
                  gatewayLogs.map((log, i) => (
                    <motion.tr key={log.id || i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs font-mono font-bold ${
                          log.method === 'GET' ? 'bg-blue-50 text-blue-700' :
                          log.method === 'POST' ? 'bg-green-50 text-green-700' :
                          log.method === 'PUT' || log.method === 'PATCH' ? 'bg-orange-50 text-orange-700' :
                          'bg-red-50 text-red-700'
                        }`}>{log.method || 'GET'}</span>
                      </td>
                      <td className="font-mono text-xs text-[#64748B] max-w-[260px] truncate">{log.path || '/'}</td>
                      <td>
                        <span className={`px-2 py-0.5 rounded text-xs font-bold ${
                          (log.status_code ?? 200) < 300 ? 'bg-green-50 text-green-700' :
                          (log.status_code ?? 200) < 400 ? 'bg-yellow-50 text-yellow-700' :
                          'bg-red-50 text-red-700'
                        }`}>{log.status_code ?? 200}</span>
                      </td>
                      <td className="text-right font-mono text-xs text-[#64748B]">{log.response_time_ms ?? 0}ms</td>
                      <td className="text-xs text-red-500 max-w-[150px] truncate">{log.error || '—'}</td>
                      <td className="text-xs text-[#64748B] whitespace-nowrap">{formatDate(log.timestamp)}</td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {!isLoading && !isError && pages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[#F1F5F9]">
            <p className="text-xs text-[#64748B]">Page {page} of {pages} ({total} total logs)</p>
            <div className="flex gap-2">
              <button className="btn btn-secondary btn-sm" disabled={page <= 1} onClick={() => setPage(p => Math.max(1, p - 1))}>Previous</button>
              <button className="btn btn-secondary btn-sm" disabled={page >= pages} onClick={() => setPage(p => p + 1)}>Next</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
