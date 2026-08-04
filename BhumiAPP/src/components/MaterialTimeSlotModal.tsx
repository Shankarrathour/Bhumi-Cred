import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView, 
  Dimensions, Platform 
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../theme/theme';

interface MaterialTimeSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onSlotSelect: (slot: string) => void;
  slots: string[];
  initialSlot?: string;
}

export const MaterialTimeSlotModal: React.FC<MaterialTimeSlotModalProps> = ({
  visible,
  onClose,
  onSlotSelect,
  slots,
  initialSlot
}) => {
  const [tempSelectedSlot, setTempSelectedSlot] = useState<string>('');

  useEffect(() => {
    if (visible) {
      setTempSelectedSlot(initialSlot || '');
    }
  }, [visible, initialSlot]);

  const handleOk = () => {
    if (tempSelectedSlot) {
      onSlotSelect(tempSelectedSlot);
    }
    onClose();
  };

  const formatDisplayTime = (slot: string) => {
    if (!slot) return 'Select Time';
    // Shorten '08:00 AM - 09:00 AM' -> '08:00 AM' for the header display
    return slot.split(' - ')[0];
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.dialog}>
          
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerSub}>Select Arrival Slot</Text>
            <View style={styles.headerTitleRow}>
              <Text style={styles.headerTitle}>
                {formatDisplayTime(tempSelectedSlot)}
              </Text>
              <MaterialCommunityIcons name="clock-outline" size={22} color={COLORS.textDark} />
            </View>
          </View>

          <View style={styles.divider} />

          {/* Grid list of slots */}
          <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
            <View style={styles.slotsGrid}>
              {slots.map((slot, idx) => {
                const isSelected = tempSelectedSlot === slot;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.slotChip,
                      isSelected && styles.chipSelected
                    ]}
                    activeOpacity={0.7}
                    onPress={() => setTempSelectedSlot(slot)}
                  >
                    <Text style={[
                      styles.slotText,
                      isSelected && styles.textSelected
                    ]}>
                      {slot.replace(':00', '')}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <TouchableOpacity style={styles.actionBtn} onPress={onClose}>
              <Text style={styles.actionBtnText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionBtn, { marginLeft: 16 }, !tempSelectedSlot && { opacity: 0.5 }]} 
              onPress={handleOk}
              disabled={!tempSelectedSlot}
            >
              <Text style={[styles.actionBtnText, { fontWeight: 'bold' }]}>OK</Text>
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    width: '88%',
    maxWidth: 328,
    maxHeight: Dimensions.get('window').height * 0.75,
    backgroundColor: '#FFFFFF',
    borderRadius: 28,
    overflow: 'hidden',
    ...SHADOWS.glow,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerSub: {
    fontSize: 12,
    color: '#64748B',
    letterSpacing: 0.5,
    marginBottom: 8,
    fontWeight: '600',
  },
  headerTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  scrollContainer: {
    padding: 16,
  },
  slotsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  slotChip: {
    width: '48%',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  slotText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  textSelected: {
    color: '#FFFFFF',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#F8FAFC',
  },
  actionBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  actionBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
  }
});
