import { useContext } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApplicationsContext } from './_layout';

export default function DashboardScreen() {
  const { applications, emails } = useContext(ApplicationsContext);

  const totalApplications = applications.length;
  const totalInterviews = applications.filter(a => a.status === 'Interview').length;
  const totalOffers = applications.filter(a => a.status === 'Offer').length;
  const totalRejected = applications.filter(a => a.status === 'Rejected').length;
  const totalEmails = emails.length;
  const totalCoffeeChats = emails.filter(e => e.coffeeChat === 'Yes').length;
  const totalResponses = emails.filter(e => e.response === 'Yes').length;
  const followUps = emails.filter(e => e.followUpDate !== '');

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.appName}>App Trax</Text>
        <Text style={styles.header}>Dashboard</Text>
      </View>

      <ScrollView style={styles.scrollView}>

        <Text style={styles.sectionTitle}>Applications</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderTopColor: '#0EA5E9' }]}>
            <Text style={styles.statNumber}>{totalApplications}</Text>
            <Text style={styles.statLabel}>Total</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#F59E0B' }]}>
            <Text style={styles.statNumber}>{totalInterviews}</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#10B981' }]}>
            <Text style={styles.statNumber}>{totalOffers}</Text>
            <Text style={styles.statLabel}>Offers</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#EF4444' }]}>
            <Text style={styles.statNumber}>{totalRejected}</Text>
            <Text style={styles.statLabel}>Rejected</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Outreach</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { borderTopColor: '#0EA5E9' }]}>
            <Text style={styles.statNumber}>{totalEmails}</Text>
            <Text style={styles.statLabel}>Emails Sent</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#10B981' }]}>
            <Text style={styles.statNumber}>{totalResponses}</Text>
            <Text style={styles.statLabel}>Responses</Text>
          </View>
          <View style={[styles.statCard, { borderTopColor: '#F59E0B' }]}>
            <Text style={styles.statNumber}>{totalCoffeeChats}</Text>
            <Text style={styles.statLabel}>Coffee Chats</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>🔔 Follow Ups Due</Text>
        {followUps.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No follow ups scheduled yet</Text>
          </View>
        ) : (
          followUps.map((email, index) => (
            <View key={index} style={styles.followUpCard}>
              <View>
                <Text style={styles.followUpCompany}>{email.company}</Text>
                {email.contactName ? <Text style={styles.followUpContact}>{email.contactName}</Text> : null}
              </View>
              <View style={styles.followUpDateBadge}>
                <Text style={styles.followUpDate}>📅 {email.followUpDate}</Text>
              </View>
            </View>
          ))
        )}

        <View style={{ height: 30 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: { backgroundColor: '#0F172A', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  appName: { fontSize: 13, color: '#0EA5E9', fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  scrollView: { flex: 1, padding: 16 },
  sectionTitle: { fontSize: 13, fontWeight: 'bold', color: '#64748B', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10, marginTop: 8 },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  statCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, flex: 1, minWidth: '45%', borderTopWidth: 3, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  statNumber: { fontSize: 32, fontWeight: 'bold', color: '#0F172A' },
  statLabel: { fontSize: 12, color: '#64748B', marginTop: 4, textAlign: 'center' },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 20, borderWidth: 1, borderColor: '#E2E8F0', alignItems: 'center' },
  emptyText: { color: '#94A3B8', fontSize: 14 },
  followUpCard: { backgroundColor: '#FFFFFF', borderRadius: 12, padding: 16, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  followUpCompany: { fontSize: 16, fontWeight: 'bold', color: '#0F172A' },
  followUpContact: { fontSize: 13, color: '#64748B', marginTop: 2 },
  followUpDateBadge: { backgroundColor: '#FEF3C7', borderRadius: 20, paddingVertical: 4, paddingHorizontal: 12 },
  followUpDate: { fontSize: 12, color: '#D97706', fontWeight: 'bold' },
});