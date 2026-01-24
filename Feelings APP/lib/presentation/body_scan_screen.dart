import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../core/design_system.dart';
import '../core/constants.dart';
import '../data/models.dart';
import 'providers.dart';
import 'sensation_selection_screen.dart';

class BodyScanScreen extends ConsumerStatefulWidget {
  const BodyScanScreen({super.key});

  @override
  ConsumerState<BodyScanScreen> createState() => _BodyScanScreenState();
}

class _BodyScanScreenState extends ConsumerState<BodyScanScreen> {
  void _toggleRegion(BodyRegion region) {
    HapticFeedback.lightImpact();
    ref.read(selectedRegionsProvider.notifier).toggle(region);
  }

  @override
  Widget build(BuildContext context) {
    final selectedRegions = ref.watch(selectedRegionsProvider);
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
          'BODY SCAN',
          style: DesignSystem.subHeadingStyle(
            color: isDark ? Colors.white : AppColors.foreground,
          ).copyWith(letterSpacing: 4),
        ),
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingL),
            child: Text(
              'Where do you notice something?',
              style: DesignSystem.bodyStyle(color: Colors.grey),
            ),
          ),
          Expanded(
            child: Center(
              child: AspectRatio(
                aspectRatio: BodyScanConstants.aspectRatio,
                child: LayoutBuilder(
                  builder: (context, constraints) {
                    return Stack(
                      children: [
                        CustomPaint(
                          size: Size(constraints.maxWidth, constraints.maxHeight),
                          painter: HomunculusPainter(
                            selectedRegions: selectedRegions,
                            onRegionTap: _toggleRegion,
                            isDark: isDark,
                          ),
                        ),
                        ..._buildTouchTargets(constraints.maxWidth, constraints.maxHeight),
                      ],
                    );
                  },
                ),
              ),
            ),
          ),
          SafeArea(
            child: Padding(
              padding: const EdgeInsets.all(DesignSystem.spacingXXL),
              child: AnimatedOpacity(
                duration: AnimationConstants.pageTransition,
                opacity: selectedRegions.isNotEmpty ? 1.0 : 0.0,
                child: SizedBox(
                  width: double.infinity,
                  child: ElevatedButton(
                    onPressed: selectedRegions.isNotEmpty
                        ? () {
                            Navigator.push(
                              context,
                              MaterialPageRoute(
                                builder: (context) => const SensationSelectionScreen(),
                              ),
                            );
                          }
                        : null,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: AppColors.foreground,
                      foregroundColor: Colors.white,
                      elevation: 0,
                      padding: const EdgeInsets.symmetric(vertical: DesignSystem.spacingXL),
                      shape: RoundedRectangleBorder(
                        borderRadius: DesignSystem.borderRadiusM,
                      ),
                    ),
                    child: Text(
                      'CONTINUE',
                      style: DesignSystem.subHeadingStyle(color: Colors.white).copyWith(letterSpacing: 2),
                    ),
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  List<Widget> _buildTouchTargets(double width, double height) {
    return [
      _buildTarget(BodyRegion.headFace, width * BodyScanConstants.headLeft, height * BodyScanConstants.headTop, width * BodyScanConstants.headWidth, height * BodyScanConstants.headHeight),
      _buildTarget(BodyRegion.neckThroat, width * BodyScanConstants.neckLeft, height * BodyScanConstants.neckTop, width * BodyScanConstants.neckWidth, height * BodyScanConstants.neckHeight),
      _buildTarget(BodyRegion.shouldersArms, width * BodyScanConstants.shouldersLeft, height * BodyScanConstants.shouldersTop, width * BodyScanConstants.shouldersWidth, height * BodyScanConstants.shouldersHeight),
      _buildTarget(BodyRegion.chestHeart, width * BodyScanConstants.chestLeft, height * BodyScanConstants.chestTop, width * BodyScanConstants.chestWidth, height * BodyScanConstants.chestHeight),
      _buildTarget(BodyRegion.bellyGut, width * BodyScanConstants.bellyLeft, height * BodyScanConstants.bellyTop, width * BodyScanConstants.bellyWidth, height * BodyScanConstants.bellyHeight),
      _buildTarget(BodyRegion.back, width * BodyScanConstants.backLeft, height * BodyScanConstants.backTop, width * BodyScanConstants.backWidth, height * BodyScanConstants.backHeight),
      _buildTarget(BodyRegion.hipsGroin, width * BodyScanConstants.hipsLeft, height * BodyScanConstants.hipsTop, width * BodyScanConstants.hipsWidth, height * BodyScanConstants.hipsHeight),
      _buildTarget(BodyRegion.legsFeet, width * BodyScanConstants.legsLeft, height * BodyScanConstants.legsTop, width * BodyScanConstants.legsWidth, height * BodyScanConstants.legsHeight),
    ];
  }

  Widget _buildTarget(BodyRegion region, double left, double top, double w, double h) {
    return Positioned(
      left: left,
      top: top,
      child: Semantics(
        button: true,
        label: _getRegionLabel(region),
        hint: 'Tap to select ${_getRegionLabel(region)} area for sensation',
        child: GestureDetector(
          onTap: () => _toggleRegion(region),
          child: Container(
            width: w,
            height: h,
            color: Colors.transparent,
          ),
        ),
      ),
    );
  }

  String _getRegionLabel(BodyRegion region) {
    switch (region) {
      case BodyRegion.headFace:
        return 'Head and face';
      case BodyRegion.neckThroat:
        return 'Neck and throat';
      case BodyRegion.shouldersArms:
        return 'Shoulders and arms';
      case BodyRegion.chestHeart:
        return 'Chest and heart';
      case BodyRegion.bellyGut:
        return 'Belly and gut';
      case BodyRegion.back:
        return 'Back';
      case BodyRegion.hipsGroin:
        return 'Hips and groin';
      case BodyRegion.legsFeet:
        return 'Legs and feet';
    }
  }
}

class HomunculusPainter extends CustomPainter {
  final Set<BodyRegion> selectedRegions;
  final Function(BodyRegion) onRegionTap;
  final bool isDark;

  HomunculusPainter({
    required this.selectedRegions,
    required this.onRegionTap,
    required this.isDark,
  });

  @override
  void paint(Canvas canvas, Size size) {
    final paint = Paint()
      ..color = isDark ? Colors.white12 : Colors.black.withValues(alpha: 0.05)
      ..style = PaintingStyle.fill;

    final outlinePaint = Paint()
      ..color = isDark ? Colors.white24 : Colors.black.withValues(alpha: 0.1)
      ..style = PaintingStyle.stroke
      ..strokeWidth = 1.0;

    final highlightPaint = Paint()
      ..color = AppColors.gold.withValues(alpha: 0.6)
      ..style = PaintingStyle.fill
      ..maskFilter = const MaskFilter.blur(BlurStyle.normal, 15);

    final w = size.width;
    final h = size.height;

    _drawRegion(canvas, BodyRegion.headFace, _headPath(w, h), paint, outlinePaint, highlightPaint);
    _drawRegion(canvas, BodyRegion.neckThroat, _neckPath(w, h), paint, outlinePaint, highlightPaint);
    _drawRegion(canvas, BodyRegion.chestHeart, _chestPath(w, h), paint, outlinePaint, highlightPaint);
    _drawRegion(canvas, BodyRegion.shouldersArms, _armsPath(w, h), paint, outlinePaint, highlightPaint);
    _drawRegion(canvas, BodyRegion.bellyGut, _bellyPath(w, h), paint, outlinePaint, highlightPaint);
    _drawRegion(canvas, BodyRegion.hipsGroin, _hipsPath(w, h), paint, outlinePaint, highlightPaint);
    _drawRegion(canvas, BodyRegion.legsFeet, _legsPath(w, h), paint, outlinePaint, highlightPaint);
  }

  void _drawRegion(Canvas canvas, BodyRegion region, Path path, Paint base, Paint outline, Paint highlight) {
    canvas.drawPath(path, base);
    canvas.drawPath(path, outline);
    if (selectedRegions.contains(region)) {
      canvas.drawPath(path, highlight);
    }
  }

  Path _headPath(double w, double h) => Path()..addOval(Rect.fromLTWH(w * BodyScanConstants.headPathLeft, h * BodyScanConstants.headPathTop, w * BodyScanConstants.headPathWidth, h * BodyScanConstants.headPathHeight));
  Path _neckPath(double w, double h) => Path()..addRect(Rect.fromLTWH(w * BodyScanConstants.neckPathLeft, h * BodyScanConstants.neckPathTop, w * BodyScanConstants.neckPathWidth, h * BodyScanConstants.neckPathHeight));
  Path _chestPath(double w, double h) => Path()
    ..moveTo(w * BodyScanConstants.chestPathLeft1, h * BodyScanConstants.chestPathTop1)..lineTo(w * BodyScanConstants.chestPathLeft2, h * BodyScanConstants.chestPathTop2)
    ..lineTo(w * BodyScanConstants.chestPathLeft3, h * BodyScanConstants.chestPathTop3)..lineTo(w * BodyScanConstants.chestPathLeft4, h * BodyScanConstants.chestPathTop4)..close();
  Path _armsPath(double w, double h) {
    final p = Path();
    p.addRect(Rect.fromLTWH(w * BodyScanConstants.armsLeft1, h * BodyScanConstants.armsTop1, w * BodyScanConstants.armsWidth1, h * BodyScanConstants.armsHeight1));
    p.addRect(Rect.fromLTWH(w * BodyScanConstants.armsLeft2, h * BodyScanConstants.armsTop2, w * BodyScanConstants.armsWidth2, h * BodyScanConstants.armsHeight2));
    return p;
  }
  Path _bellyPath(double w, double h) => Path()
    ..moveTo(w * BodyScanConstants.bellyPathLeft1, h * BodyScanConstants.bellyPathTop1)..lineTo(w * BodyScanConstants.bellyPathLeft2, h * BodyScanConstants.bellyPathTop2)
    ..lineTo(w * BodyScanConstants.bellyPathLeft3, h * BodyScanConstants.bellyPathTop3)..lineTo(w * BodyScanConstants.bellyPathLeft4, h * BodyScanConstants.bellyPathTop4)..close();
  Path _hipsPath(double w, double h) => Path()..addRect(Rect.fromLTWH(w * BodyScanConstants.hipsPathLeft, h * BodyScanConstants.hipsPathTop, w * BodyScanConstants.hipsPathWidth, h * BodyScanConstants.hipsPathHeight));
  Path _legsPath(double w, double h) {
    final p = Path();
    p.addRect(Rect.fromLTWH(w * BodyScanConstants.legsLeft1, h * BodyScanConstants.legsTop1, w * BodyScanConstants.legsWidth1, h * BodyScanConstants.legsHeight1));
    p.addRect(Rect.fromLTWH(w * BodyScanConstants.legsLeft2, h * BodyScanConstants.legsTop2, w * BodyScanConstants.legsWidth2, h * BodyScanConstants.legsHeight2));
    return p;
  }

  @override
  bool shouldRepaint(covariant HomunculusPainter oldDelegate) => true;
}
