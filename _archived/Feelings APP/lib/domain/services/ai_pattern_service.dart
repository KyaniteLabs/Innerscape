// lib/domain/services/ai_pattern_service.dart
import 'package:dio/dio.dart';

/**
 * APEX Contract: Soma AI Pattern Detection
 * Purpose: Fetch cross-app insights from backend
 */

class AIPatternService {
  final Dio _dio = Dio(BaseOptions(baseUrl: 'https://api.innerscape.app/api'));

  Future<List<Map<String, dynamic>>> fetchPatterns(String token) async {
    print('[APEX] Fetching cross-app insights');
    
    try {
      final response = await _dio.get(
        '/insights',
        options: Options(headers: {'Authorization': 'Bearer $token'}),
      );
      
      if (response.data['success'] == true) {
        return List<Map<String, dynamic>>.from(response.data['data']);
      }
      return [];
    } catch (e) {
      print('[APEX] Insight Fetch Error: $e');
      return [];
    }
  }
}
