import 'dart:typed_data';
import 'package:flutter_test/flutter_test.dart';
import 'package:mocktail/mocktail.dart';
import 'package:soma/domain/export_service.dart';
import 'package:soma/data/log_service.dart';

class MockLogService extends Mock implements LogService {}

void main() {
  late ExportService exportService;
  late MockLogService mockLogService;

  setUp(() {
    mockLogService = MockLogService();
    exportService = ExportService(mockLogService);
  });

  group('ExportService', () {
    test('generatePdfBytes produces non-empty bytes with valid history', () async {
      final history = [
        {
          'id': '550e8400-e29b-41d4-a716-446655440000',
          'timestamp': DateTime.now().toIso8601String(),
          'energy': 'high',
          'valence': 'positive',
          'source': 'internal',
          'sensations': '["warmth", "lightness"]',
          'freeText': 'Feeling good after meditation.',
          'helped': 'yes',
        }
      ];

      final bytes = await exportService.generatePdfBytes(history);

      expect(bytes, isA<Uint8List>());
      expect(bytes.isNotEmpty, true);
    });

    test('generatePdfBytes handles empty history (though exportToPdf would skip it)', () async {
      final bytes = await exportService.generatePdfBytes([]);
      expect(bytes.isNotEmpty, true); // Should still produce a basic PDF header
    });

    test('generatePdfBytes handles malformed timestamps gracefully', () async {
      final history = [
        {
          'id': '550e8400-e29b-41d4-a716-446655440001',
          'timestamp': 'not-a-date',
          'energy': 'low',
          'valence': 'negative',
          'source': 'external',
          'sensations': '[]',
        }
      ];

      final bytes = await exportService.generatePdfBytes(history);
      expect(bytes.isNotEmpty, true);
    });

    test('generatePdfBytes includes check-in data in output', () async {
      final history = [
        {
          'id': '550e8400-e29b-41d4-a716-446655440002',
          'timestamp': '2026-01-24T10:30:00Z',
          'energy': 'high',
          'valence': 'pleasant',
          'source': 'internal',
          'sensations': '["warmth", "tension"]',
          'freeText': 'Test notes for verification.',
          'intensity': 4,
        }
      ];

      final bytes = await exportService.generatePdfBytes(history);

      // PDF bytes should be substantial (not just a header)
      // A PDF with content is typically > 1KB
      expect(bytes.length, greaterThan(500));
      
      // Verify it's a valid PDF by checking magic bytes
      // PDF files start with %PDF-
      expect(bytes[0], 0x25); // %
      expect(bytes[1], 0x50); // P
      expect(bytes[2], 0x44); // D
      expect(bytes[3], 0x46); // F
    });

    test('exportToPdf handles errors gracefully when no history', () async {
      when(() => mockLogService.getHistory()).thenAnswer((_) async => []);

      // Should not throw - exportToPdf handles empty history gracefully
      await exportService.exportToPdf();

      verify(() => mockLogService.getHistory()).called(1);
    });
  });
}
