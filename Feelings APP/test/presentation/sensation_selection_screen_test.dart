import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:soma/presentation/sensation_selection_screen.dart';
import 'package:soma/presentation/providers.dart';
import '../testing_utils.dart';

import 'package:google_fonts/google_fonts.dart';

void main() {
  GoogleFonts.config.allowRuntimeFetching = false;
  testWidgets('SensationSelectionScreen loading and selection', (tester) async {
    final mockVocabulary = [
      {
        'name': 'Temperature',
        'tokens': ['Warm', 'Cold']
      },
      {
        'name': 'Pressure',
        'tokens': ['Tight', 'Loose']
      }
    ];

    await tester.pumpWidget(pumpApp(
      const SensationSelectionScreen(),
      overrides: [
        sensationVocabularyProvider.overrideWith((ref) => mockVocabulary),
      ],
    ));

    // Initially loading should show vocabulary
    expect(find.text('TEMPERATURE'), findsOneWidget);
    expect(find.text('Warm'), findsOneWidget);
    expect(find.text('Cold'), findsOneWidget);

    // Initial state: CONTINUE button should be disabled (hidden by opacity)
    final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
    expect(button.onPressed, isNull);

    // Select a sensation
    await tester.tap(find.text('Warm'));
    await tester.pumpAndSettle();

    // After selection, CONTINUE button should be enabled
    final updatedButton = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
    expect(updatedButton.onPressed, isNotNull);
  });
}
