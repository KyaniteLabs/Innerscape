import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;

export const EnergyChart = ({ data }: { data: number[] }) => {
  // Simple SVG-based line chart placeholder
  const maxVal = Math.max(...data, 100);
  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * (SCREEN_WIDTH - 80);
    const y = 150 - (val / maxVal) * 150;
    return `${x},${y}`;
  }).join(' ');

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Energy Trends</Text>
      <View style={styles.chartArea}>
        {/* Placeholder for real chart library like react-native-wagmi-charts or skia */}
        <View style={styles.placeholderLine} />
        <Text style={styles.placeholderText}>Energy Visualization over 24h</Text>
      </View>
      <View style={styles.labels}>
        <Text style={styles.label}>12am</Text>
        <Text style={styles.label}>12pm</Text>
        <Text style={styles.label}>12am</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  chartArea: {
    height: 150,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholderLine: {
    width: '80%',
    height: 2,
    backgroundColor: '#4F46E5',
    opacity: 0.3,
  },
  placeholderText: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 12,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  label: {
    fontSize: 10,
    color: '#9CA3AF',
    textTransform: 'uppercase',
  }
});
