import React from 'react';
import { View, Text, Dimensions } from 'react-native';
import { CartesianChart, Line, Area, CartesianAxis } from 'victory-native';
import { useFont } from '@shopify/react-native-skia';

/**
 * @fileoverview Trend chart for analytics using Victory Native XL (Skia-powered)
 * @module components/AnalyticsChart
 */

interface Props {
  data: { x: string | number; y: number }[];
  title: string;
  color?: string;
}

const { width } = Dimensions.get('window');

export function AnalyticsChart({ data, title, color = '#4F46E5' }: Props) {
  // We'll use a simple placeholder if font is not loaded, but CartesianAxis needs a font
  // For now, let's just use the chart without axis if font is complex to load here, 
  // or use the default system font if Skia allows.
  
  return (
    <View className="bg-white p-6 rounded-[32px] border border-gray-100 mb-6 shadow-sm overflow-hidden">
      <Text className="text-sm font-bold text-gray-900 mb-4">{title}</Text>
      <View style={{ height: 200, width: '100%' }}>
        <CartesianChart
          data={data}
          xKey="x"
          yKeys={["y"]}
          axisOptions={{
            tickCount: 5,
            labelOffset: 8,
            lineColor: '#F3F4F6',
            labelColor: '#9CA3AF',
          }}
        >
          {({ points, chartBounds }) => (
            <>
              <Area
                points={points.y}
                y0={chartBounds.bottom}
                color={`${color}20`}
                animate={{ type: "timing", duration: 500 }}
              />
              <Line
                points={points.y}
                color={color}
                strokeWidth={3}
                animate={{ type: "timing", duration: 500 }}
              />
            </>
          )}
        </CartesianChart>
      </View>
    </View>
  );
}
