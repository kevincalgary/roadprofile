import React from 'react';
import { View, Text, useWindowDimensions } from 'react-native';
import Svg, { Polyline, Circle, Line } from 'react-native-svg';
import { useTheme } from '../../lib/theme-context';
import type { MileagePoint } from '../../lib/api/vehicles';

export function MileageGraph({ points }: { points: MileagePoint[] }) {
  const { width } = useWindowDimensions();
  const { palette } = useTheme();
  const chartWidth = Math.min(width - 40, 600);
  const chartHeight = 140;
  const padding = 16;

  if (points.length < 2) {
    return (
      <View className="h-32 items-center justify-center rounded-2xl bg-cardgray dark:bg-dark-card">
        <Text className="text-sm text-asphalt dark:text-dark-textSecondary">
          {points.length === 0 ? 'No mileage history recorded yet.' : 'Add another mileage record to see a trend.'}
        </Text>
      </View>
    );
  }

  const mileages = points.map((p) => p.mileage);
  const min = Math.min(...mileages);
  const max = Math.max(...mileages);
  const range = max - min || 1;

  const coords = points.map((p, i) => {
    const x = padding + (i / (points.length - 1)) * (chartWidth - padding * 2);
    const y = chartHeight - padding - ((p.mileage - min) / range) * (chartHeight - padding * 2);
    return { x, y, point: p };
  });

  const polylinePoints = coords.map((c) => `${c.x},${c.y}`).join(' ');

  return (
    <View>
      <Svg width={chartWidth} height={chartHeight} accessibilityLabel={`Mileage history from ${min.toLocaleString()} to ${max.toLocaleString()}`}>
        <Line x1={padding} y1={chartHeight - padding} x2={chartWidth - padding} y2={chartHeight - padding} stroke={palette.border} strokeWidth={1} />
        <Polyline points={polylinePoints} fill="none" stroke="#62C58F" strokeWidth={2.5} strokeLinejoin="round" strokeLinecap="round" />
        {coords.map((c, i) => (
          <Circle key={i} cx={c.x} cy={c.y} r={c.point.mileage_inconsistency_flag ? 5 : 3.5} fill={c.point.mileage_inconsistency_flag ? '#C43D3D' : '#3B8C60'} />
        ))}
      </Svg>
      <View className="flex-row justify-between mt-1">
        <Text className="text-xs text-asphalt dark:text-dark-textSecondary">{points[0].event_date}</Text>
        <Text className="text-xs text-asphalt dark:text-dark-textSecondary">{points[points.length - 1].event_date}</Text>
      </View>
      {points.some((p) => p.mileage_inconsistency_flag) ? (
        <Text className="text-xs text-danger mt-2">Red points flag a mileage inconsistency — a later record shows lower mileage than an earlier one.</Text>
      ) : null}
    </View>
  );
}
