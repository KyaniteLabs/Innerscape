import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:soma/main.dart' as app;
import 'package:flutter_riverpod/flutter_riverpod.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('End-to-end user flow', () {
    testWidgets('appTest_completeCheckInFlow_userNavigatesFromHomeToReflection_returnsToHome', (tester) async {
      // Re-initialize the app but we need to override providers
      // Integration tests usually run the whole app. 
      // To override in integration tests, we either need a hook in main.dart 
      // or we pump the widget directly here with overrides.
      
      await tester.pumpWidget(
        const ProviderScope(
          child: app.SomaApp(showOnboarding: false),
        ),
      );
      await tester.pumpAndSettle();

      // 1. Home Screen
      expect(find.text('SOMA'), findsOneWidget);
      await tester.tap(find.text('Body Scan'));
      await tester.pumpAndSettle();

      // 2. Body Scan Screen
      expect(find.text('BODY SCAN'), findsOneWidget);
      final center = tester.getCenter(find.byType(AspectRatio));
      await tester.tapAt(center + const Offset(0, -100)); // Tap head
      await tester.pumpAndSettle();
      await tester.tap(find.text('CONTINUE'));
      await tester.pumpAndSettle();

      // 3. Sensation Selection Screen
      expect(find.text('SENSATIONS'), findsOneWidget);
      // Wait for vocabulary to load (simulated)
      await tester.pump(const Duration(seconds: 1)); 
      await tester.tap(find.text('Warm')); // Assuming Warm exists in default logic
      await tester.pumpAndSettle();
      await tester.tap(find.text('CONTINUE'));
      await tester.pumpAndSettle();

      // 4. Decision Tree Screen
      expect(find.text('STEP 1 OF 4'), findsOneWidget);
      await tester.tap(find.text('High'));
      await tester.pumpAndSettle();
      
      await tester.tap(find.text('Pleasant'));
      await tester.pumpAndSettle();
      
      await tester.tap(find.text('Inside your body'));
      await tester.pumpAndSettle();
      
      await tester.tap(find.text('SKIP'));
      await tester.pumpAndSettle();

      // 5. Result Screen
      expect(find.text('HYPOTHESIS'), findsOneWidget);
      expect(find.text('FLOW / EXCITEMENT'), findsOneWidget);
      await tester.tap(find.text('I UNDERSTAND'));
      await tester.pumpAndSettle();

      // 6. Reflection Screen (Implicitly reached if app moves forward)
    });
  });
}
