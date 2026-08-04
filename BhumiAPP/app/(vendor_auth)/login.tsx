import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, SHADOWS } from '../../src/theme/theme';
import api from '../../src/api/apiClient';

export default function VendorLoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return Alert.alert('Error', 'Enter email and password');
    setLoading(true);
    try {
      const res = await api.post('/vendor/auth/login', { email, password });
      api.defaults.headers.common['Authorization'] = `Bearer ${res.data.access_token}`;
      router.push('/(vendor_tabs)');
    } catch (err: any) {
      const msg = err.response?.data?.detail || 'Invalid email or password';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="storefront" size={60} color={COLORS.accent} />
        <Text style={styles.title}>Vendor Portal</Text>
        <Text style={styles.subtitle}>Enter your credentials to login</Text>
      </View>

      <View style={styles.form}>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="email" size={24} color={COLORS.primaryLight} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Email Address"
            placeholderTextColor="#94a3b8"
            keyboardType="email-address"
            autoCapitalize="none"
            value={email}
            onChangeText={setEmail}
          />
        </View>

        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="lock" size={24} color={COLORS.primaryLight} style={styles.icon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#94a3b8"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />
        </View>

        <TouchableOpacity 
          style={styles.button} 
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.primaryDark} />
          ) : (
            <Text style={styles.buttonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/(vendor_auth)/register')} style={{ marginTop: 16, alignItems: 'center' }}>
          <Text style={{ color: '#64748B' }}>New to BhumiCred? <Text style={{ color: COLORS.primary, fontWeight: '800' }}>Register</Text></Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC', paddingHorizontal: 24, justifyContent: 'center' },
  header: { alignItems: 'flex-start', marginBottom: 28, paddingLeft: 4 },
  title: { fontSize: 28, fontWeight: '900', color: '#0F172A', marginTop: 14, letterSpacing: -0.5 },
  subtitle: { fontSize: 15, color: '#64748B', marginTop: 8, lineHeight: 22 },
  form: { gap: 16, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 28, padding: 24, ...SHADOWS.soft },
  inputContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 12, paddingHorizontal: 16, height: 54 },
  icon: { marginRight: 12 },
  input: { flex: 1, fontSize: 16, color: '#0F172A' },
  button: { backgroundColor: COLORS.primary, height: 56, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginTop: 8, ...SHADOWS.glow },
  buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' }
});
