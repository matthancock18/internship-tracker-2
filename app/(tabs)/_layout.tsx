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
import { RatePicker } from '../../components/RatePicker';
import type { Product, ProductSubscription } from 'react-native-iap';

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

const INTRO_SCREENS = [
  {
    icon: '📋',
    title: 'Track every application',
    body: 'Add jobs as you apply — company, role, date, and status all in one place. No more lost spreadsheet rows.',
  },
  {
    icon: '✉️',
    title: 'Log your outreach',
    body: 'Track cold emails and networking conversations. Know exactly who replied and who needs a follow-up.',
  },
  {
    icon: '🎯',
    title: 'Hit your goal',
    body: 'Set a target, pick a pace, and Trax keeps you on track. Get a nudge when you fall behind.',
  },
];

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
  const scansUsedRef = useRef(0);
  const [paywallVisible, setPaywallVisible] = useState(false);
  const [initialIsPro] = useState(false);
  const iap = useIAPPurchase(initialIsPro);
  const { isPro, setIsPro } = iap;

  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean | null>(null);
  const [introStep, setIntroStep] = useState(0); // 0-2 = intro screens, 3 = goal form
  const [goal, setGoal] = useState<{ target: number; endDate: string; dailyQuota: number; startDate: string } | null>(null);
  const [onboardingTarget, setOnboardingTarget] = useState('');
  const [onboardingRateUnit, setOnboardingRateUnit] = useState<'day' | 'week'>('day');
  const [onboardingRate, setOnboardingRate] = useState<number | null>(null);

  const lastPaceCheckRef = useRef<string | null>(null);
  const dataLoadedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
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
    if (!dataLoadedRef.current) return;
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('applications', JSON.stringify(applications));
        await AsyncStorage.setItem('emails', JSON.stringify(emails));
      } catch {}
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
    const daysPassed = Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    if (daysPassed <= 0) return;
    const expectedByNow = Math.floor((daysPassed / totalDays) * currentGoal.target);
    const actual = apps.length + mails.length;
    const behind = expectedByNow - actual;

    if (behind > 0) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: 'Pace Check',
            body: `You're ${behind} application${behind !== 1 ? 's' : ''} behind your goal — keep going!`,
          },
          trigger: null,
        });
      } catch {
        // Permission denied or scheduling failed — skip silently
      }
    }

    lastPaceCheckRef.current = today;
    await AsyncStorage.setItem('lastPaceCheckDate', today);
  };

  const consumeScan = useCallback(() => {
    const newCount = scansUsedRef.current + 1;
    scansUsedRef.current = newCount;
    setScansUsed(newCount);
    AsyncStorage.setItem('scansUsed', String(newCount));
  }, []);

  const isScanLimitReached = () => !isPro && scansUsedRef.current >= FREE_SCAN_LIMIT;

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
        if (!result.canceled) onResult(result.assets[0].uri);
      } catch (e) { Alert.alert('Error', String(e)); }
    } else {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please allow photo access in Settings → Trax → Photos');
        return;
      }
      try {
        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 1 });
        if (!result.canceled) onResult(result.assets[0].uri);
      } catch (e) { Alert.alert('Error', String(e)); }
    }
  };

  useEffect(() => {
    if (!scanSource) return;
    const source = scanSource;
    setScanSource(null);
    if (isScanLimitReached()) { setPaywallVisible(true); return; }
    setTimeout(() => launchImagePicker(source, setScannedImageUri), 500);
  }, [scanSource]);

  useEffect(() => {
    if (!emailScanSource) return;
    const source = emailScanSource;
    setEmailScanSource(null);
    if (isScanLimitReached()) { setPaywallVisible(true); return; }
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
    const rate = onboardingRate ?? 1;
    if (!target || target <= 0) {
      Alert.alert('Missing Info', 'Please enter how many applications you want to send.');
      return;
    }
    try {
      const ratePerDay = onboardingRateUnit === 'day' ? rate : rate / 7;
      const newGoal = buildGoalFromRate(target, ratePerDay, onboardingRateUnit, rate);
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

  // ── Intro screens ──
  if (!hasCompletedOnboarding && introStep < 3) {
    const screen = INTRO_SCREENS[introStep];
    const isLast = introStep === 2;
    return (
      <View style={introStyles.container}>
        <View style={[introStyles.top, { paddingTop: insets.top + SP[4] }]}>
          <Text style={introStyles.appName}>Trax</Text>
          <View style={introStyles.dots}>
            {INTRO_SCREENS.map((_, i) => (
              <View key={i} style={[introStyles.dot, i === introStep && introStyles.dotActive]} />
            ))}
          </View>
        </View>

        <View style={introStyles.body}>
          <Text style={introStyles.icon}>{screen.icon}</Text>
          <Text style={introStyles.title}>{screen.title}</Text>
          <Text style={introStyles.desc}>{screen.body}</Text>
        </View>

        <View style={[introStyles.bottom, { paddingBottom: insets.bottom + SP[6] }]}>
          <TouchableOpacity
            style={introStyles.nextBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setIntroStep(introStep + 1);
            }}>
            <Text style={introStyles.nextBtnText}>{isLast ? 'Set My Goal →' : 'Next'}</Text>
          </TouchableOpacity>
          {!isLast && (
            <TouchableOpacity onPress={() => setIntroStep(3)} style={introStyles.skipBtn}>
              <Text style={introStyles.skipText}>Skip</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  // ── Goal form ──
  if (!hasCompletedOnboarding) {
    const target = parseInt(onboardingTarget, 10);
    const rate = onboardingRate ?? 1;
    const ratePerDay = onboardingRateUnit === 'day' ? rate : rate / 7;
    const daysToFinish = target > 0 ? Math.ceil(target / ratePerDay) : null;
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
        <ScrollView style={onboardingStyles.form} keyboardShouldPersistTaps="always">
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

          <RatePicker unit={onboardingRateUnit} value={onboardingRate} onChange={setOnboardingRate} />

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
  const lifetimeProduct = (iap.products as Product[]).find(p => p.id === SKU.LIFETIME);
  const lifetimePrice = lifetimeProduct?.displayPrice ?? '$15.00';
  const monthlyProduct = (iap.subscriptions as ProductSubscription[]).find(p => p.id === SKU.MONTHLY);
  const monthlyPrice = monthlyProduct?.displayPrice ?? '$1.99';

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
      consumeScan,
      dataLoaded: hasCompletedOnboarding !== null,
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
                : <Text style={paywallStyles.upgradeBtnText}>Get Trax Pro — {lifetimePrice} lifetime</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={paywallStyles.altBtn}
              disabled={iap.status === 'purchasing'}
              onPress={() => {
                setPaywallVisible(false);
                iap.purchase(SKU.MONTHLY);
              }}>
              <Text style={paywallStyles.altBtnText}>Or subscribe monthly · {monthlyPrice}/mo</Text>
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
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="briefcase.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="outreach"
          options={{
            title: 'Outreach',
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

const introStyles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  top: { paddingHorizontal: SP[6], paddingBottom: SP[4], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  appName: { ...Type.appBrand },
  dots: { flexDirection: 'row', gap: 6, paddingBottom: 2 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255,255,255,0.25)' },
  dotActive: { backgroundColor: '#0EA5E9', width: 18 },
  body: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingHorizontal: SP[8] },
  icon: { fontSize: 72, marginBottom: SP[6] },
  title: { fontSize: 30, fontWeight: '700', color: '#FFFFFF', textAlign: 'center', marginBottom: SP[3] },
  desc: { fontSize: 16, color: '#94A3B8', textAlign: 'center', lineHeight: 24 },
  bottom: { paddingHorizontal: SP[6], paddingTop: SP[4] },
  nextBtn: { backgroundColor: '#0EA5E9', borderRadius: 14, paddingVertical: SP[4], alignItems: 'center', marginBottom: SP[2] },
  nextBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  skipBtn: { alignItems: 'center', paddingVertical: SP[2] },
  skipText: { color: '#64748B', fontSize: 14 },
});

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
