import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:soma/data/models.dart';
import 'package:soma/core/design_system.dart';
import 'package:google_fonts/google_fonts.dart';

void setupTests() {
  GoogleFonts.config.allowRuntimeFetching = false;
  DesignSystem.useTestFonts = true;
}

/// Creates a [ProviderContainer] for testing with optional overrides.
ProviderContainer createContainer({
  ProviderContainer? parent,
  List<dynamic> overrides = const [],
  List<ProviderObserver>? observers,
}) {
  final container = ProviderContainer(
    parent: parent,
    overrides: overrides.isEmpty ? const [] : overrides.map((e) => e as dynamic).toList().cast(),
    observers: observers,
  );

  addTearDown(container.dispose);

  return container;
}

/// Helper to wrap widgets with necessary providers and material app for testing.
Widget pumpApp(Widget child, {List<dynamic> overrides = const []}) {
  setupTests();
  return ProviderScope(
    overrides: overrides.isEmpty ? const [] : overrides.map((e) => e as dynamic).toList().cast(),
    child: MaterialApp(
      home: child,
    ),
  );
}

/// Common test fixtures for Soma.
class TestFixtures {
  static SensationToken get sensationToken => SensationToken(
        label: 'Buzzing',
        category: 'Vibration',
      );

  static CheckIn get checkIn => CheckIn(
        id: 'test-uuid',
        timestamp: DateTime(2026, 1, 10, 14, 0),
        regions: [BodyRegion.chestHeart, BodyRegion.bellyGut],
        sensations: [sensationToken],
        intensity: 3,
        energy: EnergyLevel.high,
        valence: Valence.unpleasant,
        context: ContextCategory.task,
      );
}
