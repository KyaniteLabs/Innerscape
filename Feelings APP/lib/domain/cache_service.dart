/// A simple in-memory caching service with TTL support.
///
/// Provides thread-safe caching with automatic expiration of entries.
/// Useful for caching frequently accessed data like check-in history,
/// sensation vocabulary, or inference results.
class CacheService {
  static final Map<String, _CacheEntry> _cache = {};

  /// Retrieves a cached value by key.
  ///
  /// Returns null if the key doesn't exist or if the entry has expired.
  /// Expired entries are automatically removed from the cache.
  ///
  /// Example:
  /// ```dart
  /// final history = CacheService.get<List<CheckIn>>('checkin_history');
  /// ```
  static T? get<T>(String key) {
    final entry = _cache[key];
    if (entry == null) return null;

    if (DateTime.now().isAfter(entry.expiry)) {
      _cache.remove(key);
      return null;
    }

    return entry.value as T;
  }

  /// Stores a value in the cache with an optional TTL.
  ///
  /// Default TTL is 5 minutes. Use [ttl] to customize the expiration time.
  ///
  /// Example:
  /// ```dart
  /// CacheService.set('user_preferences', prefs, ttl: Duration(hours: 1));
  /// ```
  static void set<T>(String key, T value, {Duration ttl = const Duration(minutes: 5)}) {
    _cache[key] = _CacheEntry(
      value: value,
      expiry: DateTime.now().add(ttl),
    );
  }

  /// Clears all cached entries.
  ///
  /// Useful for logging out or resetting application state.
  static void clear() {
    _cache.clear();
  }

  /// Removes a specific entry from the cache.
  ///
  /// Example:
  /// ```dart
  /// CacheService.remove('stale_data');
  /// ```
  static void remove(String key) {
    _cache.remove(key);
  }

  /// Checks if a key exists in the cache and hasn't expired.
  ///
  /// Returns true if the key exists and is still valid.
  static bool has(String key) {
    return get(key) != null;
  }

  /// Returns the number of entries in the cache.
  static int get size => _cache.length;
}

class _CacheEntry {
  final dynamic value;
  final DateTime expiry;

  _CacheEntry({required this.value, required this.expiry});
}
