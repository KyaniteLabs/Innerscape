import 'package:flutter_test/flutter_test.dart';
import 'package:soma/data/models.dart';
import 'package:soma/domain/inference_service.dart';

void main() {
  group('InferenceService.calculateHypotheses', () {
    test('High energy + Pleasant valence → Flow / Excitement', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.high,
        valence: Valence.pleasant,
        source: null,
        context: null,
      );
      expect(result.hypotheses.first.name, 'Flow / Excitement');
    });

    test('Low energy + Pleasant valence → Calm / Safety', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.low,
        valence: Valence.pleasant,
        source: null,
        context: null,
      );
      expect(result.hypotheses.first.name, 'Calm / Safety');
    });

    test('High energy + Unpleasant valence + Outside source → Overstimulation', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.high,
        valence: Valence.unpleasant,
        source: 'Outside',
        context: null,
      );
      expect(result.hypotheses.first.name, 'Overstimulation');
    });

    test('High energy + Unpleasant valence + Inside source → Anxiety / Alarm', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.high,
        valence: Valence.unpleasant,
        source: 'Inside',
        context: null,
      );
      expect(result.hypotheses.first.name, 'Anxiety / Alarm');
    });

    test('Low energy + Unpleasant valence + Outside source → Shutdown / Freeze', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.low,
        valence: Valence.unpleasant,
        source: 'Outside',
        context: null,
      );
      expect(result.hypotheses.first.name, 'Shutdown / Freeze');
    });

    test('Low energy + Unpleasant valence + Inside source → Fatigue / Sickness', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.low,
        valence: Valence.unpleasant,
        source: 'Inside',
        context: null,
      );
      expect(result.hypotheses.first.name, 'Fatigue / Sickness');
    });

    test('Neutral valence → Mixed State', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.high,
        valence: Valence.neutral,
        source: null,
        context: null,
      );
      expect(result.hypotheses.first.name, 'Mixed State');
    });

    test('Hypothesis structure validation', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.high,
        valence: Valence.pleasant,
        source: null,
        context: null,
      );
      final h = result.hypotheses.first;
      expect(h.name.isNotEmpty, true);
      expect(h.description.isNotEmpty, true);
      expect(h.bodySignals.isNotEmpty, true);
      expect(h.actions.isNotEmpty, true);
    });

    test('High confidence when source is provided', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.high,
        valence: Valence.unpleasant,
        source: 'Outside',
        context: null,
      );
      expect(result.confidence, Confidence.high);
      expect(result.confidenceReason.contains('Clear pattern'), true);
    });

    test('Medium confidence when source is missing', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.high,
        valence: Valence.pleasant,
        source: null,
        context: null,
      );
      expect(result.confidence, Confidence.medium);
    });

    test('Low confidence for neutral valence', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.high,
        valence: Valence.neutral,
        source: null,
        context: null,
      );
      expect(result.confidence, Confidence.low);
      expect(result.confidenceReason.contains('complex'), true);
    });

    test('High energy + Unpleasant + Outside = Overstimulation with high confidence', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.high,
        valence: Valence.unpleasant,
        source: 'Outside',
        context: null,
      );
      expect(result.hypotheses.first.name, 'Overstimulation');
      expect(result.confidence, Confidence.high);
    });

    test('Low energy + Pleasant = Calm / Safety with medium confidence (no source)', () {
      final result = InferenceService.calculateHypotheses(
        energy: EnergyLevel.low,
        valence: Valence.pleasant,
        source: null,
        context: null,
      );
      expect(result.hypotheses.first.name, 'Calm / Safety');
      expect(result.confidence, Confidence.medium);
    });

    test('Confidence reason matches confidence level', () {
      // High confidence with source
      final highConf = InferenceService.calculateHypotheses(
        energy: EnergyLevel.high,
        valence: Valence.unpleasant,
        source: 'Inside',
        context: null,
      );
      expect(highConf.confidence, Confidence.high);
      expect(highConf.confidenceReason.isNotEmpty, true);

      // Medium confidence without source
      final mediumConf = InferenceService.calculateHypotheses(
        energy: EnergyLevel.low,
        valence: Valence.pleasant,
        source: null,
        context: null,
      );
      expect(mediumConf.confidence, Confidence.medium);

      // Low confidence with neutral
      final lowConf = InferenceService.calculateHypotheses(
        energy: EnergyLevel.high,
        valence: Valence.neutral,
        source: null,
        context: null,
      );
      expect(lowConf.confidence, Confidence.low);
    });
  });
}
