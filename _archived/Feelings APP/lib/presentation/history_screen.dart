import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:intl/intl.dart';
import '../core/design_system.dart';
import '../data/log_service.dart';
import '../data/models.dart';
import '../domain/pattern_service.dart';
import 'providers.dart';

class HistoryScreen extends ConsumerWidget {
  const HistoryScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final patternSummary = ref.watch(patternSummaryProvider);

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded,
              color: isDark ? AppColors.primaryForegroundDark : AppColors.foreground),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'HISTORY',
          style: DesignSystem.subHeadingStyle(
            color: isDark ? AppColors.primaryForegroundDark : AppColors.foreground,
          ).copyWith(letterSpacing: 4),
        ),
        actions: [
          PopupMenuButton<String>(
            icon: Icon(Icons.share_rounded,
                color: isDark ? AppColors.primaryForegroundDark : AppColors.foreground),
            onSelected: (value) async {
              if (context.mounted) {
                final confirmed = await _showExportWarning(context);
                if (!confirmed) return;
                
                if (value == 'pdf') {
                  await ref.read(exportServiceProvider).exportToPdf();
                } else if (value == 'csv') {
                  await ref.read(exportServiceProvider).exportToCsv();
                }
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(
                value: 'pdf',
                child: Text('Export PDF'),
              ),
              const PopupMenuItem(
                value: 'csv',
                child: Text('Export CSV'),
              ),
            ],
          ),
        ],
      ),
      body: FutureBuilder<List<Map<String, dynamic>>>(
        future: ref.read(logServiceProvider).getHistory(),
        builder: (context, snapshot) {
          if (snapshot.connectionState == ConnectionState.waiting) {
            return const Center(child: CircularProgressIndicator());
          }
          
          // Handle errors from getHistory
          if (snapshot.hasError) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.error_outline_rounded, size: 64, color: AppColors.accentRed.withValues(alpha: 0.5)),
                  const SizedBox(height: DesignSystem.spacingL),
                  Text(
                    'Failed to load history',
                    style: DesignSystem.bodyStyle(color: AppColors.foreground.withValues(alpha: 0.8)),
                  ),
                  const SizedBox(height: DesignSystem.spacingS),
                  Text(
                    snapshot.error?.toString() ?? 'Unknown error',
                    style: DesignSystem.captionStyle(color: AppColors.foreground.withValues(alpha: 0.5)),
                    textAlign: TextAlign.center,
                  ),
                ],
              ),
            );
          }
          
          if (!snapshot.hasData || (snapshot.data ?? []).isEmpty) {
            return Center(
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(Icons.history_rounded, size: 64, color: AppColors.foreground.withValues(alpha: 0.3)),
                  const SizedBox(height: DesignSystem.spacingL),
                  Text(
                    'No check-ins yet.',
                    style: DesignSystem.bodyStyle(color: AppColors.foreground.withValues(alpha: 0.6)),
                  ),
                ],
              ),
            );
          }

          final history = (snapshot.data ?? []).reversed.toList();

          return ListView.builder(
            padding: const EdgeInsets.all(DesignSystem.spacingXXL),
            itemCount: history.length + 1,
            itemBuilder: (context, index) {
              if (index == 0) {
                return patternSummary.when(
                  data: (summary) => _PatternSummaryCard(summary: summary, isDark: isDark),
                  loading: () => const SizedBox.shrink(),
                  error: (err, __) {
                    // Log pattern analysis errors but don't block history display
                    debugPrint('[APEX] Pattern analysis failed: $err');
                    return const SizedBox.shrink();
                  },
                );
              }

              final item = history[index - 1];
              DateTime timestamp;
              try {
                timestamp = DateTime.parse(item['timestamp']);
              } catch (e) {
                debugPrint('[APEX] Failed to parse timestamp: ${item['timestamp']}, error: $e');
                timestamp = DateTime.now();
              }
              final energy = EnergyLevel.values.byName(item['energy'] ?? 'neutral');
              final valence = Valence.values.byName(item['valence'] ?? 'neutral');
              
              return _HistoryCard(
                timestamp: timestamp,
                energy: energy,
                valence: valence,
                isDark: isDark,
                item: item,
              );
            },
          );
        },
      ),
    );
  }
}

class _HistoryCard extends StatelessWidget {
  final DateTime timestamp;
  final EnergyLevel energy;
  final Valence valence;
  final bool isDark;
  final Map<String, dynamic> item;

  const _HistoryCard({
    required this.timestamp,
    required this.energy,
    required this.valence,
    required this.isDark,
    required this.item,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: DesignSystem.spacingL),
      padding: const EdgeInsets.all(DesignSystem.spacingL),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : AppColors.surface,
        borderRadius: DesignSystem.borderRadiusM,
        border: Border.all(
          color: isDark ? AppColors.surfaceDark.withValues(alpha: 0.2) : AppColors.foreground.withValues(alpha: 0.05),
        ),
        boxShadow: DesignSystem.softShadow,
      ),
      child: Row(
        children: [
          Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                DateFormat('MMM dd, hh:mm a').format(timestamp).toUpperCase(),
                style: DesignSystem.captionStyle().copyWith(letterSpacing: 1),
              ),
              const SizedBox(height: DesignSystem.spacingS),
              Row(
                children: [
                  _Badge(
                    label: energy.name.toUpperCase(),
                    color: energy == EnergyLevel.high ? AppColors.accentOrange : AppColors.accentBlue,
                  ),
                  const SizedBox(width: DesignSystem.spacingS),
                  _Badge(
                    label: valence.name.toUpperCase(),
                    color: valence == Valence.pleasant ? AppColors.accentGreen : (valence == Valence.unpleasant ? AppColors.accentRed : AppColors.foreground.withValues(alpha: 0.5)),
                  ),
                  const SizedBox(width: DesignSystem.spacingS),
                  if (item['intensity'] != null)
                    _Badge(
                      label: 'INTENSITY: ${item['intensity']}',
                      color: AppColors.gold,
                    ),
                ],
              ),
            ],
          ),
          const Spacer(),
          IconButton(
            icon: Icon(
              Icons.info_outline_rounded,
              color: AppColors.foreground.withValues(alpha: 0.5),
            ),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                backgroundColor: isDark ? AppColors.surfaceDark : AppColors.surface,
                shape: RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(DesignSystem.radiusXL)),
                ),
                builder: (context) => Padding(
                  padding: const EdgeInsets.all(DesignSystem.spacingXXL),
                  child: Column(
                    mainAxisSize: MainAxisSize.min,
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text('SESSION DETAILS', style: DesignSystem.captionStyle().copyWith(letterSpacing: 2)),
                      const SizedBox(height: DesignSystem.spacingM),
                      Text(item['freeText'] ?? 'No notes provided.', style: DesignSystem.bodyStyle()),
                      const SizedBox(height: DesignSystem.spacingL),
                      Text('Sensations:', style: DesignSystem.captionStyle()),
                      Text(item['sensations'] ?? '[]', style: DesignSystem.bodyStyle(color: AppColors.foreground.withValues(alpha: 0.6))),
                      const SizedBox(height: DesignSystem.spacingXXL),
                    ],
                  ),
                ),
              );
            },
          ),
        ],
      ),
    );
  }
}

class _Badge extends StatelessWidget {
  final String label;
  final Color color;

  const _Badge({required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withValues(alpha: 0.2)),
      ),
      child: Text(
        label,
        style: DesignSystem.captionStyle(color: color).copyWith(
          fontSize: 10,
          fontWeight: FontWeight.bold,
        ),
      ),
    );
  }
}

class _PatternSummaryCard extends StatelessWidget {
  final PatternSummary summary;
  final bool isDark;

  const _PatternSummaryCard({required this.summary, required this.isDark});

  @override
  Widget build(BuildContext context) {
    if (summary.totalCheckIns < 5) return const SizedBox.shrink();

    return Container(
      margin: const EdgeInsets.only(bottom: DesignSystem.spacingXXL),
      padding: const EdgeInsets.all(DesignSystem.spacingXL),
      decoration: BoxDecoration(
        color: isDark ? AppColors.gold.withValues(alpha: 0.1) : AppColors.gold.withValues(alpha: 0.05),
        borderRadius: DesignSystem.borderRadiusL,
        border: Border.all(color: AppColors.gold.withValues(alpha: 0.3)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.auto_awesome, color: AppColors.gold, size: 20),
              const SizedBox(width: DesignSystem.spacingS),
              Text(
                'YOUR SOMATIC PATTERNS',
                style: DesignSystem.captionStyle().copyWith(
                  letterSpacing: 2,
                  fontWeight: FontWeight.bold,
                  color: AppColors.gold,
                ),
              ),
            ],
          ),
          const SizedBox(height: DesignSystem.spacingL),
          if (summary.mostCommonHypothesis case final hypothesis?)
            _PatternRow(
              label: 'Most common state:',
              value: hypothesis,
            ),
          if (summary.mostHelpfulAction case final action?)
            _PatternRow(
              label: 'What usually helps:',
              value: action,
            ),
          const Divider(height: 32),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: [
              _Stat(label: 'TOTAL', value: summary.totalCheckIns.toString()),
              _Stat(label: 'HELPED', value: summary.helpedCount.toString(), color: AppColors.accentGreen),
              _Stat(label: 'UNHELPFUL', value: summary.didntHelpCount.toString(), color: AppColors.accentRed),
            ],
          ),
        ],
      ),
    );
  }
}

class _PatternRow extends StatelessWidget {
  final String label;
  final String value;

  const _PatternRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingS),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(label, style: DesignSystem.captionStyle(color: AppColors.foreground.withValues(alpha: 0.6))),
          Text(value, style: DesignSystem.subHeadingStyle()),
        ],
      ),
    );
  }
}

class _Stat extends StatelessWidget {
  final String label;
  final String value;
  final Color? color;

  const _Stat({required this.label, required this.value, this.color});

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        Text(value, style: DesignSystem.headingStyle(color: color).copyWith(fontSize: 20)),
        Text(label, style: DesignSystem.captionStyle(color: AppColors.foreground.withValues(alpha: 0.6))),
      ],
    );
  }
}

Future<bool> _showExportWarning(BuildContext context) async {
  return await showDialog<bool>(
    context: context,
    builder: (context) => AlertDialog(
      backgroundColor: Theme.of(context).brightness == Brightness.dark 
          ? AppColors.surfaceDark 
          : Colors.white,
      title: Text(
        'EXPORT DATA',
        style: DesignSystem.subHeadingStyle().copyWith(letterSpacing: 2),
      ),
      content: Text(
        'This file may contain sensitive health information. '
        'Make sure you trust the destination before sharing.',
        style: DesignSystem.bodyStyle(),
      ),
      actions: [
        TextButton(
          onPressed: () => Navigator.pop(context, false),
          child: const Text('CANCEL'),
        ),
        ElevatedButton(
          onPressed: () => Navigator.pop(context, true),
          style: ElevatedButton.styleFrom(
            backgroundColor: AppColors.gold,
            foregroundColor: Colors.white,
          ),
          child: const Text('EXPORT'),
        ),
      ],
    ),
  ) ?? false;
}
