import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../src/theme/theme';
import api from '../../src/api/apiClient';

export default function VendorKYCScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [gst, setGst] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!name || !storeName || !gst || !address) {
      return Alert.alert('Error', 'Please fill all fields');
    }
    
    setLoading(true);
    try {
      await api.post('/vendor/profile', { 
        name, 
        store_name: storeName, 
        gst_number: gst, 
        address 
      });
      
      Alert.alert('Success', 'Profile submitted. Awaiting Admin Approval.', [
        { text: 'OK', onPress: () => router.push('/(vendor_tabs)') }
      ]);
    } catch {
      Alert.alert('Error', 'Failed to submit KYC details');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.header}>
          <MaterialCommunityIcons name="clipboard-check-outline" size={60} color={COLORS.accent} />
          <Text style={styles.title}>Vendor KYC</Text>
          <Text style={styles.subtitle}>Complete profile to start selling</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="account" size={24} color={COLORS.primaryLight} style={styles.icon} />
            <TextInput style={styles.input} placeholder="Your Full Name" placeholderTextColor="#94a3b8" value={name} onChangeText={setName} />
          </View>
          
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="store" size={24} color={COLORS.primaryLight} style={styles.icon} />
            <TextInput style={styles.input} placeholder="Store Name" placeholderTextColor="#94a3b8" value={storeName} onChangeText={setStoreName} />
          </View>
          
          <View style={styles.inputContainer}>
            <MaterialCommunityIcons name="file-document" size={24} color={COLORS.primaryLight} style={styles.icon} />
            <TextInput style={styles.input} placeholder="GST Number" placeholderTextColor="#94a3b8" autoCapitalize="characters" value={gst} onChangeText={setGst} />
          </View>

          <View style={[styles.inputContainer, { height: 100, alignItems: 'flex-start', paddingTop: 12 }]}>
            <MaterialCommunityIcons name="map-marker" size={24} color={COLORS.primaryLight} style={styles.icon} />
            <TextInput style={[styles.input, { height: 80, textAlignVertical: 'top' }]} placeholder="Full Address" placeholderTextColor="#94a3b8" multiline value={address} onChangeText={setAddress} />
          </View>

          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color={COLORS.primaryDark} /> : <Text style={styles.buttonText}>Submit Profile</Text>}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scroll: {
    paddingHorizontal: 24,
    paddingVertical: 40,
    flexGrow: 1,
  },
  header: {
    alignItems: 'flex-start',
    marginBottom: 28,
    paddingLeft: 4,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 14,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    color: '#64748B',
    marginTop: 8,
  },
  form: {
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 28,
    padding: 24,
    ...SHADOWS.soft,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
  },
  icon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#0F172A',
  },
  button: {
    backgroundColor: COLORS.primary,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
