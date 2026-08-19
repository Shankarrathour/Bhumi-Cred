import React, { useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS } from '../src/theme/theme';

export default function NotFoundScreen() {
  const router = useRouter();

  useEffect(() => {
    // Auto redirect unmatched deep links / notifications to main tab dashboard after 300ms
    const timer = setTimeout(() => {
      router.replace('/(tabs)' as any);
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name="leaf" size={54} color={COLORS.primary} />
      <Text style={styles.title}>BhumiCred Dashboard</Text>
      <Text style={styles.subtitle}>Opening requested screen...</Text>
      <TouchableOpacity style={styles.button} onPress={() => router.replace('/(tabs)' as any)}>
        <Text style={styles.buttonText}>Go to Home</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 16,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
});
