# Performance Budgets

## Core Web Vitals (Flutter Adaptation)

| Metric | Target | Limit | Current |
|--------|--------|-------|---------|
| **Frame Time** | < 16ms (60fps) | < 33ms (30fps) | TBD |
| **Build Time** | < 100ms | < 200ms | TBD |
| **First Frame** | < 100ms | < 200ms | TBD |
| **Memory Usage** | < 100MB | < 150MB | TBD |

## Bundle Budgets

| Type | Target | Current |
|------|--------|---------|
| **App Size (APK)** | < 50MB | TBD |
| **Initial Code** | < 5MB | TBD |
| **Assets** | < 20MB | TBD |
| **Largest Image** | < 500KB | TBD |

## Monitoring

Use `StructuredLogger` to track performance metrics:
```dart
final stopwatch = Stopwatch()..start();
// ... perform operation ...
stopwatch.stop();
StructuredLogger.info(
  'Performance metric',
  context: {
    'operation': 'screen_load',
    'duration_ms': stopwatch.elapsedMilliseconds,
  },
);
```

## Optimization Checklist

- [ ] Lazy load images below fold
- [ ] Use const constructors where possible
- [ ] Avoid unnecessary rebuilds with `const` widgets
- [ ] Use `ListView.builder` instead of `ListView` for long lists
- [ ] Optimize image sizes and formats
- [ ] Use `AnimatedBuilder` for complex animations
- [ ] Avoid `setState` in build methods
- [ ] Use `ValueKey` for dynamic lists

## Tools

- `flutter build apk --analyze-size` - Analyze app size
- `flutter drive --profile` - Profile performance
- `DevTools` - Memory and performance profiling

## Performance Best Practices

### Widget Optimization
- Use `const` widgets for static content
- Prefer `ListView.builder` over `ListView` for long lists
- Use `AutomaticKeepAliveClientMixin` for preserving state

### Animation Optimization
- Use `AnimationController` with `vsync`
- Prefer `AnimatedBuilder` over `setState` for animations
- Use `Transform` instead of animating layout properties

### Image Optimization
- Use appropriate image formats (WebP for most cases)
- Implement image caching
- Use `CachedNetworkImage` for remote images

### Memory Management
- Dispose controllers and streams properly
- Use `compute` for heavy computations
- Avoid memory leaks with proper cleanup

## Performance Testing

### Frame Rate Testing
```dart
testWidgets('Frame rate test', (tester) async {
  await tester.pumpWidget(MyApp());
  final frameRate = await tester.framePolicy;
  expect(frameRate, greaterThan(55)); // Target 60fps
});
```

### Memory Testing
```dart
testWidgets('Memory usage test', (tester) async {
  await tester.pumpWidget(MyApp());
  final memory = await tester.binding.defaultBinaryMessenger.handlePlatformMessage(
    'flutter/memory',
    null,
  );
  expect(memory, lessThan(100 * 1024 * 1024)); // < 100MB
});
```

## Performance Monitoring in Production

Track these metrics using `StructuredLogger`:
- Screen load times
- Database query durations
- Animation frame rates
- Memory usage patterns
- App startup time

## Known Performance Issues

| Issue | Impact | Status | Fix Version |
|--------|---------|--------|-------------|
| Large history list may cause lag | Medium | Open | TBD |
| 3D wheel rendering on low-end devices | High | Open | TBD |
| PDF export may block UI thread | High | Open | TBD |
