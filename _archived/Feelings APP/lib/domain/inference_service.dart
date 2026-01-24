import '../data/models.dart';

class InferenceService {
  static InferenceResult calculateHypotheses({
    required EnergyLevel energy,
    required Valence valence,
    required String? source,
    required ContextCategory? context,
  }) {
    List<Hypothesis> hypotheses;
    Confidence confidence;
    String confidenceReason;

    if (valence == Valence.pleasant) {
      confidence = source != null ? Confidence.high : Confidence.medium;
      confidenceReason = source != null 
          ? 'Clear pattern: pleasant state with identified source.'
          : 'Pleasant state identified, but source is unclear.';
          
      if (energy == EnergyLevel.high) {
        hypotheses = [
          Hypothesis(
            name: 'Flow / Excitement',
            description: 'Your body feels energized and engaged with something positive.',
            bodySignals: ['Racing heart', 'Focus', 'Alertness'],
            actions: ['Keep going', 'Take a note of what caused this'],
          ),
        ];
      } else {
        hypotheses = [
          Hypothesis(
            name: 'Calm / Safety',
            description: 'Your body feels settled and secure.',
            bodySignals: ['Steady breath', 'Soft muscles', 'Warmth'],
            actions: ['Enjoy the moment', 'Deep breathing to anchor'],
          ),
        ];
      }
    } else if (valence == Valence.unpleasant) {
      confidence = source != null ? Confidence.high : Confidence.medium;
      confidenceReason = source != null 
          ? 'Clear pattern: unpleasant state with identified source.'
          : 'Unpleasant state identified, but source is unclear.';

      if (energy == EnergyLevel.high) {
        if (source == 'Outside') {
          hypotheses = [
            Hypothesis(
              name: 'Overstimulation',
              description: 'Your nervous system is processing too much external input.',
              bodySignals: ['Static in head', 'Tight chest', 'Irritability'],
              actions: ['Reduce light/noise', 'Move to a smaller space', 'Noise-canceling headphones'],
            ),
          ];
        } else {
          hypotheses = [
            Hypothesis(
              name: 'Anxiety / Alarm',
              description: 'Your body is preparing for a threat or high demand.',
              bodySignals: ['Pounding heart', 'Quick breath', 'Tight gut'],
              actions: ['Box breathing', 'Grounding (5-4-3-2-1)', 'Cold water on wrists'],
            ),
          ];
        }
      } else {
        if (source == 'Outside') {
          hypotheses = [
            Hypothesis(
              name: 'Shutdown / Freeze',
              description: 'You are overwhelmed and your body is starting to disconnect.',
              bodySignals: ['Numbness', 'Foggy mind', 'Heavy limbs'],
              actions: ['Safety first: stop demands', 'Weighted blanket', 'Gentle rocking'],
            ),
          ];
        } else {
          hypotheses = [
            Hypothesis(
              name: 'Fatigue / Sickness',
              description: 'Your body is out of energy or fighting something internal.',
              bodySignals: ['Dull ache', 'Brain fog', 'Heavy eyes'],
              actions: ['Rest', 'Hydrate', 'Check physical needs (food, sleep)'],
            ),
          ];
        }
      }
    } else {
      // Default Fallback
      confidence = Confidence.low;
      confidenceReason = 'Signals are complex or transitioning, making a specific hypothesis difficult.';
      hypotheses = [
        Hypothesis(
          name: 'Mixed State',
          description: 'Your signals are complex or transitioning.',
          bodySignals: ['Varying signals'],
          actions: ['Wait and notice', 'Gentle movement'],
        ),
      ];
    }

    return InferenceResult(
      hypotheses: hypotheses,
      confidence: confidence,
      confidenceReason: confidenceReason,
    );
  }

  // TODO: [APEX] Add machine learning model for personalized hypothesis generation
  // TODO: [APEX] Implement confidence scoring for hypothesis predictions
  // TODO: [APEX] Add support for custom user-defined hypotheses
  // TODO: [APEX] Consider time-of-day and seasonal factors in inference
}
