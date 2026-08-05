import React from 'react';
import { BarChart3, Download, TrendingUp, Users, CloudRain } from 'lucide-react';
import { PageHeader } from '../../../components/ui/PageHeader';
import { KpiCard } from '../../../components/ui/KpiCard';
import { Button } from '@mui/material';

export const ReportsDashboard = () => {
  return (
    <div className="space-y-6 page-enter">
      <PageHeader
        title="Reports & Analytics"
        description="Exportable data insights covering user growth, financials, and carbon sequestration."
        icon={BarChart3}
        actions={<Button variant="outlined" startIcon={<Download size={16}/>}>Export PDF Report</Button>}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <KpiCard title="YTD Carbon Sequestered" value="124.5K tCO₂e" icon={TrendingUp} iconBg="#F0FDF4" iconColor="#16A34A" />
        <KpiCard title="New Farmer Onboardings" value="4,521" icon={Users} iconBg="#EFF6FF" iconColor="#2563EB" />
        <KpiCard title="Total Payouts Disbursed" value="₹45.2L" icon={CloudRain} iconBg="#F5F3FF" iconColor="#8B5CF6" />
      </div>

      <div className="ent-card p-6 flex flex-col items-center justify-center text-center space-y-4 min-h-[300px]">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center">
          <BarChart3 size={32} className="text-slate-400" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800">Advanced Analytics Module</h3>
        <p className="text-slate-500 max-w-md">Detailed cross-module charting and scheduled report generation will be integrated with our upcoming Looker/Tableau BI instance.</p>
        <Button variant="contained" color="primary">Connect BI Tool</Button>
      </div>
    </div>
  );
};
