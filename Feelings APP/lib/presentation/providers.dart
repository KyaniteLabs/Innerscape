import 'dart:convert';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../data/models.dart';
import '../domain/export_service.dart';
import '../domain/migration_service.dart';
import '../domain/pattern_service.dart';
import '../domain/learning_service.dart';
import '../domain/notification_service.dart';
import '../domain/app_lock_service.dart';
import '../data/log_service.dart';
import '../data/encrypted_database_helper.dart';

// APEX: New Services
import '../domain/services/sync_service.dart';
import '../domain/services/ai_pattern_service.dart';
import '../domain/services/voice_checkin_service.dart';
import '../domain/services/auth_service.dart';

final exportServiceProvider = Provider((ref) => ExportService(ref.watch(logServiceProvider)));
final migrationServiceProvider = Provider((ref) => DataMigrationService(ref.watch(encryptedDatabaseHelperProvider)));
final patternServiceProvider = Provider((ref) => PatternService(ref.watch(logServiceProvider)));
final patternSummaryProvider = FutureProvider((ref) => ref.watch(patternServiceProvider).analyzePatterns());
final learningServiceProvider = Provider((ref) => LearningService(ref.watch(encryptedDatabaseHelperProvider)));
final notificationServiceProvider = Provider((ref) => NotificationService());
final appLockServiceProvider = Provider((ref) => AppLockService());

// APEX: Cloud & Core Services
final syncServiceProvider = Provider<SyncService>((ref) => SyncService());
final authServiceProvider = Provider<AuthService>((ref) => AuthService());
final aiPatternServiceProvider = Provider<AIPatternService>((ref) => AIPatternService());
final voiceCheckinServiceProvider = Provider<VoiceCheckInService>((ref) => VoiceCheckInService());

final syncInitializedProvider = FutureProvider<void>((ref) async {
  final authService = ref.watch(authServiceProvider);
  if (!authService.isAuthenticated) return;
  
  final userId = authService.userId;
  if (userId == null) return;
  
  final syncService = ref.watch(syncServiceProvider);
  await syncService.initialize(userId);
  print('[APEX] Sync initialized for user $userId');
});

final isAuthenticatedProvider = FutureProvider<bool>((ref) async {
  final authService = ref.watch(authServiceProvider);
  return authService.isAuthenticated;
});

final patternsProvider = FutureProvider<List<dynamic>>((ref) async {
  final authService = ref.watch(authServiceProvider);
  final token = await authService.getToken();
  if (token == null) {
    print('[APEX] No auth token, skipping pattern fetch');
    return [];
  }
  
  final aiService = ref.watch(aiPatternServiceProvider);
  return aiService.fetchPatterns(token);
});

final sensationVocabularyProvider = FutureProvider<List<Map<String, dynamic>>>((ref) async {
  final String response = await rootBundle.loadString('assets/data/sensation_vocabulary.json');
  final data = await json.decode(response) as Map<String, dynamic>;
  return List<Map<String, dynamic>>.from(data['categories'] as List<dynamic>);
});

class SelectedSensations extends Notifier<Set<SensationToken>> {
  @override
  Set<SensationToken> build() => {};
  
  void toggle(SensationToken token) {
    final current = Set<SensationToken>.from(state);
    if (current.contains(token)) {
      current.remove(token);
    } else {
      current.add(token);
    }
    state = current;
  }
}
final selectedSensationsProvider = NotifierProvider<SelectedSensations, Set<SensationToken>>(SelectedSensations.new);

class SelectedRegions extends Notifier<Set<BodyRegion>> {
  @override
  Set<BodyRegion> build() => {};
  
  void toggle(BodyRegion region) {
    final current = Set<BodyRegion>.from(state);
    if (current.contains(region)) {
      current.remove(region);
    } else {
      current.add(region);
    }
    state = current;
  }
}
final selectedRegionsProvider = NotifierProvider<SelectedRegions, Set<BodyRegion>>(SelectedRegions.new);

class SimpleState<T> extends Notifier<T?> {
  @override
  T? build() => null;
  void set(T? value) => state = value;
}

final energyLevelProvider = NotifierProvider<SimpleState<EnergyLevel>, EnergyLevel?>(SimpleState.new);
final valenceProvider = NotifierProvider<SimpleState<Valence>, Valence?>(SimpleState.new);
final contextCategoryProvider = NotifierProvider<SimpleState<ContextCategory>, ContextCategory?>(SimpleState.new);
final sourceProvider = NotifierProvider<SimpleState<String>, String?>(SimpleState.new);
final intensityProvider = NotifierProvider<SimpleState<int>, int?>(SimpleState.new);
final notesProvider = NotifierProvider<SimpleState<String>, String?>(SimpleState.new);
final lastCheckInIdProvider = NotifierProvider<SimpleState<String>, String?>(SimpleState.new);

// Added providers for research gaps
final selectedHypothesisProvider = NotifierProvider<SimpleState<String>, String?>(SimpleState.new);
final hypothesisRejectedProvider = NotifierProvider<SimpleState<bool>, bool?>(SimpleState.new);
final customHypothesisProvider = NotifierProvider<SimpleState<String>, String?>(SimpleState.new);
final selectedActionProvider = NotifierProvider<SimpleState<String>, String?>(SimpleState.new);

void resetSession(WidgetRef ref) {
  ref.invalidate(selectedRegionsProvider);
  ref.invalidate(selectedSensationsProvider);
  ref.invalidate(energyLevelProvider);
  ref.invalidate(valenceProvider);
  ref.invalidate(sourceProvider);
  ref.invalidate(contextCategoryProvider);
  ref.invalidate(intensityProvider);
  ref.invalidate(notesProvider);
  ref.invalidate(selectedHypothesisProvider);
  ref.invalidate(hypothesisRejectedProvider);
  ref.invalidate(customHypothesisProvider);
  ref.invalidate(selectedActionProvider);
}
