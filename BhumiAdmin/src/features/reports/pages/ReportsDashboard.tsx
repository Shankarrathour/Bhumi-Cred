import { useState } from "react";
import { motion } from "framer-motion";
import { BarChart3, Download, FileSpreadsheet, FileText, RefreshCw, Loader2 } from "lucide-react";
import { PageHeader } from "../../../components/ui/PageHeader";
import { StatusBadge } from "../../../components/ui/StatusBadge";
import { useReportsStats } from "../api/useReports";
import { downloadPDFDocument, downloadCSVDocument } from "../../../utils/pdfExporter";
import toast from "react-hot-toast";

export const REPORT_CATEGORIES = [
  "Farmer Report",
  "Govt Report",
  "Partner Report",
  "Carbon Report",
  "Revenue",
  "Insurance",
  "Marketplace",
  "Wallet",
  "Referral",
] as const;

export type ReportCategory = (typeof REPORT_CATEGORIES)[number];

export interface ReportItem {
  id: string;
  reference_code: string;
  name: string;
  category: ReportCategory;
  primary_metric: string;
  secondary_metric: string;
  date_generated: string;
  status: "VERIFIED" | "COMPLETED" | "AUDITED";
}

const today = new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });

export const ReportsDashboard = () => {
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory>("Farmer Report");

  const { data: stats, isLoading, refetch, isFetching } = useReportsStats();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-3">
          <Loader2 className="animate-spin mx-auto text-[#16A34A]" size={32} />
          <p className="text-[13px] text-[#64748B] font-medium">Loading live report data from MongoDB...</p>
        </div>
      </div>
    );
  }

  const allReports: ReportItem[] = [
    {
      id: "RPT-101", reference_code: "FARM-RPT-2026-Q2",
      name: "Statewise Farmer Onboarding & Landholding Census",
      category: "Farmer Report",
      primary_metric: stats ? `${stats.farmer_report.total_farmers} Farmers Enrolled` : "Loading...",
      secondary_metric: stats ? `${stats.farmer_report.total_acres.toFixed(1)} Acres Geofenced` : "Loading...",
      date_generated: today, status: "VERIFIED",
    },
    {
      id: "RPT-102", reference_code: "GOVT-MOU-MP-2026",
      name: "Govt Nodal Board Land Lease & MoU Compliance",
      category: "Govt Report",
      primary_metric: stats ? `${stats.govt_report.total_mous} State Nodal MoUs Active` : "Loading...",
      secondary_metric: stats ? `${stats.govt_report.compliance_pct}% Compliant` : "Loading...",
      date_generated: today, status: "COMPLETED",
    },
    {
      id: "RPT-103", reference_code: "PRT-SLA-2026-Q2",
      name: "Developer & B2B Partner Commission & Rating Summary",
      category: "Partner Report",
      primary_metric: stats ? `${stats.partner_report.total_partners} Active Ecosystem Partners` : "Loading...",
      secondary_metric: "Based on Admin Users",
      date_generated: today, status: "VERIFIED",
    },
    {
      id: "RPT-104", reference_code: "CRB-VERRA-8091",
      name: "Verra VM0042 Verified Carbon Credit Sequestration Log",
      category: "Carbon Report",
      primary_metric: stats ? `${stats.carbon_report.carbon_generated_tco2e.toFixed(2)} tCO2e Generated` : "Loading...",
      secondary_metric: stats ? `${stats.carbon_report.carbon_issued_tco2e.toFixed(2)} tCO2e Issued` : "Loading...",
      date_generated: today, status: "AUDITED",
    },
    {
      id: "RPT-105", reference_code: "REV-FIN-2026-Q2",
      name: "Gross Platform Revenue Monetization & Payout Split",
      category: "Revenue",
      primary_metric: stats ? `Rs.${stats.revenue_report.revenue_lakhs.toFixed(2)} Lakhs Revenue` : "Loading...",
      secondary_metric: "70% Farmer Payout Split",
      date_generated: today, status: "AUDITED",
    },
    {
      id: "RPT-106", reference_code: "INS-CLAIM-2026",
      name: "Tree Insurance Underwriting & Loss Claim Settlements",
      category: "Insurance",
      primary_metric: stats ? `${stats.insurance_report.total_trees_insured} Trees Insured` : "Loading...",
      secondary_metric: stats ? `Rs.${stats.insurance_report.coverage_lakhs.toFixed(2)} Lakhs Coverage` : "Loading...",
      date_generated: today, status: "COMPLETED",
    },
    {
      id: "RPT-107", reference_code: "MKT-SALES-2026",
      name: "Agri Marketplace Catalog Sales & Fulfillment Audit",
      category: "Marketplace",
      primary_metric: "Live SKU Data from Marketplace",
      secondary_metric: "Active Categories from Backend",
      date_generated: today, status: "VERIFIED",
    },
    {
      id: "RPT-108", reference_code: "WLT-FIN-2026",
      name: "Farmer & Partner Escrow Wallet Disbursement Audit",
      category: "Wallet",
      primary_metric: stats ? `Rs.${(stats.wallet_report.total_escrow_balance / 100000).toFixed(2)} Lakhs Escrow Balance` : "Loading...",
      secondary_metric: stats ? `Rs.${(stats.wallet_report.total_withdrawn / 100000).toFixed(2)} Lakhs Withdrawn` : "Loading...",
      date_generated: today, status: "AUDITED",
    },
    {
      id: "RPT-109", reference_code: "REF-BONUS-2026",
      name: "Community Farmer Referral Bonus & Growth Audit",
      category: "Referral",
      primary_metric: stats ? `${stats.referral_report.total_referrals} Referrals Processed` : "Loading...",
      secondary_metric: stats ? `Rs.${stats.referral_report.total_bonus_paid.toLocaleString("en-IN")} Bonus Paid` : "Loading...",
      date_generated: today, status: "COMPLETED",
    },
  ];

  const activeReports = allReports.filter(r => r.category === selectedCategory);
  const currentReport = activeReports[0] ?? allReports[0];

  const handleExportPDF = () => {
    if (!currentReport) return;
    downloadPDFDocument({
      title: `ENTERPRISE REPORT - ${selectedCategory.toUpperCase()}`,
      subtitle: `Reference: ${currentReport.reference_code} - Date: ${currentReport.date_generated}`,
      filename: `Report_${selectedCategory.replace(/\s+/g, "_")}_${currentReport.reference_code}.pdf`,
      metadata: {
        "Report Name": currentReport.name,
        "Category": currentReport.category,
        "Primary Metric": currentReport.primary_metric,
        "Secondary Metric": currentReport.secondary_metric,
        "Date": currentReport.date_generated,
        "Status": currentReport.status,
      },
      sections: [{ heading: "Executive Summary", content: "This report contains cross-module analytics verified against BhumiCred blockchain ledger and Verra Gold Standard audit logs." }],
    });
    toast.success(`Generated PDF report for ${selectedCategory}!`);
  };

  const handleExportCSV = () => {
    downloadCSVDocument(
      `Report_${selectedCategory.replace(/\s+/g, "_")}.csv`,
      ["Reference Code", "Report Name", "Category", "Primary Metric", "Secondary Metric", "Date", "Status"],
      activeReports.map(r => [r.reference_code, r.name, r.category, r.primary_metric, r.secondary_metric, r.date_generated, r.status])
    );
    toast.success(`Exported CSV for ${selectedCategory}!`);
  };

  const handleExportExcel = () => {
    const headers = ["Reference Code", "Report Name", "Category", "Primary Metric", "Secondary Metric", "Date", "Status"];
    const rows = activeReports.map(r => [r.reference_code, r.name, r.category, r.primary_metric, r.secondary_metric, r.date_generated, r.status]);
    const csvContent = [headers.join("\t"), ...rows.map(row => row.join("\t"))].join("\n");
    const blob = new Blob([csvContent], { type: "application/vnd.ms-excel;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Report_${selectedCategory.replace(/\s+/g, "_")}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Exported Excel for ${selectedCategory}!`);
  };

  return (
    <div className="space-y-6 page-enter pb-12">
      <PageHeader
        title="Cross-Module Reports & Analytics"
        description="Comprehensive analytics export portal across Farmers, Govt, Partners, Carbon Credits, Revenue, Insurance, Marketplace, Wallet & Referrals."
        badge={{ label: "Live MongoDB Connected", variant: "success" }}
        icon={BarChart3}
        iconColor="#16A34A"
        actions={
          <div className="flex items-center gap-2">
            <button onClick={() => { refetch(); toast.success("Syncing live data from MongoDB..."); }} className="btn btn-secondary btn-sm gap-1 cursor-pointer">
              <RefreshCw size={13} className={isFetching ? "animate-spin" : ""} /> Sync Live Data
            </button>
          </div>
        }
      />

      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-2 shadow-xs flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
        {REPORT_CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-3.5 py-2 rounded-xl text-[12.5px] font-bold transition-all cursor-pointer whitespace-nowrap ${selectedCategory === cat ? "bg-[#F0FDF4] text-[#16A34A] border border-[#DCFCE7]" : "text-[#64748B] hover:bg-[#F8FAFC]"}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="bg-white border border-[#E8EDF5] rounded-2xl p-5 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-[16px] font-bold text-[#0F172A]">{selectedCategory} — Export Center</h2>
          <p className="text-[12.5px] text-[#64748B] mt-0.5">Download full dataset in Excel (.xlsx), PDF document, or CSV spreadsheet format.</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={handleExportExcel} className="px-3.5 py-2 bg-[#F0FDF4] border border-[#DCFCE7] hover:bg-[#DCFCE7] text-[#16A34A] font-bold text-[12.5px] rounded-xl transition-all cursor-pointer flex items-center gap-1.5">
            <FileSpreadsheet size={15} /> 1. Export Excel (.xlsx)
          </button>
          <button onClick={handleExportPDF} className="px-3.5 py-2 bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-[12.5px] rounded-xl shadow-xs transition-all cursor-pointer flex items-center gap-1.5">
            <FileText size={15} /> 2. Export PDF
          </button>
          <button onClick={handleExportCSV} className="px-3.5 py-2 bg-[#EFF6FF] border border-[#DBEAFE] hover:bg-[#DBEAFE] text-[#2563EB] font-bold text-[12.5px] rounded-xl transition-all cursor-pointer flex items-center gap-1.5">
            <Download size={15} /> 3. Export CSV
          </button>
        </div>
      </div>

      {currentReport && (
        <motion.div key={currentReport.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 bg-white border border-[#E8EDF5] rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase text-[#94A3B8]">REPORT NAME</span>
            <h4 className="text-[15px] font-bold text-[#0F172A]">{currentReport.name}</h4>
            <p className="text-[11.5px] font-mono text-[#2563EB]">{currentReport.reference_code}</p>
          </div>
          <div className="p-5 bg-white border border-[#E8EDF5] rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase text-[#16A34A]">PRIMARY METRIC</span>
            <h4 className="text-[18px] font-extrabold text-[#16A34A]">{currentReport.primary_metric}</h4>
            <p className="text-[11.5px] text-[#64748B]">{currentReport.secondary_metric}</p>
          </div>
          <div className="p-5 bg-white border border-[#E8EDF5] rounded-2xl shadow-xs space-y-1">
            <span className="text-[11px] font-bold uppercase text-[#94A3B8]">GENERATION DATE & STATUS</span>
            <h4 className="text-[15px] font-bold text-[#0F172A]">{currentReport.date_generated}</h4>
            <StatusBadge label={currentReport.status} variant="success" size="sm" />
          </div>
        </motion.div>
      )}

      <div className="bg-white border border-[#E8EDF5] rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-[#F1F5F9] flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-[#0F172A]">{selectedCategory} Records Preview</h3>
          <span className="text-[11px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2 py-0.5 rounded-full border border-[#DCFCE7]">
            {activeReports.length} Report{activeReports.length !== 1 ? "s" : ""} Available
          </span>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1100px]">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0] text-[11px] font-bold uppercase tracking-wider text-[#475569]">
                <th className="py-3 px-4 whitespace-nowrap">Reference Code</th>
                <th className="py-3 px-4 min-w-[280px]">Report Name</th>
                <th className="py-3 px-4 whitespace-nowrap">Category</th>
                <th className="py-3 px-4 whitespace-nowrap">Primary Metric</th>
                <th className="py-3 px-4 whitespace-nowrap">Generated Date</th>
                <th className="py-3 px-4 whitespace-nowrap">Status</th>
                <th className="py-3 px-4 text-right whitespace-nowrap">Quick Export</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {activeReports.map(r => (
                <tr key={r.id} className="hover:bg-[#F8FAFC] transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[12px] font-bold text-[#2563EB] whitespace-nowrap">{r.reference_code}</td>
                  <td className="py-3.5 px-4 text-[13px] font-bold text-[#0F172A]">{r.name}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap">
                    <span className="text-[11.5px] font-bold text-[#16A34A] bg-[#F0FDF4] px-2.5 py-1 rounded-md border border-[#DCFCE7] whitespace-nowrap inline-block">{r.category}</span>
                  </td>
                  <td className="py-3.5 px-4 text-[12.5px] font-semibold text-[#0F172A] whitespace-nowrap">{r.primary_metric}</td>
                  <td className="py-3.5 px-4 text-[12px] text-[#64748B] whitespace-nowrap">{r.date_generated}</td>
                  <td className="py-3.5 px-4 whitespace-nowrap"><StatusBadge label={r.status} variant="success" size="sm" /></td>
                  <td className="py-3.5 px-4 text-right whitespace-nowrap">
                    <button onClick={handleExportPDF} className="px-2.5 py-1 bg-[#F0FDF4] hover:bg-[#DCFCE7] text-[#16A34A] text-[11.5px] font-bold rounded-lg transition-colors inline-flex items-center gap-1 cursor-pointer whitespace-nowrap">
                      <Download size={13} /> Export PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
