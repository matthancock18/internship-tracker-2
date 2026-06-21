import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useContext, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SP, Type } from '../../constants/designSystem';
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setEmails(emails.filter((_, i) => i !== index));
          setEditModalVisible(false);
        }},
      ]
    );
  };

  const handleOpenEdit = (email, index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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
        <Text style={styles.appName}>Trax</Text>
        <Text style={styles.header}>Emails</Text>
      </View>

      <ScrollView style={styles.scrollView}>
        {emails.length === 0 ? (
         <View style={styles.emptyContainer}>
  <Svg width="160" height="160" viewBox="0 0 160 160">
    {/* Background circle */}
    <Circle cx="80" cy="80" r="70" fill="#EFF6FF" />
    {/* Envelope body */}
    <Rect x="30" y="55" width="100" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
    {/* Envelope flap left line */}
    <Path d="M30 55 L80 95 L130 55" stroke="#E2E8F0" strokeWidth="2" fill="none" />
    {/* Envelope bottom fold lines */}
    <Path d="M30 125 L65 90" stroke="#E2E8F0" strokeWidth="2" />
    <Path d="M130 125 L95 90" stroke="#E2E8F0" strokeWidth="2" />
    {/* Plus icon circle */}
    <Circle cx="110" cy="115" r="16" fill="#0EA5E9" />
    <Rect x="109" y="107" width="2" height="16" rx="1" fill="#FFFFFF" />
    <Rect x="102" y="114" width="16" height="2" rx="1" fill="#FFFFFF" />
  </Svg>

  <Text style={styles.empty}>No emails logged yet</Text>
  <Text style={styles.emptySub}>Tap + to log your first outreach email</Text>
</View>
        ) : (
          emails.map((email, index) => (
            <Swipeable
              key={index}
              renderRightActions={() => renderRightActions(index)}
              onSwipeableWillOpen={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}>
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

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
       <ScrollView style={styles.modalContainer}>
  <View style={styles.modalHandle} />
  <View style={styles.modalTitleRow}>
    <Text style={styles.modalHeader}>Log an Email</Text>
    <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
      <Text style={styles.closeButtonText}>✕</Text>
    </TouchableOpacity>
  </View>

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
  value={selectedFollowUp}
  mode="date"
  display="inline"
  locale="en-US"
  onChange={handleFollowUpChange}
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

      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setEditModalVisible(false)}>
        <ScrollView style={styles.modalContainer}>
  <View style={styles.modalHandle} />
  <View style={styles.modalTitleRow}>
    <Text style={styles.modalHeader}>Edit Email</Text>
    <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeButton}>
      <Text style={styles.closeButtonText}>✕</Text>
    </TouchableOpacity>
  </View>

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
              <DateTimePicker value={editSelectedDateSent} mode="date" display="inline" locale="en-US" onChange={handleEditDateSentChange} textColor="#0F172A" accentColor="#0EA5E9" themeVariant="light" />
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
              <DateTimePicker value={editSelectedFollowUp} mode="date" display="inline" locale="en-US" onChange={handleEditFollowUpChange} textColor="#0F172A" accentColor="#0EA5E9" themeVariant="light" />
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
  // ── Screen shell ──
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: { backgroundColor: '#0F172A', paddingTop: 60, paddingBottom: SP[4], paddingHorizontal: SP[6] },
  appName: { ...Type.appBrand },
  header: { ...Type.screenTitle },
  scrollView: { flex: 1, padding: SP[4] },

  // ── Empty state ──
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: SP[3] },
  empty: { ...Type.cardTitle, fontSize: 18, marginBottom: SP[2] },
  emptySub: { ...Type.cardSubtitle, textAlign: 'center', marginBottom: 0 },

  // ── Cards ──
  card: { backgroundColor: '#FFFFFF', padding: SP[4], borderRadius: 12, marginBottom: SP[2] + 2, borderWidth: 1, borderColor: '#E2E8F0' },
  company: { ...Type.cardTitle, marginBottom: SP[1] },
  contact: { ...Type.cardSubtitle, marginBottom: SP[1] },
  detail: { ...Type.cardMeta, marginBottom: SP[1] + 2 },
  tagRow: { flexDirection: 'row', gap: SP[2], marginBottom: SP[1] + 2 },
  tag: { backgroundColor: '#F1F5F9', borderRadius: 20, paddingVertical: 3, paddingHorizontal: SP[2] + 2 },
  tagText: { fontSize: 12, color: '#64748B' },
  tagGreen: { backgroundColor: '#DCFCE7' },
  tagTextGreen: { color: '#16A34A' },
  tagBlue: { backgroundColor: '#E0F2FE' },
  tagTextBlue: { color: '#0369A1' },
  followUp: { fontSize: 12, color: '#F59E0B', marginBottom: SP[1] },
  notes: { fontSize: 13, color: '#94A3B8', fontStyle: 'italic', marginTop: SP[1] },

  // ── Swipe-to-delete ──
  deleteButton: { backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: 12, marginBottom: SP[2] + 2 },
  deleteText: { fontSize: 22 },
  deleteLabel: { fontSize: 11, color: '#EF4444', fontWeight: '700' },

  // ── FAB ──
  fab: { position: 'absolute', bottom: SP[6], right: SP[6], width: 58, height: 58, borderRadius: 29, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { color: 'white', fontSize: 32, fontWeight: '300', lineHeight: 36 },

  // ── Modal shell ──
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: SP[3], paddingHorizontal: SP[6] },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: SP[2], marginBottom: SP[4] },
  modalHeader: { ...Type.modalTitle },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP[6] },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { fontSize: 14, color: '#64748B', fontWeight: '600' },

  // ── Form fields ──
  inputLabel: { ...Type.label },
  input: { ...Type.body, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: SP[3] + 2, marginBottom: 18 },
  notesInput: { height: 100, textAlignVertical: 'top' },
  dateInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: SP[3] + 2, marginBottom: 18 },
  dateText: { ...Type.body },
  datePlaceholder: { fontSize: 16, color: '#64748B' },
  datePickerContainer: { backgroundColor: '#FFFFFF', borderRadius: 10, marginBottom: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  dateConfirmButton: { backgroundColor: '#0EA5E9', padding: SP[3], alignItems: 'center' },
  dateConfirmText: { ...Type.buttonLabel },

  // ── Yes/No toggle ──
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP[3] + 2 },
  toggleLabel: { fontSize: 15, color: '#0F172A', fontWeight: '500' },
  toggleButtons: { flexDirection: 'row', gap: SP[2] },
  toggleButton: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 18, backgroundColor: '#FFFFFF' },
  toggleActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  toggleText: { color: '#64748B', fontSize: 14 },
  toggleTextActive: { color: 'white', fontWeight: '700' },

  // ── Action buttons ──
  saveButton: { backgroundColor: '#0EA5E9', padding: SP[4], borderRadius: 12, alignItems: 'center', marginTop: SP[2] + 2 },
  saveButtonText: { ...Type.buttonLabel },
  cancelButton: { alignItems: 'center', marginTop: SP[3] },
  cancelText: { ...Type.link },
});