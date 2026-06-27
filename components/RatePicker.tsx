import { useCallback, useEffect, useRef } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const WHEEL_ITEM_H = 44;
const WHEEL_VISIBLE = 5;

interface RatePickerProps {
  unit: 'day' | 'week';
  value: number | null;
  onChange: (n: number) => void;
}

export function RatePicker({ unit, value, onChange }: RatePickerProps) {
  const maxRate = unit === 'day' ? 30 : 60;
  const numbers = Array.from({ length: maxRate }, (_, i) => i + 1);
  const scrollRef = useRef<ScrollView>(null);
  const pad = WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2);
  const label = unit === 'day' ? '/day' : '/wk';

  const scrollTo = useCallback((val: number, animated: boolean) => {
    scrollRef.current?.scrollTo({ y: (val - 1) * WHEEL_ITEM_H, animated });
  }, []);

  useEffect(() => {
    const initial = value ?? 1;
    setTimeout(() => scrollTo(initial, false), 50);
  }, [unit]);

  const snapToNearest = (e: any) => {
    const y = e.nativeEvent.contentOffset.y;
    const idx = Math.round(y / WHEEL_ITEM_H);
    const picked = Math.min(maxRate, Math.max(1, idx + 1));
    onChange(picked);
    // snapToInterval already handles the snap position — don't re-animate
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.fadeTop} pointerEvents="none" />
      <View style={styles.selectionLine} pointerEvents="none" />
      <View style={styles.fadeBottom} pointerEvents="none" />
      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        nestedScrollEnabled
        directionalLockEnabled
        contentContainerStyle={{ paddingVertical: pad }}
        onMomentumScrollEnd={snapToNearest}
        onScrollEndDrag={snapToNearest}
        style={styles.scroll}>
        {numbers.map(n => (
          <TouchableOpacity
            key={n}
            style={styles.item}
            onPress={() => { onChange(n); scrollTo(n, true); }}
            activeOpacity={0.6}>
            <Text style={[styles.itemText, n === value && styles.itemTextSelected]}>
              {n} {label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    height: WHEEL_ITEM_H * WHEEL_VISIBLE,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 20,
  },
  scroll: { flex: 1 },
  item: { height: WHEEL_ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  itemTextSelected: { fontSize: 20, color: '#0EA5E9', fontWeight: 'bold' },
  selectionLine: {
    position: 'absolute',
    top: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2),
    left: 16,
    right: 16,
    height: WHEEL_ITEM_H,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#0EA5E9',
    borderRadius: 8,
    opacity: 0.35,
  },
  fadeTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2),
    zIndex: 1,
    backgroundColor: 'rgba(248,250,252,0.65)',
  },
  fadeBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2),
    zIndex: 1,
    backgroundColor: 'rgba(248,250,252,0.65)',
  },
});
