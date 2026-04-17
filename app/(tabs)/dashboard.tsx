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
      <View style={styles.headerContainer}>
        <Text style={styles.appName}>App Trax</Text>
        <Text style={styles.header}>Dashboard</Text>
      </View>

      <ScrollView style={styles.scrollView}>

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
            <Text style={styles.miniNumber}>{totalCoffeeChats}</Text>
            <Text style={styles.miniLabel}>Coffee chats</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Follow Ups Due</Text>
        {followUps.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No follow ups scheduled yet</Text>
          </View>
        ) : (
          followUps.map((email, index) => (
            <View key={index} style={styles.followUpCard}>
              <View>
                <Text style={styles.followUpCompany}>{email.company}</Text>
                {email.contactName ? (
                  <Text style={styles.followUpContact}>{email.contactName}</Text>
                ) : null}
              </View>
              <View style={styles.followUpDateBadge}>
                <Text style={styles.followUpDate}>{email.followUpDate}</Text>
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
  headerContainer: {
    backgroundColor: '#0F172A',
    paddingTop: 60,
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  appName: {
    fontSize: 13,
    color: '#0EA5E9',
    fontWeight: 'bold',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  header: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  scrollView: { flex: 1, padding: 16 },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginBottom: 10,
    marginTop: 16,
  },
  heroCard: {
    backgroundColor: '#0EA5E9',
    borderRadius: 16,
    padding: 24,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroNumber: { fontSize: 52, fontWeight: 'bold', color: '#FFFFFF', lineHeight: 56 },
  heroSub: { fontSize: 15, color: 'rgba(255,255,255,0.75)', marginTop: 4 },
  heroDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  miniGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 8,
  },
  miniCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 18,
    width: '47.5%',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  miniNumber: { fontSize: 28, fontWeight: 'bold', color: '#0F172A' },
  miniLabel: { fontSize: 13, color: '#94A3B8', marginTop: 6 },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  emptyText: { color: '#94A3B8', fontSize: 14 },
  followUpCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  followUpCompany: { fontSize: 15, fontWeight: 'bold', color: '#0F172A' },
  followUpContact: { fontSize: 12, color: '#64748B', marginTop: 2 },
  followUpDateBadge: {
    backgroundColor: '#FEF3C7',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  followUpDate: { fontSize: 12, color: '#D97706', fontWeight: 'bold' },
});