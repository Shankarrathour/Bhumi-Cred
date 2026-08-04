import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  ScrollView, 
  Platform,
  Image,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';

import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';

interface Card {
  id: string;
  bank: string;
  number: string;
  holder: string;
  expiry: string;
  type: 'slate' | 'teal' | 'blue';
}

interface Upi {
  id: string;
  name: string;
  value: string;
  icon: string;
  color: string;
  primary: boolean;
}

export default function PaymentMethodsScreen() {
  const router = useRouter();

  // State hooks for dynamic instruments
  const [cards, setCards] = useState<Card[]>([
    { id: '1', bank: 'HDFC BANK', number: '••••  ••••  ••••  4829', holder: 'WHATSAPP USER', expiry: '08 / 29', type: 'slate' },
    { id: '2', bank: 'ICICI BANK', number: '••••  ••••  ••••  9012', holder: 'WHATSAPP USER', expiry: '04 / 31', type: 'teal' }
  ]);

  const [upis, setUpis] = useState<Upi[]>([
    { id: '1', name: 'Google Pay (GPay)', value: 'whatsappuser@okaxis', icon: 'bank-outline', color: COLORS.primary, primary: true },
    { id: '2', name: 'PhonePe', value: '9999999999@ybl', icon: 'wallet-outline', color: '#7C3AED', primary: false }
  ]);

  // Modal Visibility Control
  const [isAddCardOpen, setAddCardOpen] = useState(false);
  const [isLinkUpiOpen, setLinkUpiOpen] = useState(false);

  // Card Entry Form States
  const [newCardNumber, setNewCardNumber] = useState('');
  const [newCardHolder, setNewCardHolder] = useState('');
  const [newCardExpiry, setNewCardExpiry] = useState('');
  const [newCardCVV, setNewCardCVV] = useState('');
  const [newCardBank, setNewCardBank] = useState('SBI BANK');
  const [isSavingCard, setIsSavingCard] = useState(false);

  // UPI Entry Form States
  const [newUpiId, setNewUpiId] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('GPay');
  const [isSavingUpi, setIsSavingUpi] = useState(false);

  // Automatic spacing logic for Card Digits
  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    const matched = cleaned.match(/.{1,4}/g);
    return matched ? matched.join('  ') : cleaned;
  };

  const handleCardNumberChange = (text: string) => {
    const formatted = formatCardNumber(text);
    if (formatted.length <= 22) { // 16 numbers + formatting spaces
      setNewCardNumber(formatted);
    }
  };

  const handleExpiryChange = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length >= 2) {
      formatted = `${cleaned.slice(0, 2)}/${cleaned.slice(2, 4)}`;
    }
    if (formatted.length <= 5) {
      setNewCardExpiry(formatted);
    }
  };

  // Action handler to dynamically inject new credit card
  const handleAddCard = () => {
    if (newCardNumber.replace(/\s/g, '').length < 16) {
      Alert.alert('Error', 'Please enter a valid 16-digit card number.');
      return;
    }
    if (newCardExpiry.length < 5) {
      Alert.alert('Error', 'Please enter a valid expiry date (MM/YY).');
      return;
    }
    if (newCardCVV.length < 3) {
      Alert.alert('Error', 'Please enter a valid 3-digit CVV code.');
      return;
    }
    if (!newCardHolder.trim()) {
      Alert.alert('Error', 'Please enter the Card Holder name.');
      return;
    }

    setIsSavingCard(true);
    // Simulate localized network latency
    setTimeout(() => {
      const visibleDigits = newCardNumber.slice(-4);
      const newObj: Card = {
        id: Date.now().toString(),
        bank: newCardBank.toUpperCase(),
        number: `••••  ••••  ••••  ${visibleDigits}`,
        holder: newCardHolder.toUpperCase(),
        expiry: newCardExpiry,
        type: cards.length % 2 === 0 ? 'blue' : 'slate'
      };
      setCards([...cards, newObj]);
      setIsSavingCard(false);
      setAddCardOpen(false);
      resetCardForm();
    }, 1000);
  };

  const resetCardForm = () => {
    setNewCardNumber('');
    setNewCardHolder('');
    setNewCardExpiry('');
    setNewCardCVV('');
  };

  // Action handler to inject new linked UPI ID
  const handleLinkUpi = () => {
    if (!newUpiId.includes('@') || newUpiId.length < 5) {
      Alert.alert('Error', 'Please enter a valid UPI handle (e.g. user@bank).');
      return;
    }
    setIsSavingUpi(true);
    setTimeout(() => {
      const newObj: Upi = {
        id: Date.now().toString(),
        name: selectedProvider === 'GPay' ? 'Google Pay (GPay)' : selectedProvider === 'PhonePe' ? 'PhonePe' : 'Paytm / Others',
        value: newUpiId.toLowerCase().trim(),
        icon: selectedProvider === 'GPay' ? 'bank-outline' : 'wallet-outline',
        color: selectedProvider === 'GPay' ? COLORS.primary : '#7C3AED',
        primary: false
      };
      setUpis([...upis, newObj]);
      setIsSavingUpi(false);
      setLinkUpiOpen(false);
      setNewUpiId('');
    }, 1000);
  };

  const togglePrimaryUpi = (id: string) => {
    setUpis(upis.map(u => ({ ...u, primary: u.id === id })));
  };

  const deleteCard = (id: string) => {
    Alert.alert(
      'Remove Instrument',
      'Are you sure you want to securely remove this credit/debit card from BhumiCred?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove Securely', style: 'destructive', onPress: () => setCards(cards.filter(c => c.id !== id)) }
      ]
    );
  };

  const deleteUpi = (id: string) => {
    Alert.alert(
      'Unlink UPI ID',
      'Would you like to unlink this UPI address from your profile?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Unlink Address', style: 'destructive', onPress: () => setUpis(upis.filter(u => u.id !== id)) }
      ]
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      {/* Custom App Bar */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={COLORS.textLight} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.sectionTitle}>Saved Cards</Text>

        {/* Render Active Card Mapping */}
        {cards.map((card) => {
          const cardColors: [string, string] = 
            card.type === 'slate' ? ['#0F172A', '#1E293B'] :
            card.type === 'teal' ? ['#0D9488', '#0F766E'] :
            ['#1E40AF', '#1E3A8A'];
          return (
            <TouchableOpacity 
              key={card.id}
              activeOpacity={0.9}
              onLongPress={() => deleteCard(card.id)}
              style={{ marginBottom: 16 }}
            >
              <LinearGradient 
                colors={cardColors} 
                style={styles.creditCard}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.cardTop}>
                  <MaterialCommunityIcons name="integrated-circuit-chip" size={36} color="#E2E8F0" />
                  <Text style={styles.bankName}>{card.bank}</Text>
                </View>
                <Text style={styles.cardNumber}>{card.number}</Text>
                <View style={styles.cardBottom}>
                  <View>
                    <Text style={styles.cardLabel}>CARD HOLDER</Text>
                    <Text style={styles.cardValue}>{card.holder}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={styles.cardLabel}>EXPIRES</Text>
                    <Text style={styles.cardValue}>{card.expiry}</Text>
                  </View>
                </View>
              </LinearGradient>
            </TouchableOpacity>
          );
        })}

        {cards.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No credit/debit cards saved.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.addBtn} onPress={() => setAddCardOpen(true)}>
          <MaterialCommunityIcons name="plus-circle-outline" size={22} color={COLORS.primary} />
          <Text style={styles.addBtnText}>Add New Credit/Debit Card</Text>
        </TouchableOpacity>

        <Text style={[styles.sectionTitle, { marginTop: 30 }]}>Saved UPI IDs</Text>
        
        {/* Render UPI mapping */}
        {upis.map((upi) => (
          <TouchableOpacity 
            key={upi.id} 
            style={[styles.upiCard, upi.primary && styles.upiCardPrimary]}
            activeOpacity={0.75}
            onPress={() => togglePrimaryUpi(upi.id)}
            onLongPress={() => deleteUpi(upi.id)}
          >
            <View style={styles.upiRow}>
              <View style={[styles.iconContainer, { backgroundColor: upi.primary ? 'rgba(0, 109, 111, 0.1)' : 'rgba(148, 163, 184, 0.1)' }]}>
                <MaterialCommunityIcons name={upi.icon as any} size={24} color={upi.primary ? COLORS.primary : '#64748B'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.upiName}>{upi.name}</Text>
                <Text style={styles.upiValue}>{upi.value}</Text>
              </View>
              {upi.primary && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>PRIMARY</Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}

        {upis.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No linked UPI addresses.</Text>
          </View>
        )}

        <TouchableOpacity style={styles.addBtn} onPress={() => setLinkUpiOpen(true)}>
          <MaterialCommunityIcons name="link-variant" size={22} color={COLORS.primary} />
          <Text style={styles.addBtnText}>Link New UPI ID</Text>
        </TouchableOpacity>

        <View style={styles.tipBox}>
          <MaterialCommunityIcons name="information-outline" size={18} color="#64748B" />
          <Text style={styles.tipText}>Pro Tip: Click UPI ID to set as Primary. Long-press any row to remove it securely.</Text>
        </View>
      </ScrollView>

      {/* ================= MATERIAL ADD CARD DIALOG ================= */}
      <Modal transparent visible={isAddCardOpen} animationType="slide" onRequestClose={() => setAddCardOpen(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Add Credit/Debit Card</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setAddCardOpen(false)}>
                    <MaterialCommunityIcons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
                  {/* Sleek Miniature Card Mock View */}
                  <LinearGradient colors={['#1E293B', '#475569']} style={styles.cardMiniPreview}>
                    <View style={styles.cardTop}>
                      <MaterialCommunityIcons name="integrated-circuit-chip" size={24} color="#FFF" />
                      <Text style={styles.bankNameMini}>{newCardBank}</Text>
                    </View>
                    <Text style={styles.cardNumberMini}>{newCardNumber || '••••  ••••  ••••  ••••'}</Text>
                    <View style={styles.cardBottom}>
                      <Text style={styles.cardValMini}>{newCardHolder || 'CARD HOLDER NAME'}</Text>
                      <Text style={styles.cardValMini}>{newCardExpiry || 'MM/YY'}</Text>
                    </View>
                  </LinearGradient>

                  {/* Bank Label Selector */}
                  <Text style={styles.inputLabel}>Select Issuing Bank</Text>
                  <View style={styles.bankSelectorRow}>
                    {['SBI BANK', 'HDFC BANK', 'ICICI BANK', 'AXIS BANK'].map(bank => (
                      <TouchableOpacity 
                        key={bank}
                        style={[styles.bankChip, newCardBank === bank && styles.bankChipActive]}
                        onPress={() => setNewCardBank(bank)}
                      >
                        <Text style={[styles.bankChipText, newCardBank === bank && styles.bankChipTextActive]}>{bank.split(' ')[0]}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Card Number</Text>
                  <View style={styles.inputField}>
                    <MaterialCommunityIcons name="credit-card-outline" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                    <TextInput 
                      placeholder="0000  0000  0000  0000" 
                      keyboardType="numeric"
                      value={newCardNumber}
                      onChangeText={handleCardNumberChange}
                      style={styles.textInput}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <View style={styles.rowFields}>
                    <View style={{ flex: 1, marginRight: 12 }}>
                      <Text style={styles.inputLabel}>Expiry Date</Text>
                      <View style={styles.inputField}>
                        <TextInput 
                          placeholder="MM/YY" 
                          keyboardType="numeric"
                          value={newCardExpiry}
                          onChangeText={handleExpiryChange}
                          maxLength={5}
                          style={styles.textInput}
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.inputLabel}>CVV Code</Text>
                      <View style={styles.inputField}>
                        <TextInput 
                          placeholder="•••" 
                          keyboardType="numeric"
                          secureTextEntry
                          maxLength={3}
                          value={newCardCVV}
                          onChangeText={(text) => setNewCardCVV(text.replace(/\D/g, ''))}
                          style={styles.textInput}
                          placeholderTextColor="#94A3B8"
                        />
                      </View>
                    </View>
                  </View>

                  <Text style={styles.inputLabel}>Card Holder Name</Text>
                  <View style={styles.inputField}>
                    <TextInput 
                      placeholder="Name printed on card" 
                      autoCapitalize="characters"
                      value={newCardHolder}
                      onChangeText={setNewCardHolder}
                      style={styles.textInput}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  <TouchableOpacity 
                    style={styles.saveBtn} 
                    activeOpacity={0.8}
                    onPress={handleAddCard}
                    disabled={isSavingCard}
                  >
                    {isSavingCard ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.saveBtnText}>Save Secured Card</Text>
                    )}
                  </TouchableOpacity>
                  
                  <View style={{ height: 30 }} />
                </ScrollView>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* ================= MATERIAL LINK UPI DIALOG ================= */}
      <Modal transparent visible={isLinkUpiOpen} animationType="slide" onRequestClose={() => setLinkUpiOpen(false)}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalBackdrop}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContainer}>
              <View style={styles.modalSheet}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitle}>Link New UPI ID</Text>
                  <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setLinkUpiOpen(false)}>
                    <MaterialCommunityIcons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalBody}>
                  <Text style={styles.inputLabel}>Select App Provider</Text>
                  <View style={styles.bankSelectorRow}>
                    {['GPay', 'PhonePe', 'Paytm', 'BHIM'].map(prov => (
                      <TouchableOpacity 
                        key={prov}
                        style={[styles.bankChip, selectedProvider === prov && styles.bankChipActive]}
                        onPress={() => setSelectedProvider(prov)}
                      >
                        <Text style={[styles.bankChipText, selectedProvider === prov && styles.bankChipTextActive]}>{prov}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <Text style={styles.inputLabel}>Enter UPI Address</Text>
                  <View style={styles.inputField}>
                    <MaterialCommunityIcons name="at" size={20} color={COLORS.primary} style={{ marginRight: 10 }} />
                    <TextInput 
                      placeholder="mobileNumber@ybl or username@okaxis" 
                      autoCapitalize="none"
                      value={newUpiId}
                      onChangeText={setNewUpiId}
                      style={styles.textInput}
                      placeholderTextColor="#94A3B8"
                    />
                  </View>

                  {/* Quick autofill chips tray */}
                  <Text style={styles.quickFillHeader}>Quick autofill handles:</Text>
                  <View style={styles.chipsRow}>
                    {['@okaxis', '@ybl', '@paytm', '@upi', '@okicici'].map((tail) => (
                      <TouchableOpacity 
                        key={tail} 
                        style={styles.miniChip}
                        onPress={() => {
                          const base = newUpiId.split('@')[0] || '9999999999';
                          setNewUpiId(`${base}${tail}`);
                        }}
                      >
                        <Text style={styles.miniChipText}>{tail}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  <TouchableOpacity 
                    style={styles.saveBtn} 
                    activeOpacity={0.8}
                    onPress={handleLinkUpi}
                    disabled={isSavingUpi}
                  >
                    {isSavingUpi ? (
                      <ActivityIndicator color="#FFF" />
                    ) : (
                      <Text style={styles.saveBtnText}>Verify & Link UPI</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    backgroundColor: COLORS.primary,
    paddingTop: Platform.OS === 'ios' ? 50 : 45,
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
  scrollContent: {
    padding: 20,
    paddingBottom: 50,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textDark,
    marginBottom: 16,
    marginLeft: 4,
  },
  creditCard: {
    height: 176,
    borderRadius: 20,
    padding: 20,
    justifyContent: 'space-between',
    ...SHADOWS.soft,
    elevation: 4,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bankName: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    letterSpacing: 1,
    fontSize: 14,
  },
  cardNumber: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
    letterSpacing: 2,
    textAlign: 'center',
    marginVertical: 10,
  },
  cardBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardLabel: {
    color: '#E2E8F0',
    fontSize: 8,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
    opacity: 0.8,
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
  },
  emptyStateText: {
    color: '#94A3B8',
    fontStyle: 'italic',
    fontSize: 13,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: COLORS.primary,
    borderStyle: 'dashed',
    backgroundColor: 'rgba(0, 128, 128, 0.02)',
    marginTop: 4,
  },
  addBtnText: {
    color: COLORS.primary,
    fontWeight: 'bold',
    marginLeft: 8,
    fontSize: 14,
  },
  upiCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  upiCardPrimary: {
    borderColor: COLORS.primary,
    borderWidth: 1.5,
    backgroundColor: 'rgba(0, 128, 128, 0.02)',
  },
  upiRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  upiName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  upiValue: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  defaultBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#059669',
  },
  tipBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    padding: 12,
    borderRadius: 12,
    marginTop: 30,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  tipText: {
    fontSize: 11,
    color: '#64748B',
    marginLeft: 8,
    flex: 1,
  },
  /* MODAL SHEET STYLINGS */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    width: '100%',
  },
  modalSheet: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingBottom: Platform.OS === 'ios' ? 40 : 30,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.textDark,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalBody: {
    padding: 24,
  },
  cardMiniPreview: {
    height: 120,
    borderRadius: 16,
    padding: 16,
    justifyContent: 'space-between',
    marginBottom: 20,
    ...SHADOWS.soft,
    elevation: 3,
  },
  bankNameMini: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: 'bold',
  },
  cardNumberMini: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 1,
    textAlign: 'center',
  },
  cardValMini: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
    opacity: 0.8,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 8,
    marginTop: 6,
  },
  bankSelectorRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  bankChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  bankChipActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  bankChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  bankChipTextActive: {
    color: '#FFF',
  },
  inputField: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    height: 50,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: COLORS.textDark,
    fontWeight: '500',
  },
  rowFields: {
    flexDirection: 'row',
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    ...SHADOWS.soft,
    elevation: 3,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  quickFillHeader: {
    fontSize: 11,
    color: '#64748B',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  chipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 20,
  },
  miniChip: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniChipText: {
    fontSize: 11,
    color: COLORS.primary,
    fontWeight: '700',
  },
});
