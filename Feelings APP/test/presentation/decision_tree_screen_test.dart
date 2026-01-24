
import 'package:flutter_test/flutter_test.dart';
import 'package:soma/presentation/decision_tree_screen.dart';
import '../testing_utils.dart';

void main() {
  testWidgets('DecisionTreeScreen flow', (tester) async {
    await tester.pumpWidget(pumpApp(const DecisionTreeScreen()));

    // Step 1: Energy
    expect(find.text('How is your energy?'), findsOneWidget);
    await tester.tap(find.text('High'));
    await tester.pumpAndSettle();

    // Step 2: Valence
    expect(find.text('Is it pleasant?'), findsOneWidget);
    await tester.tap(find.text('Unpleasant'));
    await tester.pumpAndSettle();

    // Step 3: Intensity
    expect(find.text('How intense is it?'), findsOneWidget);
    await tester.tap(find.text('CONFIRM'));
    await tester.pumpAndSettle();

    // Step 4: Source
    expect(find.text('Is it coming from...'), findsOneWidget);
    await tester.tap(find.text('The world around you'));
    await tester.pumpAndSettle();

    // Step 5: Context
    expect(find.text('Any specific context?'), findsOneWidget);
    await tester.tap(find.text('Social'));
    await tester.pumpAndSettle();

    // Should navigate away (ResultScreen) - verified by finding text from ResultScreen or checking mock navigator
    // In this simple test, we just check if we reached the last step.
  });
}
