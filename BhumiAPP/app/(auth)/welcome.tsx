import React, { useState, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, Animated, StatusBar } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

const { width, height } = Dimensions.get('window');

const ONBOARDING_DATA = [
  {
    id: 1,
    title: 'Sustainability Future / सतत कृषि भविष्य',
    subtitle: 'Earn through sustainable farming.',
    hindiDesc: 'टिकाऊ और जैविक खेती अपनाएं, पर्यावरण बचाएं और हर साल अतिरिक्त कार्बन आय अर्जित करें।',
    colors: [COLORS.primaryDark, COLORS.primary] as [string, string],
    icon: 'sprout',
    iconColor: COLORS.accent,
    bgGlow: 'rgba(132, 204, 22, 0.15)',
    illustration: 'sprout-illustration',
  },
  {
    id: 2,
    title: 'Carbon Credit Ecosystem / कार्बन क्रेडिट पारिस्थितिकी तंत्र',
    subtitle: 'Register your land and join climate programs.',
    hindiDesc: 'अपनी कृषि भूमि दर्ज करें, उपग्रह के माध्यम से सत्यापन कराएं और वैश्विक जलवायु कार्यक्रमों का हिस्सा बनें।',
    colors: [COLORS.primary, COLORS.secondary] as [string, string],
    icon: 'satellite-variant',
    iconColor: '#38BDF8',
    bgGlow: 'rgba(56, 189, 248, 0.15)',
    illustration: 'satellite-illustration',
  },
  {
    id: 3,
    title: 'Marketplace & Protection / बाजार और सुरक्षा सुरक्षा',
    subtitle: 'Access marketplace, insurance & government benefits.',
    hindiDesc: 'जैविक बीज-खाद खरीदें, अपने पेड़ों का बीमा कराएं और सरकारी योजनाओं के साथ पर्यावरण संरक्षण पुरस्कार पाएं।',
    colors: [COLORS.secondary, COLORS.primaryLight] as [string, string],
    icon: 'shield-check-outline',
    iconColor: '#34D399',
    bgGlow: 'rgba(52, 211, 153, 0.15)',
    illustration: 'marketplace-illustration',
  },
];

export default function OnboardingSlider() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;

  // Pulse animation for interactive eco glow
  const pulseAnim = useRef(new Animated.Value(0.95)).current;
  React.useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.95,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleNext = () => {
    if (currentIndex < ONBOARDING_DATA.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      router.push('/(auth)/login');
    }
  };

  const handleSkip = () => {
    router.push('/(auth)/login');
  };

  const currentSlide = ONBOARDING_DATA[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={currentSlide.colors[0]} />
      
      {/* Background Gradient Transitions */}
      <LinearGradient
        colors={currentSlide.colors}
        style={StyleSheet.absoluteFillObject}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      />

      {/* Decorative Particle Glow */}
      <Animated.View 
        style={[
          styles.particleGlow, 
          { 
            backgroundColor: currentSlide.bgGlow,
            transform: [{ scale: pulseAnim }],
          }
        ]} 
      />

      {/* Top Header Row */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <MaterialCommunityIcons name="leaf" size={24} color={COLORS.accent} />
          <Text style={styles.brandText}>BhumiCred</Text>
        </View>
        
        {currentIndex < ONBOARDING_DATA.length - 1 && (
          <TouchableOpacity style={styles.skipBtn} onPress={handleSkip} activeOpacity={0.85}>
            <Text style={styles.skipText}>Skip / छोड़ें</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Slide Content Display Area */}
      <View style={styles.slideContainer}>
        {/* Core Visual Representation Sphere */}
        <Animated.View style={[styles.visualSphere, { transform: [{ scale: pulseAnim }] }]}>
          <LinearGradient
            colors={['rgba(255, 255, 255, 0.12)', 'rgba(255, 255, 255, 0.03)']}
            style={styles.innerSphere}
          >
            {/* Visual Icon Illustration for each screen */}
            {currentIndex === 0 && (
              <View style={styles.iconSproutGrid}>
                <MaterialCommunityIcons name="image-filter-hdr" size={32} color="rgba(255,255,255,0.2)" style={styles.decorHills} />
                <MaterialCommunityIcons name="sprout" size={72} color={currentSlide.iconColor} />
                <MaterialCommunityIcons name="cloud" size={28} color="rgba(255,255,255,0.25)" style={styles.decorCloud} />
              </View>
            )}
            {currentIndex === 1 && (
              <View style={styles.iconSproutGrid}>
                <MaterialCommunityIcons name="globe-model" size={60} color="rgba(255,255,255,0.15)" style={styles.decorEarth} />
                <MaterialCommunityIcons name="satellite-variant" size={76} color={currentSlide.iconColor} />
                <MaterialCommunityIcons name="pulse" size={24} color={COLORS.accent} style={styles.decorPulse} />
              </View>
            )}
            {currentIndex === 2 && (
              <View style={styles.iconSproutGrid}>
                <MaterialCommunityIcons name="shopping-outline" size={38} color="rgba(255,255,255,0.2)" style={styles.decorCart} />
                <MaterialCommunityIcons name="shield-check" size={76} color={currentSlide.iconColor} />
                <MaterialCommunityIcons name="bank-transfer" size={36} color="rgba(255,255,255,0.25)" style={styles.decorPayout} />
              </View>
            )}
          </LinearGradient>
        </Animated.View>

        {/* Text descriptions */}
        <View style={styles.textContainer}>
          <Text style={styles.slideTitle}>{currentSlide.title}</Text>
          <Text style={styles.slideSubtitle}>“{currentSlide.subtitle}”</Text>
          <Text style={styles.slideHindi}>{currentSlide.hindiDesc}</Text>
        </View>
      </View>

      {/* Bottom Control Bar */}
      <View style={[styles.footerContainer, Platform.OS !== 'ios' && { paddingBottom: 16 + insets.bottom }]}>
        {/* Pagination dot indicators */}
        <View style={styles.indicatorRow}>
          {ONBOARDING_DATA.map((_, index) => (
            <View 
              key={index} 
              style={[
                styles.dot, 
                currentIndex === index ? styles.dotActive : styles.dotInactive,
                currentIndex === index && { backgroundColor: COLORS.accent }
              ]} 
            />
          ))}
        </View>

        {/* Next/CTA Button */}
        <TouchableOpacity 
          style={styles.actionBtn} 
          onPress={handleNext} 
          activeOpacity={0.9}
        >
          <LinearGradient 
            colors={[COLORS.accent, '#A3E635']} 
            style={styles.actionBtnGrad}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            {currentIndex === ONBOARDING_DATA.length - 1 ? (
              <>
                <Text style={styles.actionBtnText}>Get Started / शुरू करें</Text>
                <MaterialCommunityIcons name="rocket-launch" size={18} color={COLORS.primaryDark} style={{ marginLeft: 8 }} />
              </>
            ) : (
              <>
                <Text style={styles.actionBtnText}>Next / आगे बढ़ें</Text>
                <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.primaryDark} style={{ marginLeft: 6 }} />
              </>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Subtitle brand tag */}
        <Text style={styles.brandTagline}>Empowering Farmers Through Sustainability • भूमि क्रेड</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  particleGlow: {
    position: 'absolute',
    top: height * 0.15,
    alignSelf: 'center',
    width: width * 0.75,
    height: width * 0.75,
    borderRadius: (width * 0.75) / 2,
    zIndex: 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 20 : 40,
    zIndex: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  brandText: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    marginLeft: 6,
    letterSpacing: 0.5,
  },
  skipBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  skipText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  slideContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
    zIndex: 1,
  },
  visualSphere: {
    width: width * 0.62,
    height: width * 0.62,
    borderRadius: (width * 0.62) / 2,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.18)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
    overflow: 'hidden',
  },
  innerSphere: {
    width: '94%',
    height: '94%',
    borderRadius: (width * 0.58) / 2,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  iconSproutGrid: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    width: '100%',
    height: '100%',
  },
  decorHills: {
    position: 'absolute',
    bottom: '22%',
    left: '18%',
  },
  decorCloud: {
    position: 'absolute',
    top: '25%',
    right: '20%',
  },
  decorEarth: {
    position: 'absolute',
    top: '15%',
    left: '15%',
  },
  decorPulse: {
    position: 'absolute',
    bottom: '28%',
    right: '22%',
  },
  decorCart: {
    position: 'absolute',
    top: '24%',
    left: '18%',
  },
  decorPayout: {
    position: 'absolute',
    bottom: '22%',
    right: '16%',
  },
  textContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  slideTitle: {
    fontSize: 14,
    fontWeight: '900',
    color: COLORS.accent,
    textTransform: 'uppercase',
    letterSpacing: 1,
    textAlign: 'center',
    marginBottom: 10,
  },
  slideSubtitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 28,
    marginBottom: 16,
  },
  slideHindi: {
    fontSize: 13,
    color: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
    paddingHorizontal: 12,
  },
  footerContainer: {
    paddingHorizontal: 30,
    paddingBottom: Platform.OS === 'ios' ? 30 : 40,
    alignItems: 'center',
    zIndex: 5,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 28,
  },
  dot: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  dotActive: {
    width: 24,
  },
  dotInactive: {
    width: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  actionBtn: {
    width: '100%',
    borderRadius: 30,
    overflow: 'hidden',
    ...SHADOWS.glow,
  },
  actionBtnGrad: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 16,
  },
  actionBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.primaryDark,
  },
  brandTagline: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.45)',
    fontWeight: '700',
    marginTop: 20,
  },
});
