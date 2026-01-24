import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest.dart' as tz;
import 'package:flutter/foundation.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/constants.dart';
import '../core/platform_utils.dart';

/// Service for managing local notifications with quiet hours support.
/// 
/// Handles notification initialization, permission requests, scheduling,
/// and quiet hours management. Notifications can be scheduled with automatic
/// adjustment for quiet hour periods.
class NotificationService {
  final FlutterLocalNotificationsPlugin _notifications = FlutterLocalNotificationsPlugin();
  void Function(String? payload)? onNotificationTapped;
  
  Future<void> initialize() async {
    try {
      // Web does not support flutter_local_notifications
      if (!PlatformUtils.supportsLocalNotifications) {
        debugPrint('[APEX] Notifications not supported on web');
        return;
      }

      /// Initializes the notification service with platform-specific settings.
      /// Must be called before any notification operations.
      tz.initializeTimeZones();
      
      const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
      const iosSettings = DarwinInitializationSettings(
        requestAlertPermission: false,
        requestBadgePermission: false,
        requestSoundPermission: false,
      );
      const settings = InitializationSettings(android: androidSettings, iOS: iosSettings);
      
      await _notifications.initialize(
        settings,
        onDidReceiveNotificationResponse: (NotificationResponse response) {
          debugPrint('Notification clicked: ${response.payload}');
          onNotificationTapped?.call(response.payload);
        },
      );
    } catch (e) {
      debugPrint('[APEX] Error initializing notifications: $e');
      rethrow;
    }
  }
  
  /// Requests notification permissions from the user.
  /// 
  /// Returns true if permission was granted, false otherwise.
  /// Handles both iOS and Android permission requests.
  Future<bool> requestPermission() async {
    try {
      if (kIsWeb) return false;
      
      final iOS = await _notifications.resolvePlatformSpecificImplementation<IOSFlutterLocalNotificationsPlugin>();
      if (iOS != null) {
        return await iOS.requestPermissions(alert: true, badge: true, sound: true) ?? false;
      }
      
      final android = await _notifications.resolvePlatformSpecificImplementation<AndroidFlutterLocalNotificationsPlugin>();
      if (android != null) {
        return await android.requestNotificationsPermission() ?? false;
      }
      
      return true;
    } catch (e) {
      debugPrint('[APEX] Error requesting notification permission: $e');
      return false;
    }
  }
  
  /// Schedules a reflection follow-up notification.
  /// 
  /// Automatically adjusts the scheduled time if it falls within quiet hours.
  /// Uses the check-in ID's hash code as the notification ID (potential collision risk).
  /// 
  /// Parameters:
  /// - [checkInId]: Unique identifier for the check-in session
  /// - [delay]: Time to wait before showing the notification
  Future<void> scheduleReflectionFollowUp({
    required String checkInId,
    required Duration delay,
  }) async {
    try {
      if (!PlatformUtils.supportsLocalNotifications) {
        debugPrint('[APEX] Notifications not supported on this platform');
        return;
      }

      var scheduledTime = tz.TZDateTime.now(tz.local).add(delay);
      
      // Check quiet hours
      final prefs = await SharedPreferences.getInstance();
      final quietEnabled = prefs.getBool('quiet_hours_enabled') ?? false;
      if (quietEnabled) {
        final startMinutes = prefs.getInt('quiet_hours_start') ?? NotificationConstants.defaultQuietHourStart;
        final endMinutes = prefs.getInt('quiet_hours_end') ?? NotificationConstants.defaultQuietHourEnd;
        scheduledTime = _adjustForQuietHours(scheduledTime, startMinutes, endMinutes);
      }
      
      await _notifications.zonedSchedule(
        checkInId.hashCode,
        'How are you feeling now?',
        'Take a moment to check in with your body.',
        scheduledTime,
        const NotificationDetails(
          android: AndroidNotificationDetails(
            'reflection_followup',
            'Reflection Follow-ups',
            channelDescription: 'Reminders to reflect on your state',
            importance: Importance.defaultImportance,
            priority: Priority.defaultPriority,
          ),
          iOS: DarwinNotificationDetails(),
        ),
        androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
        uiLocalNotificationDateInterpretation: UILocalNotificationDateInterpretation.absoluteTime,
        payload: checkInId,
      );
    } catch (e) {
      debugPrint('[APEX] Error scheduling reflection follow-up: $e');
      rethrow;
    }
  }
  
  /// Adjusts scheduled time to respect quiet hours
  tz.TZDateTime _adjustForQuietHours(tz.TZDateTime time, int startMin, int endMin) {
    final timeMinutes = time.hour * 60 + time.minute;
    
    // If time is within quiet hours, delay to end of quiet hours
    if (startMin < endMin) {
      // Same day range (e.g., 14:00 - 18:00)
      if (timeMinutes >= startMin && timeMinutes < endMin) {
        return tz.TZDateTime(tz.local, time.year, time.month, time.day, endMin ~/ 60, endMin % 60);
      }
    } else {
      // Overnight range (e.g., 22:00 - 08:00)
      if (timeMinutes >= startMin || timeMinutes < endMin) {
        final nextDay = timeMinutes >= startMin ? time.add(const Duration(days: 1)) : time;
        return tz.TZDateTime(tz.local, nextDay.year, nextDay.month, nextDay.day, endMin ~/ 60, endMin % 60);
      }
    }
    
    return time; // Not in quiet hours
  }
  
  Future<void> cancelAllNotifications() async {
    await _notifications.cancelAll();
  }
}
