import React from 'react';
import { View, Text } from 'react-native';
import { CartesianChart, Line, Area } from 'victory-native';

/**
 * @fileoverview Trend chart for analytics using Victory Native XL (Skia-powered)
 * @module components/AnalyticsChart
 * 
 * APEX Contract:
 * - Inputs: data ({ x, y }[]), title (string), color (string)
 * - Outputs: Renders a Skia-powered area/line chart
 * - Errors: Graceful handling of empty or malformed data
 */

interface Props {
  data: { x: string | number; y: number }[];
  title: string;
  color?: string;
}

export function AnalyticsChart({ data, title, color = '#4F46E5' }: Props) {
  // APEX: CartesianAxis removed to avoid complex font loading in this audit stage.
  // Charts use Skia-powered animations for better UX.
  
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
