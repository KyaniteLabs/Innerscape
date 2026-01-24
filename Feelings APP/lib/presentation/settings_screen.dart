import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../core/design_system.dart';
import '../core/constants.dart';
import 'providers.dart';

class SettingsScreen extends ConsumerStatefulWidget {
  const SettingsScreen({super.key});

  @override
  ConsumerState<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends ConsumerState<SettingsScreen> {
  bool _notificationsEnabled = true;
  int _defaultReminderMinutes = SettingsConstants.defaultReminderMinutes;
  bool _appLockEnabled = false;
  bool _isDeviceSupported = false;
  bool _quietHoursEnabled = false;
  TimeOfDay _quietStart = TimeOfDay(hour: SettingsConstants.quietHourStartHour, minute: 0);
  TimeOfDay _quietEnd = TimeOfDay(hour: SettingsConstants.quietHourEndHour, minute: 0);

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final prefs = await SharedPreferences.getInstance();
    final appLockService = ref.read(appLockServiceProvider);
    
    try {
      final supported = await appLockService.isDeviceSupported();
      
      final quietStartMinutes = prefs.getInt('quiet_hours_start') ?? NotificationConstants.defaultQuietHourStart;
      final quietEndMinutes = prefs.getInt('quiet_hours_end') ?? NotificationConstants.defaultQuietHourEnd;
      
      setState(() {
        _notificationsEnabled = prefs.getBool('notifications_enabled') ?? true;
        _defaultReminderMinutes = prefs.getInt('default_reminder_minutes') ?? SettingsConstants.defaultReminderMinutes;
        _appLockEnabled = prefs.getBool('app_lock_enabled') ?? false;
        _isDeviceSupported = supported;
        _quietHoursEnabled = prefs.getBool('quiet_hours_enabled') ?? false;
        _quietStart = TimeOfDay(hour: quietStartMinutes ~/ 60, minute: quietStartMinutes % 60);
        _quietEnd = TimeOfDay(hour: quietEndMinutes ~/ 60, minute: quietEndMinutes % 60);
      });
    } catch (e) {
      debugPrint('[APEX] Error loading settings: $e');
      // Fall back to defaults
      setState(() {
        _notificationsEnabled = true;
        _defaultReminderMinutes = SettingsConstants.defaultReminderMinutes;
        _appLockEnabled = false;
        _isDeviceSupported = false;
        _quietHoursEnabled = false;
        _quietStart = TimeOfDay(hour: SettingsConstants.quietHourStartHour, minute: 0);
        _quietEnd = TimeOfDay(hour: SettingsConstants.quietHourEndHour, minute: 0);
      });
    }
  }

  Future<void> _toggleNotifications(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('notifications_enabled', value);
    setState(() => _notificationsEnabled = value);
    
    if (value) {
      await ref.read(notificationServiceProvider).requestPermission();
    } else {
      await ref.read(notificationServiceProvider).cancelAllNotifications();
    }
  }

  Future<void> _toggleAppLock(bool value) async {
    final appLockService = ref.read(appLockServiceProvider);
    
    if (value) {
      final success = await appLockService.authenticate();
      if (!success) return;
    }
    
    await appLockService.setAppLockEnabled(value);
    setState(() => _appLockEnabled = value);
  }

  Future<void> _toggleQuietHours(bool value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('quiet_hours_enabled', value);
    setState(() => _quietHoursEnabled = value);
  }

  Future<void> _pickTime({required bool isStart}) async {
    final picked = await showTimePicker(
      context: context,
      initialTime: isStart ? _quietStart : _quietEnd,
    );
    
    if (picked != null) {
      final prefs = await SharedPreferences.getInstance();
      final minutes = picked.hour * 60 + picked.minute;
      
      if (isStart) {
        await prefs.setInt('quiet_hours_start', minutes);
        setState(() => _quietStart = picked);
      } else {
        await prefs.setInt('quiet_hours_end', minutes);
        setState(() => _quietEnd = picked);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

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
          'SETTINGS',
          style: DesignSystem.subHeadingStyle(
            color: isDark ? AppColors.primaryForegroundDark : AppColors.foreground,
          ).copyWith(letterSpacing: 4),
        ),
      ),
      body: ListView(
        padding: const EdgeInsets.all(DesignSystem.spacingXXL),
        children: [
          _SectionHeader(title: 'NOTIFICATIONS'),
          SwitchListTile(
            title: const Text('Reflection Reminders'),
            subtitle: const Text('Get notified to reflect on your state'),
            value: _notificationsEnabled,
            onChanged: _toggleNotifications,
            activeThumbColor: AppColors.gold,
          ),
          if (_notificationsEnabled) ...[
            ListTile(
              title: const Text('Default Reminder Time'),
              trailing: DropdownButton<int>(
                value: _defaultReminderMinutes,
                onChanged: (val) async {
                  if (val == null) return;
                  final prefs = await SharedPreferences.getInstance();
                  await prefs.setInt('default_reminder_minutes', val);
                  setState(() => _defaultReminderMinutes = val);
                },
                items: const [
                  DropdownMenuItem(value: ReminderConstants.reminderShortMinutes, child: Text('30 min')),
                  DropdownMenuItem(value: ReminderConstants.reminderMediumMinutes, child: Text('1 hour')),
                  DropdownMenuItem(value: ReminderConstants.reminderLongMinutes, child: Text('2 hours')),
                ],
              ),
            ),
            SwitchListTile(
              title: const Text('Quiet Hours'),
              subtitle: Text(_quietHoursEnabled 
                ? '${_quietStart.format(context)} - ${_quietEnd.format(context)}'
                : 'Pause notifications during set hours'),
              value: _quietHoursEnabled,
              onChanged: _toggleQuietHours,
              activeThumbColor: AppColors.gold,
            ),
            if (_quietHoursEnabled) ...[
              ListTile(
                title: const Text('Start Time'),
                trailing: Text(_quietStart.format(context)),
                onTap: () => _pickTime(isStart: true),
              ),
              ListTile(
                title: const Text('End Time'),
                trailing: Text(_quietEnd.format(context)),
                onTap: () => _pickTime(isStart: false),
              ),
            ],
          ],
          const SizedBox(height: DesignSystem.spacingXXL),
          _SectionHeader(title: 'SECURITY'),
          if (_isDeviceSupported)
            SwitchListTile(
              title: const Text('App Lock'),
              subtitle: const Text('Require biometric or PIN to open app'),
              value: _appLockEnabled,
              onChanged: _toggleAppLock,
              activeThumbColor: AppColors.gold,
            )
          else
            const ListTile(
              title: Text('App Lock'),
              subtitle: Text('Not supported on this device'),
              enabled: false,
            ),
          const SizedBox(height: DesignSystem.spacingXXL),
          _SectionHeader(title: 'ABOUT'),
          ListTile(
            title: const Text('Version'),
            trailing: const Text('0.1.0'),
          ),
          ListTile(
            title: const Text('Open Source Licenses'),
            onTap: () => showLicensePage(context: context),
          ),
        ],
      ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;
  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingM),
      child: Text(
        title,
        style: DesignSystem.captionStyle().copyWith(
          letterSpacing: 2,
          fontWeight: FontWeight.bold,
          color: AppColors.gold,
        ),
      ),
    );
  }
}
