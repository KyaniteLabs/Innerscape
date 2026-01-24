import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/design_system.dart';
import '../core/constants.dart';
import '../data/models.dart';
import 'providers.dart';
import 'result_screen.dart';

class DecisionTreeScreen extends ConsumerStatefulWidget {
  const DecisionTreeScreen({super.key});

  @override
  ConsumerState<DecisionTreeScreen> createState() => _DecisionTreeScreenState();
}

class _DecisionTreeScreenState extends ConsumerState<DecisionTreeScreen> {
  final PageController _pageController = PageController();
  int _currentStep = 0;

  void _nextPage() {
    HapticFeedback.mediumImpact();
    if (_currentStep < DecisionTreeConstants.currentStepLimit) {
      _pageController.nextPage(
        duration: const Duration(milliseconds: DecisionTreeConstants.pageTransitionMs),
        curve: EasingCurves.easeInOut,
      );
    } else {
      Navigator.push(
        context,
        MaterialPageRoute(builder: (context) => const ResultScreen()),
      );
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
              color: isDark ? Colors.white : AppColors.foreground),
          onPressed: () {
            if (_currentStep > 0) {
              _pageController.previousPage(
                duration: AnimationDurations.standard,
                curve: EasingCurves.easeInOut,
              );
            } else {
              Navigator.pop(context);
            }
          },
        ),
        title: Text(
          'STEP ${_currentStep + 1} OF 5',
          style: DesignSystem.captionStyle().copyWith(letterSpacing: 2),
        ),
      ),
      body: PageView(
        controller: _pageController,
        onPageChanged: (index) {
          setState(() {
            _currentStep = index;
          });
        },
        physics: const NeverScrollableScrollPhysics(),
        children: [
          _buildEnergyStep(),
          _buildValenceStep(),
          _buildIntensityStep(),
          _buildSourceStep(),
          _buildContextStep(),
        ],
      ),
    );
  }

  Widget _buildStepBase({
    required String question,
    required List<Widget> options,
  }) {
    return SingleChildScrollView(
      padding: const EdgeInsets.symmetric(horizontal: DesignSystem.spacingXXL),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          const SizedBox(height: DesignSystem.spacingXXL),
          Text(
            question,
              style: DesignSystem.headingStyle().copyWith(fontSize: DesignSystem.fontSizeTitle),
          ),
          const SizedBox(height: DesignSystem.spacingXXL),
          ...options,
          const SizedBox(height: DesignSystem.spacingXXL),
        ],
      ),
    );
  }

  Widget _buildEnergyStep() {
    return _buildStepBase(
      question: 'How is your energy?',
      options: [
        _DecisionButton(
          label: 'High',
          subtitle: 'Racing, buzzing, tense, alert',
          onTap: () {
            ref.read(energyLevelProvider.notifier).set(EnergyLevel.high);
            _nextPage();
          },
        ),
        const SizedBox(height: DesignSystem.spacingL),
        _DecisionButton(
          label: 'Low',
          subtitle: 'Heavy, slow, sinking, tired',
          onTap: () {
            ref.read(energyLevelProvider.notifier).set(EnergyLevel.low);
            _nextPage();
          },
        ),
      ],
    );
  }

  Widget _buildValenceStep() {
    return _buildStepBase(
      question: 'Is it pleasant?',
      options: [
        _DecisionButton(
          label: 'Pleasant',
          subtitle: 'Warm, soft, light, glowy',
          onTap: () {
            ref.read(valenceProvider.notifier).set(Valence.pleasant);
            _nextPage();
          },
        ),
        const SizedBox(height: DesignSystem.spacingL),
        _DecisionButton(
          label: 'Unpleasant',
          subtitle: 'Sharp, cold, tight, loud',
          onTap: () {
            ref.read(valenceProvider.notifier).set(Valence.unpleasant);
            _nextPage();
          },
        ),
      ],
    );
  }

  Widget _buildIntensityStep() {
    final intensity = ref.watch(intensityProvider) ?? DecisionTreeConstants.defaultIntensity;
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return _buildStepBase(
      question: 'How intense is it?',
      options: [
        const SizedBox(height: DesignSystem.spacingXL),
        Column(
          children: [
            Text(
              intensity.toString(),
              style: DesignSystem.headingStyle().copyWith(fontSize: DesignSystem.fontSizeDisplayLarge, color: AppColors.gold),
            ),
            const SizedBox(height: DesignSystem.spacingL),
            SliderTheme(
              data: SliderTheme.of(context).copyWith(
                activeTrackColor: AppColors.gold,
                inactiveTrackColor: isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05),
                thumbColor: AppColors.gold,
                overlayColor: AppColors.gold.withValues(alpha: 0.1),
                trackHeight: 8,
                valueIndicatorTextStyle: const TextStyle(color: Colors.white),
              ),
              child: Slider(
                value: intensity.toDouble(),
                min: DecisionTreeConstants.sliderMin,
                max: DecisionTreeConstants.sliderMax,
                divisions: DecisionTreeConstants.sliderDivisions,
                label: intensity.toString(),
                onChanged: (value) {
                  HapticFeedback.selectionClick();
                  ref.read(intensityProvider.notifier).set(value.round());
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: DesignSystem.spacingL),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  Text('Subtle', style: DesignSystem.captionStyle()),
                  Text('Overwhelming', style: DesignSystem.captionStyle()),
                ],
              ),
            ),
          ],
        ),
        const SizedBox(height: DesignSystem.spacingXXL),
        SizedBox(
          width: double.infinity,
          child: ElevatedButton(
            onPressed: () {
              if (ref.read(intensityProvider) == null) {
                ref.read(intensityProvider.notifier).set(DecisionTreeConstants.defaultIntensity);
              }
              _nextPage();
            },
            style: ElevatedButton.styleFrom(
              backgroundColor: AppColors.foreground,
              foregroundColor: Colors.white,
              padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingXL),
              shape: RoundedRectangleBorder(borderRadius: DesignSystem.borderRadiusM),
            ),
            child: Text('CONFIRM', style: DesignSystem.subHeadingStyle(color: Colors.white).copyWith(letterSpacing: 2)),
          ),
        ),
      ],
    );
  }

  Widget _buildSourceStep() {
    return _buildStepBase(
      question: 'Is it coming from...',
      options: [
        _DecisionButton(
          label: 'Inside your body',
          subtitle: 'Internal sensations, thoughts, hunger',
          onTap: () {
            ref.read(sourceProvider.notifier).set('Inside');
            _nextPage();
          },
        ),
        const SizedBox(height: DesignSystem.spacingL),
        _DecisionButton(
          label: 'The world around you',
          subtitle: 'Sounds, lights, people, events',
          onTap: () {
            ref.read(sourceProvider.notifier).set('Outside');
            _nextPage();
          },
        ),
      ],
    );
  }

  Widget _buildContextStep() {
    return _buildStepBase(
      question: 'Any specific context?',
      options: [
        _DecisionButton(
          label: 'Social',
          subtitle: 'Interacting with others',
          onTap: () {
            ref.read(contextCategoryProvider.notifier).set(ContextCategory.social);
            _nextPage();
          },
        ),
        const SizedBox(height: DesignSystem.spacingL),
        _DecisionButton(
          label: 'Sensory',
          subtitle: 'Environment (noise, light, etc)',
          onTap: () {
            ref.read(contextCategoryProvider.notifier).set(ContextCategory.sensory);
            _nextPage();
          },
        ),
        const SizedBox(height: DesignSystem.spacingL),
        _DecisionButton(
          label: 'Task',
          subtitle: 'Work, demands, pressure',
          onTap: () {
            ref.read(contextCategoryProvider.notifier).set(ContextCategory.task);
            _nextPage();
          },
        ),
        const SizedBox(height: DesignSystem.spacingXL),
        Center(
          child: TextButton(
            onPressed: () {
              ref.read(contextCategoryProvider.notifier).set(ContextCategory.unknown);
              _nextPage();
            },
            child: Text(
              'SKIP',
              style: DesignSystem.captionStyle().copyWith(letterSpacing: 2),
            ),
          ),
        ),
      ],
    );
  }
}

class _DecisionButton extends StatefulWidget {
  final String label;
  final String subtitle;
  final VoidCallback onTap;

  const _DecisionButton({
    required this.label,
    required this.subtitle,
    required this.onTap,
  });

  @override
  State<_DecisionButton> createState() => _DecisionButtonState();
}

class _DecisionButtonState extends State<_DecisionButton> {
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
          padding: const EdgeInsets.all(DesignSystem.spacingXL),
          decoration: BoxDecoration(
            color: isDark ? AppColors.surfaceDark : AppColors.surface,
            borderRadius: DesignSystem.borderRadiusM,
            border: Border.all(
              color: _isHovered 
                  ? AppColors.gold 
                  : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05)),
              width: _isHovered ? 1.5 : 1.0,
            ),
            boxShadow: _isHovered ? DesignSystem.softShadow : [],
          ),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text(
                widget.label,
                style: DesignSystem.subHeadingStyle(
                  color: isDark ? Colors.white : AppColors.foreground,
                ).copyWith(
                  color: _isHovered ? AppColors.gold : null,
                ),
              ),
              const SizedBox(height: DesignSystem.spacingXS),
              Text(
                widget.subtitle,
                style: DesignSystem.captionStyle(),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
