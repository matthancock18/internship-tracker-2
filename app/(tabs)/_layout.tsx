import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import * as Notifications from 'expo-notifications';
import { Tabs } from 'expo-router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActivityIndicator, Alert, AppState, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SP, Type } from '../../constants/designSystem';
import { useIAPPurchase } from '../../hooks/useIAPPurchase';
import { SKU } from '../../constants/iap';

export const FREE_SCAN_LIMIT = 15;

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const ApplicationsContext = React.createContext<any>(null);

const WHEEL_ITEM_H = 44;
const WHEEL_VISIBLE = 5; // must be odd

function RatePicker({ unit, value, onChange }: { unit: 'day' | 'week'; value: number | null; onChange: (n: number) => void }) {
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
    // Snap scroll position to exact grid in case of slow drag release
    scrollTo(picked, true);
  };

  return (
    <View style={wheelStyles.wrapper}>
      {/* fade top */}
      <View style={wheelStyles.fadeTop} pointerEvents="none" />
      {/* selection band */}
      <View style={wheelStyles.selectionLine} pointerEvents="none" />
      {/* fade bottom */}
      <View style={wheelStyles.fadeBottom} pointerEvents="none" />

      <ScrollView
        ref={scrollRef}
        showsVerticalScrollIndicator={false}
        snapToInterval={WHEEL_ITEM_H}
        decelerationRate="fast"
        contentContainerStyle={{ paddingVertical: pad }}
        onMomentumScrollEnd={snapToNearest}
        onScrollEndDrag={snapToNearest}
        style={wheelStyles.scroll}>
        {numbers.map(n => {
          const selected = n === value;
          return (
            <TouchableOpacity
              key={n}
              style={wheelStyles.item}
              onPress={() => { onChange(n); scrollTo(n, true); }}
              activeOpacity={0.6}>
              <Text style={[wheelStyles.itemText, selected && wheelStyles.itemTextSelected]}>
                {n} {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const wheelStyles = StyleSheet.create({
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
    // gradient simulation via opacity bg
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

export default function TabLayout() {
  return <TabLayoutInner />;
}

function TabLayoutInner() {
  const colorScheme = useColorScheme();
  const insets = useSafeAreaInsets();
  const [applications, setApplications] = useState([]);
  const [emails, setEmails] = useState([]);
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [scanSource, setScanSource] = useState<'camera' | 'library' | null>(null);
  const [scannedEmailImageUri, setScannedEmailImageUri] = useState<string | null>(null);
  const [emailScanSource, setEmailScanSource] = useState<'camera' | 'library' | null>(null);
  const [scansUsed, setScansUsed] = useState(0);
  const scansUsedRef = useRef(0); // ref for race-condition-safe checks in async callbacks
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [initialIsPro] = useState(false); // loaded below after AsyncStorage read
  const iap = useIAPPurchase(initialIsPro);
  const { isPro, setIsPro } = iap;

  // Onboarding & goal
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [goal, setGoal] = useState<{ target: number; endDate: string; dailyQuota: number; startDate: string } | null>(null);
  const [onboardingTarget, setOnboardingTarget] = useState('');
  const [onboardingRateUnit, setOnboardingRateUnit] = useState<'day' | 'week'>('day');
  const [onboardingRate, setOnboardingRate] = useState<number | null>(null);

  const lastPaceCheckRef = useRef<string | null>(null);
  const dataLoadedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  // hold latest goal/apps/emails for AppState handler without stale closure
  const goalRef = useRef<typeof goal>(null);
  const appsRef = useRef<any[]>([]);
  const mailsRef = useRef<any[]>([]);

  useEffect(() => { goalRef.current = goal; }, [goal]);
  useEffect(() => { appsRef.current = applications; }, [applications]);
  useEffect(() => { mailsRef.current = emails; }, [emails]);

  useEffect(() => {
    Notifications.requestPermissionsAsync();
  }, []);

  useEffect(() => {
    const loadAll = async () => {
      try {
        const [savedApps, savedEmails, savedOnboarding, savedGoal, savedPaceDate, savedScansUsed, savedIsPro] = await Promise.all([
          AsyncStorage.getItem('applications'),
          AsyncStorage.getItem('emails'),
          AsyncStorage.getItem('hasCompletedOnboarding'),
          AsyncStorage.getItem('goal'),
          AsyncStorage.getItem('lastPaceCheckDate'),
          AsyncStorage.getItem('scansUsed'),
          AsyncStorage.getItem('isPro'),
        ]);

        const apps = savedApps ? JSON.parse(savedApps) : [];
        const mails = savedEmails ? JSON.parse(savedEmails) : [];
        const onboarded = savedOnboarding === 'true';
        const parsedGoal = savedGoal ? JSON.parse(savedGoal) : null;

        if (savedApps) setApplications(apps);
        if (savedEmails) setEmails(mails);
        setHasCompletedOnboarding(onboarded);
        if (parsedGoal) setGoal(parsedGoal);
        if (savedPaceDate) lastPaceCheckRef.current = savedPaceDate;
        if (savedScansUsed) {
          const n = parseInt(savedScansUsed, 10);
          setScansUsed(n);
          scansUsedRef.current = n;
        }
        if (savedIsPro === 'true') setIsPro(true);

        // Mark loaded BEFORE triggering pace check so save effect doesn't stomp data
        dataLoadedRef.current = true;

        if (onboarded && parsedGoal) {
          checkPace(apps, mails, parsedGoal, savedPaceDate);
        }
      } catch {
        // silent — app loads with empty state if storage fails
      }
    };
    loadAll();
  }, []);

  // Listen for app coming to foreground to re-check pace once per day
  useEffect(() => {
    const sub = AppState.addEventListener('change', nextState => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        if (goalRef.current) {
          checkPace(appsRef.current, mailsRef.current, goalRef.current, lastPaceCheckRef.current);
        }
      }
      appStateRef.current = nextState;
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    // Guard: don't write until initial load has populated state
    if (!dataLoadedRef.current) return;
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('applications', JSON.stringify(applications));
        await AsyncStorage.setItem('emails', JSON.stringify(emails));
      } catch {
        // silent — UI remains correct, next save will retry
      }
    };
    saveData();
  }, [applications, emails]);

  const checkPace = async (
    apps: any[],
    mails: any[],
    currentGoal: { target: number; endDate: string; dailyQuota: number; startDate: string },
    lastCheckDate: string | null
  ) => {
    const today = new Date().toDateString();
    if (lastCheckDate === today) return;

    const startDate = new Date(currentGoal.startDate);
    const endDate = new Date(currentGoal.endDate);
    const now = new Date();
    if (now > endDate) return;

    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    // Use floor so day 0 (same day as goal creation) expects 0, not 1
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysPassed <= 0) return; // no expectation on day of setup
    const expectedByNow = Math.floor((daysPassed / totalDays) * currentGoal.target);
    const actual = apps.length + mails.length;
    const behind = expectedByNow - actual;

    if (behind > 0) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Pace Check',
          body: `You're ${behind} application${behind !== 1 ? 's' : ''} behind your goal — keep going!`,
        },
        trigger: null,
      });
    }

    lastPaceCheckRef.current = today;
    await AsyncStorage.setItem('lastPaceCheckDate', today);
  };

  // Shared helper — atomically increments scan count via ref to avoid stale closures
  const consumeScan = () => {
    const newCount = scansUsedRef.current + 1;
    scansUsedRef.current = newCount;
    setScansUsed(newCount);
    AsyncStorage.setItem('scansUsed', String(newCount));
  };

  const isScanAllowed = () => !isPro && scansUsedRef.current >= FREE_SCAN_LIMIT;

  // Shared picker launcher
  const launchImagePicker = async (
    source: 'camera' | 'library',
    onResult: (uri: string) => void,
  ) => {
    if (source === 'camera') {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow camera access in Settings → Trax → Camera');
        return;
      }
      try {
        const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
        if (!result.canceled) { consumeScan(); onResult(result.assets[0].uri); }
      } catch (e) { Alert.alert('Error', String(e)); }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo access in Settings → Trax → Photos');
        return;
      }
      try {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
        if (!result.canceled) { consumeScan(); onResult(result.assets[0].uri); }
      } catch (e) { Alert.alert('Error', String(e)); }
    }
  };

  // App scan picker
  useEffect(() => {
    if (!scanSource) return;
    const source = scanSource;
    setScanSource(null);
    if (isScanAllowed()) { setPaywallVisible(true); return; }
    setTimeout(() => launchImagePicker(source, setScannedImageUri), 500);
  }, [scanSource]);

  // Email scan picker
  useEffect(() => {
    if (!emailScanSource) return;
    const source = emailScanSource;
    setEmailScanSource(null);
    if (isScanAllowed()) { setPaywallVisible(true); return; }
    setTimeout(() => launchImagePicker(source, setScannedEmailImageUri), 500);
  }, [emailScanSource]);

  const buildGoalFromRate = (target: number, ratePerDay: number, rateUnit: 'day' | 'week', rateValue: number) => {
    const days = Math.ceil(target / ratePerDay);
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(endDate.getDate() + days);
    return { target, endDate: endDate.toISOString(), startDate: startDate.toISOString(), dailyQuota: ratePerDay, rateUnit, rateValue };
  };

  const handleCompleteOnboarding = async () => {
    const target = parseInt(onboardingTarget, 10);
    if (!target || target <= 0 || !onboardingRate) {
      Alert.alert('Missing Info', 'Please enter a target and select a pace.');
      return;
    }
    try {
      const ratePerDay = onboardingRateUnit === 'day' ? onboardingRate : onboardingRate / 7;
      const newGoal = buildGoalFromRate(target, ratePerDay, onboardingRateUnit, onboardingRate);
      await AsyncStorage.setItem('goal', JSON.stringify(newGoal));
      await AsyncStorage.setItem('hasCompletedOnboarding', 'true');
      setGoal(newGoal);
      setHasCompletedOnboarding(true);
    } catch {
      Alert.alert('Error', 'Could not save your goal. Please try again.');
    }
  };

  const handleSaveGoal = async (target: number, ratePerDay: number, rateUnit: 'day' | 'week', rateValue: number) => {
    try {
      let newGoal;
      if (goal) {
        // Preserve original start/end dates — only update target and pace
        newGoal = { ...goal, target, dailyQuota: ratePerDay, rateUnit, rateValue };
      } else {
        newGoal = buildGoalFromRate(target, ratePerDay, rateUnit, rateValue);
      }
      await AsyncStorage.setItem('goal', JSON.stringify(newGoal));
      await AsyncStorage.removeItem('lastPaceCheckDate');
      lastPaceCheckRef.current = null;
      setGoal(newGoal);
    } catch {
      Alert.alert('Error', 'Could not save your goal. Please try again.');
    }
  };

  if (hasCompletedOnboarding === null) return null;

  if (!hasCompletedOnboarding) {
    const target = parseInt(onboardingTarget, 10);
    const ratePerDay = onboardingRate
      ? (onboardingRateUnit === 'day' ? onboardingRate : onboardingRate / 7)
      : null;
    const daysToFinish = target > 0 && ratePerDay ? Math.ceil(target / ratePerDay) : null;
    const finishDate = daysToFinish
      ? new Date(Date.now() + daysToFinish * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
      : null;

    return (
      <View style={onboardingStyles.container}>
        <View style={[onboardingStyles.headerBlock, { paddingTop: insets.top + SP[4] }]}>
          <Text style={onboardingStyles.appName}>Trax</Text>
          <Text style={onboardingStyles.title}>Set Your Goal</Text>
          <Text style={onboardingStyles.subtitle}>
            Tell us your target so we can help you stay on pace.
          </Text>
        </View>
        <ScrollView style={onboardingStyles.form} keyboardShouldPersistTaps="handled">
          <Text style={onboardingStyles.label}>How many applications + emails total?</Text>
          <TextInput
            style={onboardingStyles.input}
            placeholder="e.g. 50"
            placeholderTextColor="#64748B"
            keyboardType="number-pad"
            value={onboardingTarget}
            onChangeText={setOnboardingTarget}
          />

          <Text style={onboardingStyles.label}>At what pace?</Text>
          <View style={onboardingStyles.unitToggle}>
            {(['day', 'week'] as const).map(u => (
              <TouchableOpacity
                key={u}
                style={[onboardingStyles.unitBtn, onboardingRateUnit === u && onboardingStyles.unitBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setOnboardingRateUnit(u); setOnboardingRate(null); }}>
                <Text style={[onboardingStyles.unitBtnText, onboardingRateUnit === u && onboardingStyles.unitBtnTextActive]}>
                  Per {u.charAt(0).toUpperCase() + u.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <RatePicker
            unit={onboardingRateUnit}
            value={onboardingRate}
            onChange={setOnboardingRate}
          />

          {finishDate && daysToFinish && (
            <View style={onboardingStyles.previewCard}>
              <Text style={onboardingStyles.previewFinish}>Done by {finishDate}</Text>
              <Text style={onboardingStyles.previewSub}>{daysToFinish} days from today</Text>
            </View>
          )}

          <TouchableOpacity style={onboardingStyles.button} onPress={handleCompleteOnboarding}>
            <Text style={onboardingStyles.buttonText}>Let's Go</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </View>
    );
  }

  const scansLeft = Math.max(0, FREE_SCAN_LIMIT - scansUsed);

  return (
    <ApplicationsContext.Provider value={{
      applications,
      setApplications,
      emails,
      setEmails,
      scannedImageUri,
      setScannedImageUri,
      setScanSource,
      scannedEmailImageUri,
      setScannedEmailImageUri,
      setEmailScanSource,
      goal,
      handleSaveGoal,
      scansUsed,
      scansLeft,
      isPro,
      setIsPro,
      iap,
      showPaywall: () => setPaywallVisible(true),
    }}>
      {/* Paywall modal */}
      <Modal
        visible={paywallVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setPaywallVisible(false)}>
        <View style={paywallStyles.overlay}>
          <View style={paywallStyles.sheet}>
            <View style={paywallStyles.handle} />
            <Text style={paywallStyles.emoji}>🔒</Text>
            <Text style={paywallStyles.title}>You've used all {FREE_SCAN_LIMIT} free scans</Text>
            <Text style={paywallStyles.body}>
              Upgrade to Trax Pro for unlimited OCR scans and keep your job search moving.
            </Text>

            <View style={paywallStyles.featureList}>
              {['Unlimited document scans', 'Priority support', 'More features coming soon'].map(f => (
                <View key={f} style={paywallStyles.featureRow}>
                  <Text style={paywallStyles.check}>✓</Text>
                  <Text style={paywallStyles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={[paywallStyles.upgradeBtn, iap.status === 'purchasing' && { opacity: 0.6 }]}
              disabled={iap.status === 'purchasing'}
              onPress={() => {
                setPaywallVisible(false);
                iap.purchase(SKU.LIFETIME);
              }}>
              {iap.status === 'purchasing'
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={paywallStyles.upgradeBtnText}>Get Trax Pro — $12 lifetime</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={paywallStyles.altBtn}
              disabled={iap.status === 'purchasing'}
              onPress={() => {
                setPaywallVisible(false);
                iap.purchase(SKU.MONTHLY);
              }}>
              <Text style={paywallStyles.altBtnText}>$2.99/month  ·  $14.99/year</Text>
            </TouchableOpacity>

            <TouchableOpacity style={paywallStyles.dismissBtn} onPress={() => setPaywallVisible(false)}>
              <Text style={paywallStyles.dismissText}>Maybe later</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0EA5E9',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#0F172A',
            borderTopColor: '#1E293B',
            borderTopWidth: 1,
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Applications',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="emails"
          options={{
            title: 'Emails',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="account"
          options={{
            title: 'Account',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="person.circle.fill" color={color} />,
          }}
        />
      </Tabs>
    </ApplicationsContext.Provider>
  );
}

const onboardingStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  headerBlock: { paddingBottom: SP[8] - 2, paddingHorizontal: SP[6] },
  appName: { ...Type.appBrand, marginBottom: SP[3] },
  title: { fontSize: 32, fontWeight: '700', color: '#FFFFFF', marginBottom: SP[2] + 2 },
  subtitle: { fontSize: 15, color: '#94A3B8', lineHeight: 22 },
  form: { flex: 1, backgroundColor: '#F8FAFC', borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: SP[6], paddingTop: SP[8] },
  label: { ...Type.label, marginTop: SP[2], marginBottom: SP[2] + 2 },
  input: { ...Type.body, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: SP[3] + 2, marginBottom: SP[4] + 4 },
  unitToggle: { flexDirection: 'row', gap: SP[2], marginBottom: SP[3] + 2 },
  unitBtn: { flex: 1, paddingVertical: SP[2] + 2, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', alignItems: 'center' },
  unitBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  unitBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  unitBtnTextActive: { color: '#FFFFFF' },
  previewCard: { backgroundColor: '#0F172A', borderRadius: 14, padding: 18, marginBottom: SP[2] },
  previewFinish: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: SP[1] },
  previewSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  button: { backgroundColor: '#0EA5E9', padding: SP[4], borderRadius: 12, alignItems: 'center', marginTop: SP[4] },
  buttonText: { ...Type.buttonLabel },
});

const paywallStyles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  sheet: { backgroundColor: '#0F172A', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SP[6], paddingBottom: 40 },
  handle: { width: 40, height: 4, backgroundColor: '#334155', borderRadius: 2, alignSelf: 'center', marginBottom: SP[6] },
  emoji: { fontSize: 40, textAlign: 'center', marginBottom: SP[3] },
  title: { fontSize: 22, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: SP[2] },
  body: { fontSize: 14, color: '#94A3B8', textAlign: 'center', lineHeight: 20, marginBottom: 20 },
  featureList: { backgroundColor: '#1E293B', borderRadius: 14, padding: SP[4], marginBottom: 20, gap: SP[3] },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SP[2] },
  check: { color: '#0EA5E9', fontSize: 16, fontWeight: '700' },
  featureText: { color: '#E2E8F0', fontSize: 14 },
  upgradeBtn: { backgroundColor: '#0EA5E9', borderRadius: 14, padding: SP[4], alignItems: 'center', marginBottom: SP[3] },
  upgradeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  altBtn: { borderRadius: 14, padding: SP[3], alignItems: 'center', marginBottom: SP[2] },
  altBtnText: { color: '#94A3B8', fontSize: 14 },
  dismissBtn: { alignItems: 'center', padding: SP[2] },
  dismissText: { color: '#64748B', fontSize: 14 },
});
