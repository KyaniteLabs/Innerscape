import 'package:flutter/material.dart';
import '../core/design_system.dart';

class TermsOfServiceScreen extends StatelessWidget {
  const TermsOfServiceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.foreground : Colors.white,
      appBar: AppBar(
        title: const Text('TERMS OF SERVICE'),
        backgroundColor: Colors.transparent,
        elevation: 0,
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(DesignSystem.spacingXXL),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Usage Agreement',
              style: DesignSystem.headingStyle(color: AppColors.gold),
            ),
            const SizedBox(height: DesignSystem.spacingXL),
            _buildSection(
              title: '1. Not Medical Advice',
              content: 'SOMA is a tool for interoception support and awareness. It is not a diagnostic tool or a substitute for professional medical or mental health advice.',
              isDark: isDark,
            ),
            _buildSection(
              title: '2. Data Responsibility',
              content: 'Because your data is stored only on this device, if you delete the app or lose your device, your data cannot be recovered by us.',
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
