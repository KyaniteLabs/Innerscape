import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:soma/core/design_system.dart';
import '../testing_utils.dart';

void main() {
  setupTests();
  group('DesignSystem', () {
    test('Tokens are correctly defined', () {
      expect(AppColors.foreground, const Color(0xFF1A1A2E));
      expect(AppColors.gold, const Color(0xFFD4A853));
    });

    test('Typography returns correct styles', () {
      final style = DesignSystem.headingStyle();
      expect(style.fontSize, 28);
      expect(style.fontWeight, FontWeight.w300);
    });

    test('BorderRadius tokens are defined', () {
      expect(DesignSystem.borderRadiusM, BorderRadius.circular(8.0));
    });

    test('Shadows are defined', () {
      expect(DesignSystem.softShadow, isNotEmpty);
    });
  });
}
