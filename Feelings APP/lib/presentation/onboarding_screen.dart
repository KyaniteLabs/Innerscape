import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:shared_preferences/shared_preferences.dart';

import '../core/design_system.dart';

class OnboardingScreen extends StatefulWidget {
  const OnboardingScreen({super.key});

  @override
  State<OnboardingScreen> createState() => _OnboardingScreenState();
}

class _OnboardingScreenState extends State<OnboardingScreen> {
  final PageController _pageController = PageController();
  int _currentPage = 0;

  final List<_OnboardingData> _pages = [
    _OnboardingData(
      title: 'LISTEN TO\nYOUR BODY',
      description: 'Traditional apps ask how you feel. We ask where you notice something. Start with physical sensations to unlock emotional understanding.',
      icon: Icons.accessibility_new_rounded,
    ),
    _OnboardingData(
      title: 'NO WRONG\nANSWERS',
      description: 'Whether it is "static in the chest" or "bees in the head," your vocabulary is valid. SOMA translates your unique signals into hypotheses.',
      icon: Icons.auto_awesome,
    ),
    _OnboardingData(
      title: 'TOTAL\nPRIVACY',
      description: 'Your data is AES-256 encrypted and stored locally. It never leaves this device. No cloud, no tracking, just you and your somatic truth.',
      icon: Icons.lock_outline_rounded,
    ),
  ];

  Future<void> _completeOnboarding() async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setBool('onboarding_completed', true);
    if (mounted) {
      // Intentionally unawaited: navigation operation doesn't need to be awaited
      unawaited(Navigator.of(context).pushReplacementNamed('/'));
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      backgroundColor: isDark ? AppColors.foreground : Colors.white,
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: DesignSystem.spacingXXL),
          child: Column(
            children: [
              const SizedBox(height: DesignSystem.spacingXXL),
              Expanded(
                child: PageView.builder(
                  controller: _pageController,
                  itemCount: _pages.length,
                  onPageChanged: (index) {
                    setState(() => _currentPage = index);
                    HapticFeedback.selectionClick();
                  },
                  itemBuilder: (context, index) {
                    return _OnboardingPage(data: _pages[index], isDark: isDark);
                  },
                ),
              ),
              Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: List.generate(
                  _pages.length,
                  (index) => Container(
                    margin: const EdgeInsets.symmetric(horizontal: 4),
                    width: _currentPage == index ? 24 : 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _currentPage == index 
                          ? AppColors.gold 
                          : (isDark ? Colors.white24 : Colors.black12),
                      borderRadius: BorderRadius.circular(4),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: DesignSystem.spacingXXL),
              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: () {
                    HapticFeedback.mediumImpact();
                    if (_currentPage < _pages.length - 1) {
                      _pageController.nextPage(
                        duration: AnimationDurations.standard,
                        curve: EasingCurves.easeInOut,
                      );
                    } else {
                      _completeOnboarding();
                    }
                  },
                  style: ElevatedButton.styleFrom(
                    backgroundColor: AppColors.foreground,
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingXL),
                    shape: RoundedRectangleBorder(borderRadius: DesignSystem.borderRadiusM),
                  ),
                  child: Text(
                    _currentPage == _pages.length - 1 ? 'GET STARTED' : 'CONTINUE',
                    style: DesignSystem.subHeadingStyle(color: Colors.white).copyWith(letterSpacing: 2),
                  ),
                ),
              ),
              const SizedBox(height: DesignSystem.spacingXXL),
            ],
          ),
        ),
      ),
    );
  }
}

class _OnboardingPage extends StatelessWidget {
  final _OnboardingData data;
  final bool isDark;

  const _OnboardingPage({required this.data, required this.isDark});

  @override
  Widget build(BuildContext context) {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          data.icon,
          size: 100,
          color: AppColors.gold,
        ),
        const SizedBox(height: DesignSystem.spacingXXL),
        Text(
          data.title,
          textAlign: TextAlign.center,
          style: DesignSystem.headingStyle(color: isDark ? Colors.white : AppColors.foreground),
        ),
        const SizedBox(height: DesignSystem.spacingXL),
        Text(
          data.description,
          textAlign: TextAlign.center,
          style: DesignSystem.bodyStyle(color: isDark ? Colors.white70 : Colors.black54),
        ),
      ],
    );
  }
}

class _OnboardingData {
  final String title;
  final String description;
  final IconData icon;

  _OnboardingData({required this.title, required this.description, required this.icon});
}
