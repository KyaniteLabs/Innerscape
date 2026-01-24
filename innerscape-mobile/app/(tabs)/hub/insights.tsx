import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Sparkles } from 'lucide-react-native';

/**
 * APEX Contract: Insights Screen
 * AI-powered correlations and suggestions
 */

export default function InsightsScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Sparkles size={32} color="#4F46E5" />
        <Text style={styles.title}>Insights</Text>
      </header>
      <View style={styles.content}>
        <Text style={styles.placeholder}>AI-powered connections across your life.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },
  header: { padding: 24, flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 28, fontWeight: '700', color: '#111827' },
  content: { padding: 24 },
  placeholder: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 40 },
});
