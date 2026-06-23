import TextRecognition from '@react-native-ml-kit/text-recognition';
import DateTimePicker from '@react-native-community/datetimepicker';
import * as Haptics from 'expo-haptics';
import { useContext, useEffect, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { SP, Type } from '../../constants/designSystem';
import { ApplicationsContext } from './_layout';

export default function OutreachScreen() {
  const insets = useSafeAreaInsets();
  const { emails, setEmails, scannedEmailImageUri, setScannedEmailImageUri, setEmailScanSource, scansLeft, isPro, consumeScan } = useContext(ApplicationsContext);
  const [scanning, setScanning] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchText, setSearchText] = useState('');
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
  const [editIndex, setEditIndex] = useState<number | null>(null);
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

  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const parseEmailOCR = (text: string): { company: string; contactName: string; dateSent: string } => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
    let company = '';
    let contactName = '';
    let dateSent = '';

    const fromLine = lines.find(l => /^from:/i.test(l));
    if (fromLine) {
      const nameMatch = fromLine.match(/from:\s*([^<\n]+?)(?:\s*<|$)/i);
      if (nameMatch) contactName = nameMatch[1].trim().replace(/^"(.*)"$/, '$1');
      const emailMatch = fromLine.match(/<([^>]+)>/);
      if (emailMatch) {
        const domain = emailMatch[1].split('@')[1] || '';
        const domainPart = domain.split('.')[0];
        if (domainPart && !['gmail', 'yahoo', 'hotmail', 'outlook', 'icloud', 'me'].includes(domainPart)) {
          company = domainPart.charAt(0).toUpperCase() + domainPart.slice(1);
        }
      }
    }

    if (!contactName) {
      const viaLine = lines.find(l => /via linkedin/i.test(l));
      if (viaLine) contactName = viaLine.replace(/via linkedin.*/i, '').trim();
    }

    const subjectLine = lines.find(l => /^subject:/i.test(l)) || '';
    if (!company) {
      const atMatch = subjectLine.match(/(?:at|@|from|with)\s+([A-Z][A-Za-z0-9\s&.,'-]{1,40})/);
      if (atMatch) company = atMatch[1].trim().replace(/[,.]$/, '');
    }

    if (!contactName) {
      const hiIdx = lines.findIndex(l => /^hi\b/i.test(l));
      if (hiIdx !== -1 && lines[hiIdx + 1]) {
        const candidate = lines[hiIdx + 1].replace(/[^A-Za-z\s]/g, '').trim();
        if (candidate.split(' ').length <= 3) contactName = candidate;
      }
    }

    const datePatterns = [
      /(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i,
      /(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2},?\s+\d{4}/i,
    ];
    for (const line of lines) {
      for (const pat of datePatterns) {
        const m = line.match(pat);
        if (m) {
          try {
            const parsed = new Date(m[0].replace(/^(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun),?\s+/i, ''));
            if (!isNaN(parsed.getTime())) { dateSent = formatDate(parsed); break; }
          } catch {}
        }
      }
      if (dateSent) break;
    }

    return { company, contactName, dateSent };
  };

  // Open modal first, then process image so user sees feedback immediately
  useEffect(() => {
    if (!scannedEmailImageUri) return;
    const uri = scannedEmailImageUri;
    setScannedEmailImageUri(null);
    setModalVisible(true);
    setTimeout(() => processEmailImage(uri), 400);
  }, [scannedEmailImageUri]);

  const processEmailImage = async (uri: string) => {
    setScanning(true);
    try {
      const result = await TextRecognition.recognize(uri);
      const text = result.text;
      if (!text || text.trim().length === 0) {
        Alert.alert('No text found', 'Could not detect any text in this image. Try a clearer photo.');
        return;
      }
      const { company: c, contactName: cn, dateSent: ds } = parseEmailOCR(text);
      if (c) setCompany(c);
      if (cn) setContactName(cn);
      if (ds) { setDateSent(ds); try { setSelectedDateSent(new Date(ds)); } catch {} }
      if (!c && !cn) Alert.alert('Could not parse', "Text detected but couldn't identify sender or company. Fill in manually.");
      consumeScan();
    } catch (e) {
      Alert.alert('Scan error', String(e));
    } finally {
      setScanning(false);
    }
  };

  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (buttonIndex) => {
          if (buttonIndex === 1) { setModalVisible(false); setTimeout(() => setEmailScanSource('camera'), 300); }
          if (buttonIndex === 2) { setModalVisible(false); setTimeout(() => setEmailScanSource('library'), 300); }
        }
      );
    } else {
      Alert.alert('Scan Outreach', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => { setModalVisible(false); setTimeout(() => setEmailScanSource('camera'), 300); } },
        { text: 'Choose from Library', onPress: () => { setModalVisible(false); setTimeout(() => setEmailScanSource('library'), 300); } },
      ]);
    }
  };

  const handleDateSentChange = (event, date) => {
    if (event.type === 'dismissed') { setDateSentPickerVisible(false); return; }
    if (date) { setSelectedDateSent(date); setDateSent(formatDate(date)); }
    if (Platform.OS === 'android') setDateSentPickerVisible(false);
  };

  const handleFollowUpChange = (event, date) => {
    if (event.type === 'dismissed') { setFollowUpPickerVisible(false); return; }
    if (date) { setSelectedFollowUp(date); setFollowUpDate(formatDate(date)); }
    if (Platform.OS === 'android') setFollowUpPickerVisible(false);
  };

  const handleAdd = () => {
    if (!company) { Alert.alert('Missing Info', 'Please enter at least a company name.'); return; }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setEmails([...emails, { company, contactName, dateSent, response, coffeeChat, followUpDate, notes }]);
    setCompany(''); setContactName(''); setDateSent(''); setResponse('No');
    setCoffeeChat('No'); setFollowUpDate(''); setNotes('');
    setModalVisible(false);
  };

  const handleDelete = (index) => {
    const name = emails[index]?.company || 'this entry';
    Alert.alert('Delete Outreach', `Delete outreach to ${name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        setEmails(emails.filter((_, i) => i !== index));
        setEditModalVisible(false);
      }},
    ]);
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
    if (editIndex === null) return;
    if (!editCompany) { Alert.alert('Missing Info', 'Please enter at least a company name.'); return; }
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

  const YesNoToggle = ({ label, value, onChange }) => (
    <View style={styles.toggleRow}>
      <Text style={styles.toggleLabel}>{label}</Text>
      <View style={styles.toggleButtons}>
        <TouchableOpacity style={[styles.toggleButton, value === 'Yes' && styles.toggleActive]} onPress={() => onChange('Yes')}>
          <Text style={[styles.toggleText, value === 'Yes' && styles.toggleTextActive]}>Yes</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.toggleButton, value === 'No' && styles.toggleActive]} onPress={() => onChange('No')}>
          <Text style={[styles.toggleText, value === 'No' && styles.toggleTextActive]}>No</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const filtered = emails.filter(e => {
    if (!searchText) return true;
    const q = searchText.toLowerCase();
    return e.company?.toLowerCase().includes(q) || e.contactName?.toLowerCase().includes(q);
  });

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Text style={styles.appName}>Trax</Text>
        <Text style={styles.header}>Outreach</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search company or contact..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </View>

      <ScrollView style={styles.scrollView}>
        {emails.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Svg width="160" height="160" viewBox="0 0 160 160">
              <Circle cx="80" cy="80" r="70" fill="#EFF6FF" />
              <Rect x="30" y="55" width="100" height="70" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
              <Path d="M30 55 L80 95 L130 55" stroke="#E2E8F0" strokeWidth="2" fill="none" />
              <Path d="M30 125 L65 90" stroke="#E2E8F0" strokeWidth="2" />
              <Path d="M130 125 L95 90" stroke="#E2E8F0" strokeWidth="2" />
              <Circle cx="110" cy="115" r="16" fill="#0EA5E9" />
              <Rect x="109" y="107" width="2" height="16" rx="1" fill="#FFFFFF" />
              <Rect x="102" y="114" width="16" height="2" rx="1" fill="#FFFFFF" />
            </Svg>
            <Text style={styles.empty}>No outreach logged yet</Text>
            <Text style={styles.emptySub}>Tap + to log your first networking email</Text>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.empty}>No results</Text>
            <Text style={styles.emptySub}>Try a different search term</Text>
          </View>
        ) : (
          filtered.map((email, i) => (
            <TouchableOpacity key={i} style={styles.card} onPress={() => handleOpenEdit(email, emails.indexOf(email))}>
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
          ))
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + SP[4] }]} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      <Modal visible={modalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setModalVisible(false)}>
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <View style={styles.modalTitleRow}>
            <Text style={styles.modalHeader}>Log Outreach</Text>
            <View style={styles.modalTitleActions}>
              <TouchableOpacity style={styles.scanButton} onPress={handleScan} disabled={scanning}>
                {scanning
                  ? <ActivityIndicator size="small" color="#0EA5E9" />
                  : <Text style={styles.scanButtonText}>📷 Scan{!isPro && scansLeft <= 5 ? ` (${scansLeft} left)` : ''}</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {scanning && <View style={styles.scanningBanner}><Text style={styles.scanningText}>Scanning email...</Text></View>}

          <Text style={styles.inputLabel}>Company</Text>
          <TextInput style={styles.input} placeholder="e.g. Google" placeholderTextColor="#64748B" value={company} onChangeText={setCompany} />

          <Text style={styles.inputLabel}>Contact Name (optional)</Text>
          <TextInput style={styles.input} placeholder="e.g. Jane Smith" placeholderTextColor="#64748B" value={contactName} onChangeText={setContactName} />

          <Text style={styles.inputLabel}>Date Sent</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setDateSentPickerVisible(true)}>
            <Text style={dateSent ? styles.dateText : styles.datePlaceholder}>{dateSent || 'Select a date (optional)'}</Text>
          </TouchableOpacity>
          {dateSentPickerVisible && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker value={selectedDateSent} mode="date" display="inline" locale="en-US" onChange={handleDateSentChange} textColor="#0F172A" accentColor="#0EA5E9" themeVariant="light" />
              <TouchableOpacity style={styles.dateConfirmButton} onPress={() => setDateSentPickerVisible(false)}>
                <Text style={styles.dateConfirmText}>✓ Confirm Date</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.inputLabel}>Follow Up Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setFollowUpPickerVisible(true)}>
            <Text style={followUpDate ? styles.dateText : styles.datePlaceholder}>{followUpDate || 'Select a date (optional)'}</Text>
          </TouchableOpacity>
          {followUpPickerVisible && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker value={selectedFollowUp} mode="date" display="inline" locale="en-US" onChange={handleFollowUpChange} textColor="#0F172A" accentColor="#0EA5E9" themeVariant="light" />
              <TouchableOpacity style={styles.dateConfirmButton} onPress={() => setFollowUpPickerVisible(false)}>
                <Text style={styles.dateConfirmText}>✓ Confirm Date</Text>
              </TouchableOpacity>
            </View>
          )}

          <Text style={styles.inputLabel}>Notes (optional)</Text>
          <TextInput style={[styles.input, styles.notesInput]} placeholder="Add any notes here..." placeholderTextColor="#64748B" value={notes} onChangeText={setNotes} multiline />

          <YesNoToggle label="Got a response?" value={response} onChange={setResponse} />
          <YesNoToggle label="Led to coffee chat?" value={coffeeChat} onChange={setCoffeeChat} />

          <TouchableOpacity style={styles.saveButton} onPress={handleAdd}>
            <Text style={styles.saveButtonText}>Save Outreach</Text>
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
            <Text style={styles.modalHeader}>Edit Outreach</Text>
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
            <Text style={editDateSent ? styles.dateText : styles.datePlaceholder}>{editDateSent || 'Select a date (optional)'}</Text>
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
            <Text style={editFollowUpDate ? styles.dateText : styles.datePlaceholder}>{editFollowUpDate || 'Select a date (optional)'}</Text>
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
            <Text style={[styles.deleteLabel, { fontSize: 15 }]}>Delete Outreach</Text>
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
  headerContainer: { backgroundColor: '#0F172A', paddingBottom: SP[4], paddingHorizontal: SP[6] },
  appName: { ...Type.appBrand },
  header: { ...Type.screenTitle },
  searchInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 9, paddingHorizontal: SP[3], marginTop: SP[3], color: '#FFFFFF', fontSize: 15 },
  scrollView: { flex: 1, padding: SP[4] },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  empty: { ...Type.cardTitle, fontSize: 18, marginBottom: SP[2] },
  emptySub: { ...Type.cardSubtitle, textAlign: 'center', marginBottom: 0 },
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
  deleteButton: { backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: 12, marginBottom: SP[2] + 2 },
  deleteLabel: { fontSize: 11, color: '#EF4444', fontWeight: '700' },
  fab: { position: 'absolute', right: SP[6], width: 58, height: 58, borderRadius: 29, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { color: 'white', fontSize: 32, fontWeight: '300', lineHeight: 36 },
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: SP[3], paddingHorizontal: SP[6] },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: SP[2], marginBottom: SP[4] },
  modalHeader: { ...Type.modalTitle },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP[6] },
  modalTitleActions: { flexDirection: 'row', alignItems: 'center', gap: SP[2] },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  inputLabel: { ...Type.label },
  input: { ...Type.body, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: SP[3] + 2, marginBottom: 18 },
  notesInput: { height: 100, textAlignVertical: 'top' },
  dateInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: SP[3] + 2, marginBottom: 18 },
  dateText: { ...Type.body },
  datePlaceholder: { fontSize: 16, color: '#64748B' },
  datePickerContainer: { backgroundColor: '#FFFFFF', borderRadius: 10, marginBottom: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  dateConfirmButton: { backgroundColor: '#0EA5E9', padding: SP[3], alignItems: 'center' },
  dateConfirmText: { ...Type.buttonLabel },
  toggleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP[3] + 2 },
  toggleLabel: { fontSize: 15, color: '#0F172A', fontWeight: '500' },
  toggleButtons: { flexDirection: 'row', gap: SP[2] },
  toggleButton: { borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 18, backgroundColor: '#FFFFFF' },
  toggleActive: { backgroundColor: '#0EA5E9', borderColor: '#0EA5E9' },
  toggleText: { color: '#64748B', fontSize: 14 },
  toggleTextActive: { color: 'white', fontWeight: '700' },
  scanButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 20, paddingVertical: 6, paddingHorizontal: SP[3] },
  scanButtonText: { fontSize: 13, color: '#0EA5E9', fontWeight: '600' },
  scanningBanner: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: SP[3], marginBottom: SP[4], alignItems: 'center' },
  scanningText: { color: '#0EA5E9', fontSize: 14, fontWeight: '600' },
  saveButton: { backgroundColor: '#0EA5E9', padding: SP[4], borderRadius: 12, alignItems: 'center', marginTop: SP[2] + 2 },
  saveButtonText: { ...Type.buttonLabel },
  cancelButton: { alignItems: 'center', marginTop: SP[3] },
  cancelText: { ...Type.link },
});
