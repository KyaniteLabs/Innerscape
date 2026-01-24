import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'core/design_system.dart';
import 'core/constants.dart';
import 'presentation/body_scan_screen.dart';
import 'presentation/wheel_3d_screen.dart';
import 'presentation/history_screen.dart';
import 'presentation/onboarding_screen.dart';
import 'presentation/privacy_policy_screen.dart';
import 'presentation/terms_screen.dart';
import 'presentation/settings_screen.dart';
import 'package:shared_preferences/shared_preferences.dart';
import 'presentation/providers.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final container = ProviderContainer();
  await container.read(migrationServiceProvider).migrateFromSharedPreferences();
  await container.read(notificationServiceProvider).initialize();
  
  // Handle notification taps
  final notificationService = container.read(notificationServiceProvider);
  notificationService.onNotificationTapped = (payload) {
    // Navigate to body scan using navigator key
    navigatorKey.currentState?.pushNamed('/body-scan');
  };
  
  final prefs = await SharedPreferences.getInstance();
  final showOnboarding = prefs.getBool('onboarding_completed') != true;

  runApp(
    UncontrolledProviderScope(
      container: container,
      child: SomaApp(showOnboarding: showOnboarding),
    ),
  );
}

final GlobalKey<NavigatorState> navigatorKey = GlobalKey<NavigatorState>();

class SomaApp extends StatelessWidget {
  final bool showOnboarding;
  const SomaApp({super.key, required this.showOnboarding});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Soma',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.light,
        scaffoldBackgroundColor: AppColors.background,
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      darkTheme: ThemeData(
        brightness: Brightness.dark,
        scaffoldBackgroundColor: AppColors.backgroundDark,
        useMaterial3: true,
        fontFamily: 'Inter',
      ),
      navigatorKey: navigatorKey,
      routes: {
        '/': (context) => const HomeScreen(),
        '/body-scan': (context) => const BodyScanScreen(),
        '/onboarding': (context) => const OnboardingScreen(),
        '/privacy': (context) => const PrivacyPolicyScreen(),
        '/terms': (context) => const TermsOfServiceScreen(),
        '/settings': (context) => const SettingsScreen(),
      },
      initialRoute: showOnboarding ? '/onboarding' : '/',
      builder: (context, child) => AuthGate(child: child ?? const SizedBox.shrink()),
    );
  }
}

class AuthGate extends ConsumerStatefulWidget {
  final Widget child;
  const AuthGate({required this.child, super.key});

  @override
  ConsumerState<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends ConsumerState<AuthGate> {
  bool _authenticated = false;
  bool _isLockEnabled = false;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _checkLock();
  }

  Future<void> _checkLock() async {
    final appLockService = ref.read(appLockServiceProvider);
    final isEnabled = await appLockService.isAppLockEnabled();
    
    if (!isEnabled) {
      if (mounted) {
        setState(() {
          _authenticated = true;
          _isLockEnabled = false;
          _isLoading = false;
        });
      }
      return;
    }

    if (mounted) {
      setState(() {
        _isLockEnabled = true;
        _isLoading = false;
      });
    }
    
    await _authenticate();
  }

  Future<void> _authenticate() async {
    final appLockService = ref.read(appLockServiceProvider);
    final success = await appLockService.authenticate();
    if (success && mounted) {
      setState(() => _authenticated = true);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }

    if (!_authenticated && _isLockEnabled) {
      return Scaffold(
        backgroundColor: AppColors.backgroundDark,
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.lock_outline_rounded, size: 64, color: AppColors.gold),
              const SizedBox(height: DesignSystem.spacingXXL),
              Text(
                'SOMA IS LOCKED',
                style: DesignSystem.headingStyle(color: Colors.white).copyWith(letterSpacing: 4),
              ),
              const SizedBox(height: DesignSystem.spacingXL),
              ElevatedButton(
                onPressed: _authenticate,
                style: ElevatedButton.styleFrom(
                  backgroundColor: AppColors.gold,
                  foregroundColor: Colors.white,
                ),
                child: const Text('UNLOCK'),
              ),
            ],
          ),
        ),
      );
    }

    return widget.child;
  }
}

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    
    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        actions: [
          IconButton(
            icon: const Icon(Icons.settings_outlined),
            onPressed: () {
              showModalBottomSheet(
                context: context,
                backgroundColor: isDark ? AppColors.surfaceDark : Colors.white,
                shape: const RoundedRectangleBorder(
                  borderRadius: BorderRadius.vertical(top: Radius.circular(DesignSystem.radiusXL)),
                ),
                builder: (context) => Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    ListTile(
                      leading: const Icon(Icons.settings_outlined),
                      title: const Text('App Settings'),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, '/settings');
                      },
                    ),
                    ListTile(
                      leading: const Icon(Icons.lock_outline),
                      title: const Text('Privacy Policy'),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, '/privacy');
                      },
                    ),
                    ListTile(
                      leading: const Icon(Icons.description_outlined),
                      title: const Text('Terms of Service'),
                      onTap: () {
                        Navigator.pop(context);
                        Navigator.pushNamed(context, '/terms');
                      },
                    ),
                    const SizedBox(height: 20),
                  ],
                ),
              );
            },
          ),
        ],
      ),
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: DesignSystem.spacingXXL),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              const SizedBox(height: DesignSystem.spacingXXL * 2),
              Hero(
                tag: 'app_logo',
                child: Material(
                  color: Colors.transparent,
                  child: Text(
                    'SOMA',
                    style: DesignSystem.headingStyle().copyWith(
                      letterSpacing: 12,
                          fontSize: DesignSystem.fontSizeDisplay,
                      fontWeight: FontWeight.w200,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: DesignSystem.spacingM),
              Text(
                'A somatic translator for interoception.',
                style: DesignSystem.bodyStyle(
                  color: isDark ? Colors.white38 : Colors.black38,
                ).copyWith(letterSpacing: 0.5),
              ),
              const Spacer(),
              _ModeCard(
                title: 'Body Scan',
                subtitle: 'Translate physical sensations',
                icon: Icons.accessibility_new_rounded,
                color: AppColors.gold,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const BodyScanScreen()),
                  );
                },
              ),
              const SizedBox(height: DesignSystem.spacingL),
              _ModeCard(
                title: 'Feelings Wheel',
                subtitle: 'Explore emotional 3D landscape',
                icon: Icons.blur_on_rounded,
                color: Colors.blueAccent,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const Wheel3DScreen()),
                  );
                },
              ),
              const SizedBox(height: DesignSystem.spacingL),
              _ModeCard(
                title: 'History',
                subtitle: 'Review your somatic journey',
                icon: Icons.history_rounded,
                color: Colors.teal,
                onTap: () {
                  Navigator.push(
                    context,
                    MaterialPageRoute(builder: (context) => const HistoryScreen()),
                  );
                },
              ),
              const SizedBox(height: DesignSystem.spacingXXL * 2),
            ],
          ),
        ),
      ),
    );
  }
}

class _ModeCard extends StatefulWidget {
  final String title;
  final String subtitle;
  final IconData icon;
  final Color color;
  final VoidCallback onTap;

  const _ModeCard({
    required this.title,
    required this.subtitle,
    required this.icon,
    required this.color,
    required this.onTap,
  });

  @override
  State<_ModeCard> createState() => _ModeCardState();
}

class _ModeCardState extends State<_ModeCard> {
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
            borderRadius: DesignSystem.borderRadiusL,
            border: Border.all(
              color: _isHovered 
                  ? widget.color.withValues(alpha: 0.5) 
                  : (isDark ? Colors.white10 : Colors.black.withValues(alpha: 0.05)),
              width: _isHovered ? 2.0 : 1.0,
            ),
            boxShadow: _isHovered ? [
              BoxShadow(
                color: widget.color.withValues(alpha: 0.2),
                blurRadius: 20,
                offset: const Offset(0, 10),
              )
            ] : DesignSystem.softShadow,
          ),
          child: Row(
            children: [
              AnimatedContainer(
                duration: AnimationConstants.standard,
                padding: const EdgeInsets.all(DesignSystem.spacingM),
                decoration: BoxDecoration(
                  color: widget.color.withValues(alpha: 0.1),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: _isHovered ? widget.color.withValues(alpha: 0.3) : Colors.transparent,
                  ),
                ),
                child: Icon(
                  widget.icon,
                  color: widget.color,
                  size: 32,
                ),
              ),
              const SizedBox(width: DesignSystem.spacingL),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      widget.title,
                      style: DesignSystem.subHeadingStyle(
                        color: isDark ? Colors.white : AppColors.foreground,
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
              Icon(
                Icons.arrow_forward_ios_rounded,
                size: 16,
                color: _isHovered ? widget.color : Colors.grey.withValues(alpha: 0.5),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
