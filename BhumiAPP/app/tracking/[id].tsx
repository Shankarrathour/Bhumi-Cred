import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Animated, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

import MapView, { Marker, Polyline } from '../../components/MapViewProxy';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

const TRACKING_STEPS = [
  { id: 1, title: 'Inspection Confirmed', icon: 'check-circle', time: '08:00 AM' },
  { id: 2, title: 'Soil Officer Assigned', icon: 'account-check', time: '08:15 AM' },
  { id: 3, title: 'Drone Inspector En Route', icon: 'drone', time: 'Expected 08:45 AM' },
  { id: 4, title: 'Soil Core Samples Collected', icon: 'sprout', time: 'Pending' },
  { id: 5, title: 'Carbon MRV Certificate Ready', icon: 'file-certificate-outline', time: 'Pending' },
];

export default function TrackingScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();

  const USER_LOCATION = { latitude: 23.2599, longitude: 77.4126 }; // Bhopal Rural Plot
  const START_LOCATION = { latitude: 23.2520, longitude: 77.4080 };

  // Simulate progress steps & vehicle telemetry
  const [currentStep, setCurrentStep] = useState(3);
  const [techProgress, setTechProgress] = useState(0); // 0 to 100

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle) => {
    if (Platform.OS !== 'web') {
      Haptics.impactAsync(style);
    }
  };

  useEffect(() => {
    // Progress through status steps
    const stepTimer = setInterval(() => {
      setCurrentStep(prev => {
        const next = prev < 5 ? prev + 1 : prev;
        if (next === 4 && Platform.OS !== 'web') {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
        return next;
      });
    }, 15000);

    // Move the drone smoothly along route
    const trackerTimer = setInterval(() => {
      setTechProgress(prev => {
        if (prev >= 100) return 100;
        return prev + 0.5; // Incremental crawl
      });
    }, 150);

    return () => {
      clearInterval(stepTimer);
      clearInterval(trackerTimer);
    };
  }, []);

  // Linearly interpolate current position
  const currentTechCoord = {
    latitude: START_LOCATION.latitude + (USER_LOCATION.latitude - START_LOCATION.latitude) * (techProgress / 100),
    longitude: START_LOCATION.longitude + (USER_LOCATION.longitude - START_LOCATION.longitude) * (techProgress / 100),
  };

  // Dynamic Telemetry Calculations
  const totalKm = 1.8;
  const remainingKm = Math.max(0, (totalKm * (1 - techProgress / 100))).toFixed(2);
  const etaMins = Math.max(0, Math.ceil(6 * (1 - techProgress / 100)));

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
        <Text style={styles.headerTitle}>Track Dispatch</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Map View */}
      <View style={styles.mapContainer}>
        {Platform.OS === 'web' ? (
          <View style={[styles.map, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#F0FDF4' }]}>
            <MaterialCommunityIcons name="map-marker-radius" size={40} color={COLORS.primary} />
            <Text style={{ color: COLORS.primaryDark, marginTop: 10, fontWeight: 'bold' }}>Live tracking optimized for Mobile</Text>
          </View>
        ) : (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: 23.2560,
              longitude: 77.4100,
              latitudeDelta: 0.015,
              longitudeDelta: 0.015,
            }}
          >
            {/* Dynamic Drone Location */}
            <Marker coordinate={currentTechCoord}>
              <View style={styles.techMarker}>
                <MaterialCommunityIcons name="drone" size={22} color={COLORS.textLight} />
              </View>
            </Marker>
            {/* Farm Plot Location */}
            <Marker coordinate={USER_LOCATION}>
              <View style={styles.userMarker}>
                <MaterialCommunityIcons name="image-filter-hdr" size={20} color={COLORS.primary} />
              </View>
            </Marker>
            {/* Dynamic Route remaining */}
            <Polyline 
              coordinates={[
                currentTechCoord,
                USER_LOCATION
              ]}
              strokeColor={COLORS.primary}
              strokeWidth={3}
              lineDashPattern={[5, 5]}
            />
          </MapView>
        )}

        {/* Floating Dynamic Telemetry Pill */}
        <View style={styles.telemetryPill}>
          <View style={styles.pulseContainer}>
            <View style={styles.pulseDot} />
          </View>
          <Text style={styles.telemetryText}>
            {techProgress >= 100 
              ? "Inspector Arrived • Mapping GPS Boundaries" 
              : `Inspector Rahul is ${remainingKm} km away • ${etaMins} mins`}
          </Text>
        </View>

        {/* Tech Info Card Overlay */}
        <View style={styles.techInfoCard}>
          <View style={styles.techAvatar}>
            <MaterialCommunityIcons name="account-cowboy-hat" size={28} color={COLORS.textLight} />
          </View>
          <View style={styles.techDetails}>
            <Text style={styles.techName}>Rahul Kumar</Text>
            <Text style={styles.techSub}>Soil Verification Officer • 4.9 ★</Text>
          </View>
          <TouchableOpacity 
            style={styles.callBtn}
            onPress={() => triggerHaptic(Haptics.ImpactFeedbackStyle.Light)}
            accessibilityRole="button"
          >
            <MaterialCommunityIcons name="phone" size={20} color={COLORS.textLight} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Tracking Timeline */}
      <ScrollView style={styles.timelineContainer} showsVerticalScrollIndicator={false}>
        <Text style={styles.bookingIdText}>Inspection ID: {id}</Text>
        <View style={styles.timeline}>
          {TRACKING_STEPS.map((step, index) => {
            const isCompleted = step.id <= currentStep;
            const isCurrent = step.id === currentStep;
            const isLast = index === TRACKING_STEPS.length - 1;

            return (
              <View key={step.id} style={styles.stepRow}>
                <View style={styles.stepIndicatorContainer}>
                  <View style={[
                    styles.stepCircle,
                    isCompleted && styles.stepCircleCompleted,
                    isCurrent && styles.stepCircleCurrent
                  ]}>
                    <MaterialCommunityIcons 
                      name={step.icon as any} 
                      size={16} 
                      color={isCompleted ? COLORS.textLight : COLORS.border} 
                    />
                  </View>
                  {!isLast && (
                    <View style={[
                      styles.stepLine,
                      isCompleted && styles.stepLineCompleted
                    ]} />
                  )}
                </View>

                <View style={styles.stepContent}>
                  <Text style={[
                    styles.stepTitle,
                    isCompleted && styles.stepTitleCompleted
                  ]}>{step.title}</Text>
                  <Text style={styles.stepTime}>{step.time}</Text>
                </View>
              </View>
            );
          })}
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
    backgroundColor: COLORS.primary,
    paddingTop: 50,
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
  mapContainer: {
    height: 320,
    width: '100%',
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  techMarker: {
    backgroundColor: COLORS.primary,
    padding: 8,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#fff',
    ...SHADOWS.glow,
  },
  userMarker: {
    backgroundColor: '#fff',
    padding: 8,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.soft,
  },
  techInfoCard: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.soft,
  },
  techAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  techDetails: {
    flex: 1,
  },
  techName: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.textDark,
    fontWeight: 'bold',
  },
  techSub: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '600',
  },
  callBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.glow,
  },
  timelineContainer: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    marginTop: -24,
    padding: 24,
    ...SHADOWS.soft,
  },
  bookingIdText: {
    ...TYPOGRAPHY.subtitle,
    color: COLORS.primaryDark,
    fontWeight: '800',
    marginBottom: 20,
  },
  timeline: {
    paddingLeft: 8,
  },
  stepRow: {
    flexDirection: 'row',
  },
  stepIndicatorContainer: {
    alignItems: 'center',
    marginRight: 16,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepCircleCompleted: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepCircleCurrent: {
    borderWidth: 3,
    borderColor: COLORS.primaryLight,
  },
  stepLine: {
    width: 2.5,
    height: 44,
    backgroundColor: COLORS.border,
    marginVertical: 4,
  },
  stepLineCompleted: {
    backgroundColor: COLORS.primary,
  },
  stepContent: {
    flex: 1,
    paddingTop: 4,
    paddingBottom: 28,
  },
  stepTitle: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 4,
  },
  stepTitleCompleted: {
    color: COLORS.textDark,
    fontWeight: '700',
  },
  stepTime: {
    ...TYPOGRAPHY.caption,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  telemetryPill: {
    position: 'absolute',
    top: 16,
    alignSelf: 'center',
    backgroundColor: 'rgba(6, 78, 59, 0.9)', // forest green translucent
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    ...SHADOWS.soft,
    zIndex: 999,
  },
  telemetryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    marginLeft: 8,
  },
  pulseContainer: {
    width: 10,
    height: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.accent, // bright lime eco light
  },
});
