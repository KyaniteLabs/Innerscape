import 'package:flutter/material.dart';
import 'package:flutter/scheduler.dart';
import 'package:google_fonts/google_fonts.dart';

/// Standardized animation durations for consistent motion across the app.
///
/// These durations are used to create a cohesive motion experience.
/// Always use these constants instead of hardcoded values.
class AnimationDurations {
  /// Subtle animations for micro-interactions (hover, focus, etc.)
  static const Duration subtle = Duration(milliseconds: 150);

  /// Standard animations for common transitions (page transitions, modals)
  static const Duration standard = Duration(milliseconds: 300);

  /// Dramatic animations for major state changes (onboarding, etc.)
  static const Duration dramatic = Duration(milliseconds: 500);
}

/// Standardized easing curves for consistent animation feel.
///
/// These curves ensure all animations feel natural and cohesive.
/// Always use these constants instead of hardcoded curves.
class EasingCurves {
  /// Decelerating curve for elements entering the screen
  static const Curve easeOut = Curves.easeOut;

  /// Accelerating curve for elements leaving the screen
  static const Curve easeIn = Curves.easeIn;

  /// Accelerating then decelerating curve for bidirectional motion
  static const Curve easeInOut = Curves.easeInOut;
}

/// Standardized responsive breakpoints for adaptive layouts.
///
/// These breakpoints follow common design system patterns and
/// ensure consistent behavior across different screen sizes.
class Breakpoints {
  static const double sm = 640;
  static const double md = 768;
  static const double lg = 1024;
  static const double xl = 1280;
  static const double xxl = 1536;
}

/// Helper methods for responsive design.
///
/// Provides convenient methods to check screen size breakpoints.
class ResponsiveHelper {
  /// Check if screen is small (mobile portrait)
  static bool isSm(BuildContext context) =>
      MediaQuery.of(context).size.width < Breakpoints.md;

  /// Check if screen is medium (tablet portrait, mobile landscape)
  static bool isMd(BuildContext context) =>
      MediaQuery.of(context).size.width >= Breakpoints.md &&
      MediaQuery.of(context).size.width < Breakpoints.lg;

  /// Check if screen is large (tablet landscape, small desktop)
  static bool isLg(BuildContext context) =>
      MediaQuery.of(context).size.width >= Breakpoints.lg &&
      MediaQuery.of(context).size.width < Breakpoints.xl;

  /// Check if screen is extra large (desktop)
  static bool isXl(BuildContext context) =>
      MediaQuery.of(context).size.width >= Breakpoints.xl;
}

class DesignSystem {
  static bool useTestFonts = false;

  /// Returns whether the user has requested reduced motion.
  /// 
  /// This respects the user's system accessibility settings for
  /// reduced motion, which is important for users with vestibular
  /// disorders or motion sensitivity.
  static bool get reduceMotion {
    return SchedulerBinding.instance.platformDispatcher.accessibilityFeatures.disableAnimations;
  }

  /// Returns an appropriate animation duration based on reduced motion preference.
  /// 
  /// If the user has requested reduced motion, returns Duration.zero.
  /// Otherwise, returns the provided default duration.
  /// 
  /// Parameters:
  /// - [defaultDuration]: The default animation duration
  /// 
  /// Returns: Duration.zero if reduced motion is enabled, otherwise defaultDuration
  static Duration getAnimationDuration(Duration defaultDuration) {
    return reduceMotion ? Duration.zero : defaultDuration;
  }

  /// Returns an appropriate animation curve based on reduced motion preference.
  /// 
  /// If the user has requested reduced motion, returns Curves.linear.
  /// Otherwise, returns the provided default curve.
  /// 
  /// Parameters:
  /// - [defaultCurve]: The default animation curve
  /// 
  /// Returns: Curves.linear if reduced motion is enabled, otherwise defaultCurve
  static Curve getAnimationCurve(Curve defaultCurve) {
    return reduceMotion ? Curves.linear : defaultCurve;
  }

  static TextStyle headingStyle({Color? color}) {
    final effectiveColor = color ?? AppColors.foreground;
    if (useTestFonts) return TextStyle(fontSize: 28, fontWeight: FontWeight.w300, color: effectiveColor, letterSpacing: 2);
    return GoogleFonts.outfit(
      fontSize: 28,
      fontWeight: FontWeight.w300,
      color: effectiveColor,
      letterSpacing: 2,
    );
  }

  static TextStyle subHeadingStyle({Color? color}) {
    final effectiveColor = color ?? AppColors.foreground;
    if (useTestFonts) return TextStyle(fontSize: 18, fontWeight: FontWeight.w500, color: effectiveColor, letterSpacing: 0.5);
    return GoogleFonts.outfit(
      fontSize: 18,
      fontWeight: FontWeight.w500,
      color: effectiveColor,
      letterSpacing: 0.5,
    );
  }

  static TextStyle bodyStyle({Color? color}) {
    final effectiveColor = color ?? AppColors.foreground;
    if (useTestFonts) return TextStyle(fontSize: 16, fontWeight: FontWeight.w400, color: effectiveColor, height: 1.6);
    return GoogleFonts.outfit(
      fontSize: 16,
      fontWeight: FontWeight.w400,
      color: effectiveColor,
      height: 1.6,
    );
  }

  static TextStyle captionStyle({Color color = Colors.grey}) {
    if (useTestFonts) return TextStyle(fontSize: 13, fontWeight: FontWeight.w400, color: color, letterSpacing: 1.0);
    return GoogleFonts.outfit(
      fontSize: 13,
      fontWeight: FontWeight.w400,
      color: color,
      letterSpacing: 1.0,
    );
  }

  static TextStyle monoStyle({Color? color}) {
    final effectiveColor = color ?? AppColors.foreground;
    if (useTestFonts) return TextStyle(fontSize: 12, fontWeight: FontWeight.w400, color: effectiveColor, fontFamily: 'monospace');
    return GoogleFonts.spaceMono(
      fontSize: 12,
      fontWeight: FontWeight.w400,
      color: effectiveColor,
    );
  }

  // --- Typography Sizes (Display/Custom) ---
  static const double fontSizeDisplay = 48.0;
  static const double fontSizeDisplayLarge = 64.0;
  static const double fontSizeTitle = 28.0;
  static const double fontSizeSubtitle = 24.0;

  // --- Spacing ---
  static const double spacingXS = 4.0;
  static const double spacingS = 8.0;
  static const double spacingM = 16.0;
  static const double spacingL = 24.0;
  static const double spacingXL = 32.0;
  static const double spacingXXL = 48.0;

  // --- Borders & Radius ---
  static const double radiusS = 4.0;
  static const double radiusM = 8.0;
  static const double radiusL = 16.0;
  static const double radiusXL = 20.0;
  static const double radiusXXL = 30.0;

  static BorderRadius borderRadiusM = BorderRadius.circular(radiusM);
  static BorderRadius borderRadiusL = BorderRadius.circular(radiusL);

  // --- Shadows ---
  static List<BoxShadow> softShadow = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.05),
      blurRadius: 10,
      offset: const Offset(0, 4),
    ),
  ];

  // Shadow scale per APEX standards
  static List<BoxShadow> shadowSm = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.05),
      blurRadius: 2,
      offset: const Offset(0, 1),
    ),
  ];

  static List<BoxShadow> shadowMd = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.1),
      blurRadius: 6,
      offset: const Offset(0, 4),
    ),
  ];

  static List<BoxShadow> shadowLg = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.1),
      blurRadius: 15,
      offset: const Offset(0, 10),
    ),
  ];

  static List<BoxShadow> shadowXl = [
    BoxShadow(
      color: Colors.black.withValues(alpha: 0.15),
      blurRadius: 25,
      offset: const Offset(0, 20),
    ),
  ];
}

/// Base button widget with all required states.
/// 
/// This component implements all interactive states: default, pressed,
/// focused, hovered, disabled, and loading.
class AppButton extends StatefulWidget {
  final String label;
  final VoidCallback onPressed;
  final bool isLoading;
  final bool isDisabled;
  final Color? backgroundColor;
  final Color? textColor;
  final double? width;
  final double? height;

  const AppButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.isLoading = false,
    this.isDisabled = false,
    this.backgroundColor,
    this.textColor,
    this.width,
    this.height,
  });

  @override
  State<AppButton> createState() => _AppButtonState();
}

class _AppButtonState extends State<AppButton> {
  bool _isPressed = false;
  bool _isFocused = false;
  final bool _isHovered = false;

  @override
  Widget build(BuildContext context) {
    final isEnabled = !widget.isDisabled && !widget.isLoading;

    return FocusableActionDetector(
      onShowFocusHighlight: (value) => setState(() => _isFocused = value),
      child: GestureDetector(
        onTapDown: isEnabled ? (_) => setState(() => _isPressed = true) : null,
        onTapUp: isEnabled ? (_) => setState(() => _isPressed = false) : null,
        onTapCancel: isEnabled ? () => setState(() => _isPressed = false) : null,
        onTap: isEnabled ? widget.onPressed : null,
        child: AnimatedContainer(
          duration: DesignSystem.getAnimationDuration(const Duration(milliseconds: 150)),
          curve: DesignSystem.getAnimationCurve(Curves.easeInOut),
          width: widget.width,
          height: widget.height ?? 48,
          decoration: BoxDecoration(
            color: _getButtonColor(),
            borderRadius: BorderRadius.circular(DesignSystem.radiusM),
            boxShadow: _getShadow(),
          ),
          child: Center(
            child: widget.isLoading
                ? SizedBox(
                    width: 20,
                    height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2,
                      valueColor: AlwaysStoppedAnimation<Color>(_getTextColor()),
                    ),
                  )
                : Text(
                    widget.label,
                    style: TextStyle(
                      color: _getTextColor(),
                      fontSize: 16,
                      fontWeight: FontWeight.w500,
                    ),
                  ),
          ),
        ),
      ),
    );
  }

  Color _getButtonColor() {
    if (widget.isDisabled) return AppColors.muted;
    if (_isPressed) return AppColors.primaryDark;
    if (_isFocused) return AppColors.primary;
    if (_isHovered) return AppColors.primaryDark;
    return widget.backgroundColor ?? AppColors.primary;
  }

  Color _getTextColor() {
    if (widget.isDisabled) return AppColors.mutedForeground;
    return widget.textColor ?? AppColors.primaryForeground;
  }

  List<BoxShadow> _getShadow() {
    if (_isFocused) {
      return [
        BoxShadow(
          color: AppColors.ring.withValues(alpha: 0.5),
          blurRadius: 4,
          spreadRadius: 2,
        ),
      ];
    }
    return DesignSystem.softShadow;
  }
}

/// App color tokens for consistent theming.
class AppColors {
  // Brand colors
  static const Color gold = Color(0xFFD4A853);
  static const Color coral = Color(0xFFE8A49C);

  // Accent colors for semantic use (APEX issue CRIT-003)
  static const Color accentGreen = Color(0xFF10B981);
  static const Color accentRed = Color(0xFFEF4444);
  static const Color accentOrange = Color(0xFFF59E0B);
  static const Color accentBlue = Color(0xFF3B82F6);

  // Light mode
  static const Color background = Color(0xFFFAFAFA);
  static const Color foreground = Color(0xFF1A1A2E);
  static const Color primary = Color(0xFF4A7C59);
  static const Color primaryDark = Color(0xFF3A6C49);
  static const Color primaryForeground = Color(0xFFFFFFFF);
  static const Color secondary = Color(0xFFF1F5F9);
  static const Color muted = Color(0xFF6B7280);
  static const Color mutedForeground = Color(0xFF71717A);
  static const Color accent = Color(0xFFE8F5E9);
  static const Color destructive = Color(0xFFEF4444);
  static const Color border = Color(0xFFE5E7EB);
  static const Color ring = Color(0xFF4A7C59);
  static const Color surface = Colors.white;

  // Dark mode
  static const Color backgroundDark = Color(0xFF0A0A0A);
  static const Color foregroundDark = Color(0xFFFAFAFA);
  static const Color primaryDarkMode = Color(0xFF6B9B7A);
  static const Color primaryForegroundDark = Color(0xFF0A0A0A);
  static const Color secondaryDark = Color(0xFF27272A);
  static const Color mutedDark = Color(0xFFA1A1AA);
  static const Color mutedForegroundDark = Color(0xFF71717A);
  static const Color borderDark = Color(0xFF27272A);
  static const Color surfaceDark = Color(0xFF1E1E1E);
}

/// Focus ring widget for visible keyboard navigation.
class AppFocusRing extends StatelessWidget {
  final Widget child;
  final bool isFocused;
  final Color? focusColor;

  const AppFocusRing({
    super.key,
    required this.child,
    this.isFocused = false,
    this.focusColor,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      decoration: isFocused
          ? BoxDecoration(
              border: Border.all(
                color: focusColor ?? AppColors.ring,
                width: 2,
              ),
              borderRadius: BorderRadius.circular(DesignSystem.radiusS),
            )
          : null,
      child: child,
    );
  }
}
