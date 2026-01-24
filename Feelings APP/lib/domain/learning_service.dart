import 'dart:convert';
import 'dart:math';
import 'package:flutter/foundation.dart';
import '../core/error_handler.dart';
import '../core/constants.dart';
import '../data/encrypted_database_helper.dart';
import '../data/models.dart';

/// Service for learning from user confirmations and building personalized mappings.
/// 
/// Records when users confirm that a hypothesis "fits" their experience, building
/// a confidence score over time. Stores learned mappings with associated body regions
/// and sensations to personalize future recommendations.
class LearningService {
  final EncryptedDatabaseHelper _dbHelper;
  
  LearningService(this._dbHelper);
  
  /// Called when user confirms a hypothesis (clicks "THIS FITS")
  Future<void> recordConfirmation({
    required String hypothesisName,
    required List<BodyRegion> regions,
    required List<SensationToken> sensations,
  }) async {
    try {
      final db = await _dbHelper.database;
      
      // 1. Check if mapping exists for this hypothesis
      final List<Map<String, dynamic>> results = await db.query(
        'personal_mappings',
        where: 'hypothesis_name = ?',
        whereArgs: [hypothesisName],
      );

      if (results.isNotEmpty) {
        final mapping = results.first;
        final int count = mapping['confirmation_count'] as int;
        final double currentScore = mapping['confidence_score'] as double;
        
        // Update confidence score: score = min(0.95, score + 0.1 * (1 - score))
        final double newScore = min(
          LearningConstants.maxConfidenceScore,
          currentScore + LearningConstants.confirmationIncrement * (1 - currentScore),
        );
        
        await db.update(
          'personal_mappings',
          {
            'confirmation_count': count + 1,
            'confidence_score': newScore,
            'last_confirmed': DateTime.now().toIso8601String(),
            // Potentially merge regions/sensations if we want to track variety
          },
          where: 'id = ?',
          whereArgs: [mapping['id']],
        );
      } else {
        // Create new mapping
        await db.insert('personal_mappings', {
          'id': DateTime.now().millisecondsSinceEpoch.toString(), // Simple ID
          'hypothesis_name': hypothesisName,
          'regions': json.encode(regions.map((e) => e.name).toList()),
          'sensations': json.encode(sensations.map((e) => e.toMap()).toList()),
          'confirmation_count': 1,
          'confidence_score': LearningConstants.initialConfidenceScore,
          'last_confirmed': DateTime.now().toIso8601String(),
        });
      }
    } catch (e, stackTrace) {
      debugPrint('[APEX] Error recording confirmation: $e');
      throw DatabaseException(
        message: 'Failed to record learning confirmation',
        originalError: e,
        stackTrace: stackTrace,
      );
    }
  }
  
  /// Returns personalized hypotheses based on learned patterns
  Future<List<PersonalMapping>> getPersonalMappings() async {
    try {
      final db = await _dbHelper.database;
      final List<Map<String, dynamic>> results = await db.query('personal_mappings');
      
      return results.map((m) => PersonalMapping(
        id: m['id'] as String,
        emotionName: m['hypothesis_name'] as String,
        typicalRegions: (json.decode(m['regions'] as String) as List)
            .map((e) => BodyRegion.values.byName(e as String))
            .toList(),
        typicalSensations: (json.decode(m['sensations'] as String) as List)
            .map((e) => e.toString())
            .toList(),
        confirmationCount: m['confirmation_count'] as int,
        confidenceScore: m['confidence_score'] as double,
        lastConfirmed: DateTime.parse(m['last_confirmed'] as String),
      )).toList();
    } catch (e, stackTrace) {
      debugPrint('[APEX] Error retrieving personal mappings: $e');
      throw DatabaseException(
        message: 'Failed to retrieve personal mappings',
        originalError: e,
        stackTrace: stackTrace,
      );
    }
  }
}
