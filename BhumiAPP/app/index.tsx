import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Animated, Text, Platform } from 'react-native';
import { router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../src/theme/theme';
import { useAuthStore } from '../src/store/authStore';

const { width, height } = Dimensions.get('window');

// Number of particle floaters to render
const PARTICLE_COUNT = 15;

export default function SplashScreen() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const user = useAuthStore((state) => state.user);
  const role = useAuthStore((state) => state.role);
  const vendor = useAuthStore((state) => state.vendor);

  // Logo animations
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  // Glow ring pulse animation
  const pulseRingScale = useRef(new Animated.Value(0.8)).current;
  const pulseRingOpacity = useRef(new Animated.Value(0.6)).current;

  // Tagline animation
  const taglineOpacity = useRef(new Animated.Value(0)).current;
  const taglineTranslateY = useRef(new Animated.Value(15)).current;

  // Particle animations
  const particles = useRef(
    Array.from({ length: PARTICLE_COUNT }).map(() => ({
      x: Math.random() * width,
      y: height + Math.random() * 100,
      size: Math.random() * 8 + 4,
      speed: Math.random() * 3 + 1.5,
      anim: new Animated.Value(0),
    }))
  ).current;

  useEffect(() => {
    // 1. Logo Scale and Fade In
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 30,
        friction: 6,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Loop Glow Pulse
    Animated.loop(
      Animated.parallel([
        Animated.sequence([
          Animated.timing(pulseRingScale, {
            toValue: 1.8,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseRingScale, {
            toValue: 0.8,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
        Animated.sequence([
          Animated.timing(pulseRingOpacity, {
            toValue: 0,
            duration: 2500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseRingOpacity, {
            toValue: 0.6,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // 3. Tagline reveal after delay
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(taglineOpacity, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(taglineTranslateY, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]),
    ]).start();

    // 4. Floating Particles Loop
    particles.forEach((p) => {
      const runParticle = () => {
        p.anim.setValue(0);
        Animated.timing(p.anim, {
          toValue: 1,
          duration: (height / p.speed) * 10,
          useNativeDriver: true,
        }).start(() => {
          runParticle();
        });
      };
      runParticle();
    });

    // 5. Navigate to appropriate screen after 3 seconds
    const timer = setTimeout(() => {
      if (role === 'vendor' && vendor) {
        if (!vendor.name) {
          router.replace('/(vendor_auth)/register-wizard'); // Resume incomplete wizard
        } else if (vendor.status === 'Active') {
          router.replace('/(vendor_tabs)');
        } else if (vendor.status === 'Rejected') {
          router.replace('/(vendor_auth)/rejected');
        } else if (vendor.status === 'Suspended') {
          router.replace('/(vendor_auth)/suspended');
        } else {
          router.replace('/(vendor_auth)/pending');
        }
      } else if (isAuthenticated) {
        router.replace('/(tabs)');
      } else if (user && user.verificationStatus !== 'unverified') {
        router.replace('/onboarding'); // Onboarding step verification pending
      } else {
        router.replace('/(auth)/welcome'); // Mapped to welcome/intro onboarding slider!
      }
    }, 3000);

    return () => clearTimeout(timer);
  }, [isAuthenticated, user, role, vendor]);

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={[COLORS.primaryDark, COLORS.primary]} 
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Eco-Tech Floating Particles */}
      {particles.map((p, index) => {
        const translateY = p.anim.interpolate({
          inputRange: [0, 1],
          outputRange: [p.y, -50],
        });
        const opacity = p.anim.interpolate({
          inputRange: [0, 0.2, 0.8, 1],
          outputRange: [0, 0.7, 0.7, 0],
        });

        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: p.x,
                width: p.size,
                height: p.size,
                borderRadius: p.size / 2,
                opacity,
                transform: [{ translateY }],
              },
            ]}
          />
        );
      })}

      {/* Logo Wrapper */}
      <View style={styles.centerBox}>
        {/* Glow Ring 1 */}
        <Animated.View 
          style={[
            styles.glowRing, 
            { 
              transform: [{ scale: pulseRingScale }],
              opacity: pulseRingOpacity,
            }
          ]} 
        />
        
        {/* Animated Brand Logo */}
        <Animated.View 
          style={[
            styles.logoFrame, 
            { 
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
              ...SHADOWS.limeGlow,
            }
          ]}
        >
          <MaterialCommunityIcons name="leaf" size={68} color={COLORS.accent} />
        </Animated.View>
      </View>

      {/* Brand & Taglines */}
      <Animated.View 
        style={[
          styles.textGroup,
          {
            opacity: taglineOpacity,
            transform: [{ translateY: taglineTranslateY }],
          }
        ]}
      >
        <Text style={styles.brandTitle}>BhumiCred</Text>
        
        <View style={styles.taglineWrapper}>
          <Text style={styles.taglineText}>“Empowering Farmers Through Sustainability”</Text>
          <Text style={styles.hindiTagline}>“टिकाऊ खेती से किसान सशक्तिकरण”</Text>
        </View>
      </Animated.View>

      {/* Spinner indicator */}
      <ActivityIndicator size="small" color={COLORS.accent} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.primaryDark,
  },
  particle: {
    position: 'absolute',
    backgroundColor: COLORS.accent,
    zIndex: 1,
  },
  centerBox: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 200,
    height: 200,
    zIndex: 2,
  },
  logoFrame: {
    width: 130,
    height: 130,
    borderRadius: 65,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  glowRing: {
    position: 'absolute',
    width: 130,
    height: 130,
    borderRadius: 65,
    borderWidth: 2,
    borderColor: COLORS.accent,
  },
  textGroup: {
    alignItems: 'center',
    marginTop: 20,
    zIndex: 2,
  },
  brandTitle: {
    fontSize: 34,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  taglineWrapper: {
    alignItems: 'center',
    marginTop: 14,
    paddingHorizontal: 30,
  },
  taglineText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E2E8F0',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  hindiTagline: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.accent,
    textAlign: 'center',
    marginTop: 6,
    letterSpacing: 0.5,
  },
  spinner: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 70 : 60,
    zIndex: 2,
  },
});
