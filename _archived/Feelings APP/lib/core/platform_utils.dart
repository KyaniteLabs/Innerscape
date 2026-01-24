import 'package:flutter/foundation.dart' show TargetPlatform, defaultTargetPlatform, kIsWeb;

/// APEX Platform Utilities
/// Platform detection utilities for conditional feature availability.
class PlatformUtils {
  /// Returns true if running on web browser.
  static bool get isWeb => kIsWeb;

  /// Returns true if running on macOS.
  static bool get isMacOS => !kIsWeb && defaultTargetPlatform == TargetPlatform.macOS;

  /// Returns true if running on iOS.
  static bool get isIOS => !kIsWeb && defaultTargetPlatform == TargetPlatform.iOS;

  /// Returns true if running on Android.
  static bool get isAndroid => !kIsWeb && defaultTargetPlatform == TargetPlatform.android;

  /// Returns true if running on Windows.
  static bool get isWindows => !kIsWeb && defaultTargetPlatform == TargetPlatform.windows;

  /// Returns true if running on Linux.
  static bool get isLinux => !kIsWeb && defaultTargetPlatform == TargetPlatform.linux;

  /// Returns true if SQLCipher database is supported.
  static bool get supportsSqlCipher => !kIsWeb && (isMacOS || isIOS || isAndroid);

  /// Returns true if local authentication (biometrics) is supported.
  static bool get supportsLocalAuth => !kIsWeb && (isMacOS || isIOS || isAndroid || isWindows);

  /// Returns true if local notifications are supported.
  static bool get supportsLocalNotifications => !kIsWeb;

  /// Returns true if running on mobile (iOS or Android).
  static bool get isMobile => isIOS || isAndroid;

  /// Returns true if running on desktop (macOS, Windows, Linux).
  static bool get isDesktop => isMacOS || isWindows || isLinux;
}
