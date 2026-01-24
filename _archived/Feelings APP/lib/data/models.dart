

enum EnergyLevel { high, low }

enum Valence { pleasant, unpleasant, neutral }

enum ContextCategory { social, sensory, task, unknown }

enum BodyRegion {
  headFace,
  neckThroat,
  shouldersArms,
  chestHeart,
  bellyGut,
  back,
  hipsGroin,
  legsFeet
}

enum Confidence { low, medium, high }

enum HelpfulnessRating { helped, didntHelp, notSure }

class SensationToken {
  final String label;
  final String category;

  SensationToken({required this.label, required this.category});

  Map<String, dynamic> toMap() => {'label': label, 'category': category};
  factory SensationToken.fromMap(Map<String, dynamic> map) =>
      SensationToken(label: map['label'], category: map['category']);
}

class CheckIn {
  final String id;
  final DateTime timestamp;
  final List<BodyRegion> regions;
  final List<SensationToken> sensations;
  final int intensity; // 1-5
  final EnergyLevel energy;
  final Valence valence;
  final ContextCategory? context;
  final String? freeText;
  final bool? hypothesisAccepted;
  final String? customHypothesis;
  final String? selectedAction;

  CheckIn({
    required this.id,
    required this.timestamp,
    required this.regions,
    required this.sensations,
    required this.intensity,
    required this.energy,
    required this.valence,
    this.context,
    this.freeText,
    this.hypothesisAccepted,
    this.customHypothesis,
    this.selectedAction,
  });

  Map<String, dynamic> toMap() => {
        'id': id,
        'timestamp': timestamp.toIso8601String(),
        'regions': regions.map((e) => e.name).toList(),
        'sensations': sensations.map((e) => e.toMap()).toList(),
        'intensity': intensity,
        'energy': energy.name,
        'valence': valence.name,
        'context': context?.name,
        'freeText': freeText,
        'hypothesis_accepted': hypothesisAccepted == null ? null : (hypothesisAccepted! ? 1 : 0),
        'custom_hypothesis': customHypothesis,
        'selected_action': selectedAction,
      };
}

class Hypothesis {
  final String name;
  final String description;
  final List<String> bodySignals;
  final List<String> actions;

  Hypothesis({
    required this.name,
    required this.description,
    required this.bodySignals,
    required this.actions,
  });
}

class InferenceResult {
  final List<Hypothesis> hypotheses;
  final Confidence confidence;
  final String confidenceReason;
  
  InferenceResult({
    required this.hypotheses,
    required this.confidence,
    required this.confidenceReason,
  });
}

class Inference {
  final String checkInId;
  final List<String> hypotheses;
  final Confidence confidence;
  final String? userSelectedHypothesis;

  Inference({
    required this.checkInId,
    required this.hypotheses,
    required this.confidence,
    this.userSelectedHypothesis,
  });
}

class Reflection {
  final String checkInId;
  final HelpfulnessRating helped;
  final EnergyLevel? postEnergy;
  final Valence? postValence;
  final DateTime timestamp;

  Reflection({
    required this.checkInId,
    required this.helped,
    this.postEnergy,
    this.postValence,
    required this.timestamp,
  });
}

class PersonalMapping {
  final String id;
  final String emotionName;
  final List<BodyRegion> typicalRegions;
  final List<String> typicalSensations;
  final int confirmationCount;
  final double confidenceScore;
  final DateTime lastConfirmed;

  PersonalMapping({
    required this.id,
    required this.emotionName,
    required this.typicalRegions,
    required this.typicalSensations,
    required this.confirmationCount,
    required this.confidenceScore,
    required this.lastConfirmed,
  });
}

class ModeLink {
  final String checkInId;
  final String? explorationId;
  final String? confirmedEmotion;
  final DateTime linkedAt;

  ModeLink({
    required this.checkInId,
    this.explorationId,
    this.confirmedEmotion,
    required this.linkedAt,
  });
}
