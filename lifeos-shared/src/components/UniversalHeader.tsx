/**
 * @fileoverview Universal Header for Innerscape Suite
 * @module components/UniversalHeader
 * 
 * APEX Contract:
 * - Inputs: currentApp ('soma' | 'mobile'), onAppSwitch callback
 * - Outputs: Renders header with app switcher, search, profile
 * - Errors: Graceful fallback if emotional context unavailable
 */

import React from 'react';
import { View, Text, TouchableOpacity, Platform } from 'react-native';
import { ChevronDown, Search, User } from 'lucide-react-native';
import { useEmotionalContext } from '../hooks/useEmotionalContext';

interface UniversalHeaderProps {
  currentApp: 'soma' | 'mobile';
  onAppSwitch: (app: 'soma' | 'mobile') => void;
  onSearch?: () => void;
  onProfile?: () => void;
}

export function UniversalHeader({ 
  currentApp, 
  onAppSwitch,
  onSearch,
  onProfile 
}: UniversalHeaderProps) {
  const { energy, valence } = useEmotionalContext();
  
  const appNames = {
    soma: 'Soma',
    mobile: 'Innerscape'
  };

  const getEmoji = (energy: string | null, valence: string | null) => {
    if (!energy || !valence) return '✨';
    if (valence === 'pleasant') return energy === 'high' ? '⚡️' : '🌿';
    if (valence === 'unpleasant') return energy === 'high' ? '💢' : '☁️';
    return '😐';
  };

  return (
    <View style={{
      height: 56,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      backgroundColor: '#FFFFFF',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E7EB',
      marginTop: Platform.OS === 'ios' ? 0 : 0, // Handled by SafeAreaView in apps
    }}>
      {/* Logo + App Switcher */}
      <TouchableOpacity 
        style={{ flexDirection: 'row', alignItems: 'center' }}
        onPress={() => onAppSwitch(currentApp === 'soma' ? 'mobile' : 'soma')}
      >
        <View style={{ 
          width: 32, 
          height: 32, 
          backgroundColor: currentApp === 'soma' ? '#8B5CF6' : '#4F46E5', 
          borderRadius: 8, 
          marginRight: 8 
        }} />
        <Text style={{ fontSize: 18, fontWeight: '600', color: '#111827' }}>
          {appNames[currentApp]}
        </Text>
        <ChevronDown size={16} />
      </TouchableOpacity>

      {/* Emotional Context Indicator */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center', 
        backgroundColor: '#F3F4F6', 
        paddingHorizontal: 12, 
        paddingVertical: 4, 
        borderRadius: 20 
      }}>
        <Text style={{ fontSize: 14, color: '#4B5563' }}>
          {getEmoji(energy, valence)} {energy || 'Stable'}
        </Text>
      </View>

      {/* Actions */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
        <TouchableOpacity onPress={onSearch}>
          <Search size={24} />
        </TouchableOpacity>
        <TouchableOpacity onPress={onProfile}>
          <User size={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
}
