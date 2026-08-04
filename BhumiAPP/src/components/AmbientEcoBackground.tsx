import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, StyleProp, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS } from '../theme/theme';

const { width, height } = Dimensions.get('window');

export type SeasonType = 'Rainy' | 'Harvest' | 'Plantation' | 'Summer' | 'Winter';

interface AmbientEcoBackgroundProps {
  children?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  season?: SeasonType;
}

export const AmbientEcoBackground: React.FC<AmbientEcoBackgroundProps> = ({ 
  children, 
  style, 
  season = 'Plantation' 
}) => {
  // Dynamic parameters based on active season
  const getSeasonConfig = (activeSeason: SeasonType) => {
    switch (activeSeason) {
      case 'Rainy':
        return {
          bgColors: ['#0F172A', '#0F766E', '#031B15'] as [string, string, string],
          glowColors: ['#14B8A6', 'transparent'] as [string, string],
          particleColor: '#38BDF8', // Rain drop sky blue
          particleGlow: '#0284C7',
          breathingSpeed: 3000,
          isRainDownwards: true,
        };
      case 'Harvest':
        return {
          bgColors: ['#1A0C02', '#451A03', '#1C1917'] as [string, string, string],
          glowColors: ['#F59E0B', 'transparent'] as [string, string],
          particleColor: '#FBBF24', // Golden harvest sparkles
          particleGlow: '#D97706',
          breathingSpeed: 4500,
          isRainDownwards: false,
        };
      case 'Summer':
        return {
          bgColors: ['#290B02', '#0A2510', '#1C0601'] as [string, string, string],
          glowColors: ['#EF4444', 'transparent'] as [string, string],
          particleColor: '#F97316', // Summer solar heat orange
          particleGlow: '#EA580C',
          breathingSpeed: 5000,
          isRainDownwards: false,
        };
      case 'Winter':
        return {
          bgColors: ['#031E18', '#013A31', '#0C0A09'] as [string, string, string],
          glowColors: ['#2DD4BF', 'transparent'] as [string, string],
          particleColor: '#E2E8F0', // Ice crystal silver-blue
          particleGlow: '#94A3B8',
          breathingSpeed: 3500,
          isRainDownwards: false,
        };
      case 'Plantation':
      default:
        return {
          bgColors: ['#022C22', '#043A2F', '#022C22'] as [string, string, string],
          glowColors: ['#0D9488', 'transparent'] as [string, string],
          particleColor: '#84CC16', // Lime green leaves
          particleGlow: '#22C55E',
          breathingSpeed: 4000,
          isRainDownwards: false,
        };
    }
  };

  const config = getSeasonConfig(season);

  // We will create 6 floating eco particles with randomized parameters
  const particleAnims = useRef(
    Array.from({ length: 6 }).map(() => ({
      translateY: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.5),
    }))
  ).current;

  // Slowly pulsating background glow opacity
  const glowAnim = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    // 1. Pulser loop for background glow depth using season's customized speed
    const pulseGlow = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, {
          toValue: 0.75,
          duration: config.breathingSpeed,
          useNativeDriver: true,
        }),
        Animated.timing(glowAnim, {
          toValue: 0.35,
          duration: config.breathingSpeed,
          useNativeDriver: true,
        }),
      ])
    );
    pulseGlow.start();

    // 2. Loop each particle based on season rules (rain drops down, seeds float up)
    particleAnims.forEach((anim, index) => {
      const delay = index * 1200;
      
      const animateParticle = () => {
        // Reset states depending on rain direction
        if (config.isRainDownwards) {
          anim.translateY.setValue(-height * 0.8);
          anim.opacity.setValue(0);
          anim.scale.setValue(Math.random() * 0.4 + 0.3); // Rain drops are slightly smaller
        } else {
          anim.translateY.setValue(0);
          anim.opacity.setValue(0);
          anim.scale.setValue(Math.random() * 0.6 + 0.4);
        }

        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim.translateY, {
              toValue: config.isRainDownwards ? 0 : -height * 0.8,
              duration: config.isRainDownwards ? 6000 + Math.random() * 2000 : 10000 + Math.random() * 4000, // Rain falls faster
              useNativeDriver: true,
            }),
            Animated.sequence([
              // Fade in
              Animated.timing(anim.opacity, {
                toValue: Math.random() * 0.4 + 0.15,
                duration: 2000,
                useNativeDriver: true,
              }),
              // Fade out
              Animated.timing(anim.opacity, {
                toValue: 0,
                duration: config.isRainDownwards ? 5000 : 7000,
                useNativeDriver: true,
              }),
            ]),
          ]),
        ]).start(() => {
          // Restart loop individually for random timing
          animateParticle();
        });
      };

      animateParticle();
    });

    return () => {
      pulseGlow.stop();
      particleAnims.forEach((anim) => {
        anim.translateY.stopAnimation();
        anim.opacity.stopAnimation();
        anim.scale.stopAnimation();
      });
    };
  }, [glowAnim, particleAnims, season, config.breathingSpeed, config.isRainDownwards]);

  return (
    <View style={[styles.container, style]}>
      {/* Dynamic Base Gradient */}
      <LinearGradient
        colors={config.bgColors}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.8, y: 1 }}
        style={StyleSheet.absoluteFillObject}
      />

      {/* Atmospheric Breathing Ambient Glow Overlay */}
      <Animated.View style={[styles.ambientGlow, { opacity: glowAnim }]} pointerEvents="none">
        <LinearGradient
          colors={config.glowColors}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFillObject}
        />
      </Animated.View>

      {/* Subtle Floating GPU Particles */}
      {particleAnims.map((anim, index) => {
        const leftOffset = (width / 5) * (index % 5) + Math.random() * 30;
        return (
          <Animated.View
            key={index}
            style={[
              styles.particle,
              {
                left: leftOffset,
                bottom: 20,
                backgroundColor: config.particleColor,
                shadowColor: config.particleColor,
                transform: [
                  { translateY: anim.translateY },
                  { scale: anim.scale },
                ],
                opacity: anim.opacity,
              },
            ]}
            pointerEvents="none"
          />
        );
      })}

      {/* Screen Page Contents */}
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  ambientGlow: {
    ...StyleSheet.absoluteFillObject,
    height: height * 0.45,
    top: 0,
  },
  particle: {
    position: 'absolute',
    width: 20,
    height: 20,
    borderRadius: 10,
    // Soft blur-like halo effect
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
    elevation: 2,
  },
  content: {
    flex: 1,
    backgroundColor: 'transparent',
  },
});
