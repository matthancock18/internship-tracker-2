import React, { useContext } from 'react';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SP, Type } from '../../constants/designSystem';
import { SKU } from '../../constants/iap';
import type { Product, ProductSubscription } from 'react-native-iap';
import { ApplicationsContext, FREE_SCAN_LIMIT } from './_layout';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const { scansUsed, scansLeft, isPro, setIsPro, iap, dataLoaded } = useContext(ApplicationsContext);
  const { purchase, restore, status, products, subscriptions } = iap;

  const usagePercent = Math.min(1, scansUsed / FREE_SCAN_LIMIT);
  const barColor = usagePercent >= 1 ? '#EF4444' : usagePercent >= 0.7 ? '#F59E0B' : '#0EA5E9';
  const isBusy = status === 'purchasing' || status === 'restoring';

  // Find live prices from App Store if available, fall back to hardcoded
  const monthlyProduct = (subscriptions as ProductSubscription[]).find(p => p.id === SKU.MONTHLY);
  const yearlyProduct = (subscriptions as ProductSubscription[]).find(p => p.id === SKU.YEARLY);
  const lifetimeProduct = (products as Product[]).find(p => p.id === SKU.LIFETIME);

  const monthlyPrice = monthlyProduct?.displayPrice ?? '$2.99';
  const yearlyPrice = yearlyProduct?.displayPrice ?? '$14.99';
  const lifetimePrice = lifetimeProduct?.displayPrice ?? '$12.00';

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + SP[8] }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SP[4] }]}>
        <Text style={styles.appName}>Trax</Text>
        <Text style={styles.headerTitle}>Account</Text>
      </View>

      {/* Plan / usage card */}
      <View style={styles.section}>
        <View style={styles.planCard}>
          {!dataLoaded ? (
            <ActivityIndicator color="#0EA5E9" style={{ marginVertical: SP[3] }} />
          ) : (
            <>
              <View style={styles.planRow}>
                <Text style={styles.planLabel}>{isPro ? 'Trax Pro' : 'Free Plan'}</Text>
                {isPro && <View style={styles.proBadge}><Text style={styles.proBadgeText}>PRO</Text></View>}
              </View>
              <Text style={styles.planSub}>
                {isPro
                  ? 'You have unlimited scans. Thanks for supporting Trax!'
                  : scansLeft > 0
                    ? `${scansLeft} of ${FREE_SCAN_LIMIT} free scans remaining`
                    : "You've used all your free scans"}
              </Text>
              {!isPro && (
                <>
                  <View style={styles.barTrack}>
                    <View style={[styles.barFill, { width: `${usagePercent * 100}%` as any, backgroundColor: barColor }]} />
                  </View>
                  <Text style={styles.barLabel}>{scansUsed} / {FREE_SCAN_LIMIT} scans used</Text>
                </>
              )}
            </>
          )}
        </View>
      </View>

      {/* Upgrade section */}
      {dataLoaded && !isPro && (
        <View style={styles.section}>
          <View style={styles.upgradeCard}>
            <Text style={styles.upgradeEmoji}>⚡</Text>
            <Text style={styles.upgradeTitle}>Upgrade to Trax Pro</Text>
            <Text style={styles.upgradeSub}>
              Unlimited scans. Keep your job search moving without limits.
            </Text>

            <View style={styles.featureList}>
              {[
                'Unlimited OCR document scans',
                'Priority support',
                'More features coming soon',
              ].map(f => (
                <View key={f} style={styles.featureRow}>
                  <Text style={styles.check}>✓</Text>
                  <Text style={styles.featureText}>{f}</Text>
                </View>
              ))}
            </View>

            {/* Pricing options */}
            <View style={styles.pricingRow}>
              <TouchableOpacity
                style={styles.pricingOption}
                disabled={isBusy}
                onPress={() => purchase(SKU.MONTHLY)}>
                <Text style={styles.pricingPrice}>{monthlyPrice}</Text>
                <Text style={styles.pricingPeriod}>/ month</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pricingOption, styles.pricingPopular]}
                disabled={isBusy}
                onPress={() => purchase(SKU.LIFETIME)}>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>BEST VALUE</Text>
                </View>
                {isBusy && status === 'purchasing'
                  ? <ActivityIndicator color="#FFFFFF" style={{ marginVertical: 4 }} />
                  : <>
                      <Text style={[styles.pricingPrice, { color: '#FFFFFF' }]}>{lifetimePrice}</Text>
                      <Text style={[styles.pricingPeriod, { color: 'rgba(255,255,255,0.75)' }]}>lifetime</Text>
                    </>
                }
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.pricingOption}
                disabled={isBusy}
                onPress={() => purchase(SKU.YEARLY)}>
                <Text style={styles.pricingPrice}>{yearlyPrice}</Text>
                <Text style={styles.pricingPeriod}>/ year</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.upgradeBtn, isBusy && styles.upgradeBtnDisabled]}
              disabled={isBusy}
              onPress={() => purchase(SKU.LIFETIME)}>
              {isBusy
                ? <ActivityIndicator color="#FFFFFF" />
                : <Text style={styles.upgradeBtnText}>Get Trax Pro</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.restoreBtn}
              disabled={isBusy}
              onPress={restore}>
              {status === 'restoring'
                ? <ActivityIndicator color="#64748B" size="small" />
                : <Text style={styles.restoreText}>Restore Purchases</Text>
              }
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Pro — manage subscription */}
      {dataLoaded && isPro && (
        <View style={styles.section}>
          <View style={styles.planCard}>
            <Text style={styles.sectionCardTitle}>Manage Subscription</Text>
            <Text style={styles.planSub}>
              To cancel or modify your subscription, go to Settings → Apple ID → Subscriptions.
            </Text>
          </View>
        </View>
      )}

      {/* Dev tools — stripped from release builds */}
      {__DEV__ && (
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Dev Tools</Text>
          <TouchableOpacity style={styles.devBtn} onPress={() => setIsPro(!isPro)}>
            <Text style={styles.devBtnText}>Toggle Pro (dev only)</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>About</Text>
        <View style={styles.aboutCard}>
          <Row label="App" value="Trax" />
          <Row label="Version" value="1.0.0" />
          <Row label="Built for" value="Job seekers" />
          <TouchableOpacity
            style={[styles.row]}
            onPress={() => Linking.openURL('https://yoursite.com/privacy')}>
            <Text style={styles.rowLabel}>Privacy Policy</Text>
            <Text style={[styles.rowValue, { color: '#0EA5E9' }]}>View →</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.row]}
            onPress={() => Linking.openURL('https://yoursite.com/terms')}>
            <Text style={styles.rowLabel}>Terms of Use</Text>
            <Text style={[styles.rowValue, { color: '#0EA5E9' }]}>View →</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={[styles.row, styles.rowBorder]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { paddingHorizontal: SP[6], paddingBottom: SP[4] },
  appName: { ...Type.appBrand, marginBottom: SP[1] },
  headerTitle: { fontSize: 28, fontWeight: '700', color: '#FFFFFF' },
  section: { paddingHorizontal: SP[4], marginBottom: SP[4] },
  sectionLabel: { fontSize: 11, fontWeight: '700', color: '#475569', letterSpacing: 1, textTransform: 'uppercase', marginBottom: SP[2], paddingHorizontal: SP[2] },
  sectionCardTitle: { fontSize: 15, fontWeight: '700', color: '#FFFFFF', marginBottom: SP[2] },

  // Plan card
  planCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: SP[4] },
  planRow: { flexDirection: 'row', alignItems: 'center', gap: SP[2], marginBottom: SP[1] },
  planLabel: { fontSize: 17, fontWeight: '700', color: '#FFFFFF' },
  proBadge: { backgroundColor: '#0EA5E9', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  proBadgeText: { color: '#FFFFFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
  planSub: { fontSize: 13, color: '#94A3B8', marginBottom: SP[3] },
  barTrack: { height: 8, backgroundColor: '#0F172A', borderRadius: 4, overflow: 'hidden', marginBottom: SP[1] },
  barFill: { height: 8, borderRadius: 4 },
  barLabel: { fontSize: 12, color: '#64748B' },

  // Upgrade card
  upgradeCard: { backgroundColor: '#1E293B', borderRadius: 16, padding: SP[4], alignItems: 'center' },
  upgradeEmoji: { fontSize: 36, marginBottom: SP[2] },
  upgradeTitle: { fontSize: 20, fontWeight: '700', color: '#FFFFFF', marginBottom: SP[1] },
  upgradeSub: { fontSize: 13, color: '#94A3B8', textAlign: 'center', lineHeight: 19, marginBottom: SP[4] },
  featureList: { width: '100%', gap: SP[2], marginBottom: SP[4] },
  featureRow: { flexDirection: 'row', alignItems: 'center', gap: SP[2] },
  check: { color: '#0EA5E9', fontSize: 15, fontWeight: '700' },
  featureText: { color: '#CBD5E1', fontSize: 14 },

  // Pricing
  pricingRow: { flexDirection: 'row', gap: SP[2], width: '100%', marginBottom: SP[4] },
  pricingOption: { flex: 1, backgroundColor: '#0F172A', borderRadius: 12, padding: SP[3], alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  pricingPopular: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9', paddingTop: SP[4] },
  popularBadge: { position: 'absolute', top: -10, backgroundColor: '#F59E0B', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
  popularBadgeText: { color: '#FFFFFF', fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  pricingPrice: { color: '#E2E8F0', fontSize: 20, fontWeight: '800' },
  pricingPeriod: { color: '#64748B', fontSize: 11, marginTop: 2 },

  // CTA buttons
  upgradeBtn: { backgroundColor: '#0EA5E9', borderRadius: 12, paddingVertical: SP[3] + 2, width: '100%', alignItems: 'center', marginBottom: SP[2] },
  upgradeBtnDisabled: { opacity: 0.6 },
  upgradeBtnText: { color: '#FFFFFF', fontSize: 16, fontWeight: '700' },
  restoreBtn: { paddingVertical: SP[2], alignItems: 'center' },
  restoreText: { color: '#64748B', fontSize: 13 },

  // Dev tools
  devBtn: { backgroundColor: '#1E293B', borderRadius: 10, padding: SP[3], alignItems: 'center' },
  devBtnText: { color: '#F59E0B', fontSize: 14, fontWeight: '600' },

  // About
  aboutCard: { backgroundColor: '#1E293B', borderRadius: 14 },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: SP[4], paddingVertical: SP[3] },
  rowBorder: { borderBottomWidth: 1, borderBottomColor: '#0F172A' },
  rowLabel: { fontSize: 14, color: '#94A3B8' },
  rowValue: { fontSize: 14, color: '#E2E8F0', fontWeight: '500' },
});
