import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Alert, DeviceEventEmitter, Platform, Modal, Dimensions, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useAuthStore } from '../../src/store/authStore';
import { useLandStore } from '../../src/store/landStore';
import { useAgriStore } from '../../src/store/agriStore';
import { changeLanguage } from '../../src/locales/i18n';
import { AmbientEcoBackground } from '../../src/components/AmbientEcoBackground';
import TrackingModal from '../../src/components/TrackingModal';
import api from '../../src/api/apiClient';

export default function ProfileScreen() {
  const router = useRouter();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  const { t, i18n } = useTranslation();

  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const fetchProfile = useAuthStore((state) => state.fetchProfile);
  const updateOnboardingData = useAuthStore((state) => state.updateOnboardingData);

  useFocusEffect(
    useCallback(() => {
      fetchProfile().catch(() => {});
    }, [fetchProfile])
  );
  const plots = useLandStore((state) => state.plots);
  const fetchPlots = useLandStore((state) => state.fetchPlots);
  const schemes = useAgriStore((state) => state.homeSchemes);
  const fetchHomeSchemes = useAgriStore((state) => state.fetchHomeSchemes);
  
  useFocusEffect(
    useCallback(() => {
      fetchHomeSchemes();
    }, [fetchHomeSchemes])
  );
  useFocusEffect(
    useCallback(() => {
      fetchPlots();
    }, [fetchPlots])
  );

  const [isNotificationsEnabled, setIsNotificationsEnabled] = useState(true);
  const [selectedBadge, setSelectedBadge] = useState<any>(null);
  const [isBadgeDrawerVisible, setIsBadgeDrawerVisible] = useState(false);
  const [trackingModalVisible, setTrackingModalVisible] = useState(false);
  const [selectedPlot, setSelectedPlot] = useState<any>(null);

  const [isImagePickerOptionsVisible, setIsImagePickerOptionsVisible] = useState(false);

  const uploadFarmerPhoto = async (uri: string) => {
    try {
      const filename = uri.split('/').pop() || 'photo.jpg';
      const formData = new FormData();
      formData.append('file', { uri, name: filename, type: 'image/jpeg' } as any);
      const res = await api.post('/farmer/profile/photo', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const url: string | undefined = res.data?.data?.url;
      if (url) {
        updateOnboardingData({ farmerPhoto: url });
      } else {
        Alert.alert('Upload Error', 'Upload succeeded but no photo URL was returned.');
      }
    } catch (error: any) {
      const msg: string = error?.response?.data?.message || 'Upload failed. Please try again.';
      Alert.alert('Upload Error', msg);
    }
  };

  const handleTakePic = async () => {
    setIsImagePickerOptionsVisible(false);
    let result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadFarmerPhoto(result.assets[0].uri);
    }
  };

  const handleUploadPic = async () => {
    setIsImagePickerOptionsVisible(false);
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      await uploadFarmerPhoto(result.assets[0].uri);
    }
  };

  const BADGES = [
    { id: '1', title: 'Green Farmer', icon: 'sprout', level: 'Lvl 3', unlocked: true, color: '#10B981', desc: 'Plant boundary trees and maintain baseline biomass.', progress: '100%', progressVal: 1.0, progressText: '30/30 trees verified', reward: 'Unlocked ₹1,000/qtr payouts' },
    { id: '2', title: 'Verified Land Owner', icon: 'image-filter-hdr', level: 'Lvl 1', unlocked: true, color: '#0F766E', desc: 'Successfully register and verify your fields using drone scan.', progress: '100%', progressVal: 1.0, progressText: 'All plots verified', reward: 'Unlocked Carbon Credits Ledger' },
    { id: '3', title: 'Agro Hero', icon: 'shovel', level: 'Locked', unlocked: false, color: '#64748B', desc: 'Incorporate organic composting on 100% of verified fields.', progress: '40%', progressVal: 0.4, progressText: '2/5 plots using compost', reward: '₹1,500 organic farming bonus' },
    { id: '4', title: 'Plantation Champion', icon: 'tree', level: 'Locked', unlocked: false, color: '#64748B', desc: 'Successfully plant and maintain over 150 boundary saplings.', progress: '20%', progressVal: 0.2, progressText: '30/150 saplings planted', reward: '₹2,500 plantation subsidy' },
    { id: '5', title: 'Eco Guardian', icon: 'shield-check', level: 'Locked', unlocked: false, color: '#64748B', desc: 'Adopt zero tillage practices for at least two consecutive cropping seasons.', progress: '50%', progressVal: 0.5, progressText: '1/2 seasons completed', reward: '₹3,000 zero-tillage subsidy' },
    { id: '6', title: 'Carbon Pioneer', icon: 'molecule-co2', level: 'Locked', unlocked: false, color: '#64748B', desc: 'Accumulate more than 50.0 verified carbon capture credits.', progress: '75%', progressVal: 0.75, progressText: '37.5 / 50.0 Credits earned', reward: 'Verified Carbon Pioneer status' },
    { id: '7', title: 'Sustainability Leader', icon: 'trophy', level: 'Locked', unlocked: false, color: '#64748B', desc: 'Lead your local village block in total carbon credits earned.', progress: '60%', progressVal: 0.6, progressText: '6/10 local leaderboard points', reward: '₹5,000 community leader bonus' },
  ];

  const handleBadgePress = (badge: any) => {
    setSelectedBadge(badge);
    setIsBadgeDrawerVisible(true);
  };

  const activeLanguage = i18n.language || 'en';

  const handleLanguageToggle = async () => {
    const targetLang = activeLanguage === 'en' ? 'hi' : 'en';
    await changeLanguage(targetLang);
    Alert.alert(
      targetLang === 'hi' ? 'भाषा बदली गई' : 'Language Changed',
      targetLang === 'hi' ? 'ऐप अब हिंदी में काम करेगा।' : 'App is now translated into English.'
    );
  };

  const handleLogout = () => {
    logout();
    router.replace('/(auth)/login');
  };

  const renderSettingItem = (icon: string, title: string, subtitle?: string, rightComponent?: React.ReactNode, onPress?: () => void) => (
    <TouchableOpacity 
      style={styles.settingItem} 
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingIconContainer}>
        <MaterialCommunityIcons name={icon as any} size={22} color={COLORS.primary} />
      </View>
      <View style={styles.settingTextContainer}>
        <Text style={styles.settingTitle}>{title}</Text>
        {subtitle && <Text style={styles.settingSubtitle}>{subtitle}</Text>}
      </View>
      {rightComponent || <MaterialCommunityIcons name="chevron-right" size={24} color="#CBD5E1" />}
    </TouchableOpacity>
  );

  return (
    <AmbientEcoBackground style={styles.container}>
      {/* Premium Digital Farmer ID Card Header */}
      <View style={styles.idCardContainer}>
        <LinearGradient
          colors={['#022C22', '#064E3B']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.idCardGrad}
        >
          {/* Hologram/Badge Glow Effect */}
          <View style={styles.uhidBadgeRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity onPress={handleBack} style={{ marginRight: 8, padding: 4 }}>
                <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
              </TouchableOpacity>
              <View style={styles.idBrandRow}>
                <MaterialCommunityIcons name="leaf" size={16} color="#84CC16" style={{ marginRight: 4 }} />
                <Text style={styles.idBrandText}>BHUMICRED DIGITAL ID</Text>
              </View>
            </View>
            {(() => {
              const isBlocked = user?.isActive === false;
              const vs = user?.verificationStatus;
              console.log('[profile] badge render:', { isActive: user?.isActive, verificationStatus: vs });
              const label = isBlocked ? 'BLOCKED' : vs === 'approved' ? 'VERIFIED' : vs === 'rejected' ? 'REJECTED' : 'PENDING';
              const bgColor = isBlocked || vs === 'rejected' ? '#EF4444' : vs === 'approved' ? '#84CC16' : '#F97316';
              const icon = isBlocked || vs === 'rejected' ? 'close-circle' : vs === 'approved' ? 'check-decagram' : 'clock-outline';
              return (
                <View style={[styles.verifiedDecagramBadge, { backgroundColor: bgColor }]}>
                  <MaterialCommunityIcons name={icon as any} size={14} color="#FFFFFF" style={{ marginRight: 4 }} />
                  <Text style={styles.verifiedDecagramText}>{label}</Text>
                </View>
              );
            })()}
          </View>

          <View style={styles.profileHeaderRow}>
            <View style={styles.avatarContainer}>
              {user?.farmerPhoto ? (
                <Image source={{ uri: user.farmerPhoto }} style={{ width: 60, height: 60, borderRadius: 30 }} />
              ) : (
                <Text style={styles.avatarText}>
                  {(user?.fullName?.[0] ?? '?').toUpperCase()}
                </Text>
              )}
              
              <View style={styles.verifiedAvatarBadge}>
                <MaterialCommunityIcons name="check-decagram" size={16} color="#84CC16" />
              </View>

              <TouchableOpacity style={styles.editAvatarButton} onPress={() => setIsImagePickerOptionsVisible(true)}>
                <MaterialCommunityIcons name="plus-circle" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.fullName || ''}</Text>
              <Text style={styles.profilePhone}>{user?.mobile ? `+91 ${user.mobile}` : ''}</Text>
              <Text style={styles.uhidText}>Farmer ID: {user?.farmerId ?? 'N/A'}</Text>
            </View>
          </View>

          {/* Barcode & District Rank Footer Row */}
          <View style={styles.idCardFooter}>
            <View style={{ flex: 1.1 }}>
              <Text style={styles.idFooterLabel}>District Rank</Text>
              <View style={styles.rankPill}>
                <MaterialCommunityIcons name="trophy" size={12} color="#EAB308" style={{ marginRight: 4 }} />
                <Text style={styles.rankPillText}>Carbon Pioneer • Rank #12</Text>
              </View>
            </View>

            {/* Dynamic Vector Barcode Visualizer */}
            <View style={styles.barcodeCol}>
              <View style={styles.barcodeRow}>
                {[2, 4, 1, 3, 1, 4, 2, 1, 3, 2, 1, 4, 1, 2, 3].map((w, i) => (
                  <View key={i} style={[styles.barcodeLine, { width: w, marginRight: i % 2 === 0 ? 2 : 1 }]} />
                ))}
              </View>
              <Text style={styles.barcodeLabel}>SECURE SCAN VERIFIED</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Onboarding Lands Section */}
        <View style={styles.sectionContainer}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t('common.app_name')}</Text>
            <TouchableOpacity onPress={() => DeviceEventEmitter.emit('openGlobalScheduler')}>
              <Text style={styles.addText}>+ Add plot</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.horizontalScroll}>
            {plots.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center', width: '100%' }}>
                <MaterialCommunityIcons name="image-filter-hdr" size={40} color={COLORS.border} />
                <Text style={{ marginTop: 10, color: COLORS.textSecondary, fontSize: 12, fontWeight: '600' }}>No land parcels registered yet.</Text>
              </View>
            ) : plots.map((plot) => {
              let statusColor = COLORS.primary; // Default green for Verified
              if (plot.status === 'Pending Verification' || plot.status === 'Pending') statusColor = COLORS.warning;
              else if (plot.status === 'Rejected') statusColor = COLORS.danger;
              else if (plot.status === 'Auditing' || plot.status === 'Under Review') statusColor = '#3B82F6'; // Blue
              else if (plot.status === 'Verified' || plot.status === 'Approved') statusColor = COLORS.success;

              return (
                <TouchableOpacity
                  key={plot.id}
                  style={[styles.familyCard, { alignItems: 'center', paddingHorizontal: 12, width: 'auto', minWidth: 100 }]}
                  onPress={() => {
                    setSelectedPlot(plot);
                    setTrackingModalVisible(true);
                  }}
                >
                  <MaterialCommunityIcons name="image-filter-hdr" size={24} color={COLORS.primary} />
                  <Text style={[styles.familyName, { textAlign: 'center' }]} numberOfLines={1}>{plot.acres} Acres</Text>
                  <View style={{ marginTop: 8, alignSelf: 'center', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 4, backgroundColor: `${statusColor}20` }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: statusColor, textTransform: 'uppercase', textAlign: 'center' }}>
                      {plot.status === 'Verified' ? 'Approved' : plot.status}
                    </Text>
                  </View>
                  {plot.status === 'Rejected' && plot.remarks && (
                    <Text style={{ fontSize: 9, color: COLORS.danger, textAlign: 'center', marginTop: 4, paddingHorizontal: 4 }}>
                      {plot.remarks}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Village Impact Scorecard */}
        <View style={styles.villageScorecard}>
          <View style={styles.villageHeader}>
            <MaterialCommunityIcons name="home-group" size={22} color={COLORS.primary} style={{ marginRight: 8 }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.villageTitle}>Bhopal Rural Community Impact</Text>
              <Text style={styles.villageSub}>Bhopal District • Active carbon block</Text>
            </View>
            <View style={styles.villageBadge}>
              <Text style={styles.villageBadgeText}>Rank #3</Text>
            </View>
          </View>
          
          <Text style={styles.villageGoalLabel}>Block Goal: 5,000 verified border trees</Text>
          <View style={styles.villageProgressContainer}>
            <View style={styles.villageProgressBar}>
              <View style={[styles.villageProgressFill, { width: '96.4%' }]} />
            </View>
            <Text style={styles.villageProgressText}>4,820 / 5,000 Trees Planted (96.4%)</Text>
          </View>
          
          <View style={styles.villageStatsGrid}>
            <View style={styles.villageStatBox}>
              <Text style={styles.villageStatLabel}>Verified CO₂ Saved</Text>
              <Text style={styles.villageStatVal}>124.5 Tons</Text>
            </View>
            <View style={styles.villageStatBox}>
              <Text style={styles.villageStatLabel}>Village Payout pool</Text>
              <Text style={[styles.villageStatVal, { color: COLORS.primary }]}>₹1.48 Lakhs</Text>
            </View>
          </View>
        </View>

        {/* Sustainability Badge Cabinet */}
        <Text style={styles.sectionLabel}>Eco Badge Cabinet</Text>
        <View style={styles.badgeCabinetGroup}>
          {BADGES.map((badge) => (
            <TouchableOpacity 
              key={badge.id} 
              style={[
                styles.badgeRow,
                badge.unlocked ? styles.badgeRowUnlocked : styles.badgeRowLocked
              ]}
              onPress={() => handleBadgePress(badge)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.badgeCabinetIconBox,
                { backgroundColor: badge.unlocked ? '#ECFDF5' : '#E2E8F0' }
              ]}>
                <MaterialCommunityIcons 
                  name={badge.icon as any} 
                  size={24} 
                  color={badge.unlocked ? badge.color : '#94A3B8'} 
                />
              </View>
              <View style={styles.badgeTextCol}>
                <View style={styles.badgeNameRow}>
                  <Text style={[
                    styles.badgeName,
                    { color: badge.unlocked ? COLORS.textDark : '#64748B' }
                  ]}>{badge.title}</Text>
                  <View style={[
                    styles.badgeRowLevel,
                    { backgroundColor: badge.unlocked ? COLORS.primary : '#94A3B8' }
                  ]}>
                    <Text style={styles.badgeLevelText}>{badge.level}</Text>
                  </View>
                </View>
                <Text style={styles.badgeDesc} numberOfLines={1}>{badge.desc}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={16} color="#94A3B8" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Schemes Section */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
          <Text style={[styles.sectionLabel, { marginBottom: 0 }]}>{t('schemes.title')}</Text>
          <TouchableOpacity onPress={() => router.push('/schemes' as any)}>
            <Text style={{ fontSize: 11, color: COLORS.primaryLight, fontWeight: '800', marginRight: 4 }}>View Dashboard</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.settingsGroup}>
          {schemes.map((sch) => (
            <View key={sch.scheme_id} style={styles.schemeItem}>
              <View style={styles.schemeHeader}>
                <Text style={styles.schemeName}>{sch.scheme_name}</Text>
                <View style={[
                  styles.schemeStatus, 
                  sch.status === 'Approved' ? styles.statusApproved : sch.status === 'Applied' ? styles.statusApplied : styles.statusNotApplied
                ]}>
                  <Text style={[
                    styles.schemeStatusText,
                    sch.status === 'Approved' ? styles.statusApprovedText : sch.status === 'Applied' ? styles.statusAppliedText : styles.statusNotAppliedText
                  ]}>
                    {sch.status}
                  </Text>
                </View>
              </View>
              <Text style={styles.schemeDesc}>{sch.short_description}</Text>
            </View>
          ))}
        </View>

        {/* Insurance & Certificates */}
        <Text style={styles.sectionLabel}>Insurance & Cover</Text>
        <View style={styles.settingsGroup}>
          {renderSettingItem(
            'certificate', 
            'View Eco-Shield Certificate', 
            'View or download active insurance certificates',
            undefined,
            () => router.push('/insurance/certificate' as any)
          )}
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>{t('profile.language')}</Text>
        <View style={styles.settingsGroup}>
          {renderSettingItem(
            'translate', 
            'App Language / ऐप की भाषा', 
            activeLanguage === 'en' ? 'Current: English (टैप करें)' : 'वर्तमान भाषा: हिंदी (Tap here)',
            <View style={styles.langBadge}>
              <Text style={styles.langBadgeText}>{activeLanguage === 'en' ? 'EN' : 'HI'}</Text>
            </View>,
            handleLanguageToggle
          )}
        </View>

        {/* Preferences */}
        <Text style={styles.sectionLabel}>{t('profile.settings')}</Text>
        <View style={styles.settingsGroup}>
          {renderSettingItem(
            'bell-outline', 
            'Push Notifications', 
            'Get payout alerts and updates',
            <Switch 
              value={isNotificationsEnabled} 
              onValueChange={setIsNotificationsEnabled}
              trackColor={{ false: '#E2E8F0', true: COLORS.primary }}
              thumbColor="#fff"
            />,
            () => setIsNotificationsEnabled(!isNotificationsEnabled)
          )}
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
          <MaterialCommunityIcons name="logout" size={22} color={COLORS.danger} />
          <Text style={styles.logoutText}>{t('profile.logout')}</Text>
        </TouchableOpacity>
        
        <Text style={styles.versionText}>BhumiCred Farmer App v1.2.0 (Build 98)</Text>
      </ScrollView>

      {/* Interactive Details Bottom Sheet Modal */}
      <Modal
        visible={isBadgeDrawerVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setIsBadgeDrawerVisible(false)}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => setIsBadgeDrawerVisible(false)}
        >
          <View style={styles.sheet} onStartShouldSetResponder={() => true}>
            {selectedBadge && (
              <View style={styles.drawerSheetContent}>
                <View style={styles.drawerSheetHeader}>
                  <View style={[
                    styles.drawerIconBox, 
                    { backgroundColor: selectedBadge.unlocked ? '#ECFDF5' : '#F1F5F9' }
                  ]}>
                    <MaterialCommunityIcons 
                      name={selectedBadge.icon as any} 
                      size={28} 
                      color={selectedBadge.unlocked ? selectedBadge.color : '#94A3B8'} 
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.drawerTitle}>{selectedBadge.title}</Text>
                    <View style={[
                      styles.drawerLevelBadge,
                      { backgroundColor: selectedBadge.unlocked ? COLORS.primary : '#94A3B8' }
                    ]}>
                      <Text style={styles.drawerLevelText}>{selectedBadge.level}</Text>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setIsBadgeDrawerVisible(false)}>
                    <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
                  </TouchableOpacity>
                </View>

                <Text style={styles.drawerSectionLabel}>Requirement & Description</Text>
                <Text style={styles.drawerDescText}>{selectedBadge.desc}</Text>

                <Text style={styles.drawerSectionLabel}>Progress Status</Text>
                <View style={styles.drawerProgressRow}>
                  <View style={styles.drawerProgressBarBg}>
                    <View style={[
                      styles.drawerProgressBarFill, 
                      { width: selectedBadge.progress, backgroundColor: selectedBadge.unlocked ? COLORS.success : COLORS.warning }
                    ]} />
                  </View>
                  <Text style={styles.drawerProgressText}>{selectedBadge.progressText}</Text>
                </View>

                <Text style={styles.drawerSectionLabel}>Verification Reward</Text>
                <View style={styles.drawerRewardRow}>
                  <MaterialCommunityIcons name="gift-outline" size={16} color={COLORS.primaryLight} style={{ marginRight: 6 }} />
                  <Text style={styles.drawerRewardText}>{selectedBadge.reward}</Text>
                </View>

                <TouchableOpacity 
                  style={[
                    styles.drawerActionBtn,
                    { backgroundColor: selectedBadge.unlocked ? COLORS.primary : COLORS.warning }
                  ]}
                  onPress={() => {
                    setIsBadgeDrawerVisible(false);
                    if (!selectedBadge.unlocked) {
                      DeviceEventEmitter.emit('openGlobalScheduler');
                    } else {
                      Alert.alert('Congratulations!', 'This badge is fully verified and active.');
                    }
                  }}
                  activeOpacity={0.8}
                >
                  <Text style={styles.drawerActionLabel}>
                    {selectedBadge.unlocked ? 'View Rewards Ledger' : 'Plant Saplings / Register Now'}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Image Picker Options Modal */}
      <Modal visible={isImagePickerOptionsVisible} transparent animationType="fade" onRequestClose={() => setIsImagePickerOptionsVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsImagePickerOptionsVisible(false)}>
          <View style={styles.pickerSheet}>
            <Text style={styles.pickerTitle}>Profile Photo</Text>
            
            <TouchableOpacity style={styles.pickerOption} onPress={handleTakePic}>
              <View style={styles.pickerIconBox}><MaterialCommunityIcons name="camera" size={24} color={COLORS.primary} /></View>
              <Text style={styles.pickerOptionText}>Take a picture</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.pickerOption} onPress={handleUploadPic}>
              <View style={styles.pickerIconBox}><MaterialCommunityIcons name="image" size={24} color={COLORS.primary} /></View>
              <Text style={styles.pickerOptionText}>Upload from gallery</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {selectedPlot && (
        <TrackingModal
          visible={trackingModalVisible}
          onClose={() => setTrackingModalVisible(false)}
          plotId={selectedPlot.id}
          status={selectedPlot.status}
        />
      )}

    </AmbientEcoBackground>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 30,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  profileHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  editAvatarButton: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedAvatarBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#FFFFFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    fontWeight: '800',
    marginBottom: 2,
  },
  profilePhone: {
    fontSize: 13,
    color: '#E0F2F1',
    marginBottom: 6,
  },
  uhidBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  uhidText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  sectionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 24,
    marginTop: -10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: COLORS.primary,
  },
  addText: {
    fontSize: 11,
    color: COLORS.primaryLight,
    fontWeight: '800',
  },
  horizontalScroll: {
    marginHorizontal: -4,
  },
  familyCard: {
    backgroundColor: '#F0FDF4',
    width: 90,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  familyName: {
    fontSize: 12,
    color: COLORS.textDark,
    marginTop: 6,
    fontWeight: '800',
  },
  familyRelation: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '500',
    marginTop: 2,
  },
  sectionLabel: {
    fontSize: 11,
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 10,
    marginLeft: 4,
    fontWeight: '800',
  },
  settingsGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  settingTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  settingTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  settingSubtitle: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  langBadge: {
    backgroundColor: COLORS.accent,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  langBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  schemeItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  schemeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  schemeName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
    flex: 1.2,
  },
  schemeStatus: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusApproved: {
    backgroundColor: '#ECFDF5',
  },
  statusApprovedText: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: '800',
  },
  schemeStatusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  statusApplied: {
    backgroundColor: '#FEF3C7',
  },
  statusAppliedText: {
    color: COLORS.warning,
    fontSize: 8,
    fontWeight: '800',
  },
  statusNotApplied: {
    backgroundColor: '#F1F5F9',
  },
  statusNotAppliedText: {
    color: COLORS.textSecondary,
    fontSize: 8,
    fontWeight: '800',
  },
  schemeDesc: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 6,
    lineHeight: 14,
    fontWeight: '500',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  logoutText: {
    fontSize: 14,
    color: COLORS.danger,
    fontWeight: '800',
    marginLeft: 8,
  },
  versionText: {
    fontSize: 10,
    color: '#94A3B8',
    textAlign: 'center',
    marginTop: 24,
    fontWeight: '600',
  },
  // Badge cabinet styles
  badgeCabinetGroup: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 24,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  badgeRowUnlocked: {
    backgroundColor: '#FFFFFF',
  },
  badgeRowLocked: {
    backgroundColor: '#F8FAFC',
    opacity: 0.85,
  },
  badgeCabinetIconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    ...SHADOWS.soft,
  },
  badgeTextCol: {
    flex: 1,
  },
  badgeNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeName: {
    fontSize: 13,
    fontWeight: '800',
  },
  badgeRowLevel: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeLevelText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  badgeDesc: {
    fontSize: 10.5,
    color: COLORS.textSecondary,
    marginTop: 4,
    lineHeight: 14,
    fontWeight: '500',
  },
  // Digital ID Card Header
  idCardContainer: {
    paddingTop: Platform.OS === 'ios' ? 55 : 40,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  idCardGrad: {
    borderRadius: 24,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#84CC16', // Glowing Lime Green Border
    ...SHADOWS.limeGlow,
  },
  uhidBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  idBrandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  idBrandText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#84CC16',
    letterSpacing: 0.5,
  },
  verifiedDecagramBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  verifiedDecagramText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.3,
  },
  idCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 14,
  },
  idFooterLabel: {
    fontSize: 8.5,
    fontWeight: '800',
    color: '#A7F3D0',
    textTransform: 'uppercase',
  },
  rankPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginTop: 4,
  },
  rankPillText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  barcodeCol: {
    alignItems: 'flex-end',
  },
  barcodeRow: {
    flexDirection: 'row',
    height: 18,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  barcodeLine: {
    height: '100%',
    backgroundColor: '#022C22',
  },
  barcodeLabel: {
    fontSize: 6.5,
    fontWeight: '800',
    color: '#84CC16',
    marginTop: 4,
    letterSpacing: 0.2,
  },
  // Village Impact Scorecard
  villageScorecard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  villageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  villageTitle: {
    fontSize: 13.5,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  villageSub: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  villageBadge: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  villageBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
  },
  villageGoalLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  villageProgressContainer: {
    marginBottom: 16,
  },
  villageProgressBar: {
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
  },
  villageProgressFill: {
    height: '100%',
    backgroundColor: COLORS.success,
    borderRadius: 5,
  },
  villageProgressText: {
    fontSize: 9.5,
    color: COLORS.textSecondary,
    fontWeight: '700',
    marginTop: 4,
    textAlign: 'right',
  },
  villageStatsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1.5,
    borderTopColor: '#F1F5F9',
    paddingTop: 12,
  },
  villageStatBox: {
    width: '48%',
  },
  villageStatLabel: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  villageStatVal: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.textDark,
    marginTop: 2,
  },
  // Details Modal styles
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 44, 34, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    minHeight: 380,
  },
  drawerSheetContent: {
    width: '100%',
  },
  drawerSheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    borderBottomWidth: 1.5,
    borderBottomColor: '#F1F5F9',
    paddingBottom: 14,
  },
  drawerIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
    ...SHADOWS.soft,
  },
  drawerTitle: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  drawerLevelBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  drawerLevelText: {
    fontSize: 8.5,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  drawerSectionLabel: {
    fontSize: 9.5,
    fontWeight: '800',
    color: COLORS.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  drawerDescText: {
    fontSize: 12,
    color: COLORS.textDark,
    lineHeight: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  drawerProgressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  drawerProgressBarBg: {
    flex: 1,
    height: 10,
    backgroundColor: '#F1F5F9',
    borderRadius: 5,
    overflow: 'hidden',
    marginRight: 12,
  },
  drawerProgressBarFill: {
    height: '100%',
    borderRadius: 5,
  },
  drawerProgressText: {
    fontSize: 11,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  drawerRewardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 24,
  },
  drawerRewardText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  drawerActionBtn: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.soft,
  },
  drawerActionLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  pickerSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  pickerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: COLORS.textDark,
    marginBottom: 20,
  },
  pickerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  pickerIconBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  pickerOptionText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.textDark,
  },
});
