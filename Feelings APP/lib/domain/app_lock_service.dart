import 'package:flutter/foundation.dart';
import 'package:local_auth/local_auth.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/platform_utils.dart';

/// Service for managing app-level biometric authentication.
/// 
/// Provides biometric authentication using device fingerprint, face recognition,
/// or other local authentication methods. All authentication attempts are logged
/// for audit and debugging purposes.
class AppLockService {
  final LocalAuthentication _localAuth = LocalAuthentication();
  
  /// Checks if the device supports biometric authentication.
  /// 
  /// Returns true if the device can authenticate using biometrics
  /// (fingerprint, face, iris) or other supported methods.
  Future<bool> isDeviceSupported() async {
    // Web does not support local_auth
    if (!PlatformUtils.supportsLocalAuth) {
      return false;
    }

    final bool canAuthenticateWithBiometrics = await _localAuth.canCheckBiometrics;
    final bool canAuthenticate = canAuthenticateWithBiometrics || await _localAuth.isDeviceSupported();
    return canAuthenticate;
  }
  
  /// Attempts biometric authentication (fingerprint/face/etc).
  /// 
  /// Returns true if authentication succeeded, false if it failed or was cancelled.
  /// All failures are logged for debugging.
  Future<bool> authenticate() async {
    // Web does not support local_auth
    if (!PlatformUtils.supportsLocalAuth) {
      debugPrint('[APEX] Local auth not supported on this platform');
      return true;
    }

    try {
      return await _localAuth.authenticate(
        localizedReason: 'Authenticate to access SOMA',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: false,
        ),
      );
    } catch (e) {
      debugPrint('[APEX] Biometric authentication failed: $e');
      return false;
    }
  }
  
  /// Checks if app lock is currently enabled in user preferences.
  Future<bool> isAppLockEnabled() async {
    final prefs = await SharedPreferences.getInstance();
    return prefs.getBool('app_lock_enabled') ?? false;
  }
  
  /// Enables or disables app lock based on user preferences.
  Future<void> setAppLockEnabled(bool enabled) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('app_lock_enabled', enabled);
  }
}
