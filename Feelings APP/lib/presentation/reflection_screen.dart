import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../core/design_system.dart';
import '../core/constants.dart';
import '../data/models.dart';
import '../data/log_service.dart';
import 'providers.dart';

class ReflectionScreen extends ConsumerWidget {
  const ReflectionScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final selectedAction = ref.watch(selectedActionProvider);

    return Scaffold(
      body: Container(
        width: double.infinity,
        decoration: BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: isDark 
              ? [const Color(0xFF1A1A1A), const Color(0xFF0D0D0D)]
              : [const Color(0xFFFFFFFF), const Color(0xFFF0F0F0)],
          ),
        ),
        child: SafeArea(
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: DesignSystem.spacingXXL),
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              crossAxisAlignment: CrossAxisAlignment.center,
              children: [
                const Spacer(),
                if (selectedAction != null) ...[
                  Text(
                    'YOU TRIED',
                    style: DesignSystem.captionStyle().copyWith(letterSpacing: 2),
                  ),
                  const SizedBox(height: DesignSystem.spacingS),
                  Text(
                    selectedAction.toUpperCase(),
                    style: DesignSystem.subHeadingStyle().copyWith(
                      color: AppColors.gold,
                      fontWeight: FontWeight.bold,
                    ),
                    textAlign: TextAlign.center,
                  ),
                  const SizedBox(height: DesignSystem.spacingXXL),
                ],
                Text(
                  'DID THAT HELP?',
                  style: DesignSystem.headingStyle().copyWith(
                    letterSpacing: 6,
                    fontSize: DesignSystem.fontSizeSubtitle,
                    fontWeight: FontWeight.w200,
                  ),
                  textAlign: TextAlign.center,
                ),
                const SizedBox(height: DesignSystem.spacingXXL),
                _ReflectionButton(
                  label: 'IT HELPED',
                  icon: Icons.check_circle_outline_rounded,
                  color: Colors.teal,
                  onTap: () => _finish(context, ref, HelpfulnessRating.helped),
                ),
                const SizedBox(height: DesignSystem.spacingL),
                _ReflectionButton(
                  label: 'NOT REALLY',
                  icon: Icons.highlight_off_rounded,
                  color: AppColors.coral,
                  onTap: () => _finish(context, ref, HelpfulnessRating.didntHelp),
                ),
                const SizedBox(height: DesignSystem.spacingL),
                _ReflectionButton(
                  label: 'NOT SURE',
                  icon: Icons.help_outline_rounded,
                  color: Colors.grey,
                  onTap: () => _finish(context, ref, HelpfulnessRating.notSure),
                ),
                const Spacer(),
                TextButton(
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    resetSession(ref);
                    Navigator.of(context).popUntil((route) => route.isFirst);
                  },
                  child: Text(
                    'DONE FOR NOW',
                    style: DesignSystem.captionStyle().copyWith(letterSpacing: 3),
                  ),
                ),
                const SizedBox(height: DesignSystem.spacingXXL),
              ],
            ),
          ),
        ),
      ),
    );
  }

  Future<void> _finish(BuildContext context, WidgetRef ref, HelpfulnessRating rating) async {
    // Intentionally unawaited: haptic feedback is fire-and-forget
    unawaited(HapticFeedback.lightImpact());
    final lastId = ref.read(lastCheckInIdProvider);
    if (lastId == null) {
      debugPrint('[APEX] Error: No checkInId available for reflection');
      if (context.mounted) {
        resetSession(ref);
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
      return;
    }

    await ref.read(logServiceProvider).saveReflection(
      checkInId: lastId,
      helped: rating,
    );

    if (context.mounted) {
      await _showFollowUpDialog(context, ref, lastId);
      
      if (context.mounted) {
        resetSession(ref);
        Navigator.of(context).popUntil((route) => route.isFirst);
      }
    }
  }

  Future<void> _showFollowUpDialog(BuildContext context, WidgetRef ref, String checkInId) async {
    final Duration? selected = await showModalBottomSheet<Duration>(
      context: context,
      backgroundColor: Theme.of(context).brightness == Brightness.dark 
          ? AppColors.surfaceDark 
          : Colors.white,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (context) => Padding(
        padding: const EdgeInsets.all(DesignSystem.spacingXXL),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'WANT A FOLLOW-UP REMINDER?',
              style: DesignSystem.captionStyle().copyWith(letterSpacing: 2),
            ),
            const SizedBox(height: DesignSystem.spacingXXL),
            _FollowUpOption(
              label: 'IN 30 MINUTES',
              onTap: () => Navigator.pop(context, const Duration(minutes: 30)),
            ),
            const SizedBox(height: DesignSystem.spacingL),
            _FollowUpOption(
              label: 'IN 1 HOUR',
              onTap: () => Navigator.pop(context, const Duration(hours: 1)),
            ),
            const SizedBox(height: DesignSystem.spacingL),
            _FollowUpOption(
              label: 'IN 2 HOURS',
              onTap: () => Navigator.pop(context, const Duration(hours: 2)),
            ),
            const SizedBox(height: DesignSystem.spacingL),
            TextButton(
              onPressed: () => Navigator.pop(context),
              child: Center(
                child: Text(
                  'NO THANKS',
                  style: DesignSystem.captionStyle(color: Colors.grey),
                ),
              ),
            ),
          ],
        ),
      ),
    );

    if (selected != null) {
      await ref.read(notificationServiceProvider).scheduleReflectionFollowUp(
        checkInId: checkInId,
        delay: selected,
      );
    }
  }
}

class _FollowUpOption extends StatelessWidget {
  final String label;
  final VoidCallback onTap;

  const _FollowUpOption({required this.label, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: double.infinity,
      child: OutlinedButton(
        onPressed: onTap,
        style: OutlinedButton.styleFrom(
          padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingXL),
          shape: RoundedRectangleBorder(
            borderRadius: DesignSystem.borderRadiusM,
          ),
        ),
        child: Text(
          label,
          style: DesignSystem.subHeadingStyle().copyWith(letterSpacing: 2),
        ),
      ),
    );
  }
}

class _ReflectionButton extends StatefulWidget {
  final String label;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ReflectionButton({
    required this.label,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  State<_ReflectionButton> createState() => _ReflectionButtonState();
}

class _ReflectionButtonState extends State<_ReflectionButton> {
  bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return MouseRegion(
      onEnter: (_) => setState(() => _isHovered = true),
      onExit: (_) => setState(() => _isHovered = false),
      child: GestureDetector(
        onTap: widget.onTap,
        child: AnimatedContainer(
          duration: AnimationConstants.standard,
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingXL),
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : Colors.white,
            borderRadius: DesignSystem.borderRadiusL,
            border: Border.all(
              color: _isHovered 
                ? widget.color.withValues(alpha: 0.5) 
                : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05)),
              width: _isHovered ? 2.0 : 1.0,
            ),
            boxShadow: _isHovered ? [
              BoxShadow(
                color: widget.color.withValues(alpha: 0.1),
                blurRadius: 15,
                offset: const Offset(0, 8),
              )
            ] : DesignSystem.softShadow,
          ),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(widget.icon, color: widget.color, size: 24),
              const SizedBox(width: DesignSystem.spacingM),
              Text(
                widget.label,
                style: DesignSystem.subHeadingStyle(
                  color: isDark ? Colors.white : AppColors.foreground,
                ).copyWith(
                  letterSpacing: 2,
                  color: _isHovered ? widget.color : null,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
