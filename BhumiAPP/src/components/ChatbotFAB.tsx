import React, { useEffect, useRef } from 'react';
import { 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  View, 
  Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, SHADOWS } from '../theme/theme';

interface ChatbotFABProps {
  onPress: () => void;
}

export const ChatbotFAB: React.FC<ChatbotFABProps> = ({ onPress }) => {
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Gentle idle bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: -8,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [bounceAnim]);

  return (
    <Animated.View style={[styles.fabContainer, { transform: [{ translateY: bounceAnim }] }]}>
      <TouchableOpacity 
        style={styles.fabButton}
        activeOpacity={0.8}
        onPress={onPress}
      >
        <LinearGradient
          colors={['#10B981', '#047857']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="robot-outline" size={32} color="#FFFFFF" />
          {/* Subtle online indicator */}
          <View style={styles.onlineBadge} />
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 90 : 80,
    right: 20,
    zIndex: 9999,
  },
  fabButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    ...(SHADOWS.glow as any),
    shadowColor: '#047857',
    elevation: 10,
  },
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  onlineBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#84CC16',
    borderWidth: 2,
    borderColor: '#047857',
  }
});
