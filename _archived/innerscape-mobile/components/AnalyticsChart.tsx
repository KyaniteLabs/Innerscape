import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

/**
 * @fileoverview Simple Analytics Chart (Expo Go compatible)
 * @module components/AnalyticsChart
 * 
 * APEX Contract:
 * - Inputs: data ({ x, y }[]), title (string), color (string)
 * - Outputs: Renders a simple bar chart visualization
 * - Note: Simplified version for Expo Go testing (no Skia/Victory)
 */

interface Props {
  data: { x: string | number; y: number; label?: string }[];
  title: string;
  color?: string;
}

export function AnalyticsChart({ data, title, color = '#4F46E5' }: Props) {
  const maxValue = Math.max(...data.map(d => d.y), 1);
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.chartContainer}>
        {data.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No data yet</Text>
          </View>
        ) : (
          <View style={styles.barsContainer}>
            {data.map((point, index) => (
              <View key={index} style={styles.barWrapper}>
                <View style={styles.barBackground}>
                  <View
                    style={[
                      styles.bar,
                      {
                        height: `${(point.y / maxValue) * 100}%`,
                        backgroundColor: color,
                      },
                    ]}
                  />
                </View>
                <Text style={styles.barLabel}>
                  {typeof point.x === 'string' ? point.x.slice(-2) : point.x}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
      <View style={styles.legend}>
        <View style={[styles.legendDot, { backgroundColor: color }]} />
        <Text style={styles.legendText}>
          {data.length > 0 ? `Total: ${data.reduce((sum, d) => sum + d.y, 0)}` : 'Start tracking to see trends'}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 16,
  },
  chartContainer: {
    height: 150,
    justifyContent: 'flex-end',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-around',
    height: '100%',
    paddingTop: 10,
  },
  barWrapper: {
    flex: 1,
    alignItems: 'center',
    height: '100%',
  },
  barBackground: {
    flex: 1,
    width: '60%',
    maxWidth: 30,
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  bar: {
    width: '100%',
    borderRadius: 8,
    minHeight: 4,
  },
  barLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 6,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },
});
