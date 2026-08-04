import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

export default function ContactScreen() {
  const router = useRouter();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  const handleAction = (type: 'call' | 'email' | 'web' | 'map') => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    let url = '';
    switch (type) {
      case 'call':
        url = 'tel:+919205109007';
        break;
      case 'email':
        url = 'mailto:support@bhumicred.org';
        break;
      case 'web':
        url = 'https://www.bhumicred.org';
        break;
      case 'map':
        url = Platform.select({
          ios: 'maps:0,0?q=Bhopal, Madhya Pradesh, India',
          android: 'geo:0,0?q=Bhopal, Madhya Pradesh, India'
        }) || '';
        break;
    }
    if (url) {
      Linking.openURL(url).catch(() => {
        // Fail-safe catch
      });
    }
  };

  const renderContactRow = (
    icon: string, 
    title: string, 
    value: string, 
    onPress?: () => void
  ) => (
    <TouchableOpacity 
      style={styles.rowCard} 
      activeOpacity={onPress ? 0.7 : 1}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.iconWrapper}>
        <LinearGradient 
          colors={['rgba(0, 109, 111, 0.1)', 'rgba(20, 184, 166, 0.1)']} 
          style={styles.iconBg}
        >
          <MaterialCommunityIcons name={icon as any} size={22} color={COLORS.primary} />
        </LinearGradient>
      </View>
      <View style={styles.textWrapper}>
        <Text style={styles.rowTitle}>{title}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
      {onPress && (
        <MaterialCommunityIcons name="chevron-right" size={18} color="#94A3B8" />
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Deep Forest Gradient Header */}
      <LinearGradient 
        colors={[COLORS.primary, '#005F46']} 
        style={styles.header}
      >
        <View style={styles.headerBar}>
          <TouchableOpacity 
            style={styles.backBtn} 
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFF" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Support Desk</Text>
          <View style={{ width: 40 }} />
        </View>

        {/* Premium Graphic Banner */}
        <View style={styles.banner}>
          <View style={styles.supportIconCircle}>
            <MaterialCommunityIcons name="face-agent" size={48} color="#FFF" />
          </View>
          <Text style={styles.bannerHeading}>How can we assist you?</Text>
          <Text style={styles.bannerSubtext}>Reach out to our specialized sustainability registry support desk for any inquiries.</Text>
        </View>
      </LinearGradient>

      <ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={styles.scrollBody}
      >
        <View style={styles.contentCard}>
          <Text style={styles.sectionHeading}>Soil Lab & Registry Details</Text>
          
          {renderContactRow(
            'map-marker-outline', 
            'Central Hub Location', 
            'Bhopal, Madhya Pradesh, India',
            () => handleAction('map')
          )}
          
          <View style={styles.divider} />

          {renderContactRow(
            'phone-in-talk', 
            'Support Phone Number', 
            '+91-9205109007',
            () => handleAction('call')
          )}
          
          <View style={styles.divider} />

          {renderContactRow(
            'email-edit-outline', 
            'Registry Support Email', 
            'support@bhumicred.org',
            () => handleAction('email')
          )}
          
          <View style={styles.divider} />

          {renderContactRow(
            'clock-time-five-outline', 
            'Inspection Operating Timings', 
            'Mon–Sat: 8 AM – 6 PM'
          )}
          
          <View style={styles.divider} />

          {renderContactRow(
            'web', 
            'Official Website', 
            'www.bhumicred.org',
            () => handleAction('web')
          )}
        </View>

        <View style={styles.footerMessage}>
          <Text style={styles.footerText}>BhumiCred is committed to giving you prompt assistance for all soil inspections, tree plantations, and carbon credit queries.</Text>
        </View>
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
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 32,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    ...SHADOWS.soft,
    elevation: 6,
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    height: 48,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 0.5,
  },
  banner: {
    alignItems: 'center',
    paddingHorizontal: 24,
    marginTop: 16,
  },
  supportIconCircle: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  bannerHeading: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFF',
    textAlign: 'center',
    marginBottom: 6,
  },
  bannerSubtext: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 10,
  },
  scrollBody: {
    padding: 20,
    paddingBottom: 40,
  },
  contentCard: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
    elevation: 3,
  },
  sectionHeading: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.primaryDark,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 4,
  },
  iconWrapper: {
    marginRight: 16,
  },
  iconBg: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textWrapper: {
    flex: 1,
  },
  rowTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginBottom: 3,
  },
  rowValue: {
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  footerMessage: {
    marginTop: 24,
    paddingHorizontal: 16,
  },
  footerText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontStyle: 'italic',
  },
});
