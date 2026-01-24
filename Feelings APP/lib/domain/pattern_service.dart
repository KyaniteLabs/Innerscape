import 'dart:convert';
import 'package:flutter/foundation.dart';
import '../data/log_service.dart';
import '../data/models.dart';
import '../core/error_handler.dart';
import 'inference_service.dart';

/// Service for analyzing user check-in patterns and identifying trends.
/// 
/// Examines the user's check-in history to identify:
/// - Most common emotional states (hypotheses)
/// - Most helpful actions taken
/// - Context patterns
/// - Overall check-in statistics
/// 
/// All pattern analysis includes error handling and safe enum parsing.
class PatternService {
  final LogService _logService;
  
  PatternService(this._logService);
  
  /// Analyzes history to find most common patterns
  Future<PatternSummary> analyzePatterns() async {
    try {
      final history = await _logService.getHistory();
      if (history.isEmpty) {
        return PatternSummary.empty();
      }

      final Map<String, int> hypothesisCounts = {};
      final Map<String, int> sensationCounts = {};
      final Map<String, int> contextCounts = {};
      final Map<String, int> actionHelpedCounts = {};
      int totalCheckIns = history.length;
      int helpedCount = 0;
      int didntHelpCount = 0;

      for (final item in history) {
        // 1. Hypotheses
        final energyStr = item['energy'] as String?;
        final valenceStr = item['valence'] as String?;
        final source = item['source'] as String?;
        final contextStr = item['context'] as String?;

        // Safe enum parsing with fallback
        final energy = energyStr != null
            ? EnergyLevel.values.firstWhere((e) => e.name == energyStr, orElse: () => EnergyLevel.high)
            : EnergyLevel.high;
        final valence = valenceStr != null
            ? Valence.values.firstWhere((e) => e.name == valenceStr, orElse: () => Valence.neutral)
            : Valence.neutral;
        final context = contextStr != null 
            ? ContextCategory.values.firstWhere((e) => e.name == contextStr, orElse: () => ContextCategory.unknown)
            : null;

        final result = InferenceService.calculateHypotheses(
          energy: energy,
          valence: valence,
          source: source,
          context: context,
        );
        
        final hypothesisName = result.hypotheses.first.name;
        hypothesisCounts[hypothesisName] = (hypothesisCounts[hypothesisName] ?? 0) + 1;

        // 2. Sensations - parse JSON array
        try {
          final sensationsData = item['sensations'];
          if (sensationsData is String && sensationsData.isNotEmpty && sensationsData != '[]') {
            final decoded = json.decode(sensationsData) as List;
            for (final sensation in decoded) {
              if (sensation is Map && sensation['label'] is String) {
                final label = sensation['label'] as String;
                sensationCounts[label] = (sensationCounts[label] ?? 0) + 1;
              }
            }
          }
        } catch (e) {
          // Silently skip malformed sensation data
          debugPrint('[APEX] Error parsing sensations: $e');
        }

        // 3. Context
        if (contextStr != null) {
          contextCounts[contextStr] = (contextCounts[contextStr] ?? 0) + 1;
        }

        // 4. Helpful actions
        final helped = item['helped'] as String?;
        if (helped == 'helped') {
          helpedCount++;
          final action = item['selected_action'] as String?;
          if (action != null) {
            actionHelpedCounts[action] = (actionHelpedCounts[action] ?? 0) + 1;
          }
        } else if (helped == 'didntHelp') {
          didntHelpCount++;
        }
      }

      // Find most common
      String? topHypothesis;
      int topHypothesisCount = 0;
      hypothesisCounts.forEach((name, count) {
        if (count > topHypothesisCount) {
          topHypothesisCount = count;
          topHypothesis = name;
        }
      });

      // Find most common sensations (top 3)
      final sortedSensations = sensationCounts.entries.toList()
        ..sort((a, b) => b.value.compareTo(a.value));
      final mostCommonSensations = sortedSensations
        .take(3)
        .map((e) => e.key)
        .toList();

      String? topAction;
      int topActionCount = 0;
      actionHelpedCounts.forEach((action, count) {
        if (count > topActionCount) {
          topActionCount = count;
          topAction = action;
        }
      });

      return PatternSummary(
        mostCommonHypothesis: topHypothesis,
        mostCommonHypothesisCount: topHypothesisCount,
        mostCommonSensations: mostCommonSensations,
        mostCommonContext: null,
        mostHelpfulAction: topAction,
        totalCheckIns: totalCheckIns,
        helpedCount: helpedCount,
        didntHelpCount: didntHelpCount,
      );
    } catch (e, stackTrace) {
      debugPrint('[APEX] Error analyzing patterns: $e');
      throw DatabaseException(
        message: 'Failed to analyze patterns',
        originalError: e,
        stackTrace: stackTrace,
      );
    }
  }
}

class PatternSummary {
  final String? mostCommonHypothesis;
  final int mostCommonHypothesisCount;
  final List<String> mostCommonSensations;
  final ContextCategory? mostCommonContext;
  final String? mostHelpfulAction;
  final int totalCheckIns;
  final int helpedCount;
  final int didntHelpCount;

  PatternSummary({
    this.mostCommonHypothesis,
    this.mostCommonHypothesisCount = 0,
    required this.mostCommonSensations,
    this.mostCommonContext,
    this.mostHelpfulAction,
    required this.totalCheckIns,
    required this.helpedCount,
    required this.didntHelpCount,
  });

  factory PatternSummary.empty() => PatternSummary(
    mostCommonSensations: [],
    totalCheckIns: 0,
    helpedCount: 0,
    didntHelpCount: 0,
  );
}
