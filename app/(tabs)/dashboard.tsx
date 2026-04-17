import { useContext } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { ApplicationsContext } from './_layout';

export default function DashboardScreen() {
  const { applications, emails } = useContext(ApplicationsContext);

  const totalApplications = applications.length;
  const totalInterviews = applications.filter(a => a.status === 'Interview').length;
  const totalOffers = applications.filter(a => a.status === 'Offer').length;
  const totalEmails = emails.length;
  const totalCoffeeChats = emails.filter(e => e.coffeeChat === 'Yes').length;
  const followUps = emails.filter(e => e.followUpDate !== '');

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Dashboard</Text>
      <ScrollView>
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: '#EEF2FF' }]}>
            <Text style={styles.statNumber}>{totalApplications}</Text>
            <Text style={styles.statLabel}>Applications</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEF3C7' }]}>
            <Text style={styles.statNumber}>{totalInterviews}</Text>
            <Text style={styles.statLabel}>Interviews</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#D1FAE5' }]}>
            <Text style={styles.statNumber}>{totalOffers}</Text>
            <Text style={styles.statLabel}>Offers</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>📧 Emails Sent</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoNumber}>{totalEmails}</Text>
            <Text style={styles.infoLabel}>Total emails logged</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>☕ Coffee Chats</Text>
          <View style={styles.infoCard}>
            <Text style={styles.infoNumber}>{totalCoffeeChats}</Text>
            <Text style={styles.infoLabel}>Coffee chats secured</Text>
          </View>
        </View>
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>🔔 Follow Ups Due</Text>
          {followUps.length === 0 ? (
            <Text style={styles.empty}>No follow ups scheduled yet</Text>
          ) : (
            followUps.map((email, index) => (
              <View key={index} style={styles.followUpCard}>
                <Text style={styles.followUpCompany}>{email.company}</Text>
                <Text style={styles.followUpDate}>📅 {email.followUpDate}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', marginTop: 50, marginBottom: 20 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  statCard: { flex: 1, marginHorizontal: 4, borderRadius: 12, padding: 15, alignItems: 'center' },
  statNumber: { fontSize: 28, fontWeight: 'bold', color: '#1F2937' },
  statLabel: { fontSize: 12, color: '#6B7280', marginTop: 4, textAlign: 'center' },
  section: { marginBottom: 20 },
  sectionHeader: { fontSize: 18, fontWeight: 'bold', marginBottom: 10, color: '#1F2937' },
  infoCard: { backgroundColor: '#F3F4F6', borderRadius: 12, padding: 15, flexDirection: 'row', alignItems: 'center', gap: 15 },
  infoNumber: { fontSize: 28, fontWeight: 'bold', color: '#4F46E5' },
  infoLabel: { fontSize: 14, color: '#6B7280' },
  empty: { color: 'gray', fontSize: 14 },
  followUpCard: { backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  followUpCompany: { fontSize: 15, fontWeight: 'bold', color: '#1F2937' },
  followUpDate: { fontSize: 13, color: '#6B7280' },
});