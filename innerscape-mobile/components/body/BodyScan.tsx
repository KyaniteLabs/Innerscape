import React from 'react';
import { View, Dimensions } from 'react-native';
import Svg, { Path, G } from 'react-native-svg';

/**
 * @fileoverview Body Scan interaction with SVG
 * @module components/body/BodyScan
 * 
 * APEX Contract:
 * - Inputs: selectedRegions (string[]), onRegionSelect (callback)
 * - Outputs: Renders interactive body outline with selectable regions
 * - Errors: All regions default to unselected
 */

const { width } = Dimensions.get('window');
const BODY_WIDTH = width * 0.8;
const BODY_HEIGHT = BODY_WIDTH * 1.6;

interface Region {
  id: string;
  name: string;
  path: string;
}

// Simplified body regions for MVP
const REGIONS: Region[] = [
  { id: 'head', name: 'Head', path: 'M45,5 C55,5 60,15 60,25 C60,35 55,45 45,45 C35,45 30,35 30,25 C30,15 35,5 45,5 Z' },
  { id: 'neck', name: 'Neck', path: 'M40,45 L50,45 L50,55 L40,55 Z' },
  { id: 'chest', name: 'Chest', path: 'M25,55 L65,55 L70,100 L20,100 Z' },
  { id: 'belly', name: 'Belly', path: 'M20,100 L70,100 L65,140 L25,140 Z' },
  { id: 'arms', name: 'Arms', path: 'M25,55 L10,120 M65,55 L80,120' }, // Simplified arms
  { id: 'hips', name: 'Hips', path: 'M25,140 L65,140 L70,165 L20,165 Z' },
  { id: 'legs', name: 'Legs', path: 'M25,165 L35,240 M65,165 L55,240' }, // Simplified legs
];

interface Props {
  selectedRegions: string[];
  onRegionSelect: (regionId: string) => void;
}

export function BodyScan({ selectedRegions, onRegionSelect }: Props) {
  return (
    <View style={{ width: BODY_WIDTH, height: BODY_HEIGHT }}>
      <Svg viewBox="0 0 100 250" width="100%" height="100%">
        <G>
          {REGIONS.map((region) => {
            const isSelected = selectedRegions.includes(region.id);
            return (
              <Path
                key={region.id}
                d={region.path}
                fill={isSelected ? '#8B5CF6' : 'transparent'}
                stroke={isSelected ? '#8B5CF6' : '#94A3B8'}
                strokeWidth={2}
                onPress={() => onRegionSelect(region.id)}
              />
            );
          })}
        </G>
      </Svg>
    </View>
  );
}
