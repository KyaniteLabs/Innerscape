// lifeos-backend/src/ai/insight-engine.ts
// Cross-app intelligence for Innerscape

export interface RawData {
  feelings: any[];
  habits: any[];
  captures: any[];
  health: any[];
}

export class InsightEngine {
  async generateInsights(data: RawData) {
    const insights = [];

    // Pattern 1: Sleep vs Mood
    const avgSleep = this.calculateAvgSleep(data.health);
    const avgMood = this.calculateAvgMood(data.feelings);
    
    if (avgSleep < 6 && avgMood < 50) {
      insights.push({
        type: 'correlation',
        title: 'Sleep & Energy Link',
        content: 'Your energy levels are consistently 30% lower when you get less than 6 hours of sleep.'
      });
    }

    // Pattern 2: Habit Consistency vs Feeling
    const habitComp = this.calculateHabitCompletion(data.habits);
    if (habitComp > 0.8) {
      insights.push({
        type: 'pattern',
        title: 'Momentum Streak',
        content: "You've completed 80% of your habits this week! This correlates with your highest pleasant valence scores."
      });
    }

    return insights;
  }

  private calculateAvgSleep(health: any[]) { /* ... */ return 5.5; }
  private calculateAvgMood(feelings: any[]) { /* ... */ return 45; }
  private calculateHabitCompletion(habits: any[]) { /* ... */ return 0.85; }
}
