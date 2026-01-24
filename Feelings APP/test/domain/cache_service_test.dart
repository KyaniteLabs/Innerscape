import 'package:flutter_test/flutter_test.dart';
import 'package:soma/domain/cache_service.dart';

void main() {
  setUp(() {
    CacheService.clear();
  });

  group('CacheService', () {
    test('set and get work correctly', () {
      CacheService.set('key1', 'value1');
      expect(CacheService.get<String>('key1'), 'value1');
    });

    test('get returns null for non-existent key', () {
      expect(CacheService.get('non_existent'), null);
    });

    test('get returns null after TTL expires', () async {
      CacheService.set('key1', 'value1', ttl: const Duration(milliseconds: 10));
      
      expect(CacheService.get('key1'), 'value1');
      
      await Future.delayed(const Duration(milliseconds: 15));
      
      expect(CacheService.get('key1'), null);
    });

    test('remove deletes specific key', () {
      CacheService.set('key1', 'value1');
      CacheService.set('key2', 'value2');
      
      CacheService.remove('key1');
      
      expect(CacheService.get('key1'), null);
      expect(CacheService.get('key2'), 'value2');
    });

    test('clear deletes all keys', () {
      CacheService.set('key1', 'value1');
      CacheService.set('key2', 'value2');
      
      CacheService.clear();
      
      expect(CacheService.get('key1'), null);
      expect(CacheService.get('key2'), null);
      expect(CacheService.size, 0);
    });

    test('has returns correct status', () {
      CacheService.set('key1', 'value1');
      expect(CacheService.has('key1'), true);
      expect(CacheService.has('key2'), false);
    });
  });
}
