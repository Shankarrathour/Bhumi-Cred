import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Clipboard, Alert, Image, Dimensions
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../src/theme/theme';
import { useAuthStore } from '../src/store/authStore';

const { width } = Dimensions.get('window');

const REFERRED_FARMERS = [
  { id: '1', name: 'Ramesh Patel', village: 'Sehore, MP', date: '04 Aug 2026', status: 'Verified', reward: '₹500 + 10 tCO₂e' },
  { id: '2', name: 'Suresh Verma', village: 'Indore, MP', date: '01 Aug 2026', status: 'Verified', reward: '₹500 + 10 tCO₂e' },
  { id: '3', name: 'Kavita Rao', village: 'Ujjain, MP', date: '28 Jul 2026', status: 'Pending Verification', reward: 'Pending' },
  { id: '4', name: 'Mohan Singh', village: 'Betul, MP', date: '20 Jul 2026', status: 'Verified', reward: '₹500 + 10 tCO₂e' },
];

export default function ReferralScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const user = useAuthStore((state) => state.user);

  const referralCode = user?.mobile
    ? `BHUMI-${user.mobile.slice(-4)}`
    : 'BHUMI-9021';

  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    Clipboard.setString(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    try {
      const shareMessage = `🌱 Join bhumiCred! Use my referral code ${referralCode} to sign up and get ₹500 wallet bonus + 10 tCO₂e carbon credits for registering your farm!\nDownload now: https://bhumicred.com/app?ref=${referralCode}`;
      await Share.share({
        message: shareMessage,
        title: 'Refer & Earn on bhumiCred',
      });
    } catch (error) {
      console.log('Share error:', error);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textDark} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Refer & Earn Rewards</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Banner Gradient Card */}
        <LinearGradient
          colors={['#16A34A', '#15803D', '#0F5132']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.bannerCard}
        >
          <View style={styles.bannerBadge}>
            <MaterialCommunityIcons name="gift-outline" size={16} color="#FEF3C7" />
            <Text style={styles.bannerBadgeText}>EARN UNLIMITED REWARDS</Text>
          </View>

          <Text style={styles.bannerTitle}>Refer Farmers & Earn Cash + Carbon Credits!</Text>
          <Text style={styles.bannerSubtitle}>
            Get <Text style={styles.highlightText}>₹500 Cash</Text> + <Text style={styles.highlightText}>10 tCO₂e</Text> in your wallet for every farmer who signs up & verifies land.
          </Text>
        </LinearGradient>

        {/* Your Referral Code Section */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionLabel}>YOUR UNIQUE REFERRAL CODE</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>{referralCode}</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.copyBtn} activeOpacity={0.7}>
              <MaterialCommunityIcons
                name={copied ? 'check' : 'content-copy'}
                size={18}
                color={copied ? COLORS.success : COLORS.textSecondary}
              />
              <Text style={[styles.copyBtnText, copied && { color: COLORS.success }]}>
                {copied ? 'Copied!' : 'Copy Code'}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={handleShare} style={styles.shareBtn} activeOpacity={0.85}>
            <LinearGradient
              colors={['#16A34A', '#15803D']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.shareGradient}
            >
              <MaterialCommunityIcons name="whatsapp" size={22} color="#FFF" />
              <Text style={styles.shareBtnText}>Share Code on WhatsApp</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Rewards Summary Bar */}
        <View style={styles.rewardsRow}>
          <View style={styles.rewardStatCard}>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Farmers Invited</Text>
          </View>
          <View style={styles.rewardStatCard}>
            <Text style={[styles.statNumber, { color: '#16A34A' }]}>₹6,000</Text>
            <Text style={styles.statLabel}>Cash Earned</Text>
          </View>
          <View style={styles.rewardStatCard}>
            <Text style={[styles.statNumber, { color: '#2563EB' }]}>120 tCO₂e</Text>
            <Text style={styles.statLabel}>Carbon Bonus</Text>
          </View>
        </View>

        {/* How It Works */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>How It Works</Text>
          
          <View style={styles.stepItem}>
            <View style={[styles.stepIconBg, { backgroundColor: '#F0FDF4' }]}>
              <MaterialCommunityIcons name="share-variant" size={20} color="#16A34A" />
            </View>
            <View style={styles.stepTextContent}>
              <Text style={styles.stepTitle}>1. Share your referral code</Text>
              <Text style={styles.stepSub}>Send your link or code to farmer friends via WhatsApp/SMS.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepIconBg, { backgroundColor: '#EFF6FF' }]}>
              <MaterialCommunityIcons name="account-check-outline" size={20} color="#2563EB" />
            </View>
            <View style={styles.stepTextContent}>
              <Text style={styles.stepTitle}>2. Friend signs up & verifies land</Text>
              <Text style={styles.stepSub}>They complete registration & submit land parcel geofence.</Text>
            </View>
          </View>

          <View style={styles.stepItem}>
            <View style={[styles.stepIconBg, { backgroundColor: '#FEF3C7' }]}>
              <MaterialCommunityIcons name="wallet-plus-outline" size={20} color="#D97706" />
            </View>
            <View style={styles.stepTextContent}>
              <Text style={styles.stepTitle}>3. Both get instant rewards!</Text>
              <Text style={styles.stepSub}>₹500 cash is credited to your wallet + 10 tCO₂e carbon credits.</Text>
            </View>
          </View>
        </View>

        {/* Referred Farmers History */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionHeaderTitle}>Referred Farmers Activity</Text>

          {REFERRED_FARMERS.map((item) => (
            <View key={item.id} style={styles.historyRow}>
              <View style={styles.historyAvatar}>
                <Text style={styles.avatarText}>{item.name.substring(0, 2).toUpperCase()}</Text>
              </View>

              <View style={styles.historyMain}>
                <Text style={styles.farmerName}>{item.name}</Text>
                <Text style={styles.farmerSub}>{item.village} • Joined {item.date}</Text>
              </View>

              <View style={{ alignItems: 'flex-end' }}>
                <Text style={[
                  styles.rewardTag,
                  item.status === 'Verified' ? { color: '#16A34A' } : { color: '#D97706' }
                ]}>
                  {item.reward}
                </Text>
                <View style={[
                  styles.statusPill,
                  item.status === 'Verified' ? { backgroundColor: '#DCFCE7' } : { backgroundColor: '#FEF3C7' }
                ]}>
                  <Text style={[
                    styles.statusPillText,
                    item.status === 'Verified' ? { color: '#16A34A' } : { color: '#D97706' }
                  ]}>
                    {item.status}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  bannerCard: {
    borderRadius: 24,
    padding: 20,
    ...SHADOWS.medium,
  },
  bannerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  bannerBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FEF3C7',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 28,
    marginBottom: 8,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#E2E8F0',
    lineHeight: 18,
  },
  highlightText: {
    color: '#FEF3C7',
    fontWeight: '800',
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E8EDF5',
    ...SHADOWS.small,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  codeBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 14,
  },
  codeText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 1,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  copyBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  shareBtn: {
    borderRadius: 14,
    overflow: 'hidden',
  },
  shareGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
  },
  shareBtnText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  rewardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  rewardStatCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EDF5',
    ...SHADOWS.small,
  },
  statNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#64748B',
    marginTop: 2,
    textAlign: 'center',
  },
  sectionHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 14,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
  },
  stepIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTextContent: {
    flex: 1,
  },
  stepTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  historyAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#16A34A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFF',
  },
  historyMain: {
    flex: 1,
  },
  farmerName: {
    fontSize: 13.5,
    fontWeight: '700',
    color: '#0F172A',
  },
  farmerSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },
  rewardTag: {
    fontSize: 12,
    fontWeight: '800',
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  statusPillText: {
    fontSize: 9.5,
    fontWeight: '800',
  },
});
