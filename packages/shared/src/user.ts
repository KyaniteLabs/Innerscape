export interface User {
  id: string;
  email: string;
  createdAt: Date;
  updatedAt: Date;
  preferences: UserPreferences;
  onboardingCompleted: boolean;
}

export interface UserPreferences {
  timezone: string;
  shutdownRitualTime: string;
  weeklyReviewDay: number;
  accessibilitySettings: AccessibilitySettings;
  notificationSettings: NotificationSettings;
}

export interface AccessibilitySettings {
  fontSize: 'small' | 'medium' | 'large';
  highContrast: boolean;
  reducedMotion: boolean;
  dyslexiaFont: boolean;
}

export interface NotificationSettings {
  checkInReminders: boolean;
  shutdownRitual: boolean;
  weeklyReview: boolean;
  insightAlerts: boolean;
}
