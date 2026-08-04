import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import Animated, { FadeInUp, FadeInDown } from 'react-native-reanimated';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

const TIMELINE_STEPS = [
  { id: 1, title: 'Application Submitted', desc: 'Your carbon credit program application was successfully lodged.', icon: 'file-document-check' },
  { id: 2, title: 'Document Verification', desc: 'Khasra/Khatauni land ownership proofs verified by regional admin.', icon: 'shield-check' },
  { id: 3, title: 'Admin Review & GIS Audit', desc: 'Remote sensing checks to confirm farm boundary and agroforestry viability.', icon: 'satellite-uplink' },
  { id: 4, title: 'Project Assignment', desc: 'Application approved! Land assigned to an active carbon mitigation project.', icon: 'sprout' },
];

export default function ApplicationTrackingScreen() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(2); // Starts at step 3 active (index 2)
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    // Mock simulation of admin approval process
    let timer1: ReturnType<typeof setTimeout>;
    let timer2: ReturnType<typeof setTimeout>;

    timer1 = setTimeout(() => {
      // Advance to Admin Review complete
      setCurrentStep(3);
      if (Platform.OS !== 'web') Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      
      timer2 = setTimeout(() => {
        // Advance to Project Assignment (Approved)
        setCurrentStep(4);
        setIsApproved(true);
        if (Platform.OS !== 'web') Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        
        // Auto-redirect to Projects page after a short delay showing the approval
        setTimeout(() => {
          router.replace('/(tabs)/projects');
        }, 2000);

      }, 3000);
    }, 2500);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Application Tracker</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Animated.View entering={FadeInDown.duration(600)} style={styles.topCard}>
          <View style={styles.topRow}>
            <MaterialCommunityIcons name="clipboard-text-clock" size={28} color={COLORS.primary} />
            <View style={styles.topInfo}>
              <Text style={styles.topId}>App ID: #CRB-88392X</Text>
              <Text style={styles.topStatus}>{isApproved ? 'Approved' : 'Under Review'}</Text>
            </View>
          </View>
          <View style={styles.progressBarBg}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { width: `${(currentStep / TIMELINE_STEPS.length) * 100}%` }
              ]} 
            />
          </View>
        </Animated.View>

        <View style={styles.timelineContainer}>
          {TIMELINE_STEPS.map((step, index) => {
            const isCompleted = index < currentStep;
            const isActive = index === currentStep;
            
            return (
              <Animated.View 
                key={step.id} 
                entering={FadeInUp.delay(index * 150).duration(500)} 
                style={styles.timelineRow}
              >
                <View style={styles.bulletCol}>
                  <View style={[
                    styles.circle,
                    isCompleted && styles.circleCompleted,
                    isActive && styles.circleActive,
                    !isCompleted && !isActive && styles.circlePending
                  ]}>
                    <MaterialCommunityIcons 
                      name={step.icon as any} 
                      size={18} 
                      color={isCompleted || isActive ? '#FFFFFF' : '#94A3B8'} 
                    />
                  </View>
                  {index < TIMELINE_STEPS.length - 1 && (
                    <View style={[
                      styles.connector,
                      isCompleted && styles.connectorCompleted
                    ]} />
                  )}
                </View>

                <View style={[
                  styles.card,
                  isActive && styles.cardActive,
                  isCompleted && styles.cardCompleted
                ]}>
                  <View style={styles.cardHeader}>
                    <Text style={[
                      styles.cardTitle,
                      (isActive || isCompleted) && { color: COLORS.textDark }
                    ]}>
                      {step.title}
                    </Text>
                    {isCompleted && (
                      <MaterialCommunityIcons name="check-circle" size={16} color={COLORS.success} />
                    )}
                  </View>
                  <Text style={styles.cardDesc}>{step.desc}</Text>
                  
                  {isActive && !isApproved && (
                    <View style={styles.processingBadge}>
                      <MaterialCommunityIcons name="loading" size={14} color="#D97706" style={styles.spinner} />
                      <Text style={styles.processingText}>Processing...</Text>
                    </View>
                  )}
                  {isActive && isApproved && (
                    <View style={[styles.processingBadge, { backgroundColor: '#D1FAE5' }]}>
                      <MaterialCommunityIcons name="check-all" size={14} color={COLORS.success} />
                      <Text style={[styles.processingText, { color: COLORS.success }]}>Approved! Redirecting...</Text>
                    </View>
                  )}
                </View>
              </Animated.View>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
    paddingBottom: 20,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backBtn: { padding: 8 },
  headerTitle: { ...TYPOGRAPHY.h2, color: COLORS.textLight },
  content: { flex: 1, padding: 20 },
  topCard: {
    backgroundColor: '#FFFFFF', borderRadius: 16, padding: 20, marginBottom: 30,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.soft
  },
  topRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  topInfo: { marginLeft: 12 },
  topId: { fontSize: 13, color: COLORS.textSecondary, fontWeight: '700', marginBottom: 2 },
  topStatus: { fontSize: 18, color: COLORS.primaryDark, fontWeight: '900' },
  progressBarBg: { height: 8, backgroundColor: '#F1F5F9', borderRadius: 4, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: COLORS.primary, borderRadius: 4 },
  
  timelineContainer: { paddingLeft: 10 },
  timelineRow: { flexDirection: 'row', marginBottom: 0 },
  bulletCol: { width: 40, alignItems: 'center' },
  circle: { width: 36, height: 36, borderRadius: 18, justifyContent: 'center', alignItems: 'center', zIndex: 2 },
  circleCompleted: { backgroundColor: COLORS.success },
  circleActive: { backgroundColor: COLORS.primary, ...SHADOWS.glow },
  circlePending: { backgroundColor: '#E2E8F0' },
  connector: { width: 2, flex: 1, backgroundColor: '#E2E8F0', marginVertical: -4, zIndex: 1 },
  connectorCompleted: { backgroundColor: COLORS.success },
  
  card: { flex: 1, marginLeft: 12, paddingBottom: 32 },
  cardActive: { opacity: 1 },
  cardCompleted: { opacity: 0.8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: { fontSize: 15, fontWeight: '800', color: COLORS.textSecondary, marginBottom: 4 },
  cardDesc: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 18 },
  
  processingBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: '#FEF3C7',
    alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginTop: 12
  },
  processingText: { fontSize: 11, fontWeight: 'bold', color: '#D97706', marginLeft: 6 },
  spinner: { transform: [{ rotate: '45deg' }] } // simple mock static rotation instead of full animation for clarity
});
