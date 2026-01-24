/// APEX Database Interface
/// Abstract interface for database operations.
/// Allows platform-specific implementations (SQLCipher for mobile/macOS, in-memory for web).
abstract class DatabaseInterface {
  Future<void> initialize();
  Future<int> insert(String table, Map<String, dynamic> values);
  Future<List<Map<String, dynamic>>> query(
    String table, {
    String? where,
    List<dynamic>? whereArgs,
    String? orderBy,
    int? limit,
  });
  Future<int> update(
    String table,
    Map<String, dynamic> values, {
    String? where,
    List<dynamic>? whereArgs,
  });
  Future<int> delete(
    String table, {
    String? where,
    List<dynamic>? whereArgs,
  });
  Future<void> close();
  Future<void> backup();
  Future<void> restore();
}
