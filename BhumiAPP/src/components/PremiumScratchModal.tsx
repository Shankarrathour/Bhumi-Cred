import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, PanResponder, Dimensions, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../theme/theme';

const { width, height } = Dimensions.get('window');
const CARD_SIZE = width * 0.75;
const GRID_ROWS = 10;
const GRID_COLS = 10;

interface Props {
  visible: boolean;
  onClose: () => void;
  onApplyReward: (discountCode: string, discountValue: number) => void;
}

export function PremiumScratchModal({ visible, onClose, onApplyReward }: Props) {
  const [scratchedGrid, setScratchedGrid] = useState<boolean[]>(Array(GRID_ROWS * GRID_COLS).fill(false));
  const [isRevealed, setIsRevealed] = useState(false);
  
  // Randomize Reward Code on open
  const [reward] = useState(() => {
    const list = [
      { code: 'LUCKY250', val: 250, desc: 'Flat ₹250 Cashback' },
      { code: 'SAVE300', val: 300, desc: 'Flat ₹300 Special Discount' },
      { code: 'HEALTH150', val: 150, desc: 'Flat ₹150 Bonus Value' },
    ];
    return list[Math.floor(Math.random() * list.length)];
  });

  const fadeAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      setScratchedGrid(Array(GRID_ROWS * GRID_COLS).fill(false));
      setIsRevealed(false);
      fadeAnim.setValue(1);
      scaleAnim.setValue(0.9);
      confettiAnim.setValue(0);
    }
  }, [visible]);

  const handleTouch = (evt: any) => {
    if (isRevealed) return;

    const { locationX, locationY } = evt.nativeEvent;
    
    // Convert coordinate to column and row index
    const cellW = CARD_SIZE / GRID_COLS;
    const cellH = CARD_SIZE / GRID_ROWS;

    const col = Math.floor(locationX / cellW);
    const row = Math.floor(locationY / cellH);

    if (col >= 0 && col < GRID_COLS && row >= 0 && row < GRID_ROWS) {
      const idx = row * GRID_COLS + col;
      
      if (!scratchedGrid[idx]) {
        const updated = [...scratchedGrid];
        
        // Clear 3x3 radius around brush touch for better UX feel!
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            const r = row + dr;
            const c = col + dc;
            if (r >= 0 && r < GRID_ROWS && c >= 0 && c < GRID_COLS) {
              updated[r * GRID_COLS + c] = true;
            }
          }
        }

        setScratchedGrid(updated);

        // Count total scratched cells
        const scratchedCount = updated.filter(cell => cell).length;
        const totalCells = GRID_ROWS * GRID_COLS;
        
        // If more than 50% scratched, auto reveal the whole prize!
        if (scratchedCount > totalCells * 0.50) {
          triggerFullReveal();
        }
      }
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: handleTouch,
      onPanResponderMove: handleTouch,
    })
  ).current;

  const triggerFullReveal = () => {
    setIsRevealed(true);
    
    // Animate smooth dissolve of silver coating, scale up the code card, and pop confetti!
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
      Animated.spring(scaleAnim, { toValue: 1.1, friction: 4, useNativeDriver: true }),
      Animated.timing(confettiAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
    ]).start(() => {
      Animated.spring(scaleAnim, { toValue: 1, friction: 6, useNativeDriver: true }).start();
    });
  };

  const handleApply = () => {
    onApplyReward(reward.code, reward.val);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.closeIcon} onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color="#FFF" />
          </TouchableOpacity>

          <Text style={styles.modalHeaderTitle}>EXCLUSIVE REWARDS</Text>
          <Text style={styles.modalHeaderSubtitle}>Scratch the card to reveal your prize</Text>

          <View style={styles.scratchPadOuter}>
            {/* Back Layer: The Reward Content */}
            <View style={styles.rewardBackLayer}>
              <MaterialCommunityIcons name="trophy-variant" size={48} color="#F59E0B" style={{ marginBottom: 10 }} />
              <Text style={styles.rewardCongrats}>CONGRATS!</Text>
              <Text style={styles.rewardAmt}>{reward.desc}</Text>
              <View style={styles.codeBox}>
                <Text style={styles.codeText}>{reward.code}</Text>
              </View>
            </View>

            {/* Silver Coating Layer (Absolute Overlay Grid) */}
            {!isRevealed && (
              <View 
                style={[styles.coatingOverlay, { width: CARD_SIZE, height: CARD_SIZE }]}
                {...panResponder.panHandlers}
              >
                {scratchedGrid.map((scratched, index) => (
                  <View 
                    key={index} 
                    style={[
                      styles.cell, 
                      { width: CARD_SIZE / GRID_COLS, height: CARD_SIZE / GRID_ROWS },
                      scratched && { opacity: 0 }
                    ]} 
                  />
                ))}
              </View>
            )}

            {/* Fancy Gradient Dissolve Overlay triggered upon completion */}
            {isRevealed && (
              <Animated.View 
                pointerEvents="none"
                style={[
                  styles.coatingOverlayFade, 
                  { opacity: fadeAnim, width: CARD_SIZE, height: CARD_SIZE }
                ]} 
              >
                <LinearGradient colors={['#E2E8F0', '#94A3B8']} style={{ flex: 1 }} />
              </Animated.View>
            )}
          </View>

          {/* Apply Actions Container */}
          {isRevealed ? (
            <Animated.View style={[styles.actionRow, { transform: [{ scale: scaleAnim }] }]}>
              <TouchableOpacity activeOpacity={0.9} onPress={handleApply}>
                <LinearGradient colors={[COLORS.primary, '#14B8A6']} style={styles.applyBtn}>
                  <Text style={styles.applyBtnText}>Apply ₹{reward.val} Discount</Text>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          ) : (
            <Text style={styles.helperPrompt}>Swipe your finger back and forth!</Text>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 75, 77, 0.85)', // Deep brand dark transparency
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: width * 0.9,
    alignItems: 'center',
  },
  closeIcon: {
    alignSelf: 'flex-end',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    padding: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  modalHeaderTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    letterSpacing: 1.5,
  },
  modalHeaderSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 6,
    marginBottom: 28,
  },
  scratchPadOuter: {
    width: CARD_SIZE,
    height: CARD_SIZE,
    backgroundColor: '#FFF',
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.soft,
    elevation: 8,
    position: 'relative',
  },
  rewardBackLayer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    padding: 20,
  },
  rewardCongrats: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#059669',
    letterSpacing: 1,
  },
  rewardAmt: {
    fontSize: 17,
    fontWeight: '900',
    color: COLORS.textDark,
    textAlign: 'center',
    marginTop: 4,
  },
  codeBox: {
    borderWidth: 2,
    borderColor: '#10B981',
    borderStyle: 'dashed',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 18,
  },
  codeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#047857',
    letterSpacing: 1,
  },
  coatingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  cell: {
    backgroundColor: '#CBD5E1',
    borderColor: '#94A3B8',
    borderWidth: 0.4,
  },
  coatingOverlayFade: {
    position: 'absolute',
    top: 0,
    left: 0,
    borderRadius: 24,
    overflow: 'hidden',
  },
  actionRow: {
    marginTop: 30,
    width: '80%',
  },
  applyBtn: {
    paddingVertical: 16,
    borderRadius: 30,
    alignItems: 'center',
    ...SHADOWS.soft,
    shadowColor: '#14B8A6',
  },
  applyBtnText: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#FFF',
  },
  helperPrompt: {
    fontSize: 13,
    fontStyle: 'italic',
    color: '#94A3B8',
    marginTop: 24,
  },
});
