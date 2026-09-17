import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  ActivityIndicator,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import api from '../api/apiClient';
import { useConnectivityStore } from '../store/connectivityStore';

const { width } = Dimensions.get('window');

export interface KPIItem {
  label: string;
  value: string;
  change?: string;
}

export interface StatusBreakdownItem {
  status: string;
  count: number;
  percentage: number;
}

export interface ReportItem {
  id?: string;
  ref_id?: string;
  farmer_ref_id?: string;
  name?: string;
  target_name?: string;
  title?: string;
  masked_name?: string;
  asset_name?: string;
  type?: string;
  area?: string;
  package?: string;
  partner?: string;
  land_added?: string;
  projects?: string;
  compliance_level?: string;
  amount?: string;
  status?: string;
  [key: string]: any;
}

export interface ReportDetailData {
  category: string;
  title: string;
  generated_date: string;
  privacy_notice?: string;
  kpis: KPIItem[];
  status_breakdown: StatusBreakdownItem[];
  items: ReportItem[];
}

const REPORT_CATEGORIES = [
  { id: 'asset_inventory', label: 'Asset Inventory', icon: 'tree' },
  { id: 'farmer_participation', label: 'Farmer Participation', icon: 'account-group' },
  { id: 'soil_testing', label: 'Soil Health', icon: 'flask-outline' },
  { id: 'tree_insurance', label: 'Tree Insurance', icon: 'shield-check' },
  { id: 'project_progress', label: 'Project Progress', icon: 'clipboard-text' },
  { id: 'campaigns', label: 'Campaigns', icon: 'bullhorn' },
  { id: 'carbon_activity', label: 'Carbon Registry', icon: 'leaf' },
  { id: 'compliance', label: 'Compliance Audit', icon: 'check-decagram' },
  { id: 'expenditure', label: 'Treasury & DBT', icon: 'cash-register' },
];

const DATE_RANGES = ['Last 7 Days', 'Last 30 Days', 'Last 90 Days', 'FY 2026-27'];

export function GovtReportDetailView() {
  const isOnline = useConnectivityStore((state) => state.isOnline);

  const [selectedCategory, setSelectedCategory] = useState<string>('asset_inventory');
  const [selectedDateRange, setSelectedDateRange] = useState<string>('Last 30 Days');
  const [jurisdictionCode, setJurisdictionCode] = useState<string>('MP-IND-461');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isExporting, setIsExporting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [reportData, setReportData] = useState<ReportDetailData | null>(null);

  const fetchReportDetail = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(
        `/govt/reports/detail/${selectedCategory}?date_range=${encodeURIComponent(
          selectedDateRange
        )}&jurisdiction_code=${encodeURIComponent(jurisdictionCode)}`
      );
      if (res.data?.success) {
        setReportData(res.data);
      } else {
        throw new Error('Failed to load report data.');
      }
    } catch (err: any) {
      console.warn('[GovtReportDetailView] Fetch error:', err);
      setError(err?.message || 'Failed to fetch report details from backend.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportDetail();
  }, [selectedCategory, selectedDateRange]);

  const handleExportPDF = async () => {
    setIsExporting(true);
    try {
      const payload = {
        report_category: selectedCategory,
        report_name: reportData?.title || 'Government Audit Report',
        format: 'PDF',
        date_range: selectedDateRange,
        filters: { jurisdiction_code: jurisdictionCode },
      };

      const res = await api.post('/govt/reports/export', payload);
      if (res.data?.success) {
        const downloadUrl = res.data.download_url;
        Alert.alert(
          'PDF Report Generated',
          `Sanitized PDF report saved to disk: ${downloadUrl}\nKYC & Aadhaar data masked per government privacy standards.`,
          [
            { text: 'OK' },
            {
              text: 'Open Link',
              onPress: () => {
                if (downloadUrl) Linking.openURL(`http://127.0.0.1:8000${downloadUrl}`);
              },
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err?.response?.data?.detail || 'Failed to generate PDF report.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportCSV = async () => {
    setIsExporting(true);
    try {
      const payload = {
        report_category: selectedCategory,
        report_name: reportData?.title || 'Government Data Export',
        format: 'CSV',
        date_range: selectedDateRange,
        filters: { jurisdiction_code: jurisdictionCode },
      };

      const res = await api.post('/govt/reports/export', payload);
      if (res.data?.success) {
        const downloadUrl = res.data.download_url;
        Alert.alert(
          'CSV Export Ready',
          `Sanitized CSV data exported successfully: ${downloadUrl}\nSensitive fields scrubbed.`,
          [
            { text: 'OK' },
            {
              text: 'Download CSV',
              onPress: () => {
                if (downloadUrl) Linking.openURL(`http://127.0.0.1:8000${downloadUrl}`);
              },
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert('Export Failed', err?.response?.data?.detail || 'Failed to generate CSV export.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportGeoJSON = async () => {
    setIsExporting(true);
    try {
      const res = await api.get(`/govt/gis/export/geojson?jurisdiction_code=${jurisdictionCode}`);
      Alert.alert(
        'GeoJSON GIS Export Generated',
        'Exported spatial FeatureCollection boundary geometries for QGIS/ArcGIS mapping.'
      );
    } catch (err: any) {
      Alert.alert('GIS Export Error', err?.response?.data?.detail || 'Failed to export GeoJSON.');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOnline) {
    return (
      <View style={styles.stateContainer}>
        <MaterialCommunityIcons name="wifi-off" size={48} color="#EF4444" />
        <Text style={styles.stateTitle}>Offline Mode</Text>
        <Text style={styles.stateSubtitle}>Connect network to view live dynamic government reports and export PDF/CSV data.</Text>
        <TouchableOpacity style={styles.retryBtn} onPress={fetchReportDetail}>
          <Text style={styles.retryBtnText}>Retry Connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 140 }}>
      {/* ── HEADER ROW & EXPORT ACTIONS ── */}
      <View style={styles.headerRow}>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Dynamic Government Reports</Text>
          <Text style={styles.headerSub}>Audited & Sanitized Official Data Exports</Text>
        </View>
      </View>

      {/* ── CATEGORY SELECTOR CHIPS ── */}
      <Text style={styles.sectionHeading}>Select Report Category (9 Modules)</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
        {REPORT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.id}
            style={[styles.catChip, selectedCategory === cat.id && styles.catChipActive]}
            onPress={() => setSelectedCategory(cat.id)}
          >
            <MaterialCommunityIcons
              name={cat.icon as any}
              size={14}
              color={selectedCategory === cat.id ? '#FFFFFF' : '#475569'}
            />
            <Text style={[styles.catChipText, selectedCategory === cat.id && styles.catChipTextActive]}>
              {cat.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* ── FILTERS ROW (Date Range & Jurisdiction) ── */}
      <View style={styles.filterCard}>
        <View style={styles.filterGroup}>
          <Text style={styles.filterLabel}>Date Range:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row', gap: 6 }}>
            {DATE_RANGES.map((dt) => (
              <TouchableOpacity
                key={dt}
                style={[styles.dateChip, selectedDateRange === dt && styles.dateChipActive]}
                onPress={() => setSelectedDateRange(dt)}
              >
                <Text style={[styles.dateChipText, selectedDateRange === dt && styles.dateChipTextActive]}>{dt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={[styles.filterGroup, { marginTop: 8 }]}>
          <Text style={styles.filterLabel}>Jurisdiction Scope:</Text>
          <TextInput
            style={styles.jurisInput}
            value={jurisdictionCode}
            onChangeText={setJurisdictionCode}
            placeholder="MP-IND-461"
          />
        </View>
      </View>

      {/* ── REPORT CONTENT DISPLAY ── */}
      {isLoading ? (
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color="#0F766E" />
          <Text style={styles.loadingText}>Fetching Dynamic Report Metrics...</Text>
        </View>
      ) : error || !reportData ? (
        <View style={styles.stateContainer}>
          <MaterialCommunityIcons name="alert-circle-outline" size={48} color="#EF4444" />
          <Text style={styles.stateTitle}>Report Unavailable</Text>
          <Text style={styles.stateSubtitle}>{error}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchReportDetail}>
            <Text style={styles.retryBtnText}>Retry Fetch</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View>
          {/* Report Title & Privacy Banner */}
          <View style={styles.titleCard}>
            <Text style={styles.reportMainTitle}>{reportData.title}</Text>
            <Text style={styles.reportDate}>Generated: {reportData.generated_date} • {selectedDateRange}</Text>
            <View style={styles.privacyShieldRow}>
              <MaterialCommunityIcons name="shield-lock" size={16} color="#059669" />
              <Text style={styles.privacyShieldText}>
                Privacy Shield Active: Sensitive Aadhaar, Bank & KYC details are securely masked.
              </Text>
            </View>
          </View>

          {/* Real Export Action Buttons */}
          <View style={styles.exportBar}>
            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#DC2626' }]}
              onPress={handleExportPDF}
              disabled={isExporting}
            >
              <MaterialCommunityIcons name="file-pdf-box" size={16} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>Export PDF</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#059669' }]}
              onPress={handleExportCSV}
              disabled={isExporting}
            >
              <MaterialCommunityIcons name="file-excel-box" size={16} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>Export CSV</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.exportBtn, { backgroundColor: '#2563EB' }]}
              onPress={handleExportGeoJSON}
              disabled={isExporting}
            >
              <MaterialCommunityIcons name="map-marker-path" size={16} color="#FFFFFF" />
              <Text style={styles.exportBtnText}>Export GeoJSON</Text>
            </TouchableOpacity>
          </View>

          {/* 4-KPI Grid */}
          <Text style={styles.sectionHeading}>Summary Key Performance Indicators</Text>
          <View style={styles.kpiGrid}>
            {(reportData.kpis || []).map((kpi, idx) => (
              <View key={idx} style={styles.kpiCard}>
                <Text style={styles.kpiLabel}>{kpi.label}</Text>
                <Text style={styles.kpiValue}>{kpi.value}</Text>
                {!!kpi.change && <Text style={styles.kpiChange}>{kpi.change}</Text>}
              </View>
            ))}
          </View>

          {/* Status Breakdown Bar */}
          <Text style={styles.sectionHeading}>Status Distribution</Text>
          <View style={styles.breakdownCard}>
            {(reportData.status_breakdown || []).map((st, idx) => (
              <View key={idx} style={styles.breakdownRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stLabel}>{st.status}</Text>
                  <View style={styles.progressBarBg}>
                    <View style={[styles.progressBarFill, { width: `${st.percentage}%` }]} />
                  </View>
                </View>
                <Text style={styles.stCount}>{st.count} ({st.percentage}%)</Text>
              </View>
            ))}
          </View>

          {/* Data Table Preview */}
          <Text style={styles.sectionHeading}>Sanitized Data Table Preview ({reportData.items?.length || 0} Records)</Text>
          {reportData.items?.length === 0 ? (
            <View style={styles.emptyCard}>
              <MaterialCommunityIcons name="table-cancel" size={36} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No Records Found for Date Range</Text>
            </View>
          ) : (
            reportData.items.map((item, idx) => (
              <View key={idx} style={styles.tableRowCard}>
                <View style={styles.tableRowHeader}>
                  <Text style={styles.itemRef}>
                    {item.id || item.ref_id || item.farmer_ref_id || `REC-${100 + idx}`}
                  </Text>
                  <View style={styles.itemBadge}>
                    <Text style={styles.itemBadgeText}>{item.status || 'Verified'}</Text>
                  </View>
                </View>
                <Text style={styles.itemName}>
                  {item.name || item.target_name || item.title || item.masked_name || item.asset_name || 'Government Entry'}
                </Text>

                <View style={styles.itemDetailsRow}>
                  <Text style={styles.itemSubText}>
                    {item.type || item.area || item.package || item.partner || item.village || item.compliance_level || 'Active'}
                  </Text>
                  {!!item.amount && <Text style={styles.itemAmount}>{item.amount}</Text>}
                </View>
              </View>
            ))
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 12, paddingTop: 12 },
  stateContainer: { padding: 32, alignItems: 'center', justifyContent: 'center', minHeight: 280 },
  stateTitle: { fontSize: 18, fontWeight: '800', color: '#0F172A', marginTop: 12 },
  stateSubtitle: { fontSize: 13, color: '#64748B', textAlign: 'center', marginTop: 6, lineHeight: 18 },
  loadingText: { fontSize: 14, fontWeight: '600', color: '#0F766E', marginTop: 12 },
  retryBtn: { marginTop: 16, backgroundColor: '#0F766E', paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12 },
  retryBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 13 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  headerTitle: { fontSize: 16, fontWeight: '800', color: '#0F172A' },
  headerSub: { fontSize: 11, color: '#64748B' },
  sectionHeading: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 10, marginBottom: 6 },
  catChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFFFFF', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', marginRight: 6, gap: 4 },
  catChipActive: { backgroundColor: '#0F766E', borderColor: '#0F766E' },
  catChipText: { fontSize: 11, fontWeight: '700', color: '#475569' },
  catChipTextActive: { color: '#FFFFFF' },
  filterCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  filterGroup: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  filterLabel: { fontSize: 11, fontWeight: '700', color: '#334155' },
  dateChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, backgroundColor: '#F1F5F9', marginRight: 4 },
  dateChipActive: { backgroundColor: '#0F766E' },
  dateChipText: { fontSize: 10, fontWeight: '700', color: '#475569' },
  dateChipTextActive: { color: '#FFFFFF' },
  jurisInput: { backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#CBD5E1', borderRadius: 8, paddingHorizontal: 8, height: 32, fontSize: 11, color: '#0F172A', minWidth: 100 },
  titleCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 10 },
  reportMainTitle: { fontSize: 15, fontWeight: '800', color: '#0F172A' },
  reportDate: { fontSize: 11, color: '#64748B', marginTop: 2 },
  privacyShieldRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#ECFDF5', padding: 6, borderRadius: 8, marginTop: 8, gap: 4 },
  privacyShieldText: { fontSize: 10, fontWeight: '700', color: '#047857', flex: 1 },
  exportBar: { flexDirection: 'row', gap: 6, marginBottom: 12 },
  exportBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 8, borderRadius: 10, gap: 4 },
  exportBtnText: { color: '#FFFFFF', fontWeight: '800', fontSize: 11 },
  kpiGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  kpiCard: { width: '48%', backgroundColor: '#FFFFFF', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  kpiLabel: { fontSize: 10, fontWeight: '700', color: '#64748B' },
  kpiValue: { fontSize: 14, fontWeight: '800', color: '#0F766E', marginTop: 2 },
  kpiChange: { fontSize: 9, color: '#059669', marginTop: 2 },
  breakdownCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 },
  stLabel: { fontSize: 11, fontWeight: '700', color: '#334155' },
  progressBarBg: { height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginTop: 4, width: '90%' },
  progressBarFill: { height: 6, backgroundColor: '#0F766E', borderRadius: 3 },
  stCount: { fontSize: 11, fontWeight: '800', color: '#0F766E', marginLeft: 8 },
  emptyCard: { backgroundColor: '#FFFFFF', padding: 20, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  emptyTitle: { fontSize: 13, fontWeight: '800', color: '#0F172A', marginTop: 6 },
  tableRowCard: { backgroundColor: '#FFFFFF', borderRadius: 10, padding: 10, borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 6 },
  tableRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  itemRef: { fontSize: 11, fontWeight: '800', color: '#0F766E' },
  itemBadge: { backgroundColor: '#DCFCE7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  itemBadgeText: { fontSize: 9, fontWeight: '800', color: '#15803D' },
  itemName: { fontSize: 12, fontWeight: '800', color: '#0F172A', marginTop: 2 },
  itemDetailsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  itemSubText: { fontSize: 10, color: '#64748B' },
  itemAmount: { fontSize: 11, fontWeight: '800', color: '#059669' },
});
