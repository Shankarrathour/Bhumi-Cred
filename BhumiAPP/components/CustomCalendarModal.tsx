import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Platform, Dimensions, Keyboard, KeyboardAvoidingView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../src/theme/theme';

const { width } = Dimensions.get('window');

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June', 
  'July', 'August', 'September', 'October', 'November', 'December'
];

interface CustomCalendarModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectDate: (date: string) => void;
  initialDate?: string;
}

export default function CustomCalendarModal({ visible, onClose, onSelectDate, initialDate }: CustomCalendarModalProps) {
  const [currYear, setCurrYear] = useState(new Date().getFullYear() - 25);
  const [currMonth, setCurrMonth] = useState(0); // 0-11
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [manualDate, setManualDate] = useState('');

  useEffect(() => {
    if (visible && initialDate && initialDate !== 'Select Date') {
      const parts = initialDate.split('/');
      if (parts.length === 3) {
        setCurrMonth(parseInt(parts[1], 10) - 1);
        setCurrYear(parseInt(parts[2], 10));
        setManualDate(initialDate);
      }
    } else {
      setManualDate('');
      setIsManualEdit(false);
    }
  }, [visible, initialDate]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const daysArray = Array.from({ length: getDaysInMonth(currYear, currMonth) }, (_, i) => i + 1);

  const handleSelectDay = (day: number) => {
    const d = day < 10 ? '0' + day : day;
    const m = currMonth + 1 < 10 ? '0' + (currMonth + 1) : currMonth + 1;
    onSelectDate(`${d}/${m}/${currYear}`);
    onClose();
  };

  const handleManualSave = () => {
    Keyboard.dismiss();
    onSelectDate(manualDate);
    onClose();
  };

  const handlePrevMonth = () => {
    if (currMonth === 0) {
      setCurrMonth(11);
      setCurrYear(y => y - 1);
    } else {
      setCurrMonth(m => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currMonth === 11) {
      setCurrMonth(0);
      setCurrYear(y => y + 1);
    } else {
      setCurrMonth(m => m + 1);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={{ flex: 1 }}
      >
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1} 
          onPress={() => { Keyboard.dismiss(); onClose(); }}
        >
          <TouchableOpacity activeOpacity={1} style={styles.calendarSheet}>
            <View style={styles.calSheetHeader}>
              <Text style={styles.calSheetHeadline}>Select Date</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <TouchableOpacity onPress={() => setIsManualEdit(!isManualEdit)} style={{ marginRight: 16 }}>
                  <MaterialCommunityIcons name="pencil" size={24} color={isManualEdit ? COLORS.primary : "#94A3B8"} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { Keyboard.dismiss(); onClose(); }}>
                  <MaterialCommunityIcons name="close-circle" size={26} color="#94A3B8" />
                </TouchableOpacity>
              </View>
            </View>

            {isManualEdit ? (
              <View style={styles.manualEntryContainer}>
                <Text style={styles.pickerLabel}>ENTER DATE (DD/MM/YYYY)</Text>
                <TextInput
                  style={styles.manualInput}
                  value={manualDate}
                  onChangeText={setManualDate}
                  placeholder="e.g. 15/08/1990"
                  keyboardType="numbers-and-punctuation"
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleManualSave}>
                  <Text style={styles.saveBtnText}>Save Date</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View>
                {/* Month & Year Navigation */}
                <View style={styles.navRow}>
                  <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#1E293B" />
                  </TouchableOpacity>
                  <View style={styles.navCenter}>
                    <Text style={styles.navMonth}>{MONTHS[currMonth]}</Text>
                    <Text style={styles.navYear}>{currYear}</Text>
                  </View>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                    <MaterialCommunityIcons name="chevron-right" size={28} color="#1E293B" />
                  </TouchableOpacity>
                </View>

                <Text style={[styles.pickerLabel, { marginTop: 20, marginBottom: 12 }]}>SELECT DAY</Text>
                <View style={styles.daysMatrix}>
                  {daysArray.map((d) => (
                    <TouchableOpacity 
                      key={d} 
                      style={styles.dayCell}
                      onPress={() => handleSelectDay(d)}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.dayCellText}>{d}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            <View style={{ height: 20 }} />
          </TouchableOpacity>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  calendarSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '80%',
  },
  calSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  calSheetHeadline: {
    fontSize: 18,
    fontWeight: '900',
    color: '#1E293B',
  },
  pickerLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94A3B8',
    letterSpacing: 0.8,
  },
  navRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  navBtn: {
    padding: 4,
  },
  navCenter: {
    alignItems: 'center',
  },
  navMonth: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  navYear: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  daysMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -4,
  },
  dayCell: {
    width: (width - 56) / 7,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
  },
  dayCellText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    textAlign: 'center',
    lineHeight: 32,
  },
  manualEntryContainer: {
    marginTop: 10,
  },
  manualInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1E293B',
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 20,
  },
  saveBtn: {
    backgroundColor: '#059669',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  }
});
