import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, Platform, Dimensions, Keyboard, KeyboardAvoidingView, ScrollView } from 'react-native';
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
  mode?: 'dob' | 'general' | 'plantation';
}

const YEARS = Array.from({ length: 86 }, (_, i) => 2035 - i); // 2035 down to 1950

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export default function CustomCalendarModal({ visible, onClose, onSelectDate, initialDate, mode = 'dob' }: CustomCalendarModalProps) {
  const now = new Date();
  const defaultYear = 2026;
  const defaultMonth = now.getMonth(); // Current month
  const [currYear, setCurrYear] = useState(defaultYear);
  const [currMonth, setCurrMonth] = useState(defaultMonth);
  const [isManualEdit, setIsManualEdit] = useState(false);
  const [showYearPicker, setShowYearPicker] = useState(false);
  const [manualDate, setManualDate] = useState('');

  useEffect(() => {
    if (visible) {
      if (initialDate && initialDate !== 'Select Date' && (initialDate.includes('/') || initialDate.includes('-'))) {
        const delimiter = initialDate.includes('/') ? '/' : '-';
        const parts = initialDate.split(delimiter);
        if (parts.length === 3) {
          // If format is YYYY-MM-DD
          if (parts[0].length === 4) {
            const y = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const d = parseInt(parts[2], 10);
            if (!isNaN(m) && !isNaN(y) && m >= 0 && m <= 11) {
              setCurrMonth(m);
              setCurrYear(y);
              const dd = d < 10 ? '0' + d : d;
              const mm = (m + 1) < 10 ? '0' + (m + 1) : (m + 1);
              setManualDate(`${dd}/${mm}/${y}`);
              setIsManualEdit(false);
              setShowYearPicker(false);
              return;
            }
          } else {
            // DD/MM/YYYY
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2], 10);
            if (!isNaN(m) && !isNaN(y) && m >= 0 && m <= 11 && y > 1900) {
              setCurrMonth(m);
              setCurrYear(y);
              setManualDate(initialDate);
              setIsManualEdit(false);
              setShowYearPicker(false);
              return;
            }
          }
        }
      }

      // If no valid initial date, check the mode
      if (mode === 'dob') {
        // DOB mode: default to Year 2000
        setCurrYear(2000);
        setCurrMonth(0); // January
        setManualDate('15/01/2000');
      } else {
        // General / Plantation mode: explicitly open to year 2026
        const targetYear = 2026;
        const targetMonth = now.getMonth();
        const d = now.getDate() < 10 ? '0' + now.getDate() : now.getDate();
        const m = (targetMonth + 1) < 10 ? '0' + (targetMonth + 1) : (targetMonth + 1);
        setCurrYear(targetYear);
        setCurrMonth(targetMonth);
        setManualDate(`${d}/${m}/${targetYear}`);
      }
      setIsManualEdit(false);
      setShowYearPicker(false);
    }
  }, [visible, initialDate, mode]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const firstDayIndex = getFirstDayOfMonth(currYear, currMonth);
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
                <TouchableOpacity onPress={() => { setShowYearPicker(!showYearPicker); setIsManualEdit(false); }} style={{ marginRight: 12, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: showYearPicker ? '#ECFDF5' : '#F1F5F9', borderRadius: 8, borderWidth: 1, borderColor: showYearPicker ? '#10B981' : '#E2E8F0' }}>
                  <Text style={{ fontSize: 12, fontWeight: '800', color: showYearPicker ? '#047857' : '#475569' }}>Year {currYear}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => { setIsManualEdit(!isManualEdit); setShowYearPicker(false); }} style={{ marginRight: 16 }}>
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
                  placeholder="e.g. 15/08/2000"
                  keyboardType="numbers-and-punctuation"
                />
                <TouchableOpacity style={styles.saveBtn} onPress={handleManualSave}>
                  <Text style={styles.saveBtnText}>Save Date</Text>
                </TouchableOpacity>
              </View>
            ) : showYearPicker ? (
              <View style={{ maxHeight: 300 }}>
                <Text style={[styles.pickerLabel, { marginBottom: 12 }]}>SELECT YEAR / साल चुनें</Text>
                <ScrollView contentContainerStyle={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingBottom: 10 }} showsVerticalScrollIndicator={false}>
                  {YEARS.map((yr) => (
                    <TouchableOpacity
                      key={yr}
                      style={{
                        paddingHorizontal: 14,
                        paddingVertical: 8,
                        borderRadius: 12,
                        backgroundColor: yr === currYear ? COLORS.primary : '#F8FAFC',
                        borderWidth: 1,
                        borderColor: yr === currYear ? COLORS.primary : '#E2E8F0',
                      }}
                      onPress={() => {
                        setCurrYear(yr);
                        setShowYearPicker(false);
                      }}
                    >
                      <Text style={{ fontSize: 13, fontWeight: '800', color: yr === currYear ? '#FFFFFF' : '#334155' }}>
                        {yr}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            ) : (
              <View>
                {/* Month & Year Navigation */}
                <View style={styles.navRow}>
                  <TouchableOpacity onPress={handlePrevMonth} style={styles.navBtn}>
                    <MaterialCommunityIcons name="chevron-left" size={28} color="#1E293B" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.navCenter} onPress={() => setShowYearPicker(true)}>
                    <Text style={styles.navMonth}>{MONTHS[currMonth]}</Text>
                    <Text style={styles.navYear}>{currYear} ✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={handleNextMonth} style={styles.navBtn}>
                    <MaterialCommunityIcons name="chevron-right" size={28} color="#1E293B" />
                  </TouchableOpacity>
                </View>

                {/* Weekday labels */}
                <View style={[styles.daysMatrix, { marginTop: 16, marginBottom: 6 }]}>
                  {WEEKDAYS.map((wd) => (
                    <View key={wd} style={styles.weekdayCell}>
                      <Text style={styles.weekdayText}>{wd}</Text>
                    </View>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysMatrix}>
                  {Array.from({ length: firstDayIndex }).map((_, i) => (
                    <View key={`empty-${i}`} style={styles.dayCell} />
                  ))}
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
  weekdayCell: {
    width: (width - 56) / 7,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 4,
  },
  weekdayText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#94A3B8',
    textTransform: 'uppercase',
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
