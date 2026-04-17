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

  const statuses = ['Not Yet Open', 'Applied', 'Interview', 'Offer', 'Rejected'];

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

  const renderRightActions = (index) => (
    <TouchableOpacity style={styles.deleteButton} onPress={() => handleDelete(index)}>
      <Text style={styles.deleteText}>🗑️</Text>
      <Text style={styles.deleteLabel}>Delete</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Applications</Text>

      <ScrollView>
        {applications.length === 0 ? (
          <Text style={styles.empty}>No applications yet. Add one below!</Text>
        ) : (
          applications.map((app, index) => (
            <Swipeable
              key={index}
              renderRightActions={() => renderRightActions(index)}>
              <View style={styles.card}>
                <Text style={styles.company}>{app.company}</Text>
                <Text style={styles.role}>{app.role}</Text>
                <Text style={styles.status}>{app.status}</Text>
                {app.dateApplied ? <Text style={styles.date}>Applied: {app.dateApplied}</Text> : null}
              </View>
            </Swipeable>
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={styles.addButton} onPress={() => setModalVisible(true)}>
        <Text style={styles.addButtonText}>+ Add Application</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide">
        <ScrollView style={styles.modalContainer}>
          <Text style={styles.modalHeader}>New Application</Text>

          <TextInput style={styles.input} placeholder="Company name" placeholderTextColor="#6B7280" value={company} onChangeText={setCompany} />
          <TextInput style={styles.input} placeholder="Role / Position" placeholderTextColor="#6B7280" value={role} onChangeText={setRole} />

          <Text style={styles.label}>Date Applied:</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setDatePickerVisible(true)}>
            <Text style={dateApplied ? styles.dateText : styles.datePlaceholder}>
              {dateApplied || 'Select a date (optional)'}
            </Text>
          </TouchableOpacity>
          {datePickerVisible && (
            <View>
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
                textColor="#111827"
              />
              <TouchableOpacity
                style={styles.dateConfirmButton}
                onPress={() => setDatePickerVisible(false)}>
                <Text style={styles.dateConfirmText}>✓ Confirm Date</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.label}>Status:</Text>
          <View style={styles.statusList}>
            {statuses.map((s) => (
              <TouchableOpacity
                key={s}
                style={[styles.statusOption, status === s && styles.statusOptionActive]}
                onPress={() => setStatus(s)}>
                <Text style={[styles.statusOptionText, status === s && styles.statusOptionTextActive]}>{s}</Text>
                {status === s && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>

          <TouchableOpacity style={styles.addButton} onPress={handleAdd}>
            <Text style={styles.addButtonText}>Save Application</Text>
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
  deleteButton: { backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: 10, marginBottom: 10 },
  deleteText: { fontSize: 22 },
  deleteLabel: { fontSize: 12, color: '#EF4444', fontWeight: 'bold' },
  company: { fontSize: 18, fontWeight: 'bold' },
  role: { fontSize: 14, color: '#4B5563', marginTop: 2 },
  status: { fontSize: 12, color: '#4F46E5', fontWeight: 'bold', marginTop: 5 },
  date: { fontSize: 12, color: 'gray', marginTop: 2 },
  addButton: { backgroundColor: '#4F46E5', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 10 },
  addButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  modalContainer: { flex: 1, padding: 25, backgroundColor: 'white', marginTop: 60 },
  modalHeader: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 15, fontSize: 16 },
  label: { fontSize: 16, fontWeight: 'bold', marginBottom: 10 },
  dateInput: { borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, padding: 12, marginBottom: 15 },
  dateText: { fontSize: 16, color: '#111827' },
  datePlaceholder: { fontSize: 16, color: '#6B7280' },
  dateConfirmButton: { backgroundColor: '#4F46E5', padding: 12, borderRadius: 8, alignItems: 'center', marginBottom: 15 },
  dateConfirmText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  statusList: { marginBottom: 20 },
  statusOption: { padding: 14, borderWidth: 1, borderColor: '#D1D5DB', borderRadius: 8, marginBottom: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  statusOptionActive: { backgroundColor: '#EEF2FF', borderColor: '#4F46E5' },
  statusOptionText: { fontSize: 15, color: '#4B5563' },
  statusOptionTextActive: { color: '#4F46E5', fontWeight: 'bold' },
  checkmark: { color: '#4F46E5', fontWeight: 'bold', fontSize: 16 },
  cancelButton: { alignItems: 'center', marginTop: 10 },
  cancelText: { color: 'gray', fontSize: 16 },
});