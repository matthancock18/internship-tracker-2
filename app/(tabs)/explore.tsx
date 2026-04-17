import { useContext, useState } from 'react';
import { Alert, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { ApplicationsContext } from './_layout';

export default function EmailsScreen() {
  const { emails, setEmails } = useContext(ApplicationsContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [company, setCompany] = useState('');
  const [contactName, setContactName] = useState('');
  const [dateSent, setDateSent] = useState('');
  const [response, setResponse] = useState('No');
  const [coffeeChat, setCoffeeChat] = useState('No');
  const [followUpDate, setFollowUpDate] = useState('');
  const [notes, setNotes] = useState('');

  const handleAdd = () => {
    if (!company) {
      Alert.alert('Missing Info', 'Please enter at least a company name.');
      return;
    }
    setEmails([...emails, { company, contactName, dateSent, response, coffeeChat, followUpDate, notes }]);
    setCompany('');
    setContactName('');
    setDateSent('');
    setResponse('No');
    setCoffeeChat('No');
    setFollowUpDate('');
    setNotes('');
    setModalVisible(false);
  };

  const YesNoToggle = ({ label, value, onChange }) => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.toggleButtons}>
        <TouchableOpacity
          style={[styles.toggleButton, value === 'Yes' && styles.toggleActive]}
          onPress={() => onChange('Yes')}>
          <Text style={[styles.toggleText, value === 'Yes' && styles.toggleTextActive]}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, value === 'No' && styles.toggleActive]}
          onPress={() => onChange('No')}>
          <Text style={[styles.toggleText, value === 'No' && styles.toggleTextActive]}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Emails</Text>

      <ScrollView>
        {emails.length === 0 ? (
          <Text style={styles.empty}>No emails logged yet. Add one below!</Text>
        ) : (
          emails.map((email, index) => (
            <View key={index} style={styles.card}>
              <Text style={styles.company}>{email.company}</Text>
              {email.contactName ? <Text style={styles.contact}>To: {email.contactName}</Text> : null}
              {email.dateSent ? <Text style={styles.detail}>Sent: {email.dateSent}</Text> : null}
              <View style={styles.tagRow}>
                <View style={[styles.tag, email.response === 'Yes' && styles.tagGreen]}>
                  <Text style={styles.tagText}>Response: {email.response}</Text>
                </View>
                <View style={[styles.tag, email.coffeeChat === 'Yes' && styles.tagGreen]}>
                  <Text style={styles.tagText}>Coffee Chat: {email.coffeeChat}</Text>
                </View>
              </View>
              {email.followUpDate ? <Text style={styles.detail}>Follow up: {email.followUpDate}</Text> : null}
              {email.notes ? <Text style={styles.notes}>{email.notes}</Text> : null}
            </View>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Log Email</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalHeader}>Log an Email</Text>

          <TextInput style={styles.input} placeholder="Company name" placeholderTextColor="#6B7280" value={company} onChangeText={setCompany} />
          <TextInput style={styles.input} placeholder="Contact name (optional)" placeholderTextColor="#6B7280" value={contactName} onChangeText={setContactName} />
          <TextInput style={styles.input} placeholder="Date sent (e.g. Apr 16, 2026)" placeholderTextColor="#6B7280" value={dateSent} onChangeText={setDateSent} />
          <TextInput style={styles.input} placeholder="Follow up date (optional)" placeholderTextColor="#6B7280" value={followUpDate} onChangeText={setFollowUpDate} />
          <TextInput style={[styles.input, styles.notesInput]} placeholder="Notes (optional)" placeholderTextColor="#6B7280" value={notes} onChangeText={setNotes} multiline />

          <YesNoToggle label="Got a response?" value={response} onChange={setResponse} />
          <YesNoToggle label="Led to coffee chat?" value={coffeeChat} onChange={setCoffeeChat} />

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Save Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'white', padding: 20 },
  header: { fontSize: 28, fontWeight: 'bold', marginTop: 50, marginBottom: 20 },
  empty: { color: 'gray', textAlign: 'center', marginTop: 50 },
  card: { backgroundColor: '#F3F4F6', padding: 15, borderRadius: 10, marginBottom: 10 },
  company: { fontSize: 18, fontWeight: 'bold' },
  contact: { fontSize: 14, color: '#4B5563', marginTop: 2 },
  detail: { fontSize: 12, color: 'gray', marginTop: 4 },
  tagRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  tag: { backgroundColor: '#E5E7EB', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  tagGreen: { backgroundColor: '#D1FAE5' },
  tagText: { fontSize: 12, color: '#374151' },
  notes: { fontSize: 13, color: '#6B7280', marginTop: 6, fontStyle: 'italic' },
  addButton: { backgroundColor: '#4F46E5', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, padding: 25, backgroundColor: 'white', marginTop: 60 },
  modalHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  notesInput: { height: 100, textAlignVertical: 'top' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  toggleLabel: { fontSize: 15, color: '#374151', fontWeight: '500' },
  toggleButtons: { flexDirection: 'row', gap: 8 },
  toggleButton: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 18 },
  toggleActive: { backgroundColor: '#4F46E5', borderColor: '#4F46E5' },
  toggleText: { color: '#4B5563', fontSize: 14 },
  toggleTextActive: { color: 'white', fontWeight: 'bold' },
  cancelButton: { alignItems: 'center', marginTop: 10 },
  cancelText: { color: 'gray', fontSize: 16 },
});