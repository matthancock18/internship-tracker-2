import DateTimePicker from '@react-native-community/datetimepicker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import Svg, { Circle, Rect } from 'react-native-svg';
import { ApplicationsContext } from './_layout';

export default function ApplicationsScreen() {
  const { applications, setApplications, scannedImageUri, setScannedImageUri, setScanRequested } = useContext(ApplicationsContext);
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
  const [scanning, setScanning] = useState(false);

  const statuses = ['Not Yet Open', 'Applied', 'Interview', 'Offer', 'Rejected'];
  const statusColors = {
    'Not Yet Open': '#64748B',
    'Applied': '#0EA5E9',
    'Interview': '#F59E0B',
    'Offer': '#10B981',
    'Rejected': '#EF4444',
  };

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const handleDateChange = (event, date) => {
    if (event.type === 'dismissed') { setDatePickerVisible(false); return; }
    if (date) { setSelectedDate(date); setDateApplied(formatDate(date)); }
    if (Platform.OS === 'android') setDatePickerVisible(false);
  };

  // Watch for scanned image coming back from root level picker
  useEffect(() => {
    if (!scannedImageUri) return;
    setScannedImageUri(null);
    setModalVisible(true);
    setTimeout(() => processImage(scannedImageUri), 400);
  }, [scannedImageUri]);

  // ── OCR Parser ──
  const parseOCRText = (text: string) => {
    const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

    let detectedCompany = '';
    let detectedRole = '';
    let detectedDate = '';

    const roleKeywords = [
      'intern', 'internship', 'engineer', 'developer', 'analyst', 'associate',
      'coordinator', 'manager', 'designer', 'scientist', 'consultant', 'specialist',
      'assistant', 'director', 'officer', 'architect', 'lead', 'head', 'off-cycle',
    ];

    const companyKeywords = [
      'inc', 'llc', 'corp', 'ltd', 'co.', 'company', 'technologies', 'tech',
      'group', 'solutions', 'labs', 'studio', 'studios', 'sachs', 'stanley',
      'fargo', 'chase', 'capital', 'partners', 'ventures', 'bank', 'financial',
    ];

    const knownCompanies = [
      'goldman sachs', 'morgan stanley', 'apple', 'google', 'microsoft', 'amazon',
      'meta', 'netflix', 'tesla', 'uber', 'airbnb', 'stripe', 'jpmorgan', 'blackrock',
      'deloitte', 'mckinsey', 'bain', 'bcg', 'accenture', 'salesforce', 'oracle',
      'citibank', 'citi', 'wells fargo', 'bank of america', 'barclays', 'hsbc',
      'bloomberg', 'blackstone', 'citadel', 'two sigma', 'jane street', 'palantir',
      'spotify', 'linkedin', 'twitter', 'snapchat', 'pinterest', 'shopify', 'square',
      'nvidia', 'amd', 'intel', 'qualcomm', 'ibm', 'cisco', 'adobe', 'vmware',
    ];

    const datePatterns = [
      /\b(jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/i,
      /\b\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}\b/,
      /\b\d{4}[\/\-]\d{1,2}[\/\-]\d{1,2}\b/,
    ];

    const fullText = text.toLowerCase();

    // 1. Check known companies against full text (handles multi-word names)
    for (const known of knownCompanies) {
      if (fullText.includes(known)) {
        detectedCompany = known.replace(/\b\w/g, c => c.toUpperCase());
        break;
      }
    }

    // 2. Check domain name (e.g. goldmansachs.com -> Goldman Sachs)
    if (!detectedCompany) {
      const domainMatch = text.match(/([a-zA-Z]+)\.com/i);
      if (domainMatch) {
        const domain = domainMatch[1].toLowerCase();
        const domainToCompany: Record<string, string> = {
          goldmansachs: 'Goldman Sachs',
          morganstanley: 'Morgan Stanley',
          jpmorgan: 'JPMorgan',
          wellsfargo: 'Wells Fargo',
          bankofamerica: 'Bank of America',
          bloomberg: 'Bloomberg',
          blackstone: 'Blackstone',
          citadel: 'Citadel',
          palantir: 'Palantir',
          deloitte: 'Deloitte',
          accenture: 'Accenture',
          salesforce: 'Salesforce',
          linkedin: 'LinkedIn',
          spotify: 'Spotify',
          shopify: 'Shopify',
          nvidia: 'NVIDIA',
        };
        if (domainToCompany[domain]) {
          detectedCompany = domainToCompany[domain];
        } else {
          console.log('Domain match:', domainMatch ? domainMatch[1] : 'none');
          // Capitalize domain as fallback company name
          detectedCompany = domain.charAt(0).toUpperCase() + domain.slice(1);
        }
      }
    }

    // 3. Line-by-line scan for role, company keywords, and dates
    for (const line of lines) {
      const lower = line.toLowerCase();

      // Role detection
      if (!detectedRole && roleKeywords.some(k => lower.includes(k))) {
        if (line.length > 5 && !lower.match(/^(internship|engineer|analyst|associate)$/)) {
          detectedRole = line;
        }
      }

      // Company from line keywords (if not found yet)
      if (!detectedCompany && companyKeywords.some(k => lower.includes(k))) {
        detectedCompany = line.replace(/^(from|company|employer|organization|at|@)\s*[:\-]?\s*/i, '').trim();
      }

      // Date detection
      if (!detectedDate) {
        for (const pattern of datePatterns) {
          const match = line.match(pattern);
          if (match) {
            const parsed = new Date(match[0]);
            if (!isNaN(parsed.getTime())) {
              detectedDate = formatDate(parsed);
            } else {
              detectedDate = match[0];
            }
            break;
          }
        }
      }
    }

    // 4. Fallback: first clean short line as company (skip timestamps, UI text)
    if (!detectedCompany && lines.length > 0) {
      const firstShortLine = lines.find(l =>
        l.length > 2 && l.length < 40 &&
        !l.match(/^(\d+:\d+|dear|hi|hello|to|from|date|re:|subject|share|application|eligibility|internship|whether|we |our )/i)
      );
      if (firstShortLine) detectedCompany = firstShortLine;
    }

    return { detectedCompany, detectedRole, detectedDate };
  };

  // ── OCR Scan Handler ──
  const handleScan = async () => {
    setModalVisible(false);
    setTimeout(() => setScanRequested(true), 300);
  };

  const processImage = async (uri: string) => {
    setScanning(true);
    console.log('processImage called with uri:', uri);
    try {
      console.log('Calling TextRecognition.recognize...');
      const result = await TextRecognition.recognize(uri);
      console.log('Recognition complete');
      const text = result.text;
      console.log('OCR lines:', text.split('\n').map((l, i) => `${i}: "${l.trim()}"`).join('\n'));
      console.log('OCR raw text:', text);

      if (!text || text.trim().length === 0) {
        Alert.alert('No text found', 'Could not detect any text in this image. Try a clearer photo.');
        setScanning(false);
        return;
      }

      const { detectedCompany, detectedRole, detectedDate } = parseOCRText(text);

      if (detectedCompany) setCompany(detectedCompany);
      if (detectedRole) setRole(detectedRole);
      if (detectedDate) setDateApplied(detectedDate);

      if (!detectedCompany && !detectedRole) {
        Alert.alert('Could not parse', "Text was detected but couldn't identify company or role. Please fill in the fields manually.");
      }
    } catch (e) {
      Alert.alert('Scan failed', 'Something went wrong. Please try again or fill in manually.');
      console.log('OCR error:', e);
    }
    setScanning(false);
  };

  const handleAdd = () => {
    if (!company || !role) {
      Alert.alert('Missing Info', 'Please enter at least a company and role.');
      return;
    }
    setApplications([...applications, { company, role, dateApplied, status }]);
    setCompany(''); setRole(''); setDateApplied('');
    setSelectedDate(new Date()); setStatus('Applied');
    setModalVisible(false);
  };

  const handleDelete = (index) => {
    Alert.alert('Delete Application', 'Are you sure you want to delete this application?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () =>
          setApplications(applications.filter((_, i) => i !== index)) },
    ]);
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

  const filtered = applications.filter(
    (a) => activeFilter === 'All' || a.status === activeFilter
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.appName}>App Trax</Text>
        <Text style={styles.header}>Applications</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterRow}
          contentContainerStyle={styles.filterContent}>
          {['All', ...statuses].map((f) => (
            <TouchableOpacity
              key={f}
              style={[
                styles.filterPill,
                activeFilter === f && {
                  backgroundColor: f === 'All' ? '#0EA5E9' : statusColors[f],
                  borderColor: f === 'All' ? '#0EA5E9' : statusColors[f],
                },
              ]}
              onPress={() => setActiveFilter(f)}>
              <Text style={[styles.filterPillText, activeFilter === f && { color: '#FFFFFF' }]}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <ScrollView style={styles.scrollView}>
        {filtered.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Svg width="160" height="160" viewBox="0 0 160 160">
              <Circle cx="80" cy="80" r="70" fill="#EFF6FF" />
              <Rect x="45" y="40" width="70" height="85" rx="8" fill="#FFFFFF" stroke="#E2E8F0" strokeWidth="2" />
              <Rect x="62" y="34" width="36" height="14" rx="7" fill="#0EA5E9" />
              <Rect x="57" y="65" width="46" height="5" rx="2.5" fill="#E2E8F0" />
              <Rect x="57" y="78" width="36" height="5" rx="2.5" fill="#E2E8F0" />
              <Rect x="57" y="91" width="40" height="5" rx="2.5" fill="#E2E8F0" />
              <Circle cx="110" cy="115" r="16" fill="#0EA5E9" />
              <Rect x="109" y="107" width="2" height="16" rx="1" fill="#FFFFFF" />
              <Rect x="102" y="114" width="16" height="2" rx="1" fill="#FFFFFF" />
            </Svg>
            <Text style={styles.empty}>No applications yet</Text>
            <Text style={styles.emptySub}>Tap + to track your first internship application</Text>
          </View>
        ) : (
          filtered.map((app, index) => (
            <Swipeable key={index} renderRightActions={() => renderRightActions(index)}>
              <TouchableOpacity style={styles.card} onPress={() => handleOpenEdit(app, index)}>
                <View style={styles.cardInner}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.company}>{app.company}</Text>
                    <Text style={styles.role}>{app.role}</Text>
                    {app.dateApplied ? <Text style={styles.date}>{app.dateApplied}</Text> : null}
                    <View style={{ alignSelf: 'flex-start' }}>
                      <View style={[styles.statusBadge, { backgroundColor: statusColors[app.status] + '22' }]}>
                        <Text style={[styles.statusText, { color: statusColors[app.status] }]}>
                          {app.status}
                        </Text>
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

      {/* ── Add Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}>
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalHandle} />
          <View style={styles.modalTitleRow}>
            <Text style={styles.modalHeader}>New Application</Text>
            <View style={styles.modalTitleActions}>
              <TouchableOpacity
                style={styles.scanButton}
                onPress={handleScan}
                disabled={scanning}>
                {scanning
                  ? <ActivityIndicator size="small" color="#0EA5E9" />
                  : <Text style={styles.scanButtonText}>📷 Scan</Text>
                }
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeButton}>
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
          </View>

          {scanning && (
            <View style={styles.scanningBanner}>
              <Text style={styles.scanningText}>Scanning document...</Text>
            </View>
          )}

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
              <TouchableOpacity style={styles.dateConfirmButton} onPress={() => setDatePickerVisible(false)}>
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

      {/* ── Edit Modal ── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalHandle} />
        <ScrollView style={styles.modalContainer}>
          <View style={styles.modalTitleRow}>
            <Text style={styles.modalHeader}>Edit Application</Text>
            <TouchableOpacity onPress={() => setEditModalVisible(false)} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>

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
                value={editSelectedDate}
                mode="date"
                display="inline"
                locale="en-US"
                onChange={handleEditDateChange}
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
          <TouchableOpacity
            style={[styles.deleteButton, { width: '100%', borderRadius: 12, height: 52, marginBottom: 0 }]}
            onPress={() => handleDelete(editIndex)}>
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
  empty: { color: '#0F172A', fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  emptySub: { color: '#64748B', fontSize: 14, textAlign: 'center' },
  card: { backgroundColor: '#FFFFFF', padding: 16, borderRadius: 12, marginBottom: 10, borderWidth: 1, borderColor: '#E2E8F0' },
  cardInner: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cardLeft: { flex: 1 },
  company: { fontSize: 17, fontWeight: 'bold', color: '#0F172A', flex: 1 },
  role: { fontSize: 14, color: '#64748B', marginBottom: 6 },
  date: { fontSize: 12, color: '#94A3B8', marginBottom: 4 },
  statusBadge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: 10 },
  statusText: { fontSize: 11, fontWeight: 'bold' },
  swipeHint: { marginLeft: 12, opacity: 0.3, alignItems: 'center' },
  swipeArrow: { fontSize: 16, color: '#94A3B8' },
  deleteButton: { backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: 12, marginBottom: 10 },
  deleteText: { fontSize: 22 },
  deleteLabel: { fontSize: 11, color: '#EF4444', fontWeight: 'bold' },
  fab: { position: 'absolute', bottom: 24, right: 24, width: 58, height: 58, borderRadius: 29, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { color: 'white', fontSize: 32, fontWeight: '300', lineHeight: 36 },
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: 12, paddingHorizontal: 20 },
  modalHeader: { fontSize: 26, fontWeight: 'bold', color: '#0F172A' },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: 8, marginBottom: 16 },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  modalTitleActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { fontSize: 14, color: '#64748B', fontWeight: '600' },
  scanButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 20, paddingVertical: 6, paddingHorizontal: 12 },
  scanButtonText: { fontSize: 13, color: '#0EA5E9', fontWeight: '600' },
  scanningBanner: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: 12, marginBottom: 16, alignItems: 'center' },
  scanningText: { color: '#0EA5E9', fontSize: 14, fontWeight: '600' },
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