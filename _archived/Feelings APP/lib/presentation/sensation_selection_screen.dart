import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/design_system.dart';
import '../core/constants.dart';
import '../data/models.dart';
import 'providers.dart';
import 'decision_tree_screen.dart';

class SensationSelectionScreen extends ConsumerWidget {
  const SensationSelectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final vocabularyAsync = ref.watch(sensationVocabularyProvider);
    final selectedSensations = ref.watch(selectedSensationsProvider);
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded,
              color: isDark ? Colors.white : AppColors.foreground),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'SENSATIONS',
          style: DesignSystem.subHeadingStyle(
            color: isDark ? Colors.white : AppColors.foreground,
          ).copyWith(letterSpacing: 4),
        ),
      ),
      body: vocabularyAsync.when(
        data: (categories) => ListView.builder(
          padding: const EdgeInsets.symmetric(horizontal: DesignSystem.spacingXXL),
          itemCount: categories.length + 1,
          itemBuilder: (context, index) {
            if (index == categories.length) {
              return _buildContinueButton(context, ref, selectedSensations);
            }

            final category = categories[index];
            final String categoryName = category['name'];
            final List<String> tokens = List<String>.from(category['tokens']);

            return Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                const SizedBox(height: DesignSystem.spacingXL),
                Text(
                  categoryName.toUpperCase(),
                  style: DesignSystem.captionStyle().copyWith(
                    letterSpacing: 2,
                    fontWeight: FontWeight.bold,
                  ),
                ),
                const SizedBox(height: DesignSystem.spacingM),
                Wrap(
                  spacing: DesignSystem.spacingS,
                  runSpacing: DesignSystem.spacingS,
                  children: tokens.map((label) {
                    final token = SensationToken(label: label, category: categoryName);
                    final isSelected = selectedSensations.any((t) => t.label == label);

                    return ChoiceChip(
                      label: Text(label),
                      selected: isSelected,
                      onSelected: (selected) {
                        HapticFeedback.lightImpact();
                        ref.read(selectedSensationsProvider.notifier).toggle(token);
                      },
                      labelStyle: DesignSystem.bodyStyle(
                        color: isSelected ? Colors.white : (isDark ? Colors.white70 : AppColors.foreground),
                      ).copyWith(fontSize: 14),
                      selectedColor: AppColors.foreground,
                      backgroundColor: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.03),
                      shape: RoundedRectangleBorder(
                        borderRadius: DesignSystem.borderRadiusM,
                        side: BorderSide.none,
                      ),
                      showCheckmark: false,
                    );
                  }).toList(),
                ),
              ],
            );
          },
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (err, stack) => Center(child: Text('Error: $err')),
      ),
    );
  }

  Widget _buildContinueButton(BuildContext context, WidgetRef ref, Set<SensationToken> selected) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingXXL),
      child: AnimatedOpacity(
        duration: AnimationConstants.pageTransition,
        opacity: selected.isNotEmpty ? 1.0 : 0.0,
        child: SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: selected.isNotEmpty
                ? () {
                    Navigator.push(
                      context,
                      MaterialPageRoute(
                        builder: (context) => const DecisionTreeScreen(),
                      ),
                    );
                  }
                : null,
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.foreground,
              foregroundColor: Colors.white,
              elevation: 0,
              padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingXL),
              shape: RoundedRectangleBorder(
                borderRadius: DesignSystem.borderRadiusM,
              ),
            ),
            child: Text(
              'CONTINUE',
              style: DesignSystem.subHeadingStyle(color: Colors.white).copyWith(letterSpacing: 2),
            ),
          ),
        ),
      ),
    );
  }
}
