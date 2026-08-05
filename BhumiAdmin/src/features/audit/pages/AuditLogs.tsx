import React from 'react';
import { ClipboardList, Filter } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { Button } from '@mui/material';

const MOCK_LOGS = [
  { id: 'LOG-991', user: 'Admin (Ramesh)', action: 'Approved KYC', target: 'KYC-104', date: '2026-08-05 14:32:01', ip: '192.168.1.1' },
  { id: 'LOG-992', user: 'Finance (Sita)', action: 'Disbursed Payout', target: 'TXN-987', date: '2026-08-05 12:15:44', ip: '10.0.0.45' },
  { id: 'LOG-993', user: 'Super Admin', action: 'Changed Permissions', target: 'Role: Ops Admin', date: '2026-08-04 09:00:12', ip: '172.16.254.1' },
];

export const AuditLogs = () => {
  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="System Audit Logs"
        description="Immutable record of all administrative actions, data mutations, and security events."
        icon={ClipboardList}
        actions={<Button variant="outlined" startIcon={<Filter size={16}/>}>Filter Logs</Button>}
      />

      <div className="ent-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="ent-table">
            <thead>
              <tr>
                <th>Log ID</th>
                <th>Timestamp</th>
                <th>Actor (User)</th>
                <th>Action Performed</th>
                <th>Target Resource</th>
                <th>IP Address</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_LOGS.map((log) => (
                <tr key={log.id}>
                  <td className="font-mono text-xs text-slate-500">{log.id}</td>
                  <td className="text-sm text-slate-600">{log.date}</td>
                  <td className="font-semibold text-slate-800">{log.user}</td>
                  <td className="text-sm text-slate-700 font-medium">{log.action}</td>
                  <td className="text-sm text-slate-500 font-mono">{log.target}</td>
                  <td className="text-xs text-slate-400 font-mono">{log.ip}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
