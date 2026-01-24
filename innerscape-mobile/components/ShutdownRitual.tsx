import React, { useState } from 'react';
import { View, Text, TouchableOpacity, LayoutAnimation } from 'react-native';
import { 
  Check, 
  Moon, 
  Sparkles, 
  Clock, 
  ChevronDown, 
  ChevronUp 
} from 'lucide-react-native';
import { useShutdownRitual } from '../lib/hooks/useShutdownRitual';

/**
 * @fileoverview Shutdown Ritual Component for Mobile
 * @module components/ShutdownRitual
 * 
 * APEX Contract:
 * - Inputs: None (Uses useShutdownRitual hook)
 * - Outputs: Renders interactive end-of-day checklist
 * - Errors: Graceful handling of storage failures
 */

export function ShutdownRitual() {
  const { 
    steps, 
    completed, 
    toggleStep, 
    isEvening, 
    isLateNight, 
    progress, 
    isComplete 
  } = useShutdownRitual();
  
  const [isExpanded, setIsExpanded] = useState(true);

  const toggleExpand = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  if (!isEvening) {
    return (
      <View className="bg-white/50 border border-gray-100 p-4 rounded-3xl flex-row items-center gap-3">
        <Moon size={16} color="#9CA3AF" />
        <Text className="text-xs text-gray-400">Wind Down available after 5 PM</Text>
      </View>
    );
  }

  return (
    <View className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm mb-6">
      {/* Header */}
      <View className="flex-row items-center justify-between mb-4">
        <TouchableOpacity 
          onPress={toggleExpand}
          accessibilityLabel={`${isExpanded ? 'Collapse' : 'Expand'} wind down ritual`}
          accessibilityRole="button"
          className="flex-row items-center gap-3 flex-1"
        >
          <View className="w-10 h-10 rounded-2xl bg-amber-50 items-center justify-center">
            <Moon size={20} color="#F59E0B" />
          </View>
          <View>
            <Text className="text-sm font-bold text-gray-900">Wind Down</Text>
            <Text className="text-xs text-gray-500">
              {isLateNight ? "It's late - time to rest!" : "End-of-day ritual"}
            </Text>
          </View>
        </TouchableOpacity>
        
        <View className="flex-row items-center gap-3">
          <Text 
            className="text-xs font-bold" 
            style={{ color: isComplete ? '#10B981' : '#9CA3AF' }}
          >
            {completed.length}/{steps.length}
          </Text>
          <TouchableOpacity onPress={toggleExpand}>
            {isExpanded ? <ChevronUp size={20} color="#9CA3AF" /> : <ChevronDown size={20} color="#9CA3AF" />}
          </TouchableOpacity>
        </View>
      </View>

      {/* Progress Bar */}
      <View className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-4">
        <View 
          className="h-full bg-amber-400 rounded-full" 
          style={{ width: `${progress}%` }} 
        />
      </View>

      {/* Steps */}
      {isExpanded && (
        <View className="gap-2">
          {steps.map((step) => {
            const isDone = completed.includes(step.id);
            return (
              <TouchableOpacity
                key={step.id}
                onPress={() => toggleStep(step.id)}
                accessibilityLabel={`Mark ${step.label} as ${completed.includes(step.id) ? 'incomplete' : 'complete'}`}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: completed.includes(step.id) }}
                className="flex-row items-center gap-3 p-3 rounded-2xl bg-gray-50/50"
              >
                <View 
                  className={`w-6 h-6 rounded-full items-center justify-center border ${
                    isDone ? 'bg-amber-400 border-amber-400' : 'border-gray-200 bg-white'
                  }`}
                >
                  {isDone && <Check size={14} color="white" strokeWidth={3} />}
                </View>
                <View className="flex-1">
                  <Text 
                    className={`text-sm ${isDone ? 'text-gray-400 line-through' : 'text-gray-700 font-medium'}`}
                  >
                    {step.label}
                  </Text>
                  <Text className="text-[10px] text-gray-400">{step.sub}</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Completion Message */}
      {isComplete && (
        <View className="mt-4 flex-row items-center justify-center gap-2 bg-green-50 p-3 rounded-2xl border border-green-100">
          <Sparkles size={16} color="#10B981" />
          <Text className="text-xs font-bold text-green-700">All done! Rest well.</Text>
        </View>
      )}

      {/* Late Night Warning */}
      {isLateNight && !isComplete && (
        <View className="mt-4 flex-row items-center gap-2 p-3 rounded-2xl bg-amber-50 border border-amber-100">
          <Clock size={16} color="#F59E0B" />
          <Text className="text-[10px] text-amber-700 flex-1">
            It&apos;s past 10 PM - try to complete your wind down soon!
          </Text>
        </View>
      )}
    </View>
  );
}
