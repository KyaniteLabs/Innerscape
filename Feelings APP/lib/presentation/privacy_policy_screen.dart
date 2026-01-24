import 'package:flutter/material.dart';
import '../core/design_system.dart';

class PrivacyPolicyScreen extends StatelessWidget {
  const PrivacyPolicyScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.foreground : Colors.white,
      appBar: AppBar(
        title: const Text('PRIVACY POLICY'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(DesignSystem.spacingXXL),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Your Data is Yours.',
              style: DesignSystem.headingStyle(color: AppColors.gold),
            ),
            const SizedBox(height: DesignSystem.spacingXL),
            _buildSection(
              title: '1. Local Storage',
              content: 'All somatic and emotional data you enter into SOMA is stored exclusively on your device. We do not use cloud storage or external databases.',
              isDark: isDark,
            ),
            _buildSection(
              title: '2. Encryption',
              content: 'Your data is protected by AES-256 encryption using keys managed by the OS secure enclave (iOS Keychain / Android Keystore).',
              isDark: isDark,
            ),
            _buildSection(
              title: '3. No Tracking',
              content: 'We do not use analytics, tracking pixels, or third-party cookies. Your journey is private.',
              isDark: isDark,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSection({required String title, required String content, required bool isDark}) {
    return Padding(
      padding: const EdgeInsets.only(bottom: DesignSystem.spacingXL),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: DesignSystem.subHeadingStyle(color: isDark ? Colors.white : AppColors.foreground),
          ),
          const SizedBox(height: DesignSystem.spacingS),
          Text(
            content,
            style: DesignSystem.bodyStyle(color: isDark ? Colors.white70 : Colors.black54),
          ),
        ],
      ),
    );
  }
}
