import DateTimePicker from '@react-native-community/datetimepicker';
import { useContext, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
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
  const [dateSentPickerVisible, setDateSentPickerVisible] = useState(false);
  const [followUpPickerVisible, setFollowUpPickerVisible] = useState(false);
  const [selectedDateSent, setSelectedDateSent] = useState(new Date());
  const [selectedFollowUp, setSelectedFollowUp] = useState(new Date());
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [editCompany, setEditCompany] = useState('');
  const [editContactName, setEditContactName] = useState('');
  const [editDateSent, setEditDateSent] = useState('');
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editResponse, setEditResponse] = useState('No');
  const [editCoffeeChat, setEditCoffeeChat] = useState('No');
  const [editSelectedDateSent, setEditSelectedDateSent] = useState(new Date());
  const [editSelectedFollowUp, setEditSelectedFollowUp] = useState(new Date());
  const [editDateSentPickerVisible, setEditDateSentPickerVisible] = useState(false);
  const [editFollowUpPickerVisible, setEditFollowUpPickerVisible] = useState(false);

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDateSentChange = (event, date) => {
    if (event.type === 'dismissed') {
      setDateSentPickerVisible(false);
      return;
    }
    if (date) {
      setSelectedDateSent(date);
      setDateSent(formatDate(date));
    }
    if (Platform.OS === 'android') setDateSentPickerVisible(false);
  };

  const handleFollowUpChange = (event, date) => {
    if (event.type === 'dismissed') {
      setFollowUpPickerVisible(false);
      return;
    }
    if (date) {
      setSelectedFollowUp(date);
      setFollowUpDate(formatDate(date));
    }
    if (Platform.OS === 'android') setFollowUpPickerVisible(false);
  };

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

  const handleDelete = (index) => {
    Alert.alert(
      'Delete Email',
      'Are you sure you want to delete this email?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setEmails(emails.filter((_, i) => i !== index));
        }},
      ]
    );
  };

  const handleOpenEdit = (email, index) => {
    setEditIndex(index);
    setEditCompany(email.company);
    setEditContactName(email.contactName || '');
    setEditDateSent(email.dateSent || '');
    setEditFollowUpDate(email.followUpDate || '');
    setEditNotes(email.notes || '');
    setEditResponse(email.response || 'No');
    setEditCoffeeChat(email.coffeeChat || 'No');
    setEditSelectedDateSent(email.dateSent ? new Date(email.dateSent) : new Date());
    setEditSelectedFollowUp(email.followUpDate ? new Date(email.followUpDate) : new Date());
    setEditModalVisible(true);
  };

  const handleSaveEdit = () => {
    if (!editCompany) {
      Alert.alert('Missing Info', 'Please enter at least a company name.');
      return;
    }
    const updated = [...emails];
    updated[editIndex] = { company: editCompany, contactName: editContactName, dateSent: editDateSent, followUpDate: editFollowUpDate, notes: editNotes, response: editResponse, coffeeChat: editCoffeeChat };
    setEmails(updated);
    setEditModalVisible(false);
  };

  const handleEditDateSentChange = (event, date) => {
    if (event.type === 'dismissed') { setEditDateSentPickerVisible(false); return; }
    if (date) { setEditSelectedDateSent(date); setEditDateSent(formatDate(date)); }
    if (Platform.OS === 'android') setEditDateSentPickerVisible(false);
  };

  const handleEditFollowUpChange = (event, date) => {
    if (event.type === 'dismissed') { setEditFollowUpPickerVisible(false); return; }
    if (date) { setEditSelectedFollowUp(date); setEditFollowUpDate(formatDate(date)); }
    if (Platform.OS === 'android') setEditFollowUpPickerVisible(false);
  };

  const renderRightActions = (index) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(index)}>
      <Text style={styles.deleteText}>🗑️</Text>
      <Text style={styles.deleteLabel}>Delete</Text>
    </TouchableOpacity>
  );

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
      <View style={styles.headerContainer}>
        <Text style={styles.appName}>App Trax</Text>
        <Text style={styles.header}>Emails</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {emails.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📧</Text>
            <Text style={styles.empty}>No emails logged yet.</Text>
            <Text style={styles.emptySub}>Tap the button below to log your first one!</Text>
          </View>
        ) : (
          emails.map((email, index) => (
            <Swipeable
              key={index}
              renderRightActions={() => renderRightActions(index)}>
              <TouchableOpacity style={styles.card} onPress={() => handleOpenEdit(email, index)}>
                <Text style={styles.company}>{email.company}</Text>
                {email.contactName ? <Text style={styles.contact}>To: {email.contactName}</Text> : null}
                {email.dateSent ? <Text style={styles.detail}>📅 Sent: {email.dateSent}</Text> : null}
                <View style={styles.tagRow}>
                  <View style={[styles.tag, email.response === 'Yes' && styles.tagGreen]}>
                    <Text style={[styles.tagText, email.response === 'Yes' && styles.tagTextGreen]}>Response: {email.response}</Text>
                  </View>
                  <View style={[styles.tag, email.coffeeChat === 'Yes' && styles.tagBlue]}>
                    <Text style={[styles.tagText, email.coffeeChat === 'Yes' && styles.tagTextBlue]}>☕ Chat: {email.coffeeChat}</Text>
                  </View>
                </View>
                {email.followUpDate ? <Text style={styles.followUp}>🔔 Follow up: {email.followUpDate}</Text> : null}
                {email.notes ? <Text style={styles.notes}>{email.notes}</Text> : null}
              </TouchableOpacity>
            </Swipeable>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.fab} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalHeader}>Log an Email</Text>

          <Text style={styles.inputLabel}>Company</Text>
          <TextInput style={styles.input} placeholder="e.g. Google" placeholderTextColor="#64748B" value={company} onChangeText={setCompany} />

          <Text style={styles.inputLabel}>Contact Name (optional)</Text>
          <TextInput style={styles.input} placeholder="e.g. Jane Smith" placeholderTextColor="#64748B" value={contactName} onChangeText={setContactName} />

          <Text style={styles.inputLabel}>Date Sent</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setDateSentPickerVisible(true)}>
            <Text style={dateSent ? styles.dateText : styles.datePlaceholder}>
              {dateSent || 'Select a date (optional)'}
            </Text>
          </TouchableOpacity>
          {dateSentPickerVisible && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
  value={selectedDateSent}
  mode="date"
  display="inline"
  locale="en-US"
  onChange={handleDateSentChange}
  textColor="#0F172A"
  accentColor="#0EA5E9"
  themeVariant="light"
/>
              <TouchableOpacity
                style={styles.dateConfirmButton}
                onPress={() => setDateSentPickerVisible(false)}>
                <Text style={styles.dateConfirmText}>✓ Confirm Date</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.inputLabel}>Follow Up Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setFollowUpPickerVisible(true)}>
            <Text style={followUpDate ? styles.dateText : styles.datePlaceholder}>
              {followUpDate || 'Select a date (optional)'}
            </Text>
          </TouchableOpacity>
          {followUpPickerVisible && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
  value={selectedDate}
  mode="date"
  display="inline"
  locale="en-US"
  onChange={handleDateChange}
  textColor="#0F172A"
  accentColor="#0EA5E9"
  themeVariant="light"
/>
              <TouchableOpacity
                style={styles.dateConfirmButton}
                onPress={() => setFollowUpPickerVisible(false)}>
                <Text style={styles.dateConfirmText}>✓ Confirm Date</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.inputLabel}>Notes (optional)</Text>
          <TextInput style={[styles.input, styles.notesInput]} placeholder="Add any notes here..." placeholderTextColor="#64748B" value={notes} onChangeText={setNotes} multiline />

          <YesNoToggle label="Got a response?" value={response} onChange={setResponse} />
          <YesNoToggle label="Led to coffee chat?" value={coffeeChat} onChange={setCoffeeChat} />

          <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
            <Text style={styles.saveButtonText}>Save Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>

      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalHeader}>Edit Email</Text>

          <Text style={styles.inputLabel}>Company</Text>
          <TextInput style={styles.input} placeholder="e.g. Google" placeholderTextColor="#64748B" value={editCompany} onChangeText={setEditCompany} />

          <Text style={styles.inputLabel}>Contact Name (optional)</Text>
          <TextInput style={styles.input} placeholder="e.g. Jane Smith" placeholderTextColor="#64748B" value={editContactName} onChangeText={setEditContactName} />

          <Text style={styles.inputLabel}>Date Sent</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setEditDateSentPickerVisible(true)}>
            <Text style={editDateSent ? styles.dateText : styles.datePlaceholder}>
              {editDateSent || 'Select a date (optional)'}
            </Text>
          </TouchableOpacity>
          {editDateSentPickerVisible && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker value={editSelectedDateSent} mode="date" display="spinner" onChange={handleEditDateSentChange} textColor="#0F172A" />
              <TouchableOpacity style={styles.dateConfirmButton} onPress={() => setEditDateSentPickerVisible(false)}>
                <Text style={styles.dateConfirmText}>✓ Confirm Date</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.inputLabel}>Follow Up Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setEditFollowUpPickerVisible(true)}>
            <Text style={editFollowUpDate ? styles.dateText : styles.datePlaceholder}>
              {editFollowUpDate || 'Select a date (optional)'}
            </Text>
          </TouchableOpacity>
          {editFollowUpPickerVisible && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker value={editSelectedFollowUp} mode="date" display="spinner" onChange={handleEditFollowUpChange} textColor="#000000" />
              <TouchableOpacity style={styles.dateConfirmButton} onPress={() => setEditFollowUpPickerVisible(false)}>
                <Text style={styles.dateConfirmText}>✓ Confirm Date</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.inputLabel}>Notes (optional)</Text>
          <TextInput style={[styles.input, styles.notesInput]} placeholder="Add any notes here..." placeholderTextColor="#64748B" value={editNotes} onChangeText={setEditNotes} multiline />

          <YesNoToggle label="Got a response?" value={editResponse} onChange={setEditResponse} />
          <YesNoToggle label="Led to coffee chat?" value={editCoffeeChat} onChange={setEditCoffeeChat} />

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteButton, { width: '100%', borderRadius: 12, height: 52, marginBottom: 0 }]} onPress={() => handleDelete(editIndex)}>
            <Text style={[styles.deleteLabel, { fontSize: 15 }]}>Delete Email</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => setEditModalVisible(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: { backgroundColor: '#0F172A', paddingTop: 60, paddingBottom: 20, paddingHorizontal: 20 },
  appName: { fontSize: 13, color: '#0EA5E9', fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  scrollView: { flex: 1, padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  empty: { color: '#0F172A', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySub: { color: '#64748B', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  company: { fontSize: 17, fontWeight: 'bold', color: '#0F172A', marginBottom: 4 },
  contact: { fontSize: 14, color: '#64748B', marginBottom: 4 },
  detail: { fontSize: 12, color: '#94A3B8', marginBottom: 6 },
  tagRow: { flexDirection: 'row', gap: 8, marginBottom: 6 },
  tag: { backgroundColor: '#F1F5F9', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  tagText: { fontSize: 12, color: '#64748B' },
  tagGreen: { backgroundColor: '#DCFCE7' },
  tagTextGreen: { color: '#16A34A' },
  tagBlue: { backgroundColor: '#E0F2FE' },
  tagTextBlue: { color: '#0369A1' },
  followUp: { fontSize: 12, color: '#F59E0B', marginBottom: 4 },
  notes: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginTop: 4 },
  deleteButton: { backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: 12, marginBottom: 10 },
  deleteText: { fontSize: 22 },
  deleteLabel: { fontSize: 11, color: '#EF4444', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { color: 'white', fontSize: 32, fontWeight: '300', lineHeight: 36 },
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 60, paddingHorizontal: 20 },
  modalHeader: { fontSize: 26, fontWeight: 'bold', color: '#0F172A', marginBottom: 24 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 16, color: '#0F172A' },
  notesInput: { height: 100, textAlignVertical: 'top' },
  dateInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 14, marginBottom: 18 },
  dateText: { fontSize: 16, color: '#0F172A' },
  datePlaceholder: { fontSize: 16, color: '#64748B' },
  datePickerContainer: { backgroundColor: '#FFFFFF', borderRadius: 10, marginBottom: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  dateConfirmButton: { backgroundColor: '#0EA5E9', padding: 12, alignItems: 'center' },
  dateConfirmText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 },
  toggleLabel: { fontSize: 15, color: '#0F172A', fontWeight: '500' },
  toggleButtons: { flexDirection: 'row', gap: 8 },
  toggleButton: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 18, backgroundColor: '#FFFFFF' },
  toggleActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  toggleText: { color: '#64748B', fontSize: 14 },
  toggleTextActive: { color: 'white', fontWeight: 'bold' },
  saveButton: { backgroundColor: '#0EA5E9', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { alignItems: 'center', marginTop: 12 },
  cancelText: { color: '#64748B', fontSize: 16 },
});