import DateTimePicker from '@react-native-community/datetimepicker';
import { useContext, useState } from 'react';
import { Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { ApplicationsContext } from './_layout';

export default function ApplicationsScreen() {
  const { applications, setApplications } = useContext(ApplicationsContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [dateApplied, setDateApplied] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [status, setStatus] = useState('Applied');
  const [editModalVisible, setEditModalVisible] = useState(false);
const [editIndex, setEditIndex] = useState(null);
const [editCompany, setEditCompany] = useState('');
const [editRole, setEditRole] = useState('');
const [editDateApplied, setEditDateApplied] = useState('');
const [editSelectedDate, setEditSelectedDate] = useState(new Date());
const [editDatePickerVisible, setEditDatePickerVisible] = useState(false);
const [editStatus, setEditStatus] = useState('Applied');
const [activeFilter, setActiveFilter] = useState('All');

  const statuses = ['Not Yet Open', 'Applied', 'Interview', 'Offer', 'Rejected'];

  const statusColors = {
    'Not Yet Open': '#64748B',
    'Applied': '#0EA5E9',
    'Interview': '#F59E0B',
    'Offer': '#10B981',
    'Rejected': '#EF4444',
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDateChange = (event, date) => {
    if (event.type === 'dismissed') {
      setDatePickerVisible(false);
      return;
    }
    if (date) {
      setSelectedDate(date);
      setDateApplied(formatDate(date));
    }
    if (Platform.OS === 'android') setDatePickerVisible(false);
  };

  const handleAdd = () => {
    if (!company || !role) {
      Alert.alert('Missing Info', 'Please enter at least a company and role.');
      return;
    }
    setApplications([...applications, { company, role, dateApplied, status }]);
    setCompany('');
    setRole('');
    setDateApplied('');
    setSelectedDate(new Date());
    setStatus('Applied');
    setModalVisible(false);
  };

  const handleDelete = (index) => {
    Alert.alert(
      'Delete Application',
      'Are you sure you want to delete this application?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => {
          setApplications(applications.filter((_, i) => i !== index));
        }},
      ]
    );
  };
  const handleOpenEdit = (app, index) => {
  setEditIndex(index);
  setEditCompany(app.company);
  setEditRole(app.role);
  setEditDateApplied(app.dateApplied || '');
  setEditSelectedDate(app.dateApplied ? new Date(app.dateApplied) : new Date());
  setEditStatus(app.status);
  setEditModalVisible(true);
};

const handleSaveEdit = () => {
  if (!editCompany || !editRole) {
    Alert.alert('Missing Info', 'Please enter at least a company and role.');
    return;
  }
  const updated = [...applications];
  updated[editIndex] = { company: editCompany, role: editRole, dateApplied: editDateApplied, status: editStatus };
  setApplications(updated);
  setEditModalVisible(false);
};

const handleEditDateChange = (event, date) => {
  if (event.type === 'dismissed') { setEditDatePickerVisible(false); return; }
  if (date) { setEditSelectedDate(date); setEditDateApplied(formatDate(date)); }
  if (Platform.OS === 'android') setEditDatePickerVisible(false);
};

  const renderRightActions = (index) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(index)}>
      <Text style={styles.deleteText}>🗑️</Text>
      <Text style={styles.deleteLabel}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.appName}>App Trax</Text>
        <Text style={styles.header}>Applications</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow} contentContainerStyle={styles.filterContent}>
          {['All', ...statuses].map((f) => (
            <TouchableOpacity
              key={f}
              style={[styles.filterPill, activeFilter === f && { backgroundColor: activeFilter === 'All' ? '#0EA5E9' : statusColors[f], borderColor: activeFilter === 'All' ? '#0EA5E9' : statusColors[f] }]}
              onPress={() => setActiveFilter(f)}>
              <Text style={[styles.filterPillText, activeFilter === f && { color: '#FFFFFF' }]}>{f}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView}>
        {applications.filter(a => activeFilter === 'All' || a.status === activeFilter).length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>📋</Text>
            <Text style={styles.empty}>No applications yet.</Text>
            <Text style={styles.emptySub}>Tap the button below to add your first one!</Text>
          </View>
        ) : (
          applications.filter(a => activeFilter === 'All' || a.status === activeFilter).map((app, index) => (
            <Swipeable
              key={index}
              renderRightActions={() => renderRightActions(index)}>
              <TouchableOpacity style={styles.card} onPress={() => handleOpenEdit(app, index)}>
                <View style={styles.cardInner}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.company}>{app.company}</Text>
                    <Text style={styles.role}>{app.role}</Text>
                    {app.dateApplied ? <Text style={styles.date}>{app.dateApplied}</Text> : null}
                    <View style={{ alignSelf: 'flex-start' }}>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors[app.status] + '22' }]}>
                        <Text style={[styles.statusText, { color: statusColors[app.status] }]}>{app.status}</Text>
                      </View>
                    </View>
                  </View>
                  <View style={styles.swipeHint}>
                    <Text style={styles.swipeArrow}>←</Text>
                  </View>
                </View>
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
          <Text style={styles.modalHeader}>New Application</Text>

          <Text style={styles.inputLabel}>Company</Text>
          <TextInput style={styles.input} placeholder="e.g. Google" placeholderTextColor="#64748B" value={company} onChangeText={setCompany} />

          <Text style={styles.inputLabel}>Role / Position</Text>
          <TextInput style={styles.input} placeholder="e.g. Software Engineer Intern" placeholderTextColor="#64748B" value={role} onChangeText={setRole} />

          <Text style={styles.inputLabel}>Date Applied</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setDatePickerVisible(true)}>
            <Text style={dateApplied ? styles.dateText : styles.datePlaceholder}>
              {dateApplied || 'Select a date (optional)'}
            </Text>
          </TouchableOpacity>
          {datePickerVisible && (

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
                onPress={() => setDatePickerVisible(false)}>
                <Text style={styles.dateConfirmText}>✓ Confirm Date</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.inputLabel}>Status</Text>
          <View style={styles.statusList}>
            {statuses.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOption, status === s && { backgroundColor: statusColors[s] + '22', borderColor: statusColors[s] }]}
                onPress={() => setStatus(s)}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusColors[s] }]} />
                  <Text style={[styles.statusOptionText, status === s && { color: statusColors[s], fontWeight: 'bold' }]}>{s}</Text>
                </View>
                {status === s && <Text style={{ color: statusColors[s], fontWeight: 'bold' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
            <Text style={styles.saveButtonText}>Save Application</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelButton} onPress={() => setModalVisible(false)}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>

          <View style={{ height: 40 }} />
        </ScrollView>
     </Modal>

      <Modal visible={editModalVisible} animationType="slide" presentationStyle="pageSheet">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalHeader}>Edit Application</Text>

          <Text style={styles.inputLabel}>Company</Text>
          <TextInput style={styles.input} placeholder="e.g. Google" placeholderTextColor="#64748B" value={editCompany} onChangeText={setEditCompany} />

          <Text style={styles.inputLabel}>Role / Position</Text>
          <TextInput style={styles.input} placeholder="e.g. Software Engineer Intern" placeholderTextColor="#64748B" value={editRole} onChangeText={setEditRole} />

          <Text style={styles.inputLabel}>Date Applied</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setEditDatePickerVisible(true)}>
            <Text style={editDateApplied ? styles.dateText : styles.datePlaceholder}>
              {editDateApplied || 'Select a date (optional)'}
            </Text>
          </TouchableOpacity>
          {editDatePickerVisible && (
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
              <TouchableOpacity style={styles.dateConfirmButton} onPress={() => setEditDatePickerVisible(false)}>
                <Text style={styles.dateConfirmText}>✓ Confirm Date</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.inputLabel}>Status</Text>
          <View style={styles.statusList}>
            {statuses.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOption, editStatus === s && { backgroundColor: statusColors[s] + '22', borderColor: statusColors[s] }]}
                onPress={() => setEditStatus(s)}>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: statusColors[s] }]} />
                  <Text style={[styles.statusOptionText, editStatus === s && { color: statusColors[s], fontWeight: 'bold' }]}>{s}</Text>
                </View>
                {editStatus === s && <Text style={{ color: statusColors[s], fontWeight: 'bold' }}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.saveButton} onPress={handleSaveEdit}>
            <Text style={styles.saveButtonText}>Save Changes</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.deleteButton, { width: '100%', borderRadius: 12, height: 52, marginBottom: 0 }]} onPress={() => handleDelete(editIndex)}>
            <Text style={[styles.deleteLabel, { fontSize: 15 }]}>Delete Application</Text>
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
  filterRow: { marginTop: 14 },
  filterContent: { gap: 8, paddingBottom: 2 },
  filterPill: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 14, backgroundColor: 'rgba(255,255,255,0.1)' },
  filterPillText: { fontSize: 13, fontWeight: '600', color: '#FFFFFF' },
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: { backgroundColor: '#0F172A', paddingTop: 60, paddingBottom: 14, paddingHorizontal: 20 },
  appName: { fontSize: 13, color: '#0EA5E9', fontWeight: 'bold', letterSpacing: 2, textTransform: 'uppercase', marginBottom: 4 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF' },
  scrollView: { flex: 1, padding: 16 },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 48, marginBottom: 12 },
  empty: { color: '#0F172A', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySub: { color: '#64748B', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cardInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flex: 1 },
  company: { fontSize: 15, fontWeight: '700', color: '#0F172A', marginBottom: 3 },
  role: { fontSize: 13, color: '#64748B', marginBottom: 4 },
  date: { fontSize: 11, color: '#94A3B8', marginBottom: 6 },
  statusBadge: { alignSelf: 'flex-start', borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10, flexShrink: 1 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  swipeHint: { marginLeft: 12, opacity: 0.3, alignItems: 'center' },
  swipeArrow: { fontSize: 16, color: '#94A3B8' },
  company: { fontSize: 17, fontWeight: 'bold', color: '#0F172A', flex: 1 },
  statusBadge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  role: { fontSize: 14, color: '#64748B', marginBottom: 6 },
  date: { fontSize: 12, color: '#94A3B8' },
  deleteButton: { backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: 12, marginBottom: 10 },
  deleteText: { fontSize: 22 },
  deleteLabel: { fontSize: 11, color: '#EF4444', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { color: 'white', fontSize: 32, fontWeight: '300', lineHeight: 36 },
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 60, paddingHorizontal: 20 },
  modalHeader: { fontSize: 26, fontWeight: 'bold', color: '#0F172A', marginBottom: 24 },
  inputLabel: { fontSize: 13, fontWeight: 'bold', color: '#64748B', marginBottom: 6, textTransform: 'uppercase', letterSpacing: 1 },
  input: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 14, marginBottom: 18, fontSize: 16, color: '#0F172A' },
  dateInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: 14, marginBottom: 18 },
  dateText: { fontSize: 16, color: '#0F172A' },
  datePlaceholder: { fontSize: 16, color: '#64748B' },
  datePickerContainer: { backgroundColor: '#FFFFFF', borderRadius: 10, marginBottom: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  dateConfirmButton: { backgroundColor: '#0EA5E9', padding: 12, alignItems: 'center' },
  dateConfirmText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  statusList: { marginBottom: 20 },
  statusOption: { padding: 14, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusOptionText: { fontSize: 15, color: '#64748B' },
  saveButton: { backgroundColor: '#0EA5E9', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  cancelButton: { alignItems: 'center', marginTop: 12 },
  cancelText: { color: '#64748B', fontSize: 16 },
});