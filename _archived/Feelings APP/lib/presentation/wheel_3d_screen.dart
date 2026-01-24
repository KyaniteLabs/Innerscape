import 'dart:math' as math;
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../core/design_system.dart';
import '../core/constants.dart';
import 'body_scan_screen.dart';

class Wheel3DScreen extends StatefulWidget {
  const Wheel3DScreen({super.key});

  @override
  State<Wheel3DScreen> createState() => _Wheel3DScreenState();
}

class _Wheel3DScreenState extends State<Wheel3DScreen> with SingleTickerProviderStateMixin {
  double _rotation = 0.0;
  double _zoom = 1.0;
  String _hoveredEmotion = '';

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;

    return Scaffold(
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back_ios_new_rounded,
              color: isDark ? Colors.white : AppColors.foreground),
          onPressed: () => Navigator.pop(context),
        ),
        title: Text(
          'FEELINGS WHEEL',
          style: DesignSystem.subHeadingStyle(
            color: isDark ? Colors.white : AppColors.foreground,
          ).copyWith(letterSpacing: 4),
        ),
      ),
      body: GestureDetector(
        onTapUp: (details) {
        final renderBox = context.findRenderObject() as RenderBox;
        final size = renderBox.size;
        final center = Offset(size.width / 2, size.height / 2);

        final dx = details.localPosition.dx - center.dx;
        final dy = details.localPosition.dy - center.dy;
        final dxSquared = dx * dx;
        final dySquared = dy * dy;
        final distance = (dxSquared.isNaN || dySquared.isNaN || (dxSquared + dySquared).isNaN)
            ? 0.0
            : math.sqrt(dxSquared + dySquared);

        // Only trigger if clicking on the petals (not the center hole or far away)
        if (distance > size.width * WheelConstants.distanceThresholdInner && distance < size.width * WheelConstants.distanceThresholdOuter) {
          final rawAngle = math.atan2(dy, dx) + WheelConstants.angleOffset + WheelConstants.angleAdjustment - _rotation;
          final angle = rawAngle.isFinite ? (rawAngle % WheelConstants.fullCircle) : 0.0;
          final angleStep = WheelConstants.fullCircle / WheelConstants.emotionCount;
          final index = (angle / angleStep).floor() % WheelConstants.emotionCount;
          
          final emotions = [
            'Joy / Ecstasy',
            'Trust / Admiration',
            'Fear / Terror',
            'Surprise / Amazement',
            'Sadness / Grief',
            'Disgust / Loathing',
            'Anger / Rage',
            'Anticipation / Vigilance',
          ];
          
          setState(() {
            _hoveredEmotion = emotions[index];
          });
          HapticFeedback.lightImpact();
        }
      },
      onPanUpdate: (details) {
          setState(() {
            _rotation += details.delta.dx * Wheel3DConstants.rotationMultiplier;
          });
        },
        onScaleUpdate: (details) {
          setState(() {
            _zoom = (_zoom * details.scale).clamp(Wheel3DConstants.minZoom, Wheel3DConstants.maxZoom);
          });
        },
        child: Column(
          children: [
            Padding(
              padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingL),
              child: Text(
                'Rotate to explore. Pinch to zoom for intensity.',
                style: DesignSystem.bodyStyle(color: Colors.grey),
              ),
            ),
            Expanded(
              child: Center(
                child: Transform.rotate(
                  angle: _rotation,
                  child: Transform.scale(
                    scale: _zoom,
                    child: CustomPaint(
                      size: const Size(WheelConstants.wheelSize, WheelConstants.wheelSize),
                      painter: PlutchikWheelPainter(
                        isDark: isDark,
                        hoveredEmotion: _hoveredEmotion,
                      ),
                    ),
                  ),
                ),
              ),
            ),
            _buildEmotionDetail(isDark),
          ],
        ),
      ),
    );
  }

  Widget _buildEmotionDetail(bool isDark) {
    return Container(
      width: double.infinity,
      padding: const EdgeInsets.all(DesignSystem.spacingXXL),
      decoration: BoxDecoration(
        color: isDark ? AppColors.surfaceDark : Colors.white,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(DesignSystem.radiusXXL)),
        boxShadow: DesignSystem.softShadow,
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            _hoveredEmotion.isEmpty ? 'Explore the wheel' : _hoveredEmotion,
            style: DesignSystem.headingStyle(),
          ),
          const SizedBox(height: DesignSystem.spacingS),
          Text(
            'Swipe the wheel to discover connections between sensations and emotions.',
            style: DesignSystem.bodyStyle(color: Colors.grey),
          ),
          const SizedBox(height: DesignSystem.spacingXL),
          SizedBox(
            width: double.infinity,
            child: ElevatedButton(
              onPressed: () {
                Navigator.of(context).pushReplacement(
                  MaterialPageRoute(builder: (context) => const BodyScanScreen()),
                );
              },
              style: ElevatedButton.styleFrom(
                backgroundColor: AppColors.gold,
                foregroundColor: Colors.white,
                padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingL),
                shape: RoundedRectangleBorder(borderRadius: DesignSystem.borderRadiusM),
              ),
              child: Text(
                'FEEL IN BODY',
                style: DesignSystem.subHeadingStyle(color: Colors.white).copyWith(letterSpacing: 2),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class PlutchikWheelPainter extends CustomPainter {
  final bool isDark;
  final String hoveredEmotion;

  PlutchikWheelPainter({required this.isDark, required this.hoveredEmotion});

  final List<Map<String, dynamic>> emotions = [
    {'name': 'Joy', 'color': AppColors.gold},
    {'name': 'Trust', 'color': const Color(0xFF90EE90)},
    {'name': 'Fear', 'color': const Color(0xFF50C878)},
    {'name': 'Surprise', 'color': const Color(0xFF22D3EE)},
    {'name': 'Sadness', 'color': const Color(0xFF3B82F6)},
    {'name': 'Disgust', 'color': const Color(0xFF9333EA)},
    {'name': 'Anger', 'color': AppColors.coral},
    {'name': 'Anticipation', 'color': const Color(0xFFFB923C)},
  ];

  @override
  void paint(Canvas canvas, Size size) {
    final center = Offset(size.width / 2, size.height / 2);
    final radius = size.width / WheelConstants.outerRadius;
    final angleStep = WheelConstants.fullCircle / emotions.length;

    for (int i = 0; i < emotions.length; i++) {
      final emotion = emotions[i];
      final startAngle = i * angleStep - (WheelConstants.angleOffset) - (angleStep / 2);

      _drawPetal(canvas, center, radius, startAngle, angleStep, emotion['color']);
    }

    // Centered White/Dark Hole
    final holePaint = Paint()..color = isDark ? AppColors.backgroundDark : AppColors.background;
    canvas.drawCircle(center, radius * WheelConstants.holeRadius, holePaint);
  }

  void _drawPetal(Canvas canvas, Offset center, double radius, double startAngle, double sweepAngle, Color color) {
    final petalPaint = Paint()
      ..color = color.withValues(alpha: 0.4)
      ..style = PaintingStyle.fill;

    final outlinePaint = Paint()
      ..color = color.withValues(alpha: 0.8)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 2.0;

    final path = Path();
    
    // Outer arc
    path.addArc(
      Rect.fromCircle(center: center, radius: radius),
      startAngle,
      sweepAngle,
    );
    
    // Inner connection (curved petal effect)
    path.relativeCubicTo(
      -radius * 0.2, -radius * 0.4, 
      -radius * 0.8, -radius * 0.4, 
      -radius * 1.0, 0
    );

    // This is a simplified petal shape for MVP
    // For a real Plutchik petal, we'd use a more complex Bezier path.

    final petalPath = Path();
    final innerR = radius * WheelConstants.innerPetalRadius;
    final outerR = radius;

    petalPath.moveTo(
      center.dx + innerR * math.cos(startAngle),
      center.dy + innerR * math.sin(startAngle)
    );

    petalPath.quadraticBezierTo(
      center.dx + outerR * WheelConstants.petalOuterMultiplier * math.cos(startAngle + sweepAngle / 2),
      center.dy + outerR * WheelConstants.petalOuterMultiplier * math.sin(startAngle + sweepAngle / 2),
      center.dx + innerR * math.cos(startAngle + sweepAngle),
      center.dy + innerR * math.sin(startAngle + sweepAngle)
    );

    petalPath.close();

    canvas.drawPath(petalPath, petalPaint);
    canvas.drawPath(petalPath, outlinePaint);

    // Intensity layers (inner petals)
    final innerPetalPaint = Paint()
      ..color = color.withValues(alpha: 0.8)
      ..style = PaintingStyle.fill;

    final innerPetalPath = Path();
    final midR = radius * WheelConstants.midPetalRadius;

    innerPetalPath.moveTo(
      center.dx + innerR * math.cos(startAngle),
      center.dy + innerR * math.sin(startAngle)
    );

    innerPetalPath.quadraticBezierTo(
      center.dx + midR * WheelConstants.petalMidMultiplier * math.cos(startAngle + sweepAngle / 2),
      center.dy + midR * WheelConstants.petalMidMultiplier * math.sin(startAngle + sweepAngle / 2),
      center.dx + innerR * math.cos(startAngle + sweepAngle),
      center.dy + innerR * math.sin(startAngle + sweepAngle)
    );

    innerPetalPath.close();
    canvas.drawPath(innerPetalPath, innerPetalPaint);
  }

  @override
  bool shouldRepaint(covariant PlutchikWheelPainter oldDelegate) => true;
}
