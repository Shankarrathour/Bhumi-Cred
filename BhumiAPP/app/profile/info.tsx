import React from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform 
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

export default function InfoScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ type: string; title: string }>();
  
  const type = params.type || 'privacy';
  const title = params.title || 'Information';

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const renderPrivacyPolicy = () => (
    <>
      <Text style={styles.introText}>Last updated: May 29, 2026</Text>
      <Text style={styles.paragraph}>
        At BhumiCred, we are committed to protecting your privacy and ensuring your agricultural land coordinates and soil chemical data remain fully secured. This policy outlines how we handle landowner information.
      </Text>
      
      <Text style={styles.sectionHeader}>1. Data Collection</Text>
      <Text style={styles.paragraph}>
        We collect farm location coordinates, Aadhaar identity mappings, land Khasra titles, and vegetative canopy densities solely for the purpose of verifying sustainable farming metrics and issuing carbon offset credits.
      </Text>

      <Text style={styles.sectionHeader}>2. Registry Storage</Text>
      <Text style={styles.paragraph}>
        All soil organic carbon (SOC) reports, drone multispectral mappings, and credit balances are stored securely in IPFS blockchain databases. Access is limited strictly to verified account owners and authorized registry auditors.
      </Text>

      <Text style={styles.sectionHeader}>3. Third-Party Sharing</Text>
      <Text style={styles.paragraph}>
        We never sell, trade, or lease farmer identity profiles or field baseline histories to synthetic fertilizer corporations, commercial developers, or advertising networks.
      </Text>
    </>
  );

  const renderTermsOfService = () => (
    <>
      <Text style={styles.introText}>Effective from: May 2026</Text>
      <Text style={styles.paragraph}>
        By accessing the BhumiCred platform and registering your plot, you agree to comply with verified carbon standard (VCS) rules and remote sensing compliance audits.
      </Text>
      
      <Text style={styles.sectionHeader}>1. Inspection Bookings</Text>
      <Text style={styles.paragraph}>
        All scheduled drone arrivals or soil sampling visits represent estimated windows. Our field verification officers strive for absolute punctuality but timing may vary due to boundary visibility or local weather conditions.
      </Text>

      <Text style={styles.sectionHeader}>2. Wallet Refunds</Text>
      <Text style={styles.paragraph}>
        Cancellations initiated at least 4 hours prior to a scheduled physical soil core draw qualify for automated full wallet credits. Missed on-site appointments due to boundary access failure are subject to rescheduling fees.
      </Text>

      <Text style={styles.sectionHeader}>3. Carbon Credit Disclaimer</Text>
      <Text style={styles.paragraph}>
        BhumiCred issues sustainability carbon points based on remote Sentinel multispectral absorption indices combined with ICAR-partner soil sampling. Point valuations are subject to international voluntary carbon credit market rates.
      </Text>
    </>
  );

  const renderHelpCenter = () => (
    <>
      <Text style={styles.introText}>Frequently Asked Questions</Text>
      
      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How do I download my Soil Health Cards?</Text>
        <Text style={styles.faqAnswer}>Navigate to the 'Verification Registry' tab on the bottom bar. Locate your completed baseline audit and tap 'Download PDF' instantly to share or print.</Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>Is physical soil core collection mandatory?</Text>
        <Text style={styles.faqAnswer}>Initial Soil Organic Carbon (SOC) baselines require physically extracting core samples from the 4 corners of your fields. Remote Sentinel crop scans and vegetative canopy analyses are fully digital.</Text>
      </View>

      <View style={styles.faqCard}>
        <Text style={styles.faqQuestion}>How do I earn carbon bonuses?</Text>
        <Text style={styles.faqAnswer}>Practicing zero-tillage, planting fast-growing boundary sapling packs, and reducing water in paddy fields will grow your Eco Sustainability Index, directly increasing carbon credit rewards.</Text>
      </View>

      <TouchableOpacity 
        style={styles.supportBtn}
        onPress={() => triggerHaptic(Haptics.ImpactFeedbackStyle.Medium)}
        accessibilityRole="button"
      >
        <MaterialCommunityIcons name="chat-processing-outline" size={24} color="#FFF" />
        <Text style={styles.supportBtnText}>Consult Bhumi Mitra Support</Text>
      </TouchableOpacity>
    </>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }} 
          style={styles.backBtn}
          accessibilityRole="button"
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {type === 'privacy' && renderPrivacyPolicy()}
        {type === 'terms' && renderTermsOfService()}
        {type === 'help' && renderHelpCenter()}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: {
    padding: 8,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.textLight,
  },
  scrollContent: {
    padding: 20,
  },
  introText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: COLORS.primary,
    textTransform: 'uppercase',
    marginBottom: 16,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: 'bold',
    color: COLORS.primaryDark,
    marginTop: 24,
    marginBottom: 8,
  },
  paragraph: {
    ...TYPOGRAPHY.body,
    color: '#475569',
    lineHeight: 22,
    marginBottom: 16,
  },
  faqCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    elevation: 2,
  },
  faqQuestion: {
    ...TYPOGRAPHY.subtitle,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 8,
  },
  faqAnswer: {
    ...TYPOGRAPHY.body,
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  supportBtn: {
    backgroundColor: COLORS.primary,
    flexDirection: 'row',
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    ...SHADOWS.soft,
    elevation: 3,
  },
  supportBtnText: {
    ...TYPOGRAPHY.subtitle,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 10,
  },
});
