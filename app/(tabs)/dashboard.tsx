import * as Haptics from 'expo-haptics';
import { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { SP, Type } from '../../constants/designSystem';
import { ApplicationsContext } from './_layout';

const WHEEL_ITEM_H = 44;
const WHEEL_VISIBLE = 5;

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
    scrollTo(picked, true);
  };

  return (
    <View style={wheelStyles.wrapper}>
      <View style={wheelStyles.fadeTop} pointerEvents="none" />
      <View style={wheelStyles.selectionLine} pointerEvents="none" />
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
            <TouchableOpacity key={n} style={wheelStyles.item} onPress={() => { onChange(n); scrollTo(n, true); }} activeOpacity={0.6}>
              <Text style={[wheelStyles.itemText, selected && wheelStyles.itemTextSelected]}>{n} {label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const wheelStyles = StyleSheet.create({
  wrapper: { height: WHEEL_ITEM_H * WHEEL_VISIBLE, overflow: 'hidden', borderRadius: 14, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', marginBottom: 20 },
  scroll: { flex: 1 },
  item: { height: WHEEL_ITEM_H, alignItems: 'center', justifyContent: 'center' },
  itemText: { fontSize: 16, color: '#94A3B8', fontWeight: '500' },
  itemTextSelected: { fontSize: 20, color: '#0EA5E9', fontWeight: 'bold' },
  selectionLine: { position: 'absolute', top: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2), left: 16, right: 16, height: WHEEL_ITEM_H, borderTopWidth: 1, borderBottomWidth: 1, borderColor: '#0EA5E9', borderRadius: 8, opacity: 0.35 },
  fadeTop: { position: 'absolute', top: 0, left: 0, right: 0, height: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2), zIndex: 1, backgroundColor: 'rgba(248,250,252,0.65)' },
  fadeBottom: { position: 'absolute', bottom: 0, left: 0, right: 0, height: WHEEL_ITEM_H * Math.floor(WHEEL_VISIBLE / 2), zIndex: 1, backgroundColor: 'rgba(248,250,252,0.65)' },
});

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const { applications, emails, goal, handleSaveGoal } = useContext(ApplicationsContext);

  const [editGoalVisible, setEditGoalVisible] = useState(false);
  const [editTarget, setEditTarget] = useState('');
  const [editRateUnit, setEditRateUnit] = useState<'day' | 'week'>('day');
  const [editRate, setEditRate] = useState<number | null>(null);

  const totalApplications = applications.length;
  const totalInterviews = applications.filter(a => a.status === 'Interview').length;
  const totalOffers = applications.filter(a => a.status === 'Offer').length;
  const totalRejected = applications.filter(a => a.status === 'Rejected').length;
  const totalEmails = emails.length;
  const totalFollowUpsPending = [
    ...applications.filter(a => a.followUpDate),
    ...emails.filter(e => e.followUpDate !== ''),
  ].length;

  // All upcoming follow-ups merged and sorted by date
  const followUps = [
    ...emails.filter(e => e.followUpDate !== '').map(e => ({ label: e.company, sub: e.contactName || null, date: e.followUpDate, type: 'email' })),
    ...applications.filter(a => a.followUpDate).map(a => ({ label: a.company, sub: a.role || null, date: a.followUpDate, type: 'app' })),
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Goal progress
  const totalSent = totalApplications + totalEmails;
  let goalProgress = null;
  if (goal) {
    const endDate = new Date(goal.endDate);
    const startDate = new Date(goal.startDate);
    const now = new Date();
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    // floor so day 0 (goal creation day) shows 0 expected, not 1
    const daysPassed = Math.max(0, Math.floor((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysLeft = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    const expected = daysPassed === 0 ? 0 : Math.min(goal.target, Math.floor((daysPassed / totalDays) * goal.target));
    const behind = Math.max(0, expected - totalSent);
    goalProgress = { daysLeft, behind, pct: Math.min(100, Math.round((totalSent / goal.target) * 100)) };
  }

  const openEditGoal = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (goal) {
      setEditTarget(String(goal.target));
      // Restore original unit and value if stored, else fall back to per-day
      const unit: 'day' | 'week' = (goal as any).rateUnit ?? 'day';
      const val: number = (goal as any).rateValue ?? Math.min(30, Math.max(1, Math.round(goal.dailyQuota)));
      setEditRateUnit(unit);
      setEditRate(val);
    } else {
      setEditTarget('');
      setEditRateUnit('day');
      setEditRate(null);
    }
    setEditGoalVisible(true);
  };

  const handleSaveEditGoal = async () => {
    const target = parseInt(editTarget, 10);
    if (!target || target <= 0 || !editRate) {
      Alert.alert('Missing Info', 'Please enter a target and select a pace.');
      return;
    }
    const ratePerDay = editRateUnit === 'day' ? editRate : editRate / 7;
    await handleSaveGoal(target, ratePerDay, editRateUnit, editRate);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEditGoalVisible(false);
  };

  const editRatePerDay = editRate ? (editRateUnit === 'day' ? editRate : editRate / 7) : null;
  // When editing existing goal, keep the original end date; when creating new, project from today
  const editFinishDate = goal
    ? new Date(goal.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : (editRatePerDay && parseInt(editTarget) > 0
        ? new Date(Date.now() + Math.ceil(parseInt(editTarget) / editRatePerDay) * 86400000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        : null);
  const editDaysLeft = goal
    ? Math.max(0, Math.ceil((new Date(goal.endDate).getTime() - Date.now()) / 86400000))
    : (editRatePerDay && parseInt(editTarget) > 0 ? Math.ceil(parseInt(editTarget) / editRatePerDay) : null);

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Text style={styles.appName}>Trax</Text>
        <Text style={styles.header}>Dashboard</Text>
      </View>

      <ScrollView style={styles.scrollView}>

        {/* Goal card */}
        {goal && goalProgress && (
          <>
            <Text style={styles.sectionTitle}>Your Goal</Text>
            <View style={styles.goalCard}>
              <View style={styles.goalCardTop}>
                <View>
                  <Text style={styles.goalSent}>{totalSent} / {goal.target}</Text>
                  <Text style={styles.goalSub}>sent · {goalProgress.pct}% complete</Text>
                </View>
                <TouchableOpacity style={styles.editGoalButton} onPress={openEditGoal}>
                  <Text style={styles.editGoalText}>Edit Goal</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.progressBarBg}>
                <View style={[styles.progressBarFill, { width: `${goalProgress.pct}%` }]} />
              </View>
              <View style={styles.goalMeta}>
                <Text style={styles.goalMetaText}>{goalProgress.daysLeft} days left</Text>
                {goalProgress.behind > 0 && (
                  <Text style={styles.goalBehind}>{goalProgress.behind} behind pace</Text>
                )}
                {goalProgress.behind === 0 && (
                  <Text style={styles.goalOnTrack}>On track</Text>
                )}
              </View>
            </View>
          </>
        )}

        {!goal && (
          <>
            <Text style={styles.sectionTitle}>Your Goal</Text>
            <TouchableOpacity style={styles.setGoalCard} onPress={openEditGoal}>
              <Text style={styles.setGoalText}>+ Set a Goal</Text>
            </TouchableOpacity>
          </>
        )}

        {totalApplications === 0 && totalEmails === 0 && (
          <View style={styles.emptyStateCard}>
            <Text style={styles.emptyStateIcon}>📊</Text>
            <Text style={styles.emptyStateTitle}>Nothing tracked yet</Text>
            <Text style={styles.emptyStateSub}>Add applications and emails to see your stats here.</Text>
          </View>
        )}

        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.heroCard}>
          <View>
            <Text style={styles.heroNumber}>{totalApplications}</Text>
            <Text style={styles.heroSub}>Total applications</Text>
          </View>
          <View style={styles.heroDot} />
        </View>

        <Text style={styles.sectionTitle}>Progress</Text>
        <View style={styles.miniGrid}>
          <View style={styles.miniCard}>
            <Text style={styles.miniNumber}>{totalInterviews}</Text>
            <Text style={styles.miniLabel}>Interviews</Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniNumber}>{totalOffers}</Text>
            <Text style={styles.miniLabel}>Offers</Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={styles.miniNumber}>{totalEmails}</Text>
            <Text style={styles.miniLabel}>Emails sent</Text>
          </View>
          <View style={styles.miniCard}>
            <Text style={[styles.miniNumber, totalFollowUpsPending > 0 && { color: '#F59E0B' }]}>{totalFollowUpsPending}</Text>
            <Text style={styles.miniLabel}>Follow-ups</Text>
          </View>
        </View>

        {totalApplications > 0 && (
          <>
            <Text style={styles.sectionTitle}>Pipeline</Text>
            <View style={styles.funnelCard}>
              {[
                { label: 'Applied', count: totalApplications, color: '#0EA5E9' },
                { label: 'Interview', count: totalInterviews, color: '#F59E0B' },
                { label: 'Offer', count: totalOffers, color: '#10B981' },
                { label: 'Rejected', count: totalRejected, color: '#EF4444' },
              ].map((stage, i) => {
                const pct = totalApplications > 0 ? stage.count / totalApplications : 0;
                const barWidth = Math.max(pct, stage.count > 0 ? 0.04 : 0);
                return (
                  <View key={i} style={styles.funnelRow}>
                    <View style={styles.funnelLabelCol}>
                      <Text style={styles.funnelLabel}>{stage.label}</Text>
                    </View>
                    <View style={styles.funnelBarBg}>
                      <View style={[styles.funnelBarFill, { width: `${barWidth * 100}%`, backgroundColor: stage.color }]} />
                    </View>
                    <Text style={[styles.funnelCount, { color: stage.color }]}>{stage.count}</Text>
                  </View>
                );
              })}
            </View>
          </>
        )}

        <Text style={styles.sectionTitle}>Follow Ups Due</Text>
        {followUps.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No follow ups scheduled yet</Text>
          </View>
        ) : (
          followUps.map((item, index) => (
            <View key={index} style={styles.followUpCard}>
              <View style={{ flex: 1 }}>
                <Text style={styles.followUpCompany}>{item.label}</Text>
                {item.sub ? <Text style={styles.followUpContact}>{item.sub}</Text> : null}
              </View>
              <View style={[styles.followUpDateBadge, item.type === 'app' && { backgroundColor: '#EFF6FF' }]}>
                <Text style={[styles.followUpDate, item.type === 'app' && { color: '#0369A1' }]}>{item.date}</Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>

      {/* Edit Goal Modal */}
      <Modal
        visible={editGoalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditGoalVisible(false)}>
        <ScrollView style={styles.modalContainer} keyboardShouldPersistTaps="handled">
          <View style={styles.modalHandle} />
          <View style={styles.modalTitleRow}>
            <Text style={styles.modalHeader}>{goal ? 'Edit Goal' : 'Set Goal'}</Text>
            <TouchableOpacity onPress={() => setEditGoalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

          <Text style={styles.inputLabel}>Total applications + emails to send</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. 50"
            placeholderTextColor="#64748B"
            keyboardType="number-pad"
            value={editTarget}
            onChangeText={setEditTarget}
          />

          <Text style={styles.inputLabel}>At what pace?</Text>
          <View style={styles.unitToggle}>
            {(['day', 'week'] as const).map(u => (
              <TouchableOpacity
                key={u}
                style={[styles.unitBtn, editRateUnit === u && styles.unitBtnActive]}
                onPress={() => { Haptics.selectionAsync(); setEditRateUnit(u); setEditRate(null); }}>
                <Text style={[styles.unitBtnText, editRateUnit === u && styles.unitBtnTextActive]}>
                  Per {u.charAt(0).toUpperCase() + u.slice(1)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <RatePicker unit={editRateUnit} value={editRate} onChange={setEditRate} />

          {editFinishDate && (
            <View style={styles.previewCard}>
              <Text style={styles.previewFinish}>
                {goal ? 'Deadline' : 'Done by'}: {editFinishDate}
              </Text>
              <Text style={styles.previewSub}>
                {goal ? `${editDaysLeft} days remaining` : `${editDaysLeft} days from today`}
              </Text>
            </View>
          )}

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveEditGoal}>
            <Text style={styles.saveButtonText}>Save Goal</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditGoalVisible(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Screen shell ──
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: { backgroundColor: '#0F172A', paddingBottom: SP[4], paddingHorizontal: SP[6] },
  appName: { ...Type.appBrand },
  header: { ...Type.screenTitle },
  scrollView: { flex: 1, padding: SP[4] },
  sectionTitle: { ...Type.caption, color: '#94A3B8', letterSpacing: 1.5, marginBottom: SP[2] + 2, marginTop: SP[4] },

  // ── Goal card ──
  goalCard: { backgroundColor: '#0F172A', borderRadius: 16, padding: SP[4] + 4, marginBottom: SP[1] },
  goalCardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: SP[3] + 2 },
  goalSent: { fontSize: 36, fontWeight: '700', color: '#FFFFFF', lineHeight: 40 },
  goalSub: { fontSize: 13, color: 'rgba(255,255,255,0.55)', marginTop: 2 },
  editGoalButton: { backgroundColor: 'rgba(14,165,233,0.2)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: SP[3] + 2 },
  editGoalText: { color: '#0EA5E9', fontSize: 13, fontWeight: '600' },
  progressBarBg: { height: 6, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 3, marginBottom: SP[3] },
  progressBarFill: { height: 6, backgroundColor: '#0EA5E9', borderRadius: 3 },
  goalMeta: { flexDirection: 'row', justifyContent: 'space-between' },
  goalMetaText: { fontSize: 12, color: 'rgba(255,255,255,0.45)' },
  goalBehind: { fontSize: 12, color: '#EF4444', fontWeight: '600' },
  goalOnTrack: { fontSize: 12, color: '#10B981', fontWeight: '600' },
  setGoalCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: SP[4] + 4, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginBottom: SP[1] },
  setGoalText: { color: '#0EA5E9', fontSize: 15, fontWeight: '600' },

  // ── Stats ──
  heroCard: { backgroundColor: '#0EA5E9', borderRadius: 16, padding: SP[6], marginBottom: SP[1], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroNumber: { fontSize: 52, fontWeight: '700', color: '#FFFFFF', lineHeight: 56 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: SP[1] },
  heroDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: 'rgba(255,255,255,0.4)' },
  miniGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SP[2] + 2, marginBottom: SP[2] },
  miniCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 18, width: '47.5%', borderWidth: 1, borderColor: '#E2E8F0' },
  miniNumber: { fontSize: 28, fontWeight: '700', color: '#0F172A' },
  miniLabel: { ...Type.cardSubtitle, marginBottom: 0, marginTop: SP[1] + 2 },

  // ── Empty state ──
  emptyStateCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SP[6], borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center', marginBottom: SP[2] },
  emptyStateIcon: { fontSize: 40, marginBottom: SP[3] },
  emptyStateTitle: { ...Type.cardTitle, fontSize: 17, marginBottom: SP[1] },
  emptyStateSub: { ...Type.cardSubtitle, textAlign: 'center', marginBottom: 0 },

  // ── Funnel ──
  funnelCard: { backgroundColor: '#FFFFFF', borderRadius: 16, padding: SP[4], borderWidth: 1, borderColor: '#E2E8F0', marginBottom: SP[1] },
  funnelRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SP[2] + 2 },
  funnelLabelCol: { width: 72 },
  funnelLabel: { fontSize: 12, color: '#64748B', fontWeight: '600' },
  funnelBarBg: { flex: 1, height: 10, backgroundColor: '#F1F5F9', borderRadius: 5, marginHorizontal: SP[2] },
  funnelBarFill: { height: 10, borderRadius: 5 },
  funnelCount: { width: 28, textAlign: 'right', fontSize: 13, fontWeight: '700' },

  // ── Follow-ups ──
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: SP[4] + 4, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  emptyText: { ...Type.cardSubtitle, marginBottom: 0 },
  followUpCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: SP[4], marginBottom: SP[2] + 2, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  followUpCompany: { ...Type.cardTitle, fontSize: 15 },
  followUpContact: { ...Type.cardMeta, marginBottom: 0, marginTop: 2 },
  followUpDateBadge: { backgroundColor: '#FEF3C7', borderRadius: 20, paddingVertical: 6, paddingHorizontal: SP[3] + 2 },
  followUpDate: { fontSize: 12, color: '#D97706', fontWeight: '700' },

  // ── Edit goal modal ──
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: SP[3], paddingHorizontal: SP[6] },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: SP[2], marginBottom: SP[4] },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP[6] },
  modalHeader: { ...Type.modalTitle },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  inputLabel: { ...Type.label },
  input: { ...Type.body, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: SP[3] + 2, marginBottom: 18 },
  unitToggle: { flexDirection: 'row', gap: SP[2], marginBottom: SP[3] + 2 },
  unitBtn: { flex: 1, paddingVertical: SP[2] + 2, borderRadius: 10, borderWidth: 1, borderColor: '#E2E8F0', backgroundColor: '#FFFFFF', alignItems: 'center' },
  unitBtnActive: { backgroundColor: '#0F172A', borderColor: '#0F172A' },
  unitBtnText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  unitBtnTextActive: { color: '#FFFFFF' },
  previewCard: { backgroundColor: '#0F172A', borderRadius: 14, padding: 18, marginBottom: 18 },
  previewFinish: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginBottom: SP[1] },
  previewSub: { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  saveButton: { backgroundColor: '#0EA5E9', padding: SP[4], borderRadius: 12, alignItems: 'center', marginTop: SP[2] + 2 },
  saveButtonText: { ...Type.buttonLabel },
  cancelButton: { alignItems: 'center', marginTop: SP[3] },
  cancelText: { ...Type.link },
});
