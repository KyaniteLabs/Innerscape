import 'package:pdf/pdf.dart';
import 'package:pdf/widgets.dart' as pw;
import 'package:printing/printing.dart';
import 'package:flutter/foundation.dart';
import 'package:share_plus/share_plus.dart';
import 'dart:convert';
import '../data/log_service.dart';
import '../data/models.dart';
import 'package:intl/intl.dart';
import '../domain/inference_service.dart';
import 'dart:async';
import '../core/constants.dart';

class ExportService {
  final LogService _logService;
  static const Duration _defaultTimeout = Duration(seconds: TimeoutConstants.defaultTimeoutSeconds);

  ExportService(this._logService);

  /// Exports all check-in history to a PDF report.
  /// 
  /// This method generates a comprehensive PDF report containing:
  /// - A summary table with date, energy, valence, hypothesis, and helpfulness
  /// - Detailed session notes for each check-in
  /// 
  /// The PDF is automatically shared using the platform's sharing mechanism.
  /// If there are no check-ins in history, the method returns without action.
  /// 
  /// Throws: TimeoutException if PDF generation or sharing takes longer than default timeout
  Future<void> exportToPdf() async {
    final history = await _logService.getHistory();
    if (history.isEmpty) return;

    final bytes = await generatePdfBytes(history);

    await Printing.sharePdf(bytes: bytes, filename: 'SOMA_Report_${DateFormat('yyyyMMdd').format(DateTime.now())}.pdf')
        .timeout(_defaultTimeout, onTimeout: () {
      debugPrint('[APEX] exportToPdf timeout after ${_defaultTimeout.inSeconds}s');
      throw TimeoutException('PDF export timeout');
    });
  }

  /// Exports all check-in history to a CSV file.
  Future<void> exportToCsv() async {
    final history = await _logService.getHistory();
    if (history.isEmpty) return;
    
    final csv = StringBuffer();
    
    // Header row
    csv.writeln('Date,Time,Energy,Valence,Intensity,Context,Hypothesis,Sensations,Notes,Helped');
    
    // Data rows
    for (final item in history) {
      final timestamp = DateTime.parse(item['timestamp'] as String);
      final date = DateFormat('yyyy-MM-dd').format(timestamp);
      final time = DateFormat('HH:mm').format(timestamp);
      final energy = item['energy'] ?? '';
      final valence = item['valence'] ?? '';
      final intensity = item['intensity']?.toString() ?? '';
      final context = item['context'] ?? '';
      final sensations = _escapeCsvField(item['sensations'] ?? '');
      final notes = _escapeCsvField(item['freeText'] ?? '');
      final helped = item['helped'] ?? '';
      
      // Calculate hypothesis from energy/valence/source
      final hypothesis = _deriveHypothesis(item);
      
      csv.writeln('$date,$time,$energy,$valence,$intensity,$context,$hypothesis,$sensations,$notes,$helped');
    }
    
    final filename = 'SOMA_Export_${DateFormat('yyyyMMdd').format(DateTime.now())}.csv';
    await Share.shareXFiles(
      [XFile.fromData(utf8.encode(csv.toString()), name: filename, mimeType: 'text/csv')],
      subject: 'SOMA Somatic History Export',
    ).timeout(_defaultTimeout, onTimeout: () {
      debugPrint('[APEX] exportToCsv timeout after ${_defaultTimeout.inSeconds}s');
      throw TimeoutException('CSV export timeout');
    });
  }

  String _escapeCsvField(String field) {
    if (field.contains(',') || field.contains('"') || field.contains('\n')) {
      return '"${field.replaceAll('"', '""')}"';
    }
    return field;
  }

  String _deriveHypothesis(Map<String, dynamic> item) {
    final energyStr = item['energy'] as String?;
    final valenceStr = item['valence'] as String?;
    final source = item['source'] as String?;
    final contextStr = item['context'] as String?;

    if (energyStr == null || valenceStr == null) return 'N/A';

    final energy = EnergyLevel.values.firstWhere((e) => e.name == energyStr, orElse: () => EnergyLevel.high);
    final valence = Valence.values.firstWhere((e) => e.name == valenceStr, orElse: () => Valence.neutral);
    final context = contextStr != null 
        ? ContextCategory.values.firstWhere((e) => e.name == contextStr, orElse: () => ContextCategory.unknown)
        : null;

    final result = InferenceService.calculateHypotheses(
      energy: energy,
      valence: valence,
      source: source,
      context: context,
    );
    
    return result.hypotheses.first.name;
  }

  /// Generates PDF bytes for the given history.
  @visibleForTesting
  Future<Uint8List> generatePdfBytes(List<Map<String, dynamic>> history) async {
    final pdf = pw.Document();
    
    // Header Info
    pdf.addPage(
      pw.MultiPage(
        pageFormat: PdfPageFormat.a4,
        margin: const pw.EdgeInsets.all(32),
        build: (context) {
          return [
            pw.Header(
              level: 0,
              child: pw.Row(
                mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                children: [
                  pw.Text('SOMA: Somatic Progress Report', style: pw.TextStyle(fontSize: 24, fontWeight: pw.FontWeight.bold)),
                  pw.Text(DateFormat('MMM dd, yyyy').format(DateTime.now())),
                ],
              ),
            ),
            pw.SizedBox(height: 20),
            pw.Text('This report summarizes the somatic check-ins and emotional hypotheses for the period ending ${DateFormat('MMMM dd, yyyy').format(DateTime.now())}.', style: const pw.TextStyle(fontSize: 12)),
            pw.SizedBox(height: 30),
            
            pw.TableHelper.fromTextArray(
              headers: ['Date', 'Energy', 'Valence', 'Hypothesis', 'Helpful'],
              data: history.map((item) {
                DateTime timestamp;
                try {
                  timestamp = DateTime.parse(item['timestamp']);
                } catch (e) {
                  debugPrint('[APEX] Failed to parse timestamp: ${item['timestamp']}, error: $e');
                  timestamp = DateTime.now();
                }
                final energy = item['energy'];
                final valence = item['valence'];
                final helped = item['helped'] ?? 'N/A';

                // PDF export requires hypothesis names for display, but history stores enum values
                final hypothesis = InferenceService.calculateHypotheses(
                  energy: EnergyLevel.values.firstWhere((e) => e.name == energy, orElse: () => EnergyLevel.high),
                  valence: Valence.values.firstWhere((e) => e.name == valence, orElse: () => Valence.neutral),
                  source: item['source'],
                  context: null,
                ).hypotheses.first;

                return [
                  DateFormat('MM/dd HH:mm').format(timestamp),
                  energy.toString().toUpperCase(),
                  valence.toString().toUpperCase(),
                  hypothesis.name,
                  helped.toString().toUpperCase(),
                ];
              }).toList(),
              border: pw.TableBorder.all(width: 0.5, color: PdfColors.grey300),
              headerStyle: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10),
              cellStyle: const pw.TextStyle(fontSize: 9),
              headerDecoration: const pw.BoxDecoration(color: PdfColors.grey100),
              cellAlignment: pw.Alignment.centerLeft,
            ),
            
            pw.SizedBox(height: 40),
            pw.Header(level: 1, text: 'Detailed Session Notes'),
            pw.SizedBox(height: 10),
            
            ...history.map((item) {
              DateTime timestamp;
              try {
                timestamp = DateTime.parse(item['timestamp']);
              } catch (e) {
                debugPrint('[APEX] Failed to parse timestamp: ${item['timestamp']}, error: $e');
                timestamp = DateTime.now();
              }
              final sensations = item['sensations'] ?? '[]';
              final notes = item['freeText'] ?? 'No notes provided.';

              return pw.Container(
                margin: const pw.EdgeInsets.only(bottom: 20),
                padding: const pw.EdgeInsets.all(10),
                decoration: pw.BoxDecoration(
                  border: pw.Border.all(color: PdfColors.grey200),
                  borderRadius: const pw.BorderRadius.all(pw.Radius.circular(4)),
                ),
                child: pw.Column(
                  crossAxisAlignment: pw.CrossAxisAlignment.start,
                  children: [
                    pw.Row(
                      mainAxisAlignment: pw.MainAxisAlignment.spaceBetween,
                      children: [
                        pw.Text(DateFormat('EEEE, MMMM dd, yyyy - HH:mm').format(timestamp), style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 10)),
                        pw.Text('ID: ${item['id'] != null && item['id'].toString().length >= 8 ? item['id'].toString().substring(0, 8) : 'N/A'}', style: const pw.TextStyle(fontSize: 8, color: PdfColors.grey500)),
                      ],
                    ),
                    pw.SizedBox(height: 5),
                    pw.Text('Sensations: $sensations', style: const pw.TextStyle(fontSize: 9)),
                    pw.SizedBox(height: 5),
                    pw.Text('Clinical Notes:', style: pw.TextStyle(fontWeight: pw.FontWeight.bold, fontSize: 9)),
                    pw.Text(notes, style: pw.TextStyle(fontSize: 9, fontStyle: pw.FontStyle.italic)),
                  ],
                ),
              );
            }),
          ];
        },
      ),
    );

    return await pdf.save();
  }

  // TODO: [APEX] Add support for exporting to CSV format
  // TODO: [APEX] Implement custom PDF themes and branding options
  // TODO: [APEX] Add data visualization charts to PDF reports
  // TODO: [APEX] Implement incremental export for large datasets
}
