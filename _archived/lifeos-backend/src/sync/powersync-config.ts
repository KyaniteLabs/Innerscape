/**
 * Innerscape PowerSync Configuration
 * This defines the synchronization rules for the edge-to-client sync engine.
 */

export const syncRules = {
  emotional_context: {
    // Sync all user's emotional context records
    query: 'SELECT * FROM emotional_context WHERE user_id = ?',
    parameters: ['user_id'],
  },
  captures: {
    // Sync all active captures for the user
    query: 'SELECT * FROM captures WHERE user_id = ?',
    parameters: ['user_id'],
  },
  habits: {
    // Sync habits and their completions
    query: 'SELECT * FROM habits WHERE user_id = ?',
    parameters: ['user_id'],
  },
  habit_completions: {
    query: `SELECT hc.* FROM habit_completions hc 
            JOIN habits h ON hc.habit_id = h.id 
            WHERE h.user_id = ?`,
    parameters: ['user_id'],
  },
  journal_entries: {
    query: 'SELECT * FROM journal_entries WHERE user_id = ?',
    parameters: ['user_id'],
  },
  goals: {
    query: 'SELECT * FROM goals WHERE user_id = ?',
    parameters: ['user_id'],
  }
};
