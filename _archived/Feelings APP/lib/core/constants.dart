import 'dart:math' as math;

/// APEX Core Constants
/// Centralized magic numbers extracted from codebase per APEX_CORE.md No Magic Law

class WheelConstants {
  // Wheel dimensions
  static const double outerRadius = 2.5;
  static const double holeRadius = 0.3;
  
  // Wheel interaction thresholds
  static const double distanceThresholdInner = 0.1;
  static const double distanceThresholdOuter = 0.45;
  
  // Wheel angle calculations
  static const double angleOffset = math.pi / 2;
  static const double angleAdjustment = math.pi / 8;
  
  // Wheel emotion configuration
  static const int emotionCount = 8;
  static const double fullCircle = 2 * math.pi;
  
  // Petal dimensions
  static const double innerPetalRadius = 0.3;
  static const double outerPetalRadius = 1.0;
  static const double midPetalRadius = 0.6;
  static const double midPetalRadiusMultiplier = 1.2;
  
  // Petal curve multipliers
  static const double petalOuterMultiplier = 1.5;
  static const double petalMidMultiplier = 1.2;
  
  // Wheel size
  static const double wheelSize = 400.0;
}

class Wheel3DConstants {
  static const double rotationMultiplier = 0.01;
  static const double minZoom = 0.5;
  static const double maxZoom = 2.0;
}

class BodyScanConstants {
  // Touch target positions (multipliers of width/height)
  static const double headLeft = 0.35;
  static const double headTop = 0.05;
  static const double headWidth = 0.3;
  static const double headHeight = 0.15;
  
  static const double neckLeft = 0.43;
  static const double neckTop = 0.18;
  static const double neckWidth = 0.14;
  static const double neckHeight = 0.05;
  
  static const double shouldersLeft = 0.15;
  static const double shouldersTop = 0.2;
  static const double shouldersWidth = 0.7;
  static const double shouldersHeight = 0.3;
  
  static const double chestLeft = 0.3;
  static const double chestTop = 0.23;
  static const double chestWidth = 0.4;
  static const double chestHeight = 0.15;
  
  static const double bellyLeft = 0.3;
  static const double bellyTop = 0.38;
  static const double bellyWidth = 0.4;
  static const double bellyHeight = 0.15;
  
  static const double backLeft = 0.3;
  static const double backTop = 0.25;
  static const double backWidth = 0.4;
  static const double backHeight = 0.3;
  
  static const double hipsLeft = 0.3;
  static const double hipsTop = 0.53;
  static const double hipsWidth = 0.4;
  static const double hipsHeight = 0.1;
  
  static const double legsLeft = 0.25;
  static const double legsTop = 0.63;
  static const double legsWidth = 0.5;
  static const double legsHeight = 0.35;
  
  // Body region path coordinates
  static const double headPathLeft = 0.35;
  static const double headPathTop = 0.05;
  static const double headPathWidth = 0.3;
  static const double headPathHeight = 0.12;
  
  static const double neckPathLeft = 0.45;
  static const double neckPathTop = 0.17;
  static const double neckPathWidth = 0.1;
  static const double neckPathHeight = 0.04;
  
  static const double chestPathLeft1 = 0.3;
  static const double chestPathTop1 = 0.22;
  static const double chestPathLeft2 = 0.7;
  static const double chestPathTop2 = 0.22;
  static const double chestPathLeft3 = 0.65;
  static const double chestPathTop3 = 0.38;
  static const double chestPathLeft4 = 0.35;
  static const double chestPathTop4 = 0.38;
  
  static const double armsLeft1 = 0.15;
  static const double armsTop1 = 0.22;
  static const double armsWidth1 = 0.15;
  static const double armsHeight1 = 0.3;
  static const double armsLeft2 = 0.7;
  static const double armsTop2 = 0.22;
  static const double armsWidth2 = 0.15;
  static const double armsHeight2 = 0.3;
  
  static const double bellyPathLeft1 = 0.35;
  static const double bellyPathTop1 = 0.38;
  static const double bellyPathLeft2 = 0.65;
  static const double bellyPathTop2 = 0.38;
  static const double bellyPathLeft3 = 0.6;
  static const double bellyPathTop3 = 0.52;
  static const double bellyPathLeft4 = 0.4;
  static const double bellyPathTop4 = 0.52;
  
  static const double hipsPathLeft = 0.35;
  static const double hipsPathTop = 0.52;
  static const double hipsPathWidth = 0.3;
  static const double hipsPathHeight = 0.08;
  
  static const double legsLeft1 = 0.35;
  static const double legsTop1 = 0.6;
  static const double legsWidth1 = 0.12;
  static const double legsHeight1 = 0.35;
  static const double legsLeft2 = 0.53;
  static const double legsTop2 = 0.6;
  static const double legsWidth2 = 0.12;
  static const double legsHeight2 = 0.35;
  
  // Aspect ratio
  static const double aspectRatio = 0.6;
}

class DecisionTreeConstants {
  // Step configuration
  static const int totalSteps = 5;
  static const int currentStepLimit = 4;
  
  // Slider configuration
  static const double sliderMin = 1;
  static const double sliderMax = 5;
  static const int sliderDivisions = 4;
  
  // Default values
  static const int defaultIntensity = 3;
  
  // Animation duration
  static const int pageTransitionMs = 300;
}

class LogServiceConstants {
  // Default values
  static const int defaultIntensity = 3;
}

class TimeoutConstants {
  // Timeout durations
  static const int defaultTimeoutSeconds = 30;
}

class LearningConstants {
  // Confidence score thresholds (APEX issue HIGH-001)
  static const double maxConfidenceScore = 0.95;
  static const double confirmationIncrement = 0.1;
  static const double initialConfidenceScore = 0.5;
}

class NotificationConstants {
  // Quiet hours default times (in minutes since midnight) (APEX issue HIGH-001)
  static const int defaultQuietHourStart = 22 * 60; // 22:00 (10 PM)
  static const int defaultQuietHourEnd = 8 * 60;   // 08:00 (8 AM)
}

class SettingsConstants {
  // Default reminder time (in minutes) (APEX issue HIGH-001)
  static const int defaultReminderMinutes = 60;
  static const int quietHourStartHour = 22;
  static const int quietHourEndHour = 8;
}

class ReminderConstants {
  static const int reminderShortMinutes = 30;
  static const int reminderMediumMinutes = 60;
  static const int reminderLongMinutes = 120;

  static const Duration reminderShort = Duration(minutes: reminderShortMinutes);
  static const Duration reminderMedium = Duration(minutes: reminderMediumMinutes);
  static const Duration reminderLong = Duration(minutes: reminderLongMinutes);
}

class AnimationConstants {
  static const Duration microInteraction = Duration(milliseconds: 150);
  static const Duration standard = Duration(milliseconds: 200);
  static const Duration pageTransition = Duration(milliseconds: 300);
}

class ValidationConstants {
  static const int freeTextMaxLength = 1000;
}
