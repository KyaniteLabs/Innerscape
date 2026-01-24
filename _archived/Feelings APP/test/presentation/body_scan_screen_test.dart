import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:soma/presentation/body_scan_screen.dart';
import '../testing_utils.dart';

void main() {
  testWidgets('BodyScanScreen renders and toggles regions', (tester) async {
    await tester.pumpWidget(pumpApp(const BodyScanScreen()));

    expect(find.text('Where do you notice something?'), findsOneWidget);
    expect(find.text('CONTINUE'), findsOneWidget);

    // Initial state: CONTINUE button should be disabled (opacity 0)
    // Actually AnimatedOpacity is used, we can check the button's onPressed
    final button = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
    expect(button.onPressed, isNull);

    // Find a touch target (e.g. Head)
    // Head is at width * 0.35, height * 0.05
    // In tester, we can find by type Container if we are lucky or use coordinates
    // Better: find by GestureDetector if we can identify them, but they are anonymous
    // We can find the Positioned but they don't have easy keys.
    // Let's use the layout coordinates or just find the RenderCustomPaint if we want but it won't trigger the GestureDetector.
    
    // We can try to tap at a relative position in the Center AspectRatio
    final center = tester.getCenter(find.byType(AspectRatio));
    await tester.tapAt(center + const Offset(0, -100)); // Tap towards head
    await tester.pumpAndSettle();

    // After tapping, the button should be enabled
    final updatedButton = tester.widget<ElevatedButton>(find.byType(ElevatedButton));
    expect(updatedButton.onPressed, isNotNull);
  });
}
