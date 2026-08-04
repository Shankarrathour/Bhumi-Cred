import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, StatusBar, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

export default function PolicyDetailsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4FDF9" />
      
      {/* Navbar Header */}
      <View style={styles.navBar}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialCommunityIcons name="arrow-left" size={22} color={COLORS.primary} />
        </TouchableOpacity>
        <Text style={styles.navTitle}>Policy Architecture Details</Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
        {/* Main Title */}
        <View style={styles.welcomeBanner}>
          <Text style={styles.mainTitle}>BhumiShield Asset Coverage</Text>
          <Text style={styles.subTitle}>Empowering farmers by securing environmental assets against climate vulnerabilities.</Text>
        </View>

        {/* 1. What is Covered */}
        <View style={styles.detailCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="shield-check" size={24} color={COLORS.success} />
            <Text style={styles.cardHeaderTitle}>Covered Damages / क्या सुरक्षित है</Text>
          </View>
          <Text style={styles.sectionDesc}>Our satellite monitoring audits and covers losses caused by critical eco hazards:</Text>
          
          <View style={styles.itemRow}>
            <View style={styles.bulletDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletTitle}>Heavy Storm & Cyclones / आंधी और तूफान</Text>
              <Text style={styles.bulletDesc}>Cover against trunk breakage or uprooting due to heavy winds.</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <View style={styles.bulletDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletTitle}>Extreme Drought stress / गंभीर सूखा</Text>
              <Text style={styles.bulletDesc}>Protects if crop fails due to complete rainfall failure and dry heat waves.</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <View style={styles.bulletDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletTitle}>Fungal Infections & Pests / कीट और बीमारी</Text>
              <Text style={styles.bulletDesc}>Satellite-verified leaf decay or pest attacks threatening complete plantation death.</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <View style={styles.bulletDot} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletTitle}>Heavy Flash Floods / भारी बाढ़</Text>
              <Text style={styles.bulletDesc}>Damage or soil washing caused by localized waterlogging exceeding 72 hours.</Text>
            </View>
          </View>
        </View>

        {/* 2. Exclusions & T&Cs */}
        <View style={styles.detailCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="alert-circle-outline" size={24} color="#EF4444" />
            <Text style={[styles.cardHeaderTitle, { color: '#EF4444' }]}>Exclusions & Conditions / नियम व शर्तें</Text>
          </View>
          <Text style={styles.sectionDesc}>To prevent moral hazard and maintain carbon registry credibility, the following conditions apply:</Text>

          <View style={styles.itemRow}>
            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#EF4444" style={styles.bulletIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletTitle}>Fake Plantation Claims / फर्जी वृक्षारोपण दावा</Text>
              <Text style={styles.bulletDesc}>Submitting photos of trees that are not physically present on the geo-tagged boundaries will blacklist the farmer profile.</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#EF4444" style={styles.bulletIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletTitle}>Intentional Felling / पेड़ काटना</Text>
              <Text style={styles.bulletDesc}>No claim payout will be processed if trees are cut down intentionally or harvested for timber value without admin permission.</Text>
            </View>
          </View>

          <View style={styles.itemRow}>
            <MaterialCommunityIcons name="close-circle-outline" size={16} color="#EF4444" style={styles.bulletIcon} />
            <View style={{ flex: 1 }}>
              <Text style={styles.bulletTitle}>Missed Satellite Audits / छूटे हुए उपग्रह स्कैन</Text>
              <Text style={styles.bulletDesc}>Farmers must keep fields accessible for periodic orbital NPK biomass indexes. Blocked data can freeze payouts.</Text>
            </View>
          </View>
        </View>

        {/* 3. Climate Rewards System */}
        <View style={styles.detailCard}>
          <View style={styles.cardHeader}>
            <MaterialCommunityIcons name="leaf" size={24} color="#D97706" />
            <Text style={[styles.cardHeaderTitle, { color: '#D97706' }]}>Ecosystem Benefits / पर्यावरण बोनस</Text>
          </View>
          <Text style={styles.sectionDesc}>Insuring trees is not just about protection - it contributes directly to India's climate-tech score:</Text>

          <View style={styles.benefitRow}>
            <View style={styles.benefitIconBox}>
              <MaterialCommunityIcons name="molecule-co2" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.benefitTitle}>Carbon Credit Multiplier</Text>
              <Text style={styles.benefitDesc}>Insured trees undergo premium MRV audits, increasing average carbon estimation yields by 1.5x.</Text>
            </View>
          </View>

          <View style={styles.benefitRow}>
            <View style={styles.benefitIconBox}>
              <MaterialCommunityIcons name="shield-lock-outline" size={20} color={COLORS.primary} />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.benefitTitle}>Green Family Badges</Text>
              <Text style={styles.benefitDesc}>Grouped trees trigger Banyan Master or Golden Leaf status, unlocking micro-credit subsidy eligibility automatically.</Text>
            </View>
          </View>
        </View>

        {/* Go Back button */}
        <TouchableOpacity 
          style={styles.backBtnAction} 
          activeOpacity={0.85}
          onPress={() => router.back()}
        >
          <Text style={styles.backBtnLabel}>Back to Registry / पीछे जाएं</Text>
        </TouchableOpacity>
        
        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4FDF9',
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 56,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderColor: '#E2E8F0',
  },
  backBtn: {
    padding: 6,
    borderRadius: 10,
  },
  navTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  scrollArea: {
    padding: 20,
  },
  welcomeBanner: {
    marginBottom: 20,
  },
  mainTitle: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primaryDark,
    fontWeight: '800',
  },
  subTitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 16,
    fontWeight: '600',
  },
  detailCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.success,
    marginLeft: 8,
  },
  sectionDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    lineHeight: 15,
    marginBottom: 16,
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  bulletDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: COLORS.success,
    marginTop: 6,
    marginRight: 10,
  },
  bulletIcon: {
    marginTop: 2,
    marginRight: 8,
  },
  bulletTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  bulletDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 14,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 14,
  },
  benefitIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: '#E6F4EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  benefitTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  benefitDesc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
    lineHeight: 14,
  },
  backBtnAction: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 30,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 10,
  },
  backBtnLabel: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '800',
  },
});
