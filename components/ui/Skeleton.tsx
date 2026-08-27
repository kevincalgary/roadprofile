import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View, AccessibilityInfo } from 'react-native';

export function Skeleton({ className, width, height }: { className?: string; width?: number | string; height?: number | string }) {
  const opacity = useRef(new Animated.Value(0.35)).current;

  useEffect(() => {
    let reduceMotion = false;
    AccessibilityInfo.isReduceMotionEnabled?.().then((v) => (reduceMotion = v));
    if (reduceMotion) return;

    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.8, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.35, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [opacity]);

  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={{ opacity, width: width as any, height: height as any }}
      className={['bg-cardgray dark:bg-dark-card rounded-xl', className ?? ''].join(' ')}
    />
  );
}

export function FeedPostSkeleton() {
  return (
    <View className="px-4 py-4 gap-3">
      <View className="flex-row items-center gap-3">
        <Skeleton width={44} height={44} className="rounded-full" />
        <View className="gap-2 flex-1">
          <Skeleton width="40%" height={12} />
          <Skeleton width="60%" height={10} />
        </View>
      </View>
      <Skeleton width="100%" height={14} />
      <Skeleton width="90%" height={14} />
      <Skeleton width="100%" height={200} className="rounded-2xl" />
    </View>
  );
}
