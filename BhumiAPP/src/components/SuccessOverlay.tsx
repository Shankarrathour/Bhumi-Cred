import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';

const { width } = Dimensions.get('window');

interface SuccessOverlayProps {
  visible: boolean;
  onClose: () => void;
  title: string;
  message: string;
  rewardText?: string;
  iconName?: string;
}

export const SuccessOverlay: React.FC<SuccessOverlayProps> = ({
  visible,
  onClose,
  title,
  message,
  rewardText = 'Verification Completed Successfully!',
  iconName = 'check-decagram',
}) => {
  // Scale pop of the success card
  const cardScale = useRef(new Animated.Value(0.3)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;

  // Confetti particles: 10 individual particles
  const particleAnims = useRef(
    Array.from({ length: 10 }).map(() => ({
      x: new Animated.Value(0),
      y: new Animated.Value(0),
      opacity: new Animated.Value(0),
      scale: new Animated.Value(0.2),
    }))
  ).current;

  useEffect(() => {
    if (visible) {
      // 1. Pop entry animation for the overlay card
      Animated.parallel([
        Animated.spring(cardScale, {
          toValue: 1,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 350,
          useNativeDriver: true,
        }),
      ]).start();

      // 2. Confetti blast animation
      particleAnims.forEach((anim, idx) => {
        // Reset positions
        anim.x.setValue(0);
        anim.y.setValue(0);
        anim.opacity.setValue(1);
        anim.scale.setValue(Math.random() * 0.8 + 0.4);

        // Blast angle distribution
        const angle = (idx / 10) * Math.PI * 2;
        const radius = Math.random() * 80 + 70;
        const targetX = Math.cos(angle) * radius;
        const targetY = Math.sin(angle) * radius - 60; // Push upwards

        Animated.parallel([
          Animated.timing(anim.x, {
            toValue: targetX,
            duration: 1000 + Math.random() * 600,
            useNativeDriver: true,
          }),
          Animated.timing(anim.y, {
            toValue: targetY,
            duration: 1200 + Math.random() * 500,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 1200 + Math.random() * 500,
            useNativeDriver: true,
          }),
        ]).start();
      });
    } else {
      // Reset values on close
      cardScale.setValue(0.3);
      overlayOpacity.setValue(0);
    }
  }, [visible, cardScale, overlayOpacity, particleAnims]);

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose}>
          <Animated.View 
            style={[
              styles.card, 
              { transform: [{ scale: cardScale }] }
            ]} 
            onStartShouldSetResponder={() => true}
          >
            {/* Soft Ambient Radial Background Glow */}
            <LinearGradient
              colors={['#DCFCE7', '#FFFFFF']}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={StyleSheet.absoluteFillObject}
            />

            {/* Confetti Elements Wrapper */}
            <View style={StyleSheet.absoluteFillObject} pointerEvents="none">
              {particleAnims.map((anim, idx) => (
                <Animated.View
                  key={idx}
                  style={[
                    styles.particleConfetti,
                    {
                      transform: [
                        { translateX: anim.x },
                        { translateY: anim.y },
                        { scale: anim.scale },
                      ],
                      opacity: anim.opacity,
                    },
                  ]}
                />
              ))}
            </View>

            {/* Premium Icon Circle Indicator */}
            <View style={styles.iconCircle}>
              <LinearGradient colors={['#84CC16', '#22C55E']} style={styles.iconGrad}>
                <MaterialCommunityIcons name={iconName as any} size={48} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Milestone Summary & Titles */}
            <Text style={styles.title}>{title}</Text>
            <Text style={styles.message}>{message}</Text>

            {/* Sustainability Reward Indicator Pill */}
            <View style={styles.rewardContainer}>
              <MaterialCommunityIcons name="molecule-co2" size={20} color={COLORS.primaryLight} style={{ marginRight: 6 }} />
              <Text style={styles.rewardText} numberOfLines={1}>{rewardText}</Text>
            </View>

            {/* Action CTA */}
            <TouchableOpacity style={styles.btn} onPress={onClose} activeOpacity={0.8}>
              <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.btnGrad}>
                <Text style={styles.btnLabel}>Excellent / धन्यवाद</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 44, 34, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  card: {
    width: width * 0.85,
    borderRadius: 28,
    borderWidth: 1.5,
    borderColor: '#A7F3D0', // Soft eco green border
    padding: 24,
    alignItems: 'center',
    overflow: 'hidden',
    ...SHADOWS.glow,
    backgroundColor: '#FFFFFF',
  },
  iconCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#F0FDF4',
    padding: 6,
    marginBottom: 20,
  },
  iconGrad: {
    flex: 1,
    borderRadius: 39,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.limeGlow,
  },
  title: {
    ...TYPOGRAPHY.h2,
    color: COLORS.primaryDark,
    fontWeight: '900',
    textAlign: 'center',
    marginBottom: 10,
  },
  message: {
    fontSize: 12.5,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    fontWeight: '600',
    paddingHorizontal: 8,
    marginBottom: 20,
  },
  rewardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#DCFCE7',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
  },
  rewardText: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
  },
  btn: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    ...SHADOWS.soft,
  },
  btnGrad: {
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnLabel: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  particleConfetti: {
    position: 'absolute',
    left: '50%',
    top: '50%',
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#84CC16', // Confetti particles
  },
});
