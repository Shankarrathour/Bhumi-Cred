import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Alert, Modal, Dimensions, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useFocusEffect } from 'expo-router';

import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { COLORS, TYPOGRAPHY, SHADOWS } from '../../src/theme/theme';
import { useWalletStore } from '../../src/store/walletStore';
import { useAuthStore } from '../../src/store/authStore';
import { isFarmerVerified } from '../../src/utils/verificationGuard';

const { width, height } = Dimensions.get('window');

export default function WalletScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace('/(tabs)' as any);
    }
  };

  // Zustand store
  const balance = useWalletStore((state) => state.balance);
  const totalEarnings = useWalletStore((state) => state.totalEarnings);
  const transactions = useWalletStore((state) => state.transactions);
  const bankAccounts = useWalletStore((state) => state.bankAccounts);
  const upiId = useWalletStore((state) => state.upiId);
  const addBankAccount = useWalletStore((state) => state.addBankAccount);
  const updateBankAccount = useWalletStore((state) => state.updateBankAccount);
  const deleteBankAccount = useWalletStore((state) => state.deleteBankAccount);
  const setPrimaryBankAccount = useWalletStore((state) => state.setPrimaryBankAccount);
  const addUpiId = useWalletStore((state) => state.addUpiId);
  const removeUpiId = useWalletStore((state) => state.removeUpiId);
  const requestWithdrawal = useWalletStore((state) => state.requestWithdrawal);
  const sellCarbonCredits = useWalletStore((state) => state.sellCarbonCredits);
  const storeLoading = useWalletStore((state) => state.isLoading);
  const fetchWallet = useWalletStore((state) => state.fetchWallet);
  const fetchTransactions = useWalletStore((state) => state.fetchTransactions);
  const fetchBankAccounts = useWalletStore((state) => state.fetchBankAccounts);

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
    fetchBankAccounts();
  }, []);

  const authUser = useAuthStore((state) => state.user);
  const availableCredits = authUser?.carbonCreditsGenerated || 0;

  // Local state
  const [isWithdrawVisible, setIsWithdrawVisible] = useState(false);
  const [isBankVisible, setIsBankVisible] = useState(false);
  const [isUpiVisible, setIsUpiVisible] = useState(false);
  const [isSellVisible, setIsSellVisible] = useState(false);
  const [sellAmount, setSellAmount] = useState('');

  useFocusEffect(
    React.useCallback(() => {
      useAuthStore.getState().fetchProfile().catch(() => {});
      fetchWallet().catch(() => {});
      fetchTransactions().catch(() => {});
      fetchBankAccounts().catch(() => {});
    }, [])
  );
  
  // Withdrawal Form
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawMethod, setWithdrawMethod] = useState<'bank' | 'upi'>(upiId ? 'upi' : 'bank');
  const [selectedBankAccountId, setSelectedBankAccountId] = useState<string | null>(null);

  // UPI Form
  const [upiInput, setUpiInput] = useState('');

  // Bank Account Form
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);
  const [bankName, setBankName] = useState('');
  const [accNum, setAccNum] = useState('');
  const [ifsc, setIfsc] = useState('');
  const [holder, setHolder] = useState('');

  const openAddBankModal = () => {
    setEditingAccountId(null);
    setBankName('');
    setAccNum('');
    setIfsc('');
    setHolder('');
    setIsBankVisible(true);
  };

  const openEditBankModal = (account: (typeof bankAccounts)[number]) => {
    setEditingAccountId(account.id);
    setBankName(account.bankName);
    setAccNum(account.accountNumber);
    setIfsc(account.ifscCode);
    setHolder(account.holderName);
    setIsBankVisible(true);
  };

  const handleWithdrawSubmit = async () => {
    const amt = parseFloat(withdrawAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid positive number to withdraw.');
      return;
    }
    if (amt > balance) {
      Alert.alert('Insufficient Balance', 'Withdrawal amount exceeds your current payout balance.');
      return;
    }
    if (withdrawMethod === 'bank' && !selectedBankAccountId) {
      Alert.alert('Select Bank Account', 'Please select a bank account to continue, or add one first.');
      return;
    }
    if (withdrawMethod === 'upi' && !upiId) {
      Alert.alert('No UPI Linked', 'Please link a UPI ID first.');
      return;
    }

    if (!isFarmerVerified()) return;

    try {
      const success = await requestWithdrawal(amt, withdrawMethod, {
        bankAccountId: withdrawMethod === 'bank' ? selectedBankAccountId ?? undefined : undefined,
        upiId: withdrawMethod === 'upi' ? upiId ?? undefined : undefined,
      });
      if (success) {
        setIsWithdrawVisible(false);
        setWithdrawAmount('');
        Alert.alert('Withdrawal Processed ✅', `₹${amt} has been successfully transferred to your linked bank account.`);
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Unable to process payout. Please check bank details.';
      Alert.alert('Error', msg);
    }
  };

  const handleBankSubmit = async () => {
    if (!bankName || !accNum || !ifsc || !holder) {
      Alert.alert('Incomplete Info', 'Please complete all highlighted fields.');
      return;
    }

    const payload = {
      bankName,
      accountNumber: `******${accNum.slice(-4)}`,
      ifscCode: ifsc,
      holderName: holder,
    };

    try {
      if (editingAccountId) {
        await updateBankAccount(editingAccountId, payload);
        setIsBankVisible(false);
        Alert.alert('Bank Account Updated ✅', 'Your payout bank account details were updated.');
      } else {
        await addBankAccount(payload);
        setIsBankVisible(false);
        Alert.alert('Bank Account Linked ✅', 'Your payout bank account was successfully linked and verified.');
      }
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Unable to synchronize bank credentials.';
      Alert.alert('Error', msg);
    }
  };

  const handleDeleteBank = (id: string) => {
    Alert.alert(
      'Delete Bank Account',
      'Are you sure you want to remove this bank account?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteBankAccount(id);
            } catch (e: any) {
              const msg = e?.response?.data?.message || 'Unable to delete bank account.';
              Alert.alert('Error', msg);
            }
          },
        },
      ]
    );
  };

  const handleSetPrimary = async (id: string) => {
    try {
      await setPrimaryBankAccount(id);
    } catch (e: any) {
      const msg = e?.response?.data?.message || 'Unable to update primary account.';
      Alert.alert('Error', msg);
    }
  };

  const handleUpiSubmit = async () => {
    if (!upiInput) {
      Alert.alert('Incomplete Info', 'Please enter a valid UPI ID.');
      return;
    }
    try {
      await addUpiId(upiInput);
      setIsUpiVisible(false);
      Alert.alert('UPI Linked ✅', 'Your UPI ID was successfully linked.');
    } catch (e) {
      Alert.alert('Error', 'Unable to synchronize UPI credentials.');
    }
  };

  const openEditUpiModal = () => {
    setUpiInput(upiId ?? '');
    setIsUpiVisible(true);
  };

  const handleDeleteUpi = () => {
    Alert.alert(
      'Remove UPI ID',
      'Are you sure you want to unlink this UPI ID?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeUpiId() },
      ]
    );
  };

  const handleSellSubmit = async () => {
    const amt = parseFloat(sellAmount);
    if (isNaN(amt) || amt <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount to sell.');
      return;
    }
    if (amt > availableCredits) {
      Alert.alert('Insufficient Credits', 'You do not have enough carbon credits to sell.');
      return;
    }

    try {
      const success = await sellCarbonCredits(amt);
      if (success) {
        setIsSellVisible(false);
        setSellAmount('');
        
        Alert.alert('Request Submitted ✅', `Your request to sell ${amt} CO₂e has been submitted. The admin will sell these on the market and transfer the final amount to your wallet.`);
      } else {
        Alert.alert('Error', 'Failed to submit request. Please try again.');
      }
    } catch (e) {
      Alert.alert('Error', 'An error occurred while selling credits.');
    }
  };


  return (
    <View style={styles.container}>
      {/* Top Banner header */}
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity onPress={handleBack} style={{ marginRight: 10, padding: 4 }}>
            <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Eco Payout Wallet</Text>
            <Text style={styles.headerSubtitle}>Claim carbon credits & tree insurance payouts</Text>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollArea} showsVerticalScrollIndicator={false}>
        
        {/* Sell Carbon Credits Card */}
        <View style={styles.balanceCardWrapper}>
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.balanceCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>Available Carbon Credits</Text>
              <MaterialCommunityIcons name="tree-outline" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.balanceText}>{availableCredits.toFixed(1)} <Text style={{ fontSize: 18 }}>CO₂e</Text></Text>
            
            <View style={styles.cardFooterRow}>
              <View>
                <Text style={styles.cardSubLabel}>Sale Type</Text>
                <Text style={styles.cardSubVal}>Market Rate</Text>
              </View>
              
              <TouchableOpacity 
                style={styles.withdrawBtn} 
                onPress={() => {
                  if (availableCredits > 0) {
                    setSellAmount(Number(availableCredits.toFixed(2)).toString());
                    setIsSellVisible(true);
                  } else {
                    Alert.alert('No Credits', 'You do not have any carbon credits to sell.');
                  }
                }}
              >
                <Text style={styles.withdrawBtnLabel}>Sell Credits</Text>
                <MaterialCommunityIcons name="currency-inr" size={16} color={COLORS.primaryDark} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Wallet Balance Card with Eco-Glow */}
        <View style={styles.balanceCardWrapper}>
          <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.balanceCard}>
            <View style={styles.cardHeaderRow}>
              <Text style={styles.cardLabel}>Available Payout Balance</Text>
              <MaterialCommunityIcons name="leaf" size={24} color={COLORS.accent} />
            </View>
            <Text style={styles.balanceText}>₹{balance}</Text>
            
            <View style={styles.cardFooterRow}>
              <View>
                <Text style={styles.cardSubLabel}>Total Eco Earnings</Text>
                <Text style={styles.cardSubVal}>₹{totalEarnings}</Text>
              </View>
              
              <TouchableOpacity
                style={styles.withdrawBtn}
                onPress={() => {
                  const primary = bankAccounts.find((a) => a.isPrimary) ?? bankAccounts[0] ?? null;
                  setSelectedBankAccountId(primary ? primary.id : null);
                  setIsWithdrawVisible(true);
                }}
              >
                <Text style={styles.withdrawBtnLabel}>Withdraw</Text>
                <MaterialCommunityIcons name="arrow-up-bold-box-outline" size={16} color={COLORS.primaryDark} />
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>

        {/* Payout Methods Box */}
        <View style={styles.bankSection}>
          <Text style={styles.sectionTitle}>Linked Payout Methods</Text>

          {/* Bank Cards (max 3) */}
          {bankAccounts.map((account) => (
            <View key={account.id} style={[styles.bankCard, { marginBottom: 12 }]}>
              <View style={styles.bankIconFrame}>
                <MaterialCommunityIcons name="bank-outline" size={24} color={COLORS.primary} />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Text style={styles.bankName}>{account.bankName}</Text>
                  <View style={[styles.primaryTag, account.isPrimary ? styles.primaryTagActive : styles.primaryTagSecondary]}>
                    <Text style={[styles.primaryTagText, account.isPrimary ? styles.primaryTagTextActive : styles.primaryTagTextSecondary]}>
                      {account.isPrimary ? 'PRIMARY' : 'SECONDARY'}
                    </Text>
                  </View>
                </View>
                <Text style={styles.bankAcc}>A/C: {account.accountNumber} • IFSC: {account.ifscCode}</Text>
                <Text style={styles.bankHolder}>Holder: {account.holderName}</Text>
                {!account.isPrimary && (
                  <TouchableOpacity onPress={() => handleSetPrimary(account.id)}>
                    <Text style={styles.setPrimaryLink}>Set as Primary</Text>
                  </TouchableOpacity>
                )}
              </View>
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity onPress={() => openEditBankModal(account)} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDeleteBank(account.id)} style={{ padding: 4, marginTop: 6 }}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ))}

          {bankAccounts.length < 3 ? (
            <TouchableOpacity style={[styles.addBankBtn, { marginBottom: 12 }]} onPress={openAddBankModal}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color={COLORS.primary} />
              <Text style={styles.addBankLabel}>Link Bank Account</Text>
            </TouchableOpacity>
          ) : (
            <Text style={styles.maxBankHint}>Maximum of 3 bank accounts reached.</Text>
          )}

          {/* UPI Card */}
          {upiId ? (
            <View style={styles.bankCard}>
              <View style={[styles.bankIconFrame, { backgroundColor: '#F3E8FF' }]}>
                <MaterialCommunityIcons name="lightning-bolt" size={24} color="#9333EA" />
              </View>
              <View style={{ flex: 1, marginLeft: 14 }}>
                <Text style={styles.bankName}>UPI ID</Text>
                <Text style={styles.bankAcc}>{upiId}</Text>
              </View>
              <View style={{ alignItems: 'center' }}>
                <TouchableOpacity onPress={openEditUpiModal} style={{ padding: 4 }}>
                  <MaterialCommunityIcons name="pencil-outline" size={16} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={handleDeleteUpi} style={{ padding: 4, marginTop: 6 }}>
                  <MaterialCommunityIcons name="trash-can-outline" size={16} color={COLORS.danger} />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <TouchableOpacity style={styles.addBankBtn} onPress={() => { setUpiInput(''); setIsUpiVisible(true); }}>
              <MaterialCommunityIcons name="plus-circle-outline" size={20} color="#9333EA" />
              <Text style={[styles.addBankLabel, { color: '#9333EA' }]}>Link UPI ID</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Transaction History list */}
        <View style={styles.txnSection}>
          <Text style={styles.sectionTitle}>Transaction History</Text>
          
          {transactions.length === 0 ? (
            <View style={styles.emptyTxnContainer}>
              <View style={styles.emptyTxnIconBox}>
                <MaterialCommunityIcons name="swap-horizontal" size={32} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTxnTitle}>No Transactions Yet</Text>
              <Text style={styles.emptyTxnSubtitle}>
                Your payout earnings, carbon credit sales, and bank withdrawals will appear here.
              </Text>
            </View>
          ) : (
            transactions.map((txn) => {
              const isCredit = txn.type === 'credit';
              return (
                <View key={txn.id} style={styles.txnCard}>
                  <View style={[styles.txnIconBox, { backgroundColor: isCredit ? '#ECFDF5' : '#FFF1F2' }]}>
                    <MaterialCommunityIcons 
                      name={isCredit ? "cash-plus" : "cash-minus"} 
                      size={22} 
                      color={isCredit ? COLORS.success : COLORS.danger} 
                    />
                  </View>
                  
                  <View style={{ flex: 1, marginLeft: 12 }}>
                    <Text style={styles.txnDesc}>{txn.description}</Text>
                    <Text style={styles.txnDate}>{txn.date} • {txn.id}</Text>
                  </View>

                  <View style={{ alignItems: 'flex-end' }}>
                    <Text style={[styles.txnAmt, { color: isCredit ? COLORS.success : COLORS.danger }]}>
                      {isCredit ? '+' : '-'} ₹{txn.amount}
                    </Text>
                    <View style={[styles.statusBadge, txn.status === 'Completed' ? styles.statusCompleted : styles.statusPending]}>
                      <Text style={[styles.statusText, txn.status === 'Completed' ? styles.statusCompletedText : styles.statusPendingText]}>
                        {txn.status}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })
          )}
        </View>

      </ScrollView>

      {/* 🔄 Sell Carbon Credits Modal */}
      <Modal visible={isSellVisible} transparent animationType="slide" onRequestClose={() => setIsSellVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsSellVisible(false)}>
          <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Sell Carbon Credits</Text>
              <TouchableOpacity onPress={() => setIsSellVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.withdrawForm}>
              <Text style={styles.formLabel}>Enter Amount of CO₂e to Sell *</Text>
              <TextInput 
                style={styles.formInput}
                placeholder="e.g. 50"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={sellAmount}
                onChangeText={setSellAmount}
              />
              
              <Text style={styles.availableHint}>Available Credits: {availableCredits.toFixed(1)} CO₂e</Text>
              
              {parseFloat(sellAmount) > 0 && parseFloat(sellAmount) <= availableCredits && (
                <View style={{ marginTop: 12, padding: 12, backgroundColor: '#F0FDF4', borderRadius: 8, borderWidth: 1, borderColor: '#BBF7D0' }}>
                  <Text style={{ color: '#166534', fontSize: 13, lineHeight: 18 }}>
                    The system administrator will sell your credits to an external buyer on the open market. The final price depends on the market rate at the time of sale.
                    {"\n\n"}
                    <Text style={{ fontWeight: 'bold' }}>Note:</Text> If the gross sale amount exceeds ₹5,000, standard platform (7%) and GST (18%) deductions will apply before the net amount is transferred to your wallet.
                  </Text>
                </View>
              )}

              <TouchableOpacity 
                style={[styles.formSubmitBtn, { backgroundColor: '#22C55E' }]} 
                onPress={handleSellSubmit}
                disabled={storeLoading}
              >
                {storeLoading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.formSubmitLabel}>Confirm Sale</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 💸 Payout Withdrawal Modal */}
      <Modal visible={isWithdrawVisible} transparent animationType="slide" onRequestClose={() => setIsWithdrawVisible(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setIsWithdrawVisible(false)}>
          <View style={[styles.sheet, { paddingBottom: 20 + insets.bottom }]} onStartShouldSetResponder={() => true}>
            <View style={styles.sheetHeader}>
              <Text style={styles.sheetTitle}>Request Payout Withdrawal</Text>
              <TouchableOpacity onPress={() => setIsWithdrawVisible(false)}>
                <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.withdrawForm}>
              <Text style={styles.formLabel}>Enter Withdrawal Amount (INR) *</Text>
              <TextInput 
                style={styles.formInput}
                placeholder="e.g. ₹2000"
                placeholderTextColor="#94A3B8"
                keyboardType="numeric"
                value={withdrawAmount}
                onChangeText={setWithdrawAmount}
              />
              
              <Text style={styles.availableHint}>Available Balance: ₹{balance}</Text>

              <View style={{ flexDirection: 'row', marginBottom: 20 }}>
                <TouchableOpacity
                  style={[styles.methodSelector, withdrawMethod === 'bank' && styles.methodSelectorActive]}
                  onPress={() => setWithdrawMethod('bank')}
                >
                  <MaterialCommunityIcons name="bank-outline" size={18} color={withdrawMethod === 'bank' ? COLORS.primary : COLORS.textSecondary} />
                  <Text style={[styles.methodSelectorText, withdrawMethod === 'bank' && styles.methodSelectorTextActive]}>Bank</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodSelector, withdrawMethod === 'upi' && styles.methodSelectorActive, { marginLeft: 10 }]}
                  onPress={() => setWithdrawMethod('upi')}
                  disabled={!upiId}
                >
                  <MaterialCommunityIcons name="lightning-bolt" size={18} color={withdrawMethod === 'upi' ? '#9333EA' : COLORS.textSecondary} />
                  <Text style={[styles.methodSelectorText, withdrawMethod === 'upi' && { color: '#9333EA' }]}>UPI</Text>
                </TouchableOpacity>
              </View>

              {withdrawMethod === 'bank' && (
                bankAccounts.length === 0 ? (
                  <View style={{ marginBottom: 20 }}>
                    <Text style={styles.emptyBankHint}>No bank account added.</Text>
                    <TouchableOpacity
                      style={styles.addBankBtn}
                      onPress={() => {
                        setIsWithdrawVisible(false);
                        openAddBankModal();
                      }}
                    >
                      <MaterialCommunityIcons name="plus-circle-outline" size={20} color={COLORS.primary} />
                      <Text style={styles.addBankLabel}>Add Bank Account</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={{ marginBottom: 20 }}>
                    {bankAccounts.map((account) => {
                      const selected = selectedBankAccountId === account.id;
                      return (
                        <TouchableOpacity
                          key={account.id}
                          style={[styles.bankCard, { marginBottom: 10 }, selected && styles.bankCardSelected]}
                          onPress={() => setSelectedBankAccountId(account.id)}
                        >
                          <MaterialCommunityIcons
                            name={selected ? 'radiobox-marked' : 'radiobox-blank'}
                            size={20}
                            color={selected ? COLORS.primary : '#CBD5E1'}
                          />
                          <View style={{ flex: 1, marginLeft: 12 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                              <Text style={styles.bankName}>{account.bankName}</Text>
                              {account.isPrimary && (
                                <View style={[styles.primaryTag, styles.primaryTagActive]}>
                                  <Text style={[styles.primaryTagText, styles.primaryTagTextActive]}>PRIMARY</Text>
                                </View>
                              )}
                            </View>
                            <Text style={styles.bankAcc}>{account.accountNumber}</Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                )
              )}

              <TouchableOpacity
                style={styles.submitWithdrawBtn}
                onPress={handleWithdrawSubmit}
                disabled={storeLoading || (withdrawMethod === 'bank' && bankAccounts.length === 0)}
              >
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.withdrawGrad}>
                  {storeLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <>
                      <MaterialCommunityIcons name="cash-fast" size={20} color="#FFF" style={{ marginRight: 8 }} />
                      <Text style={styles.submitWithdrawText}>Process Instant Payout</Text>
                    </>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* 🏦 Link Bank Account Modal */}
      <Modal visible={isBankVisible} animationType="slide" onRequestClose={() => setIsBankVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View style={[styles.sheetHeader, { paddingHorizontal: 20, paddingTop: 15 }]}>
            <Text style={styles.sheetTitle}>{editingAccountId ? 'Edit Bank Account' : 'Link Bank Account'}</Text>
            <TouchableOpacity onPress={() => setIsBankVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: 20, paddingVertical: 12 }}>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Bank Name / बैंक का नाम *</Text>
                <TextInput style={styles.formInput} placeholder="e.g. State Bank of India" value={bankName} onChangeText={setBankName} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Account Number / खाता संख्या *</Text>
                <TextInput style={styles.formInput} placeholder="e.g. 30219087123" keyboardType="numeric" value={accNum} onChangeText={setAccNum} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>IFSC Code / आईएफएससी कोड *</Text>
                <TextInput style={styles.formInput} placeholder="e.g. SBIN0001024" autoCapitalize="characters" value={ifsc} onChangeText={setIfsc} />
              </View>
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Account Holder Name / खाताधारक का नाम *</Text>
                <TextInput style={styles.formInput} placeholder="e.g. Your Full Name" value={holder} onChangeText={setHolder} />
              </View>

              <TouchableOpacity style={styles.submitWithdrawBtn} onPress={handleBankSubmit} disabled={storeLoading}>
                <LinearGradient colors={[COLORS.primary, COLORS.secondary]} style={styles.withdrawGrad}>
                  {storeLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitWithdrawText}>{editingAccountId ? 'Save Changes' : 'Verify & Save Account'}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
        </View>
      </Modal>

      {/* 💳 Link UPI Modal */}
      <Modal visible={isUpiVisible} animationType="slide" onRequestClose={() => setIsUpiVisible(false)}>
        <View style={{ flex: 1, backgroundColor: '#FFFFFF', paddingTop: insets.top, paddingBottom: insets.bottom }}>
          <View style={[styles.sheetHeader, { paddingHorizontal: 20, paddingTop: 15 }]}>
            <Text style={styles.sheetTitle}>{upiId ? 'Edit UPI ID' : 'Link UPI ID'}</Text>
            <TouchableOpacity onPress={() => setIsUpiVisible(false)}>
              <MaterialCommunityIcons name="close" size={24} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <View style={{ paddingHorizontal: 20, paddingTop: 12 }}>
            <View style={styles.withdrawForm}>
              <Text style={styles.formLabel}>Enter UPI ID *</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. name@okicici"
                placeholderTextColor="#94A3B8"
                autoCapitalize="none"
                value={upiInput}
                onChangeText={setUpiInput}
              />
              <TouchableOpacity style={[styles.submitWithdrawBtn, { marginTop: 20 }]} onPress={handleUpiSubmit} disabled={storeLoading}>
                <LinearGradient colors={['#9333EA', '#A855F7']} style={styles.withdrawGrad}>
                  {storeLoading ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.submitWithdrawText}>{upiId ? 'Save Changes' : 'Verify & Save UPI'}</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 45,
    paddingBottom: 16,
    paddingHorizontal: 20,
    backgroundColor: COLORS.primary,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerTitle: {
    ...TYPOGRAPHY.h2,
    color: '#FFFFFF',
    fontWeight: '900',
  },
  headerSubtitle: {
    fontSize: 11,
    color: COLORS.accent,
    fontWeight: '700',
    marginTop: 2,
  },
  scrollArea: {
    padding: 20,
  },
  balanceCardWrapper: {
    borderRadius: 24,
    overflow: 'hidden',
    ...SHADOWS.glow,
    marginBottom: 24,
  },
  balanceCard: {
    padding: 20,
    height: 180,
    justifyContent: 'space-between',
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardLabel: {
    fontSize: 11,
    color: '#E0F2F1',
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  balanceText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  cardFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardSubLabel: {
    fontSize: 9,
    color: '#E0F2F1',
    fontWeight: '600',
  },
  cardSubVal: {
    fontSize: 15,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  withdrawBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.accent,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  withdrawBtnLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginRight: 6,
  },
  bankSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    ...TYPOGRAPHY.h3,
    color: COLORS.primaryDark,
    fontWeight: '800',
    marginBottom: 12,
  },
  bankCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    ...SHADOWS.soft,
  },
  bankIconFrame: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#F0FDF4',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bankName: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  bankAcc: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  bankHolder: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
  },
  verifiedBadge: {
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 8,
    fontWeight: '800',
    color: COLORS.success,
    marginTop: 2,
  },
  addBankBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: COLORS.border,
    borderRadius: 20,
    paddingVertical: 14,
    ...SHADOWS.soft,
  },
  addBankLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: COLORS.primary,
    marginLeft: 6,
  },
  primaryTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
  primaryTagActive: {
    backgroundColor: '#ECFDF5',
  },
  primaryTagSecondary: {
    backgroundColor: '#F1F5F9',
  },
  primaryTagText: {
    fontSize: 8,
    fontWeight: '800',
  },
  primaryTagTextActive: {
    color: COLORS.success,
  },
  primaryTagTextSecondary: {
    color: COLORS.textSecondary,
  },
  setPrimaryLink: {
    fontSize: 10,
    fontWeight: '800',
    color: COLORS.primary,
    marginTop: 4,
  },
  bankCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#ECFDF5',
  },
  emptyBankHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginBottom: 10,
  },
  maxBankHint: {
    fontSize: 10,
    color: COLORS.textSecondary,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  txnSection: {
    marginBottom: 24,
  },
  txnCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  txnIconBox: {
    width: 42,
    height: 42,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  txnDesc: {
    fontSize: 12,
    fontWeight: '800',
    color: COLORS.textDark,
  },
  txnDate: {
    fontSize: 9,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 2,
  },
  txnAmt: {
    fontSize: 14,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 2,
  },
  statusText: {
    fontSize: 8,
    fontWeight: '800',
  },
  statusCompleted: {
    backgroundColor: '#ECFDF5',
  },
  statusCompletedText: {
    color: COLORS.success,
    fontSize: 8,
    fontWeight: '800',
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusPendingText: {
    color: COLORS.warning,
    fontSize: 8,
    fontWeight: '800',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 44, 34, 0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    minHeight: height * 0.35,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderColor: '#F1F5F9',
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: COLORS.textDark,
  },
  withdrawForm: {
    paddingVertical: 16,
  },
  formField: {
    marginBottom: 14,
  },
  formLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.textDark,
    marginBottom: 6,
  },
  formInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    fontWeight: '700',
    color: COLORS.textDark,
  },
  availableHint: {
    fontSize: 11,
    color: COLORS.textSecondary,
    fontWeight: '600',
    marginTop: 6,
    marginBottom: 20,
  },
  submitWithdrawBtn: {
    borderRadius: 30,
    overflow: 'hidden',
  },
  withdrawGrad: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
  },
  submitWithdrawText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  methodSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    backgroundColor: '#F8FAFC',
  },
  methodSelectorActive: {
    borderColor: COLORS.primary,
    backgroundColor: '#ECFDF5',
  },
  methodSelectorText: {
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginLeft: 6,
  },
  methodSelectorTextActive: {
    color: COLORS.primary,
  },
  formSubmitBtn: {
    borderRadius: 30,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginTop: 20,
  },
  formSubmitLabel: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyTxnContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 4,
    ...SHADOWS.soft,
  },
  emptyTxnIconBox: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emptyTxnTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.primaryDark,
    marginBottom: 4,
  },
  emptyTxnSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 260,
  },
});
