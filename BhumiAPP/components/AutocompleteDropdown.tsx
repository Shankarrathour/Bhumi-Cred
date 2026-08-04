import React, { useState, useEffect } from 'react';
import { View, TextInput, ScrollView, Text, TouchableOpacity, StyleSheet, Keyboard } from 'react-native';
import { COLORS } from '../src/theme/theme';

interface AutocompleteDropdownProps {
  data: string[];
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
  closeTrigger?: number;
}

export default function AutocompleteDropdown({ data, value, onChangeText, placeholder, style, closeTrigger }: AutocompleteDropdownProps) {
  const [filteredData, setFilteredData] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    if (value && showDropdown) {
      const filtered = data.filter(item => item.toLowerCase().includes(value.toLowerCase()));
      setFilteredData(filtered);
    } else {
      setFilteredData(data);
    }
  }, [value, data, showDropdown]);

  useEffect(() => {
    if (closeTrigger && closeTrigger > 0) {
      setShowDropdown(false);
    }
  }, [closeTrigger]);

  const handleSelect = (item: string) => {
    onChangeText(item);
    setShowDropdown(false);
    Keyboard.dismiss();
  };

  return (
    <View style={[styles.container, style]}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#64748B"
        value={value}
        onChangeText={(text) => {
          onChangeText(text);
          setShowDropdown(true);
        }}
        onFocus={() => setShowDropdown(true)}
      />
      {showDropdown && filteredData.length > 0 && (
        <View style={styles.dropdownContainer}>
          <ScrollView
            style={styles.list}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {filteredData.map((item, index) => (
              <TouchableOpacity key={item + index} style={styles.dropdownItem} onPress={() => handleSelect(item)}>
                <Text style={styles.dropdownText}>{item}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    zIndex: 1000,
  },
  input: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#1E293B',
    fontWeight: '600',
  },
  dropdownContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 150,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  list: {
    flexGrow: 0,
  },
  dropdownItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  dropdownText: {
    fontSize: 14,
    color: '#334155',
  }
});
