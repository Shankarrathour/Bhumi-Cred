import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, ScrollView, Dimensions, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { RootState } from '../../src/store';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';
import { BackButton } from '../../src/components/BackButton';

const { width } = Dimensions.get('window');

export default function SuccessScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const booking = useSelector((state: RootState) => state.booking);
  const authUser = useAuthStore((state) => state.user);

  // Get the most recent booking
  const recentBooking = booking.pastBookings[0] || { id: 'BKG-0000', date: 'TBD', time: 'TBD' };

  // Invoice dynamic details
  const farmerName = booking.farmerDetails?.name || authUser?.fullName || '';
  const acres = parseFloat(booking.farmerDetails?.acres || '1') || 1;
  const mobile = booking.farmerDetails?.mobile || authUser?.mobile || '';
  const instructions = booking.farmerDetails?.instructions || 'Bhopal Rural, MP';

  // Pricing Breakdowns: total 129 / acre
  const mrvFee = Math.round(49 * acres);
  const soilFee = Math.round(29 * acres);
  const projectFee = Math.round(31 * acres);
  const regFee = Math.round(20 * acres);
  const totalAmount = mrvFee + soilFee + projectFee + regFee;

  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <BackButton color="#FFFFFF" backgroundColor="rgba(255,255,255,0.15)" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          
          <Animated.View style={[styles.iconCircle, { transform: [{ scale: scaleAnim }] }]}>
            <MaterialCommunityIcons name="check" size={48} color="#fff" />
          </Animated.View>

          <Animated.Text style={[styles.title, { opacity: opacityAnim }]}>Eco Program Active! 🍃</Animated.Text>
          <Animated.Text style={[styles.subtitle, { opacity: opacityAnim }]}>
            Your soil carbon audit baseline & satellite mapping scan have been scheduled successfully.
          </Animated.Text>

          {/* Premium Digital Invoice Box */}
          <Animated.View style={[styles.invoiceCard, { opacity: opacityAnim }]}>
            {/* Invoice Top Bar */}
            <View style={styles.invoiceHeader}>
              <View style={styles.brandRow}>
                <MaterialCommunityIcons name="leaf" size={18} color={COLORS.primary} style={{ marginRight: 6 }} />
                <Text style={styles.invoiceBrand}>BhumiCred MRV Registry</Text>
              </View>
              <Text style={styles.receiptTitle}>OFFICIAL RECEIPT</Text>
            </View>

            <View style={styles.dividerDashed} />

            {/* Farmer/Plot Info Metadata */}
            <View style={styles.metadataSection}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>FARMER NAME</Text>
                <Text style={styles.metaVal}>{farmerName}</Text>
              </View>
              <View style={styles.metaColRight}>
                <Text style={styles.metaLabelRight}>INVOICE ID</Text>
                <Text style={styles.metaValRight}>{recentBooking.id}</Text>
              </View>
            </View>

            <View style={styles.metadataSection}>
              <View style={styles.metaCol}>
                <Text style={styles.metaLabel}>LAND ACREAGE</Text>
                <Text style={styles.metaVal}>{acres} Acres</Text>
              </View>
              <View style={styles.metaColRight}>
                <Text style={styles.metaLabelRight}>CONTACT</Text>
                <Text style={styles.metaValRight}>+91 {mobile}</Text>
              </View>
            </View>

            <View style={styles.metadataSection}>
              <View style={{ flex: 1 }}>
                <Text style={styles.metaLabel}>INSPECTION LOCATION</Text>
                <Text style={styles.metaVal} numberOfLines={1}>{instructions}</Text>
              </View>
            </View>

            <View style={styles.dividerSolid} />

            {/* Billing Breakdown Table */}
            <Text style={styles.tableHeading}>BILLING BREAKDOWN (₹129 / Acre)</Text>
            
            <View style={styles.billRow}>
              <View style={styles.billService}>
                <MaterialCommunityIcons name="drone" size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.billLabel}>MRV Drone Inspection</Text>
              </View>
              <Text style={styles.billPrice}>₹{mrvFee}</Text>
            </View>

            <View style={styles.billRow}>
              <View style={styles.billService}>
                <MaterialCommunityIcons name="sprout" size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.billLabel}>Soil Organic Core Testing</Text>
              </View>
              <Text style={styles.billPrice}>₹{soilFee}</Text>
            </View>

            <View style={styles.billRow}>
              <View style={styles.billService}>
                <MaterialCommunityIcons name="molecule-co2" size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.billLabel}>Carbon Project Assignment</Text>
              </View>
              <Text style={styles.billPrice}>₹{projectFee}</Text>
            </View>

            <View style={styles.billRow}>
              <View style={styles.billService}>
                <MaterialCommunityIcons name="file-sign" size={14} color={COLORS.textSecondary} style={{ marginRight: 6 }} />
                <Text style={styles.billLabel}>Sustainability Registration</Text>
              </View>
              <Text style={styles.billPrice}>₹{regFee}</Text>
            </View>

            <View style={styles.dividerDashed} />

            {/* Total Row */}
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>TOTAL AMOUNT PAID</Text>
              <Text style={styles.totalPrice}>₹{totalAmount}</Text>
            </View>

            {/* Invoice Footnote */}
            <View style={styles.invoiceFootnote}>
              <MaterialCommunityIcons name="shield-check" size={14} color={COLORS.success} style={{ marginRight: 6 }} />
              <Text style={styles.footnoteText}>Blockchain verified digital MRV receipt</Text>
            </View>
          </Animated.View>

          {/* Logistics Summary Details */}
          <Animated.View style={[styles.detailsCard, { opacity: opacityAnim }]}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Scheduled Date</Text>
              <Text style={styles.detailValue}>{recentBooking.date}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Expected Time</Text>
              <Text style={styles.detailValue}>{recentBooking.time}</Text>
            </View>
          </Animated.View>

        </View>
      </ScrollView>

      <Animated.View style={[styles.footer, { opacity: opacityAnim, paddingBottom: (Platform.OS === 'ios' ? 34 : 24) + insets.bottom }]}>
        <TouchableOpacity 
          style={styles.trackBtn} 
          onPress={() => router.push(`/tracking/${recentBooking.id}`)}
        >
          <MaterialCommunityIcons name="map-marker-path" size={20} color={COLORS.textLight} />
          <Text style={styles.trackBtnText}>Track Field Inspection</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.homeBtn} 
          onPress={() => router.replace('/(tabs)')}
        >
          <Text style={styles.homeBtnText}>Back to Dashboard</Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.primaryDark,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 120,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    paddingTop: 50,
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.2)',
    ...SHADOWS.glow,
  },
  title: {
    ...TYPOGRAPHY.h1,
    color: COLORS.textLight,
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textLight,
    opacity: 0.85,
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 18,
    paddingHorizontal: 12,
  },
  
  // Premium Digital Invoice receipt layout
  invoiceCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    width: '100%',
    padding: 20,
    ...SHADOWS.soft,
    marginBottom: 20,
  },
  invoiceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  invoiceBrand: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primary,
  },
  receiptTitle: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.textSecondary,
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  metadataSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: 6,
  },
  metaCol: {
    flex: 1.2,
  },
  metaColRight: {
    flex: 1,
    alignItems: 'flex-end',
  },
  metaLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
  },
  metaLabelRight: {
    fontSize: 8.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    letterSpacing: 0.5,
    textAlign: 'right',
  },
  metaVal: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 2,
  },
  metaValRight: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginTop: 2,
    textAlign: 'right',
  },
  tableHeading: {
    fontSize: 9,
    fontWeight: '900',
    color: COLORS.primary,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 6,
  },
  billService: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  billLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.textDark,
  },
  billPrice: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  totalLabel: {
    fontSize: 12,
    fontWeight: '900',
    color: COLORS.primary,
  },
  totalPrice: {
    fontSize: 18,
    fontWeight: '900',
    color: COLORS.primary,
  },
  invoiceFootnote: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 12,
    backgroundColor: '#ECFDF5',
    paddingVertical: 6,
    borderRadius: 8,
  },
  footnoteText: {
    fontSize: 9,
    fontWeight: '800',
    color: COLORS.success,
    textTransform: 'uppercase',
  },

  detailsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 20,
    padding: 16,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: 11.5,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: COLORS.textLight,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 12,
  },
  dividerSolid: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 12,
  },
  dividerDashed: {
    height: 1,
    borderWidth: 0.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    marginVertical: 12,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
  },
  trackBtn: {
    flexDirection: 'row',
    backgroundColor: COLORS.accent, // Lime accent
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    ...SHADOWS.limeGlow,
  },
  trackBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.primaryDark,
    fontWeight: '900',
    marginLeft: 8,
  },
  homeBtn: {
    paddingVertical: 16,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  homeBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textLight,
    fontWeight: '800',
  }
});
