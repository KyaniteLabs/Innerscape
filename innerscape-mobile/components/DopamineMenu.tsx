import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal } from 'react-native';
import { 
  Coffee, 
  Activity, 
  Heart, 
  Star, 
  Sparkles, 
  ChevronRight, 
  X, 
  Clock, 
  Zap, 
  Sunrise, 
  Sun, 
  Sunset, 
  Moon 
} from 'lucide-react-native';
import { useDopamineMenu, RegulationItem, RegulationSection } from '../lib/hooks/useDopamineMenu';

/**
 * @fileoverview Dopamine Menu Component for Mobile
 * @module components/DopamineMenu
 * 
 * APEX Contract:
 * - Inputs: None
 * - Outputs: Renders regulation activities based on time of day
 * - Errors: Graceful handling of empty menu or missing icons
 */

const ICON_MAP: Record<string, any> = {
  Coffee,
  Activity,
  Heart,
  Star,
};

const TIME_ICONS: Record<string, any> = {
  morning: Sunrise,
  afternoon: Sun,
  evening: Sunset,
  night: Moon,
};

export function DopamineMenu() {
  const { menu, recommendations, timeOfDay, getGreeting } = useDopamineMenu();
  const [selectedItem, setSelectedItem] = useState<{
    section: RegulationSection;
    item: RegulationItem;
  } | null>(null);

  const TimeIcon = TIME_ICONS[timeOfDay];

  return (
    <View className="flex-1">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <View className="flex-row items-center gap-2">
          <Sparkles size={20} color="#4F46E5" />
          <Text className="text-xl font-bold text-gray-900">Regulation Menu</Text>
        </View>
      </View>

      {/* Greeting & Recommendations */}
      <View 
        className="p-5 rounded-3xl mb-6"
        style={{ backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: 'rgba(199, 210, 254, 0.4)' }}
      >
        <View className="flex-row items-center gap-3 mb-4">
          <View className="w-8 h-8 rounded-full bg-indigo-200 items-center justify-center">
            <TimeIcon size={16} color="#4F46E5" />
          </View>
          <Text className="text-sm font-semibold text-gray-800">{getGreeting()}</Text>
        </View>

        <View className="flex-row items-center gap-2 mb-3">
          <Zap size={14} color="#F59E0B" />
          <Text className="text-xs font-medium text-gray-500 uppercase tracking-wider">
            Recommended for you
          </Text>
        </View>

        <View className="gap-2">
          {recommendations.map(({ section, item }, index) => {
            const Icon = ICON_MAP[section.icon];
            return (
              <TouchableOpacity
                key={item.name}
                onPress={() => setSelectedItem({ section, item })}
                accessibilityLabel={`${item.name}, ${item.duration}, ${section.category}`}
                accessibilityRole="button"
                className="flex-row items-center p-3 rounded-2xl bg-white/60"
                style={index === 0 ? { backgroundColor: 'rgba(79, 70, 229, 0.1)' } : {}}
              >
                <View 
                  className="w-10 h-10 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: `${section.color}20` }}
                >
                  <Icon size={20} color={section.color} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-gray-900">{item.name}</Text>
                  <Text className="text-xs text-gray-500">{item.duration} • {section.category}</Text>
                </View>
                <ChevronRight size={18} color="#9CA3AF" />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Full Menu Grid */}
      <View className="flex-row flex-wrap gap-4">
        {menu.map((section) => {
          const Icon = ICON_MAP[section.icon];
          return (
            <View key={section.id} className="w-[47%] bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
              <View className="flex-row items-center gap-2 mb-2">
                <View 
                  className="w-8 h-8 rounded-lg items-center justify-center"
                  style={{ backgroundColor: `${section.color}15` }}
                >
                  <Icon size={16} color={section.color} />
                </View>
                <Text className="text-xs font-bold text-gray-900 truncate flex-1">
                  {section.category}
                </Text>
              </View>
              <Text className="text-[10px] text-gray-400 mb-3" numberOfLines={2}>
                {section.description}
              </Text>

              <View className="gap-2">
                {section.items.map((item) => (
                  <TouchableOpacity 
                    key={item.name}
                    onPress={() => setSelectedItem({ section, item })}
                    accessibilityLabel={`View ${item.name} instructions`}
                    accessibilityRole="button"
                    className="flex-row items-center justify-between -mx-1 p-1 rounded-lg"
                  >
                    <View className="flex-row items-center gap-2 flex-1">
                      <View className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: section.color }} />
                      <Text className="text-xs text-gray-700 truncate flex-1">{item.name}</Text>
                    </View>
                    <ChevronRight size={14} color="#D1D5DB" />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          );
        })}
      </View>

      {/* Instructions Modal */}
      <Modal
        visible={!!selectedItem}
        transparent
        animationType="fade"
        onRequestClose={() => setSelectedItem(null)}
      >
        <TouchableOpacity 
          className="flex-1 bg-black/50 justify-center p-6"
          activeOpacity={1}
          onPress={() => setSelectedItem(null)}
        >
          <TouchableOpacity 
            activeOpacity={1}
            className="bg-white rounded-[40px] p-8 shadow-2xl"
            onPress={e => e.stopPropagation()}
          >
            {selectedItem && (
              <>
                <View className="flex-row items-start justify-between mb-6">
                  <View className="flex-row items-center gap-4">
                    <View 
                      className="w-14 h-14 rounded-2xl items-center justify-center"
                      style={{ backgroundColor: `${selectedItem.section.color}15` }}
                    >
                      {React.createElement(ICON_MAP[selectedItem.section.icon], {
                        size: 28,
                        color: selectedItem.section.color
                      })}
                    </View>
                    <View>
                      <Text className="text-lg font-bold text-gray-900">{selectedItem.item.name}</Text>
                      <View className="flex-row items-center gap-2">
                        <Clock size={14} color="#6B7280" />
                        <Text className="text-xs text-gray-500">{selectedItem.item.duration}</Text>
                      </View>
                    </View>
                  </View>
                  <TouchableOpacity onPress={() => setSelectedItem(null)}>
                    <X size={24} color="#9CA3AF" />
                  </TouchableOpacity>
                </View>

                <View className="mb-6">
                  <Text className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                    How to do it
                  </Text>
                  {selectedItem.item.instructions.map((step, i) => (
                    <View key={i} className="flex-row gap-3 mb-3">
                      <View 
                        className="w-6 h-6 rounded-full items-center justify-center"
                        style={{ backgroundColor: `${selectedItem.section.color}15` }}
                      >
                        <Text className="text-xs font-bold" style={{ color: selectedItem.section.color }}>
                          {i + 1}
                        </Text>
                      </View>
                      <Text className="flex-1 text-sm text-gray-700 leading-5 pt-0.5">{step}</Text>
                    </View>
                  ))}
                </View>

                {selectedItem.item.tip && (
                  <View 
                    className="p-4 rounded-2xl bg-gray-50 border-l-4"
                    style={{ borderLeftColor: selectedItem.section.color }}
                  >
                    <Text className="text-[10px] font-bold text-gray-400 uppercase mb-1">Pro tip</Text>
                    <Text className="text-sm text-gray-600 italic">{selectedItem.item.tip}</Text>
                  </View>
                )}

                <TouchableOpacity 
                  onPress={() => setSelectedItem(null)}
                  className="bg-indigo-600 p-4 rounded-2xl items-center mt-8"
                >
                  <Text className="text-white font-bold">Got it</Text>
                </TouchableOpacity>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
}
