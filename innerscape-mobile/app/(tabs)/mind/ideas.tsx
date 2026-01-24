import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Lightbulb } from 'lucide-react-native';

/**
 * APEX Contract: Ideas Screen
 * Creative sandbox and idea storage
 */

export default function IdeasScreen() {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Lightbulb size={32} color="#4F46E5" />
        <Text style={styles.title}>Ideas</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.placeholder}>Your creative spark, captured and organized.</Text>
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
