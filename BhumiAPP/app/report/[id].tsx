import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, SafeAreaView } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { MOCK_REPORTS_DETAILS } from '../../src/mock/reportMockData';
import { downloadAndShareReportPDF } from '../../src/utils/pdfGenerator';
import { useAuthStore } from '../../src/store/authStore';

export default function ReportDetailsScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [downloading, setDownloading] = useState(false);
  const userName = useAuthStore((state) => state.user?.fullName);

  const baseReport = MOCK_REPORTS_DETAILS[id || ''] || MOCK_REPORTS_DETAILS['REP-001'];
  // Overlay the real logged-in farmer name so reports never show mock names.
  const report = { ...baseReport, farmerName: userName || baseReport.farmerName || '' };

  const handleDownload = async () => {
    await downloadAndShareReportPDF(report, setDownloading);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Configure navigation bar */}
      <Stack.Screen 
        options={{
          title: report.testName,
          headerShown: true,
          headerStyle: { backgroundColor: COLORS.primary },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: 'bold' },
          headerLeft: () => (
            <TouchableOpacity onPress={() => router.back()} style={styles.headerBackBtn}>
              <MaterialCommunityIcons name="chevron-left" size={28} color="#FFF" />
            </TouchableOpacity>
          )
        }} 
      />

      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        
        {/* Header Box - Native Simulation of Letterhead */}
        <View style={styles.letterhead}>
          <View style={styles.brandRow}>
            <View style={styles.logoBox}>
              <MaterialCommunityIcons name="sprout" size={24} color="#FFF" />
            </View>
            <View style={styles.brandTextContainer}>
              <Text style={styles.brandTitle}>BhumiCred Soil & Carbon Labs</Text>
              <Text style={styles.brandTagline}>Verified Agricultural MRV & Soil Carbon Registry</Text>
            </View>
          </View>
          
          <View style={styles.contactBlock}>
            <Text style={styles.contactText}>📞 +91 98765 43210</Text>
            <Text style={styles.contactText}>✉️ audits@bhumicred.org</Text>
            <Text style={styles.contactText}>🌐 www.bhumicred.org</Text>
          </View>
        </View>

        {/* Farmer Info Block */}
        <View style={styles.metaContainer}>
          <View style={styles.farmerColumn}>
            <Text style={styles.farmerName}>{report.farmerName}</Text>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Acreage/Loc</Text>
              <Text style={styles.metaValue}>: {report.ageSex}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Verified By</Text>
              <Text style={styles.metaValue}>: {report.referredBy}</Text>
            </View>
            <View style={styles.metaRow}>
              <Text style={styles.metaLabel}>Plot ID</Text>
              <Text style={styles.metaValue}>: {report.regNo}</Text>
            </View>
          </View>
          
          <View style={styles.barcodeColumn}>
            <Text style={styles.barcodeVisual}>||||| || || |||| ||| |</Text>
            <View style={styles.metaRowRight}>
              <Text style={styles.metaLabelRight}>Registered</Text>
              <Text style={styles.metaValueRight}>: {report.registeredOn.split(' ')[0]}</Text>
            </View>
            <View style={styles.metaRowRight}>
              <Text style={styles.metaLabelRight}>Inspected</Text>
              <Text style={styles.metaValueRight}>: {report.collectedOn.split(' ')[0]}</Text>
            </View>
            <View style={styles.metaRowRight}>
              <Text style={styles.metaLabelRight}>Issued</Text>
              <Text style={styles.metaValueRight}>: {report.reportedOn.split(' ')[0]}</Text>
            </View>
          </View>
        </View>

        {/* Lab Results Layout */}
        <View style={styles.resultsSection}>
          
          {report.sections.map((section, sIdx) => (
            <View key={sIdx} style={styles.tableCard}>
              {/* Table Section Header */}
              <View style={styles.tableHeaderBar}>
                <Text style={styles.tableHeaderTitle}>{section.category}</Text>
              </View>
              
              {/* Table Subheader Row */}
              <View style={styles.tableColumnHeader}>
                <Text style={[styles.colHeadText, { flex: 4, textAlign: 'left' }]}>METRIC DESCRIPTION</Text>
                <Text style={[styles.colHeadText, { flex: 2.5, textAlign: 'center' }]}>VALUE</Text>
                <Text style={[styles.colHeadText, { flex: 2, textAlign: 'center' }]}>UNIT</Text>
                <Text style={[styles.colHeadText, { flex: 3.5, textAlign: 'right' }]}>TARGET RANGE</Text>
              </View>

              {/* Table Parameter Rows */}
              {section.parameters.map((param, pIdx) => {
                const isFlagged = param.flag ? true : false;
                return (
                  <View 
                    key={pIdx} 
                    style={[
                      styles.tableRow, 
                      pIdx === section.parameters.length - 1 && { borderBottomWidth: 0 },
                      isFlagged && styles.flaggedRowBackground
                    ]}
                  >
                    <Text style={[styles.paramName, { flex: 4 }]}>{param.name}</Text>
                    
                    <View style={[{ flex: 2.5, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' }]}>
                      {isFlagged && (
                        <Text style={styles.flagIndicator}>{param.flag}</Text>
                      )}
                      <Text style={[styles.paramValue, isFlagged && styles.flaggedText]}>
                        {param.value}
                      </Text>
                    </View>
                    
                    <Text style={[styles.paramUnit, { flex: 2 }]}>{param.unit}</Text>
                    <Text style={[styles.paramRef, { flex: 3.5 }]}>{param.referenceRange}</Text>
                  </View>
                );
              })}
            </View>
          ))}
        </View>

        {/* Auditor Notes */}
        <View style={styles.notesSection}>
          <View style={styles.notesCard}>
            <View style={styles.notesHeader}>
              <MaterialCommunityIcons name="notebook-outline" size={18} color={COLORS.textDark} />
              <Text style={styles.notesTitle}>Auditor Recommendations & Notes</Text>
            </View>
            <Text style={styles.notesBody}>{report.auditorNotes}</Text>
          </View>
        </View>

        {/* Pathologists Signatures simulation */}
        <View style={styles.signaturesRow}>
          <View style={styles.sigBlock}>
            <Text style={styles.simSig}>S. Sharma</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>Sachin Sharma</Text>
            <Text style={styles.sigRole}>GIS Lead Auditor, BhumiCred</Text>
          </View>
          
          <View style={styles.sigBlock}>
            <Text style={styles.simSig}>Dr. A.K. Asthana</Text>
            <View style={styles.sigLine} />
            <Text style={styles.sigName}>Dr. A. K. Asthana</Text>
            <Text style={styles.sigRole}>Senior Soil Scientist, ICAR</Text>
          </View>
        </View>
 
        {/* Fine Print legal label */}
        <View style={styles.finePrint}>
          <Text style={styles.finePrintText}>CERTIFIED CARBON MRV BLOCKCHAIN REPORT</Text>
          <Text style={styles.finePrintSub}>BhumiCred Verification Facility</Text>
        </View>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Floating Action Download Button */}
      <View style={[styles.floatingContainer, { bottom: 24 + insets.bottom }]}>
        <TouchableOpacity 
          style={[styles.downloadFAB, downloading && { backgroundColor: COLORS.secondary }]}
          onPress={handleDownload}
          disabled={downloading}
          activeOpacity={0.8}
        >
          {downloading ? (
            <ActivityIndicator color="#FFF" size="small" />
          ) : (
            <MaterialCommunityIcons name="file-download-outline" size={24} color="#FFF" />
          )}
          <Text style={styles.fabText}>{downloading ? "Generating PDF..." : "Download Report PDF"}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  headerBackBtn: {
    marginLeft: -10,
    padding: 8,
  },
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  letterhead: {
    backgroundColor: COLORS.primary,
    padding: 20,
    paddingTop: 24,
    borderBottomRightRadius: 24,
    borderBottomLeftRadius: 24,
    ...SHADOWS.soft,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  logoBox: {
    width: 40,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  logoText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  brandTextContainer: {
    flex: 1,
  },
  brandTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  brandTagline: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 11,
    marginTop: 1,
  },
  contactBlock: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    paddingTop: 12,
  },
  contactText: {
    color: '#E0F2FE',
    fontSize: 10,
    marginRight: 10,
    fontWeight: '500',
  },
  metaContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  farmerColumn: {
    flex: 1.2,
  },
  barcodeColumn: {
    flex: 1,
    alignItems: 'flex-end',
  },
  farmerName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  metaRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  metaLabel: {
    fontSize: 11,
    color: '#64748B',
    width: 70,
  },
  metaValue: {
    fontSize: 11,
    color: COLORS.textDark,
    fontWeight: '600',
  },
  barcodeVisual: {
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.textSecondary,
    marginBottom: 6,
  },
  metaRowRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
  },
  metaLabelRight: {
    fontSize: 10,
    color: '#64748B',
    width: 65,
    textAlign: 'right',
  },
  metaValueRight: {
    fontSize: 10,
    color: COLORS.textDark,
    fontWeight: '600',
    width: 75,
    textAlign: 'left',
    paddingLeft: 4,
  },
  resultsSection: {
    paddingHorizontal: 16,
    marginTop: 20,
  },
  tableCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    ...SHADOWS.soft,
    marginBottom: 20,
  },
  tableHeaderBar: {
    backgroundColor: '#F1F5F9',
    borderBottomWidth: 2,
    borderBottomColor: COLORS.primary,
    padding: 12,
    alignItems: 'center',
  },
  tableHeaderTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
    color: COLORS.primary,
  },
  tableColumnHeader: {
    flexDirection: 'row',
    backgroundColor: '#FFF',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#CBD5E1',
  },
  colHeadText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#64748B',
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  flaggedRowBackground: {
    backgroundColor: 'rgba(239, 68, 68, 0.03)',
  },
  paramName: {
    fontSize: 11,
    fontWeight: '600',
    color: '#334155',
  },
  paramValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    textAlign: 'center',
  },
  flaggedText: {
    color: '#DC2626',
    fontWeight: '800',
  },
  flagIndicator: {
    fontSize: 11,
    fontWeight: '900',
    color: '#DC2626',
    marginRight: 4,
  },
  paramUnit: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
  },
  paramRef: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
    fontWeight: '500',
  },
  notesSection: {
    paddingHorizontal: 16,
  },
  notesCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 16,
  },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  notesTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    marginLeft: 6,
  },
  notesBody: {
    fontSize: 11,
    color: '#475569',
    lineHeight: 16,
    fontStyle: 'italic',
  },
  signaturesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginTop: 32,
  },
  sigBlock: {
    alignItems: 'center',
    width: '45%',
  },
  simSig: {
    fontSize: 18,
    fontFamily: 'System',
    fontStyle: 'italic',
    color: '#475569',
    marginBottom: 2,
  },
  sigLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#94A3B8',
    marginBottom: 6,
  },
  sigName: {
    fontSize: 11,
    fontWeight: '700',
    color: '#1E293B',
  },
  sigRole: {
    fontSize: 9,
    color: '#64748B',
    marginTop: 1,
  },
  finePrint: {
    alignItems: 'center',
    marginTop: 40,
    paddingBottom: 20,
  },
  finePrintText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#94A3B8',
    letterSpacing: 0.5,
  },
  finePrintSub: {
    fontSize: 8,
    color: '#CBD5E1',
    marginTop: 2,
  },
  floatingContainer: {
    position: 'absolute',
    bottom: 24,
    left: 16,
    right: 16,
  },
  downloadFAB: {
    backgroundColor: COLORS.primary,
    borderRadius: 30,
    height: 56,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  fabText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
