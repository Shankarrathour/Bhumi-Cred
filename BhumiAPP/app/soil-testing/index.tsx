import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useLandStore } from '../../src/store/landStore';
import api from '../../src/api/apiClient';

const { width } = Dimensions.get('window');

interface Booking {
  id: string;
  land_parcel_id: string;
  land_parcel_name: string;
  package_name: string;
  is_paid: boolean;
  amount_paid: number;
  schedule_date: string;
  schedule_time_slot: string;
  status: string;
  nitrogen?: number;
  phosphorus?: number;
  potassium?: number;
  ph?: number;
  organic_carbon?: number;
  soil_health_score?: number;
  observations?: string;
  recommendations?: string;
  created_at: string;
}

export default function SoilTestingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const plots = useLandStore((state) => state.plots);
  const fetchPlots = useLandStore((state) => state.fetchPlots);

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<'dashboard' | 'select_parcel' | 'choose_package' | 'schedule_time' | 'checkout' | 'payment_gateway'>('dashboard');

  // Booking Form State
  const [selectedParcelId, setSelectedParcelId] = useState<string>('');
  const [selectedPackage, setSelectedPackage] = useState<'Standard NPK Audit' | 'Premium Micro-nutrient Scan'>('Standard NPK Audit');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<string>('09:00 AM - 12:00 PM');

  // Detailed view report state
  const [selectedReport, setSelectedReport] = useState<Booking | null>(null);
  const [comparisonEnabled, setComparisonEnabled] = useState(false);

  // Simulated gateway loading
  const [paying, setPaying] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      if (plots.length === 0) {
        await fetchPlots();
      }
      const response = await api.get('/farmer/soil-testing/bookings');
      if (response.data && response.data.success) {
        setBookings(response.data.data);
      }
    } catch (e) {
      console.log('Failed to fetch soil test bookings', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleStartBooking = () => {
    if (plots.length === 0) {
      Alert.alert('No Plots Found', 'Please register your land parcel first before scheduling a soil test.');
      return;
    }
    setSelectedParcelId(plots[0].id);
    setSelectedDate(new Date(Date.now() + 86400000 * 2).toISOString().split('T')[0]); // Default 2 days from now
    setActiveStep('select_parcel');
  };

  const handleProceedToPackage = () => {
    if (!selectedParcelId) {
      Alert.alert('Selection Required', 'Please select a land parcel.');
      return;
    }
    setActiveStep('choose_package');
  };

  const handleProceedToSchedule = () => {
    setActiveStep('schedule_time');
  };

  const handleProceedToCheckout = () => {
    if (!selectedDate) {
      Alert.alert('Date Required', 'Please select a date for sample collection.');
      return;
    }
    setActiveStep('checkout');
  };

  const handlePayAndConfirm = async () => {
    if (selectedPackage === 'Premium Micro-nutrient Scan') {
      setActiveStep('payment_gateway');
      setPaying(true);
      setTimeout(async () => {
        await submitBooking();
      }, 2500);
    } else {
      await submitBooking();
    }
  };

  const submitBooking = async () => {
    try {
      const response = await api.post('/farmer/soil-testing/booking', {
        land_parcel_id: selectedParcelId,
        package_name: selectedPackage,
        schedule_date: selectedDate,
        schedule_time_slot: selectedSlot
      });
      if (response.data && response.data.success) {
        Alert.alert('Booking Confirmed', 'Soil test sample collection scheduled successfully!');
        await loadData();
        setActiveStep('dashboard');
      }
    } catch (e) {
      Alert.alert('Error', 'Failed to create soil test booking. Please try again.');
      setActiveStep('checkout');
    } finally {
      setPaying(false);
    }
  };

  const downloadReport = (report: Booking) => {
    const parcelName = (report?.land_parcel_name || 'Land_Plot').replace(/\s+/g, '_');
    const reportDate = report?.schedule_date || '2026-08-18';
    Alert.alert(
      'Download Certified Report PDF',
      `Downloading Soil_Report_${parcelName}_${reportDate}.pdf (N=240, P=35, K=180 kg/ha, SOC=1.45%)`,
      [{ text: 'Share PDF', onPress: () => Alert.alert('Share', 'Report PDF link copied to clipboard.') }, { text: 'Done' }]
    );
  };

  // Timeline indicator status mapping
  const getTimelineProgress = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'scheduled') return 1;
    if (s === 'sample_collected') return 2;
    if (s === 'lab_processing') return 3;
    if (s === 'report_ready') return 4;
    return 1;
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }] as any}>
      {/* Header bar */}
      <View style={styles.headerBar as any}>
        <TouchableOpacity 
          onPress={() => activeStep === 'dashboard' ? router.back() : setActiveStep('dashboard')}
          style={styles.backBtn as any}
        >
          <MaterialCommunityIcons name="arrow-left" size={20} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle as any}>Soil Testing Dashboard</Text>
        <TouchableOpacity onPress={loadData} style={styles.refreshBtn as any}>
          <MaterialCommunityIcons name="refresh" size={20} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loaderArea as any}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={{ marginTop: 12, color: COLORS.textSecondary, fontWeight: '600' }}>Syncing soil health data...</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContainer as any} showsVerticalScrollIndicator={false}>
          
          {/* ========================================= */}
          {/* 1. DASHBOARD OVERVIEW                     */}
          {/* ========================================= */}
          {activeStep === 'dashboard' && !selectedReport && (
            <View>
              {/* Premium Top card banner */}
              <LinearGradient colors={['#065F46', '#022C22']} style={styles.heroCard as any}>
                <MaterialCommunityIcons name="test-tube" size={32} color="#84CC16" />
                <Text style={styles.heroTitle as any}>Audit Ground Soil Organic Carbon</Text>
                <Text style={styles.heroDesc as any}>
                  Schedule certified baseline sample collections to unlock verified carbon payouts and check humic carbon accumulation rates.
                </Text>
                <TouchableOpacity style={styles.heroBtn as any} onPress={handleStartBooking}>
                  <Text style={styles.heroBtnText as any}>Schedule Soil Test / मिट्टी परीक्षण</Text>
                  <MaterialCommunityIcons name="calendar-clock" size={16} color={COLORS.primary} style={{ marginLeft: 6 }} />
                </TouchableOpacity>
              </LinearGradient>

              {/* Active Bookings Progress tracker */}
              {bookings.filter(b => b.status !== 'report_ready').length > 0 && (
                <View style={{ marginTop: 20 }}>
                  <Text style={styles.sectionHeader as any}>Active Soil Audits ({bookings.filter(b => b.status !== 'report_ready').length})</Text>
                  {bookings.filter(b => b.status !== 'report_ready').map((b) => {
                    const stepNum = getTimelineProgress(b.status);
                    return (
                      <View key={b.id} style={styles.activeAuditCard as any}>
                        <View style={styles.auditCardHeader as any}>
                          <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textDark }}>{b.package_name}</Text>
                          <View style={styles.badgeWarning as any}>
                            <Text style={{ fontSize: 9, fontWeight: '800', color: '#D97706' }}>{b.status.replace('_', ' ').toUpperCase()}</Text>
                          </View>
                        </View>
                        <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 4 }}>Land Plot: {b.land_parcel_name}</Text>
                        
                        {/* Mini timeline nodes */}
                        <View style={styles.miniTimelineRow as any}>
                          {[
                            { step: 1, label: 'Scheduled' },
                            { step: 2, label: 'Collected' },
                            { step: 3, label: 'Lab processing' },
                            { step: 4, label: 'Ready' }
                          ].map((t) => {
                            const isDone = stepNum >= t.step;
                            return (
                              <View key={t.step} style={{ flex: 1, alignItems: 'center' }}>
                                <View style={[styles.timelineNodeDot, isDone && styles.timelineNodeDotDone] as any}>
                                  {isDone && <MaterialCommunityIcons name="check" size={10} color="#FFFFFF" />}
                                </View>
                                <Text style={[styles.timelineNodeLabel, isDone && { color: COLORS.primary, fontWeight: '700' }] as any}>{t.label}</Text>
                              </View>
                            );
                          })}
                        </View>
                      </View>
                    );
                  })}
                </View>
              )}

              {/* Lab Reports List */}
              <View style={{ marginTop: 22 }}>
                <Text style={styles.sectionHeader as any}>Soil Analysis Reports</Text>
                
                {bookings.filter(b => b.status === 'report_ready').length === 0 ? (
                  <View style={styles.emptyStateBox as any}>
                    <MaterialCommunityIcons name="flask-outline" size={40} color="#94A3B8" />
                    <Text style={{ fontSize: 13, color: COLORS.textSecondary, marginTop: 10, fontWeight: '700' }}>No reports delivered yet</Text>
                  </View>
                ) : (
                  bookings.filter(b => b.status === 'report_ready').map((b) => (
                    <TouchableOpacity key={b.id} style={styles.reportRowCard as any} onPress={() => setSelectedReport(b)}>
                      <View style={styles.reportIconContainer as any}>
                        <MaterialCommunityIcons name="file-chart" size={24} color={COLORS.primary} />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textDark }}>Report: {b.schedule_date}</Text>
                        <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>{b.land_parcel_name} • Health Score: {b.soil_health_score}/10</Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={20} color={COLORS.textSecondary} />
                    </TouchableOpacity>
                  ))
                )}
              </View>

              {/* Historical Comparison */}
              {bookings.filter(b => b.status === 'report_ready').length > 1 && (
                <View style={styles.comparisonCard as any}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                      <MaterialCommunityIcons name="chart-bell-curve" size={20} color="#4F46E5" />
                      <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textDark }}>Historical Comparison</Text>
                    </View>
                    <TouchableOpacity onPress={() => setComparisonEnabled(!comparisonEnabled)}>
                      <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.primary }}>
                        {comparisonEnabled ? 'Hide Specs' : 'View Specs Table'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                  
                  {comparisonEnabled && (
                    <View style={{ marginTop: 14 }}>
                      <View style={styles.compareTableHeader as any}>
                        <Text style={[styles.compareCol, { flex: 1.2 }] as any}>DATE</Text>
                        <Text style={styles.compareCol as any}>NITROGEN</Text>
                        <Text style={styles.compareCol as any}>CARBON %</Text>
                        <Text style={styles.compareCol as any}>pH VALUE</Text>
                      </View>
                      {bookings.filter(b => b.status === 'report_ready').map((b) => (
                        <View key={b.id} style={styles.compareTableRow as any}>
                          <Text style={[styles.compareCol, { flex: 1.2, fontWeight: '800' }] as any}>{b.schedule_date}</Text>
                          <Text style={styles.compareCol as any}>{b.nitrogen} mg/kg</Text>
                          <Text style={[styles.compareCol, { color: COLORS.success, fontWeight: '800' }] as any}>{b.organic_carbon}%</Text>
                          <Text style={styles.compareCol as any}>{b.ph}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          )}

          {/* ========================================= */}
          {/* DETAILED REPORT VIEW                      */}
          {/* ========================================= */}
          {selectedReport && (
            <View style={styles.reportDetailView as any}>
              <TouchableOpacity style={styles.backToDashboardLink as any} onPress={() => setSelectedReport(null)}>
                <MaterialCommunityIcons name="arrow-left" size={16} color={COLORS.primary} />
                <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.primary, marginLeft: 4 }}>Back to Dashboard</Text>
              </TouchableOpacity>

              <View style={styles.sheetHeaderRow as any}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 16, fontWeight: '800', color: COLORS.textDark }}>Soil Health Certificate</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>Plot: {selectedReport.land_parcel_name || 'Dewas Sector Plot 1'} • {selectedReport.schedule_date || '2026-08-18'}</Text>
                </View>
                <TouchableOpacity onPress={() => downloadReport(selectedReport)} style={styles.downloadReportBtn as any}>
                  <MaterialCommunityIcons name="download" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>

              {/* Big Score Card */}
              <LinearGradient colors={['#F0FDF4', '#DCFCE7']} style={styles.scoreGradBox as any}>
                <View>
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#16A34A', letterSpacing: 0.5 }}>SOIL HEALTH SCORE</Text>
                  <Text style={{ fontSize: 32, fontWeight: '900', color: '#14532D', marginTop: 4 }}>{selectedReport.soil_health_score} <Text style={{ fontSize: 14, fontWeight: '600', color: '#166534' }}>/ 10</Text></Text>
                </View>
                <View style={styles.scoreTagBadge as any}>
                  <Text style={{ fontSize: 10, fontWeight: '900', color: '#FFFFFF' }}>OPTIMAL HEALTH</Text>
                </View>
              </LinearGradient>

              {/* Chemical Metrics Grid */}
              <Text style={{ fontSize: 12, fontWeight: '800', color: COLORS.textDark, marginTop: 18, marginBottom: 10 }}>NPK & Carbon Constituents</Text>
              <View style={styles.chemicalGrid as any}>
                <View style={styles.chemBox as any}>
                  <Text style={styles.chemLabel as any}>NITROGEN (N)</Text>
                  <Text style={styles.chemVal as any}>{selectedReport.nitrogen} mg/kg</Text>
                  <View style={styles.progressTrack as any}><View style={[styles.progressBar, { width: '80%', backgroundColor: '#3B82F6' }] as any} /></View>
                  <Text style={styles.chemStatus as any}>Optimal / पर्याप्त</Text>
                </View>
                <View style={styles.chemBox as any}>
                  <Text style={styles.chemLabel as any}>PHOSPHORUS (P)</Text>
                  <Text style={styles.chemVal as any}>{selectedReport.phosphorus} mg/kg</Text>
                  <View style={styles.progressTrack as any}><View style={[styles.progressBar, { width: '50%', backgroundColor: '#D97706' }] as any} /></View>
                  <Text style={styles.chemStatus as any}>Medium / मध्यम</Text>
                </View>
                <View style={styles.chemBox as any}>
                  <Text style={styles.chemLabel as any}>POTASSIUM (K)</Text>
                  <Text style={styles.chemVal as any}>{selectedReport.potassium} mg/kg</Text>
                  <View style={styles.progressTrack as any}><View style={[styles.progressBar, { width: '90%', backgroundColor: '#10B981' }] as any} /></View>
                  <Text style={styles.chemStatus as any}>Optimal / पर्याप्त</Text>
                </View>
                <View style={styles.chemBox as any}>
                  <Text style={styles.chemLabel as any}>ORGANIC CARBON %</Text>
                  <Text style={[styles.chemVal, { color: COLORS.success }] as any}>{selectedReport.organic_carbon}%</Text>
                  <View style={styles.progressTrack as any}><View style={[styles.progressBar, { width: `${(selectedReport.organic_carbon || 0.5) * 60}%`, backgroundColor: COLORS.success }] as any} /></View>
                  <Text style={styles.chemStatus as any}>Stable Canopy Protection</Text>
                </View>
              </View>

              {/* pH and Micro elements block */}
              <View style={styles.microInfoBox as any}>
                <View style={styles.microRow as any}>
                  <Text style={{ fontSize: 12, fontWeight: '700', color: COLORS.textDark }}>Soil pH Balance:</Text>
                  <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.primary }}>{selectedReport.ph} (Slightly Acidic)</Text>
                </View>
              </View>

              {/* Auditor Observations */}
              <View style={styles.obsCard as any}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E293B' }}>Auditor Observations</Text>
                <Text style={{ fontSize: 12, color: '#475569', marginTop: 6, lineHeight: 17 }}>{selectedReport.observations}</Text>
                
                <View style={styles.dottedDivider as any} />
                
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#1E293B' }}>Agronomist Recommendations</Text>
                <Text style={{ fontSize: 12, color: '#0F766E', fontWeight: '600', marginTop: 6, lineHeight: 17 }}>
                  💡 {selectedReport.recommendations}
                </Text>
              </View>
            </View>
          )}

          {/* ========================================= */}
          {/* STEP 1: SELECT PLOT                       */}
          {/* ========================================= */}
          {activeStep === 'select_parcel' && (
            <View>
              <Text style={styles.wizardHeader as any}>Select Land Parcel / भूमि का चयन करें</Text>
              <Text style={styles.wizardSub as any}>Step 1 of 4</Text>
              
              <View style={{ gap: 12, marginTop: 16 }}>
                {plots.map((plot) => {
                  const isSelected = selectedParcelId === plot.id;
                  return (
                    <TouchableOpacity 
                      key={plot.id} 
                      style={[styles.wizardCard, isSelected && styles.wizardCardActive] as any}
                      onPress={() => setSelectedParcelId(plot.id)}
                    >
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.textDark }}>{plot.name || 'Your Plot'}</Text>
                        <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 3 }}>Khasra: {plot.khasraNumber} • {plot.acres} Acres</Text>
                      </View>
                      <View style={[styles.wizardRadio, isSelected && styles.wizardRadioActive] as any}>
                        {isSelected && <View style={styles.wizardRadioDot as any} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.wizardNextBtn as any} onPress={handleProceedToPackage}>
                <Text style={styles.wizardNextBtnText as any}>Proceed to Package Selection</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================= */}
          {/* STEP 2: CHOOSE PACKAGE                    */}
          {/* ========================================= */}
          {activeStep === 'choose_package' && (
            <View>
              <Text style={styles.wizardHeader as any}>Choose Soil Audit Package</Text>
              <Text style={styles.wizardSub as any}>Step 2 of 4</Text>

              <View style={{ gap: 14, marginTop: 16 }}>
                {/* Package 1: Standard */}
                <TouchableOpacity 
                  style={[styles.pkgCard, selectedPackage === 'Standard NPK Audit' && styles.pkgCardActive] as any}
                  onPress={() => setSelectedPackage('Standard NPK Audit')}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.textDark }}>Standard NPK Audit</Text>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.primary }}>FREE</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 6, lineHeight: 16 }}>
                    Baseline checks for Nitrogen, Phosphorus, Potassium and pH levels. Essential for carbon registration approval checks.
                  </Text>
                </TouchableOpacity>

                {/* Package 2: Premium */}
                <TouchableOpacity 
                  style={[styles.pkgCard, selectedPackage === 'Premium Micro-nutrient Scan' && styles.pkgCardActive] as any}
                  onPress={() => setSelectedPackage('Premium Micro-nutrient Scan')}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: COLORS.textDark }}>Premium Micro-nutrient Scan</Text>
                    <Text style={{ fontSize: 14, fontWeight: '900', color: '#4F46E5' }}>₹499</Text>
                  </View>
                  <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 6, lineHeight: 16 }}>
                    Includes N, P, K, pH, full trace minerals (Zinc, Iron, Copper, Boron) + Organic Carbon % calculation certificates.
                  </Text>
                </TouchableOpacity>
              </View>

              <TouchableOpacity style={styles.wizardNextBtn as any} onPress={handleProceedToSchedule}>
                <Text style={styles.wizardNextBtnText as any}>Proceed to Schedule Time</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================= */}
          {/* STEP 3: SCHEDULE TIME                     */}
          {/* ========================================= */}
          {activeStep === 'schedule_time' && (
            <View>
              <Text style={styles.wizardHeader as any}>Schedule Sample Collection</Text>
              <Text style={styles.wizardSub as any}>Step 3 of 4</Text>

              {/* Date selection mock */}
              <Text style={styles.inputSectionHeader as any}>Select Collection Date:</Text>
              <View style={styles.dateSelectorRow as any}>
                {[0, 1, 2, 3].map((days) => {
                  const d = new Date(Date.now() + 86400000 * (days + 2));
                  const dateStr = d.toISOString().split('T')[0];
                  const displayDay = d.toLocaleDateString('en-IN', { weekday: 'short' });
                  const displayDate = d.getDate();
                  const isSelected = selectedDate === dateStr;
                  
                  return (
                    <TouchableOpacity 
                      key={dateStr}
                      style={[styles.dateBlock, isSelected && styles.dateBlockActive] as any}
                      onPress={() => setSelectedDate(dateStr)}
                    >
                      <Text style={[styles.dateBlockDay, isSelected && { color: '#FFFFFF' }] as any}>{displayDay}</Text>
                      <Text style={[styles.dateBlockNum, isSelected && { color: '#FFFFFF' }] as any}>{displayDate}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Slot selection */}
              <Text style={styles.inputSectionHeader as any}>Select Time Slot:</Text>
              <View style={{ gap: 10, marginTop: 10 }}>
                {['09:00 AM - 12:00 PM', '02:00 PM - 05:00 PM'].map((slot) => {
                  const isSelected = selectedSlot === slot;
                  return (
                    <TouchableOpacity 
                      key={slot}
                      style={[styles.wizardCard, isSelected && styles.wizardCardActive] as any}
                      onPress={() => setSelectedSlot(slot)}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '800', color: COLORS.textDark }}>{slot}</Text>
                      <View style={[styles.wizardRadio, isSelected && styles.wizardRadioActive] as any}>
                        {isSelected && <View style={styles.wizardRadioDot as any} />}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              <TouchableOpacity style={styles.wizardNextBtn as any} onPress={handleProceedToCheckout}>
                <Text style={styles.wizardNextBtnText as any}>Confirm & Proceed to Checkout</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================= */}
          {/* STEP 4: REVIEW & PAY                      */}
          {/* ========================================= */}
          {activeStep === 'checkout' && (
            <View>
              <Text style={styles.wizardHeader as any}>Review & Confirm Order</Text>
              <Text style={styles.wizardSub as any}>Final Step</Text>

              <View style={styles.checkoutInvoiceCard as any}>
                <Text style={{ fontSize: 10, fontWeight: '900', color: COLORS.primary, textTransform: 'uppercase' }}>BILLING SUMMARY</Text>
                
                <View style={styles.invoiceDottedDivider as any} />
                
                <View style={styles.invoiceLineItem as any}>
                  <Text style={{ fontSize: 13, color: COLORS.textDark, fontWeight: '600' }}>{selectedPackage}</Text>
                  <Text style={{ fontSize: 13, color: COLORS.textDark, fontWeight: '800' }}>
                    {selectedPackage === 'Standard NPK Audit' ? 'FREE' : '₹499.00'}
                  </Text>
                </View>
                <View style={styles.invoiceLineItem as any}>
                  <Text style={{ fontSize: 13, color: COLORS.textSecondary }}>Taxes & Admin Fees</Text>
                  <Text style={{ fontSize: 13, color: COLORS.textDark, fontWeight: '800' }}>₹0.00</Text>
                </View>

                <View style={styles.invoiceDottedDivider as any} />

                <View style={styles.invoiceLineItem as any}>
                  <Text style={{ fontSize: 14, fontWeight: '800', color: COLORS.textDark }}>Total Payable Amount:</Text>
                  <Text style={{ fontSize: 15, fontWeight: '900', color: COLORS.primary }}>
                    {selectedPackage === 'Standard NPK Audit' ? '₹0.00' : '₹499.00'}
                  </Text>
                </View>
              </View>

              {/* Details confirmation snippet */}
              <View style={styles.detailConfirmSnippet as any}>
                <MaterialCommunityIcons name="map-marker" size={16} color={COLORS.primary} style={{ marginRight: 8 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 11, fontWeight: '800', color: COLORS.textDark }}>Sample Collection Address</Text>
                  <Text style={{ fontSize: 11, color: COLORS.textSecondary, marginTop: 2 }}>
                    Plot: {plots.find(p => p.id === selectedParcelId)?.name || 'Selected Plot'} • Date: {selectedDate} • Time: {selectedSlot}
                  </Text>
                </View>
              </View>

              <TouchableOpacity style={styles.payNowBtn as any} onPress={handlePayAndConfirm}>
                <MaterialCommunityIcons name="shield-check" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.payNowBtnText as any}>
                  {selectedPackage === 'Standard NPK Audit' ? 'Confirm Booking' : 'Pay Now & Book'}
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ========================================= */}
          {/* STEP 5: PAYMENT GATEWAY SIMULATION        */}
          {/* ========================================= */}
          {activeStep === 'payment_gateway' && (
            <View style={styles.gatewayArea as any}>
              <ActivityIndicator size="large" color="#4F46E5" />
              <Text style={{ fontSize: 15, fontWeight: '900', color: COLORS.textDark, marginTop: 20 }}>Processing Soil Audit Payment</Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary, marginTop: 6 }}>Please do not close the application or press back.</Text>
            </View>
          )}

        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    padding: 6,
  },
  refreshBtn: {
    padding: 6,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  scrollContainer: {
    padding: 16,
  },
  loaderArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
  heroCard: {
    borderRadius: 20,
    padding: 20,
    ...SHADOWS.medium,
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    marginTop: 14,
  },
  heroDesc: {
    fontSize: 11.5,
    color: '#A7F3D0',
    marginTop: 6,
    lineHeight: 18,
  },
  heroBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: 14,
    marginTop: 18,
    ...SHADOWS.small,
  },
  heroBtnText: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: '900',
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 12,
  },
  activeAuditCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    ...SHADOWS.small,
  },
  auditCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badgeWarning: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniTimelineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  timelineNodeDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineNodeDotDone: {
    backgroundColor: COLORS.primary,
  },
  timelineNodeLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginTop: 4,
  },
  emptyStateBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reportRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#F1F5F9',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...SHADOWS.small,
  },
  reportIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E6F4EA',
    alignItems: 'center',
    justifyContent: 'center',
  },
  comparisonCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  compareTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#F8FAFC',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  compareTableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  compareCol: {
    flex: 1,
    fontSize: 9.5,
    color: COLORS.textDark,
    textAlign: 'center',
    fontWeight: '600',
  },
  reportDetailView: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 16,
    ...SHADOWS.small,
  },
  backToDashboardLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  downloadReportBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scoreGradBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  scoreTagBadge: {
    backgroundColor: '#16A34A',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chemicalGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  chemBox: {
    width: (width - 64) / 2,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 12,
  },
  chemLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
  },
  chemVal: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textDark,
    marginTop: 4,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    marginTop: 8,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    borderRadius: 2,
  },
  chemStatus: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#64748B',
    marginTop: 6,
  },
  microInfoBox: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  microRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  obsCard: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  dottedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  wizardHeader: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  wizardSub: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 2,
  },
  wizardCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 14,
  },
  wizardCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  wizardRadio: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  wizardRadioActive: {
    borderColor: COLORS.primary,
  },
  wizardRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  wizardNextBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    ...SHADOWS.small,
  },
  wizardNextBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
  pkgCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    padding: 16,
  },
  pkgCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#F0FDF4',
  },
  inputSectionHeader: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
    marginTop: 18,
    marginBottom: 8,
  },
  dateSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateBlock: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  dateBlockActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  dateBlockDay: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  dateBlockNum: {
    fontSize: 15,
    fontWeight: '900',
    color: COLORS.textDark,
    marginTop: 4,
  },
  checkoutInvoiceCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 18,
    padding: 16,
    marginTop: 14,
    ...SHADOWS.small,
  },
  invoiceDottedDivider: {
    height: 1,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginVertical: 10,
  },
  invoiceLineItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  detailConfirmSnippet: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    borderRadius: 12,
    padding: 12,
    marginTop: 14,
  },
  payNowBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    ...SHADOWS.small,
  },
  payNowBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  gatewayArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 100,
  },
});
