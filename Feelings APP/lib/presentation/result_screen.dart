import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/design_system.dart';
import '../data/log_service.dart';
import '../data/models.dart';
import '../domain/inference_service.dart';
import 'providers.dart';
import 'reflection_screen.dart';

class ResultScreen extends ConsumerWidget {
  const ResultScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final energy = ref.watch(energyLevelProvider);
    final valence = ref.watch(valenceProvider);
    final source = ref.watch(sourceProvider);
    final contextCategory = ref.watch(contextCategoryProvider);
    // Note: regions and sensations are watched but not used in result display
    // They are kept for future analysis features
    
    final isDark = Theme.of(context).brightness == Brightness.dark;

    final result = InferenceService.calculateHypotheses(
      energy: energy ?? EnergyLevel.high,
      valence: valence ?? Valence.neutral,
      source: source,
      context: contextCategory,
    );

    final hypothesis = result.hypotheses.first;

    return Scaffold(
      body: Container(
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
            colors: isDark 
              ? [const Color(0xFF121212), const Color(0xFF0D0D0D)]
              : [const Color(0xFFFDFDFD), const Color(0xFFF5F5F5)],
          ),
        ),
        child: SafeArea(
          child: SingleChildScrollView(
            padding: const EdgeInsets.symmetric(horizontal: DesignSystem.spacingXXL),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: DesignSystem.spacingXXL),
                Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text(
                      'HYPOTHESIS',
                      style: DesignSystem.captionStyle().copyWith(letterSpacing: 4),
                    ),
                    IconButton(
                      icon: Icon(Icons.close_rounded,
                          color: isDark ? Colors.white30 : AppColors.foreground.withValues(alpha: 0.3)),
                      onPressed: () => Navigator.of(context).popUntil((route) => route.isFirst),
                    ),
                  ],
                ),
                const SizedBox(height: DesignSystem.spacingM),
                Text(
                  hypothesis.name.toUpperCase(),
                  style: DesignSystem.headingStyle().copyWith(
                    fontSize: DesignSystem.fontSizeDisplay,
                    fontWeight: FontWeight.w200,
                    letterSpacing: -1,
                  ),
                ),
                const SizedBox(height: DesignSystem.spacingS),
                _ConfidenceBadge(confidence: result.confidence),
                const SizedBox(height: DesignSystem.spacingXS),
                Text(
                  result.confidenceReason,
                  style: DesignSystem.captionStyle(color: Colors.grey),
                ),
                const SizedBox(height: DesignSystem.spacingXXL),
                Container(
                  padding: const EdgeInsets.all(DesignSystem.spacingL),
                  decoration: BoxDecoration(
                    color: isDark ? Colors.white.withValues(alpha: 0.03) : Colors.black.withValues(alpha: 0.02),
                    borderRadius: DesignSystem.borderRadiusL,
                    border: Border.all(color: AppColors.gold.withValues(alpha: 0.1)),
                  ),
                  child: Text(
                    hypothesis.description,
                    style: DesignSystem.bodyStyle(
                      color: isDark ? Colors.white70 : AppColors.foreground.withValues(alpha: 0.7),
                    ).copyWith(fontSize: 18, height: 1.6),
                  ),
                ),
                const SizedBox(height: DesignSystem.spacingXXL),
                const SizedBox(height: DesignSystem.spacingXXL),
                const _SectionHeader(title: 'What your body says'),
                const SizedBox(height: DesignSystem.spacingM),
                Wrap(
                  spacing: DesignSystem.spacingS,
                  runSpacing: DesignSystem.spacingS,
                  children: hypothesis.bodySignals.map((s) => _SignalTag(label: s)).toList(),
                ),
                const SizedBox(height: DesignSystem.spacingXXL),
                const _SectionHeader(title: 'Try or notice'),
                const SizedBox(height: DesignSystem.spacingM),
                ...hypothesis.actions.map((a) => _ActionCard(action: a, isDark: isDark)),
                const SizedBox(height: DesignSystem.spacingXXL),
                const _SectionHeader(title: 'Notes'),
                const SizedBox(height: DesignSystem.spacingM),
                TextField(
                  onChanged: (val) => ref.read(notesProvider.notifier).set(val),
                  maxLines: 3,
                  style: DesignSystem.bodyStyle(color: isDark ? Colors.white : AppColors.foreground),
                  decoration: InputDecoration(
                    hintText: 'Any other observations...',
                    hintStyle: DesignSystem.captionStyle(),
                    filled: true,
                    fillColor: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.02),
                    border: OutlineInputBorder(
                      borderRadius: DesignSystem.borderRadiusM,
                      borderSide: BorderSide.none,
                    ),
                  ),
                ),
                const SizedBox(height: DesignSystem.spacingXXL * 2),
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => _showRejectionBottomSheet(context, ref),
                        style: OutlinedButton.styleFrom(
                          padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingXL),
                          side: const BorderSide(color: Colors.grey),
                          shape: RoundedRectangleBorder(
                            borderRadius: DesignSystem.borderRadiusM,
                          ),
                        ),
                        child: Text(
                          "DOESN'T FIT",
                          style: DesignSystem.subHeadingStyle(color: Colors.grey).copyWith(letterSpacing: 2),
                        ),
                      ),
                    ),
                    const SizedBox(width: DesignSystem.spacingM),
                    Expanded(
                      flex: 2,
                      child: ElevatedButton(
                        onPressed: () => _saveAndContinue(context, ref, true, hypothesis.name),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: AppColors.gold,
                          foregroundColor: Colors.white,
                          elevation: 0,
                          padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingXL),
                          shape: RoundedRectangleBorder(
                            borderRadius: DesignSystem.borderRadiusM,
                          ),
                        ),
                        child: Text(
                          'THIS FITS',
                          style: DesignSystem.subHeadingStyle(color: Colors.white).copyWith(letterSpacing: 2),
                        ),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: DesignSystem.spacingXXL),
              ],
            ),
          ),
        ),
      ),
    );
  }

  void _showRejectionBottomSheet(BuildContext context, WidgetRef ref) {
    showModalBottomSheet(
      context: context,
      isScrollControlled: true,
      backgroundColor: Theme.of(context).brightness == Brightness.dark 
          ? AppColors.surfaceDark 
          : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom,
          left: DesignSystem.spacingL,
          right: DesignSystem.spacingL,
          top: DesignSystem.spacingL,
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'WHAT DO YOU THINK IS HAPPENING?',
              style: DesignSystem.captionStyle().copyWith(letterSpacing: 2),
            ),
            const SizedBox(height: DesignSystem.spacingM),
            TextField(
              autofocus: true,
              maxLines: 2,
              onChanged: (val) => ref.read(customHypothesisProvider.notifier).set(val),
              decoration: InputDecoration(
                hintText: 'Describe your own hypothesis...',
                filled: true,
                fillColor: Colors.black.withValues(alpha: 0.05),
                border: OutlineInputBorder(
                  borderRadius: DesignSystem.borderRadiusM,
                  borderSide: BorderSide.none,
                ),
              ),
            ),
            const SizedBox(height: DesignSystem.spacingL),
            Row(
              children: [
                TextButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _saveAndContinue(context, ref, false, null);
                  },
                  child: const Text('SKIP'),
                ),
                const Spacer(),
                ElevatedButton(
                  onPressed: () {
                    Navigator.pop(context);
                    _saveAndContinue(context, ref, false, null);
                  },
                  child: const Text('SAVE'),
                ),
              ],
            ),
            const SizedBox(height: DesignSystem.spacingL),
          ],
        ),
      ),
    );
  }

  Future<void> _saveAndContinue(BuildContext context, WidgetRef ref, bool accepted, String? hypothesisName) async {
    final energy = ref.read(energyLevelProvider);
    final valence = ref.read(valenceProvider);
    final source = ref.read(sourceProvider);
    final contextCategory = ref.read(contextCategoryProvider);
    final regions = ref.read(selectedRegionsProvider);
    final sensations = ref.read(selectedSensationsProvider);
    final intensity = ref.read(intensityProvider);
    final notes = ref.read(notesProvider);
    final customHypothesis = ref.read(customHypothesisProvider);
    final selectedAction = ref.read(selectedActionProvider);

    // Save to DB
    final id = await ref.read(logServiceProvider).saveCheckIn(
      regions: regions.toList(),
      sensations: sensations,
      energy: energy ?? EnergyLevel.high,
      valence: valence ?? Valence.neutral,
      source: source,
      context: contextCategory,
      intensity: intensity,
      freeText: notes,
      hypothesisAccepted: accepted,
      customHypothesis: customHypothesis,
      selectedAction: selectedAction,
    );
    
    // Learning from confirmation
    if (accepted && hypothesisName != null) {
      await ref.read(learningServiceProvider).recordConfirmation(
        hypothesisName: hypothesisName,
        regions: regions.toList(),
        sensations: sensations.toList(),
      );
    }
    
    ref.read(lastCheckInIdProvider.notifier).set(id);
    
    if (context.mounted) {
      // Intentionally unawaited: navigation operation doesn't need to be awaited
      unawaited(Navigator.push(
        context,
        PageRouteBuilder(
          pageBuilder: (context, animation, secondaryAnimation) => const ReflectionScreen(),
          transitionsBuilder: (context, animation, secondaryAnimation, child) {
            return FadeTransition(opacity: animation, child: child);
          },
        ),
      ));
    }
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Text(
      title.toUpperCase(),
      style: DesignSystem.captionStyle().copyWith(
        letterSpacing: 2,
        fontWeight: FontWeight.bold,
        color: AppColors.gold,
      ),
    );
  }
}

class _SignalTag extends StatelessWidget {
  final String label;
  const _SignalTag({required this.label});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      decoration: BoxDecoration(
        color: isDark ? Colors.white.withValues(alpha: 0.05) : Colors.black.withValues(alpha: 0.03),
        borderRadius: BorderRadius.circular(DesignSystem.radiusXXL),
      ),
      child: Text(
        label,
        style: DesignSystem.captionStyle(color: isDark ? Colors.white70 : AppColors.foreground),
      ),
    );
  }
}

class _ActionCard extends ConsumerWidget {
  final String action;
  final bool isDark;
  const _ActionCard({required this.action, required this.isDark});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final selectedAction = ref.watch(selectedActionProvider);
    final isSelected = selectedAction == action;

    return GestureDetector(
      onTap: () => ref.read(selectedActionProvider.notifier).set(action),
      child: Container(
        width: double.infinity,
        margin: const EdgeInsets.only(bottom: DesignSystem.spacingM),
        padding: const EdgeInsets.all(DesignSystem.spacingL),
        decoration: BoxDecoration(
          color: isSelected 
              ? AppColors.gold.withValues(alpha: 0.1) 
              : (isDark ? Colors.white.withValues(alpha: 0.05) : Colors.white),
          borderRadius: DesignSystem.borderRadiusM,
          border: Border.all(
            color: isSelected 
                ? AppColors.gold 
                : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05)),
            width: isSelected ? 2.0 : 1.0,
          ),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(
              isSelected ? Icons.check_circle : Icons.auto_awesome, 
              color: AppColors.gold, 
              size: 20
            ),
            const SizedBox(width: DesignSystem.spacingM),
            Expanded(
              child: Text(
                action,
                style: DesignSystem.bodyStyle(
                  color: isDark ? Colors.white70 : AppColors.foreground.withValues(alpha: 0.8),
                ).copyWith(
                  fontWeight: isSelected ? FontWeight.bold : FontWeight.normal,
                ),
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _ConfidenceBadge extends StatelessWidget {
  final Confidence confidence;
  const _ConfidenceBadge({required this.confidence});

  @override
  Widget build(BuildContext context) {
    final color = switch (confidence) {
      Confidence.high => Colors.green,
      Confidence.medium => AppColors.gold,
      Confidence.low => Colors.grey,
    };

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.1),
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: color.withValues(alpha: 0.5)),
      ),
      child: Text(
        '${confidence.name.toUpperCase()} CONFIDENCE',
        style: TextStyle(
          color: color,
          fontSize: 10,
          fontWeight: FontWeight.bold,
          letterSpacing: 1,
        ),
      ),
    );
  }
}
