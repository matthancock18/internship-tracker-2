import DateTimePicker from '@react-native-community/datetimepicker';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as Haptics from 'expo-haptics';
import * as Notifications from 'expo-notifications';
import * as StoreReview from 'expo-store-review';
import { useContext, useEffect, useRef, useState } from 'react';
import { ActionSheetIOS, ActivityIndicator, Alert, Animated, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Rect } from 'react-native-svg';
import { SP, SPRING_CONFIG, TIMING_CONFIG, Type } from '../../constants/designSystem';
import { ApplicationsContext } from './_layout';

export default function ApplicationsScreen() {
  const insets = useSafeAreaInsets();
  const { applications, setApplications, scannedImageUri, setScannedImageUri, setScanSource, scansLeft, isPro, consumeScan } = useContext(ApplicationsContext);
  const [modalVisible, setModalVisible] = useState(false);
  const [company, setCompany] = useState('');
  const [role, setRole] = useState('');
  const [dateApplied, setDateApplied] = useState('');
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [status, setStatus] = useState<string>('Applied');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [editCompany, setEditCompany] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editDateApplied, setEditDateApplied] = useState('');
  const [editSelectedDate, setEditSelectedDate] = useState(new Date());
  const [editDatePickerVisible, setEditDatePickerVisible] = useState(false);
  const [editStatus, setEditStatus] = useState('Applied');
  const [activeFilter, setActiveFilter] = useState('All');
  const [searchText, setSearchText] = useState('');
  const [scanning, setScanning] = useState(false);
  // ── Card animations — parallel array to `applications` ──
  const cardAnims = useRef<Animated.Value[]>([]);

  // Populate anims at value 1 when data first loads from storage
  useEffect(() => {
    if (cardAnims.current.length === 0 && applications.length > 0) {
      cardAnims.current = applications.map(() => new Animated.Value(1));
    }
  }, [applications]);

  // Follow-up date for add modal
  const [followUpDate, setFollowUpDate] = useState('');
  const [followUpSelectedDate, setFollowUpSelectedDate] = useState(new Date());
  const [followUpPickerVisible, setFollowUpPickerVisible] = useState(false);
  // Follow-up date for edit modal
  const [editFollowUpDate, setEditFollowUpDate] = useState('');
  const [editFollowUpSelectedDate, setEditFollowUpSelectedDate] = useState(new Date());
  const [editFollowUpPickerVisible, setEditFollowUpPickerVisible] = useState(false);
  const statuses = ['Applied', 'Interview', 'Offer', 'Rejected'];
  const statusColors = {
    'Applied': '#0EA5E9',
    'Interview': '#F59E0B',
    'Offer': '#10B981',
    'Rejected': '#EF4444',
  };

  const formatDate = (date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const scheduleFollowUpNotification = async (company: string, role: string, followUpDateStr: string): Promise<string | null> => {
    try {
      const date = new Date(followUpDateStr);
      if (isNaN(date.getTime()) || date <= new Date()) return null;
      date.setHours(9, 0, 0, 0);
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Follow-up Reminder',
          body: `Follow up on your ${role} application at ${company}`,
        },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date },
      });
      return id;
    } catch {
      return null;
    }
  };

  const cancelFollowUpNotification = async (notificationId: string | undefined) => {
    if (notificationId) {
      try { await Notifications.cancelScheduledNotificationAsync(notificationId); } catch {}
    }
  };

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
    const lowerText = text.toLowerCase();

    let detectedCompany = '';
    let detectedRole = '';

    // ── Helpers ──
    const isSentence = (s: string) =>
      /\b(we|you|your|they|our|have|has|are|is|was|will|please|thank|dear|hello|hi|excited|happy|pleased|invite|look forward)\b/i.test(s);

    const cleanRole = (s: string) =>
      s.replace(/^(?:for the|for a|for an|the|a|an)\s+/i, '')
       .replace(/\s+(?:position|role|opportunity|opening|posting|job)\.?$/i, '')
       .replace(/^(?:position|role|title)[:\s]+/i, '')
       .trim();

    const cleanCompany = (s: string) =>
      s.replace(/[,\.!?]+$/, '')
       .replace(/\s*\(.*?\)\s*$/, '')
       .trim();

    const isLikelyRole = (s: string) => {
      const low = s.toLowerCase();
      return (
        roleKeywords.some(k => low.includes(k)) &&
        !isSentence(s) &&
        s.length >= 4 &&
        s.length <= 80
      );
    };

    // ── Keywords ──
    const roleKeywords = [
      'intern', 'internship', 'engineer', 'developer', 'analyst', 'associate',
      'coordinator', 'manager', 'designer', 'scientist', 'consultant', 'specialist',
      'assistant', 'director', 'officer', 'architect', 'lead', 'researcher',
      'quantitative', 'quant', 'software', 'product', 'data', 'devops',
      'full-stack', 'full stack', 'frontend', 'backend', 'swe', 'sde', 'mle',
      'off-cycle', 'co-op', 'coop', 'placement', 'graduate', 'trainee',
    ];

    const knownCompanies: [string, string][] = [
      // Big tech
      ['google', 'Google'], ['alphabet', 'Alphabet'], ['youtube', 'YouTube'],
      ['apple', 'Apple'], ['microsoft', 'Microsoft'], ['amazon', 'Amazon'],
      ['aws', 'AWS'], ['meta', 'Meta'], ['facebook', 'Meta'], ['instagram', 'Meta'],
      ['netflix', 'Netflix'], ['tesla', 'Tesla'], ['uber', 'Uber'], ['lyft', 'Lyft'],
      ['airbnb', 'Airbnb'], ['stripe', 'Stripe'], ['square', 'Square'], ['block', 'Block'],
      ['twitter', 'Twitter'], ['x corp', 'X'], ['snapchat', 'Snapchat'],
      ['pinterest', 'Pinterest'], ['linkedin', 'LinkedIn'], ['spotify', 'Spotify'],
      ['shopify', 'Shopify'], ['palantir', 'Palantir'], ['databricks', 'Databricks'],
      ['snowflake', 'Snowflake'], ['confluent', 'Confluent'], ['datadog', 'Datadog'],
      ['cloudflare', 'Cloudflare'], ['nvidia', 'NVIDIA'], ['amd', 'AMD'],
      ['intel', 'Intel'], ['qualcomm', 'Qualcomm'], ['arm', 'ARM'],
      ['ibm', 'IBM'], ['cisco', 'Cisco'], ['oracle', 'Oracle'], ['adobe', 'Adobe'],
      ['salesforce', 'Salesforce'], ['servicenow', 'ServiceNow'], ['workday', 'Workday'],
      ['zoom', 'Zoom'], ['slack', 'Slack'], ['atlassian', 'Atlassian'],
      ['vmware', 'VMware'], ['twilio', 'Twilio'], ['okta', 'Okta'],
      ['splunk', 'Splunk'], ['palo alto networks', 'Palo Alto Networks'],
      ['crowdstrike', 'CrowdStrike'], ['intuit', 'Intuit'], ['paypal', 'PayPal'],
      ['ebay', 'eBay'], ['doordash', 'DoorDash'], ['instacart', 'Instacart'],
      ['roblox', 'Roblox'], ['epic games', 'Epic Games'], ['riot games', 'Riot Games'],
      // Finance
      ['goldman sachs', 'Goldman Sachs'], ['morgan stanley', 'Morgan Stanley'],
      ['jpmorgan', 'JPMorgan'], ['jp morgan', 'JPMorgan'],
      ['blackrock', 'BlackRock'], ['blackstone', 'Blackstone'],
      ['citadel', 'Citadel'], ['two sigma', 'Two Sigma'], ['jane street', 'Jane Street'],
      ['point72', 'Point72'], ['aqr', 'AQR Capital'], ['d.e. shaw', 'D.E. Shaw'],
      ['de shaw', 'D.E. Shaw'], ['bridgewater', 'Bridgewater'],
      ['virtu', 'Virtu Financial'], ['jump trading', 'Jump Trading'],
      ['wells fargo', 'Wells Fargo'], ['bank of america', 'Bank of America'],
      ['citibank', 'Citi'], ['citi', 'Citi'], ['barclays', 'Barclays'],
      ['hsbc', 'HSBC'], ['ubs', 'UBS'], ['deutsche bank', 'Deutsche Bank'],
      ['bloomberg', 'Bloomberg'], ['fidelity', 'Fidelity'],
      ['vanguard', 'Vanguard'], ['charles schwab', 'Charles Schwab'],
      // Consulting
      ['mckinsey', 'McKinsey'], ['bain', 'Bain & Company'],
      ['bcg', 'BCG'], ['boston consulting', 'BCG'],
      ['deloitte', 'Deloitte'], ['accenture', 'Accenture'],
      ['pwc', 'PwC'], ['kpmg', 'KPMG'], ['ey', 'EY'],
      ['ernst & young', 'EY'], ['oliver wyman', 'Oliver Wyman'],
    ];

    const domainToCompany: Record<string, string> = {
      google: 'Google', youtube: 'YouTube', alphabet: 'Alphabet',
      apple: 'Apple', microsoft: 'Microsoft', amazon: 'Amazon',
      meta: 'Meta', facebook: 'Meta', netflix: 'Netflix',
      tesla: 'Tesla', uber: 'Uber', lyft: 'Lyft', airbnb: 'Airbnb',
      stripe: 'Stripe', linkedin: 'LinkedIn', spotify: 'Spotify',
      shopify: 'Shopify', palantir: 'Palantir', nvidia: 'NVIDIA',
      intel: 'Intel', qualcomm: 'Qualcomm', ibm: 'IBM', cisco: 'Cisco',
      oracle: 'Oracle', adobe: 'Adobe', salesforce: 'Salesforce',
      twilio: 'Twilio', okta: 'Okta', zoom: 'Zoom', slack: 'Slack',
      atlassian: 'Atlassian', intuit: 'Intuit', paypal: 'PayPal',
      ebay: 'eBay', doordash: 'DoorDash', roblox: 'Roblox',
      datadog: 'Datadog', cloudflare: 'Cloudflare', databricks: 'Databricks',
      snowflake: 'Snowflake', crowdstrike: 'CrowdStrike',
      goldmansachs: 'Goldman Sachs', morganstanley: 'Morgan Stanley',
      jpmorgan: 'JPMorgan', blackrock: 'BlackRock', blackstone: 'Blackstone',
      citadel: 'Citadel', bloomberg: 'Bloomberg', fidelity: 'Fidelity',
      wellsfargo: 'Wells Fargo', bankofamerica: 'Bank of America',
      barclays: 'Barclays', hsbc: 'HSBC', deloitte: 'Deloitte',
      accenture: 'Accenture', mckinsey: 'McKinsey', bain: 'Bain & Company',
      bcg: 'BCG', pwc: 'PwC', kpmg: 'KPMG',
    };

    const personalDomains = new Set([
      'gmail', 'yahoo', 'outlook', 'hotmail', 'icloud', 'proton',
      'me', 'noreply', 'no-reply', 'donotreply', 'notifications',
      'mailer', 'mail', 'careers', 'jobs', 'talent', 'recruiting',
      'hr', 'info', 'hello', 'contact', 'apply',
    ]);

    // ── PASS 1: Explicit labeled fields ──
    for (const line of lines) {
      if (!detectedCompany) {
        const m = line.match(/^(?:company|employer|organization|firm|from)\s*[:\-]\s*(.+)/i);
        if (m) detectedCompany = cleanCompany(m[1].trim());
      }
      if (!detectedRole) {
        const m = line.match(/^(?:position|role|job\s*title|title|applying\s+for|applied\s+for|application\s+for)\s*[:\-]\s*(.+)/i);
        if (m) detectedRole = cleanRole(m[1].trim());
      }
    }

    // ── PASS 2: Known companies in full text ──
    if (!detectedCompany) {
      for (const [key, label] of knownCompanies) {
        if (lowerText.includes(key)) {
          detectedCompany = label;
          break;
        }
      }
    }

    // ── PASS 3: Sentence patterns — "Role at Company" ──
    const atPatterns = [
      // "applied for the Software Engineer Intern position at Google"
      /(?:applied?|applying)\s+(?:to\s+)?(?:for\s+)?(?:the\s+|a\s+|an\s+)?(.+?)\s+(?:position|role|opportunity|job|opening)?\s*(?:at|with|@)\s+([A-Z][A-Za-z0-9 &.,'()-]+?)(?=\s*[,\.\n!]|$)/i,
      // "application for Software Engineer at Amazon has been received"
      /application\s+(?:received\s+)?(?:for|to)\s+(?:the\s+)?(.+?)\s+(?:at|with|@)\s+([A-Z][A-Za-z0-9 &.,'()-]+?)(?=\s*[,\.\n!]|$)/i,
      // standalone "Software Engineer Intern at Google"
      /\b((?:[A-Z][a-zA-Z-]+ ){1,5}(?:Intern(?:ship)?|Engineer|Developer|Analyst|Manager|Designer|Scientist|Specialist|Associate|Consultant|Director|Researcher|Coordinator))\s+at\s+([A-Z][A-Za-z0-9 &.,'()-]+?)(?=\s*[,\.\n!]|$)/,
      // "thank you for your interest in the Data Analyst role at Stripe"
      /interest\s+in\s+(?:the\s+|a\s+)?(.+?)\s+(?:role|position|opportunity)?\s*(?:at|with)\s+([A-Z][A-Za-z0-9 &.,'()-]+?)(?=\s*[,\.\n!]|$)/i,
    ];

    for (const pattern of atPatterns) {
      const match = text.match(pattern);
      if (match) {
        const roleCandidate = cleanRole(match[1].trim());
        const companyCandidate = cleanCompany(match[2].trim());
        if (!detectedRole && isLikelyRole(roleCandidate)) detectedRole = roleCandidate;
        if (!detectedCompany && companyCandidate.length >= 2 && !isSentence(companyCandidate)) {
          detectedCompany = companyCandidate;
        }
        if (detectedRole && detectedCompany) break;
      }
    }

    // ── PASS 4: Email / domain extraction ──
    if (!detectedCompany) {
      const emailMatch = text.match(/[\w.+-]+@([\w-]+)\.(?:com|io|co|org|net|jobs|ai|tech)/i);
      if (emailMatch) {
        const domain = emailMatch[1].toLowerCase().replace(/-/g, '');
        if (domainToCompany[domain]) {
          detectedCompany = domainToCompany[domain];
        } else if (!personalDomains.has(domain) && domain.length > 2) {
          detectedCompany = domain.charAt(0).toUpperCase() + domain.slice(1);
        }
      }
    }
    if (!detectedCompany) {
      const domainMatch = text.match(/\b([\w-]+)\.(?:com|io|co\.uk|org|ai)\b/i);
      if (domainMatch) {
        const d = domainMatch[1].toLowerCase().replace(/-/g, '');
        if (domainToCompany[d]) detectedCompany = domainToCompany[d];
      }
    }

    // ── PASS 5: Line-by-line scan ──
    for (const line of lines) {
      // Role: prefer standalone title lines
      if (!detectedRole && isLikelyRole(line)) {
        detectedRole = cleanRole(line);
      }

      // Company: lines ending with a corporate suffix
      if (!detectedCompany) {
        const corpSuffixMatch = line.match(/^(.+?)\s*,?\s*(?:Inc\.?|LLC\.?|LLP\.?|Corp\.?|Ltd\.?|Limited|Technologies|Solutions|Capital|Partners|Ventures|Financial|Group|Holdings)\.?$/i);
        if (corpSuffixMatch) {
          const candidate = cleanCompany(line);
          if (candidate.length >= 2 && candidate.length <= 60 && !isSentence(candidate)) {
            detectedCompany = candidate;
          }
        }
      }

    }

    // ── PASS 6: Guarded company fallback ──
    // Only grab a short capitalized line from the first 8 lines as a last resort
    if (!detectedCompany) {
      const noisePattern = /^(?:\d|\d{1,2}:\d{2}|dear|hi |hello|to:|from:|date:|re:|subject:|share|via |the |a |an |application|internship|job|position|career|congratulations|thank|we |our |your |you )/i;
      for (const line of lines.slice(0, 8)) {
        if (
          line.length >= 2 && line.length <= 45 &&
          /^[A-Z]/.test(line) &&
          !isSentence(line) &&
          !/^\d/.test(line) &&
          !noisePattern.test(line)
        ) {
          detectedCompany = cleanCompany(line);
          break;
        }
      }
    }

    return { detectedCompany, detectedRole };
  };

  // ── OCR Scan Handler ──
  const handleScan = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        { options: ['Cancel', 'Take Photo', 'Choose from Library'], cancelButtonIndex: 0 },
        (buttonIndex) => {
          if (buttonIndex === 1) { setModalVisible(false); setTimeout(() => setScanSource('camera'), 300); }
          if (buttonIndex === 2) { setModalVisible(false); setTimeout(() => setScanSource('library'), 300); }
        }
      );
    } else {
      Alert.alert('Scan Document', 'Choose an option', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Take Photo', onPress: () => { setModalVisible(false); setTimeout(() => setScanSource('camera'), 300); } },
        { text: 'Choose from Library', onPress: () => { setModalVisible(false); setTimeout(() => setScanSource('library'), 300); } },
      ]);
    }
  };

  const processImage = async (uri: string) => {
    setScanning(true);
    try {
      const result = await TextRecognition.recognize(uri);
      const text = result.text;

      if (!text || text.trim().length === 0) {
        Alert.alert('No text found', 'Could not detect any text in this image. Try a clearer photo.');
        setScanning(false);
        return;
      }

      const { detectedCompany, detectedRole } = parseOCRText(text);

      if (detectedCompany) setCompany(detectedCompany);
      if (detectedRole) setRole(detectedRole);

      if (!detectedCompany && !detectedRole) {
        Alert.alert('Could not parse', "Text was detected but couldn't identify company or role. Please fill in the fields manually.");
      }
      consumeScan();
    } catch (e) {
      Alert.alert('Scan failed', 'Something went wrong. Please try again or fill in manually.');
    }
    setScanning(false);
  };

  const handleAdd = async () => {
    if (!company || !role) {
      Alert.alert('Missing Info', 'Please enter at least a company and role.');
      return;
    }
    const notificationId = followUpDate
      ? await scheduleFollowUpNotification(company, role, followUpDate)
      : null;

    // Create entrance animation before state update so the value exists on first render
    const entranceAnim = new Animated.Value(0);
    cardAnims.current.push(entranceAnim);

    const newCount = applications.length + 1;
    setApplications([...applications, { company, role, dateApplied, status, followUpDate, notificationId }]);
    setCompany(''); setRole(''); setDateApplied(''); setFollowUpDate('');
    setSelectedDate(new Date()); setFollowUpSelectedDate(new Date()); setStatus('Applied');
    setModalVisible(false);

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Animated.spring(entranceAnim, { toValue: 1, ...SPRING_CONFIG }).start();

    if (newCount === 3) {
      StoreReview.isAvailableAsync().then(available => {
        if (available) setTimeout(() => StoreReview.requestReview(), 1500);
      }).catch(() => {});
    }
  };

  const handleDelete = (index: number | null) => {
    if (index === null) return;
    const name = applications[index]?.company || 'this application';
    Alert.alert('Delete Application', `Delete ${name} application?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          setEditModalVisible(false);
          const anim = cardAnims.current[index];
          const doDelete = () => {
            cancelFollowUpNotification(applications[index]?.notificationId);
            cardAnims.current.splice(index, 1);
            setApplications(prev => prev.filter((_, i) => i !== index));
          };
          if (anim) {
            Animated.timing(anim, { toValue: 0, ...TIMING_CONFIG }).start(doDelete);
          } else {
            doDelete();
          }
        }},
    ]);
  };

  const handleOpenEdit = (app, index) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setEditIndex(index);
    setEditCompany(app.company);
    setEditRole(app.role);
    setEditDateApplied(app.dateApplied || '');
    setEditSelectedDate(app.dateApplied ? new Date(app.dateApplied) : new Date());
    setEditStatus(app.status);
    setEditFollowUpDate(app.followUpDate || '');
    setEditFollowUpSelectedDate(app.followUpDate ? new Date(app.followUpDate) : new Date());
    setEditModalVisible(true);
  };

  const handleSaveEdit = async () => {
    if (editIndex === null) return;
    if (!editCompany || !editRole) {
      Alert.alert('Missing Info', 'Please enter at least a company and role.');
      return;
    }
    const existing = applications[editIndex];
    // Cancel old notification if follow-up date changed
    if (existing?.notificationId && existing.followUpDate !== editFollowUpDate) {
      cancelFollowUpNotification(existing.notificationId);
    }
    const notificationId = editFollowUpDate && editFollowUpDate !== existing?.followUpDate
      ? await scheduleFollowUpNotification(editCompany, editRole, editFollowUpDate)
      : (editFollowUpDate ? existing?.notificationId : null);
    const updated = [...applications];
    updated[editIndex] = { company: editCompany, role: editRole, dateApplied: editDateApplied, status: editStatus, followUpDate: editFollowUpDate, notificationId };
    setApplications(updated);
    setEditModalVisible(false);
  };

  const handleFollowUpDateChange = (event, date) => {
    if (event.type === 'dismissed') { setFollowUpPickerVisible(false); return; }
    if (date) { setFollowUpSelectedDate(date); setFollowUpDate(formatDate(date)); }
    if (Platform.OS === 'android') setFollowUpPickerVisible(false);
  };

  const handleEditFollowUpDateChange = (event, date) => {
    if (event.type === 'dismissed') { setEditFollowUpPickerVisible(false); return; }
    if (date) { setEditFollowUpSelectedDate(date); setEditFollowUpDate(formatDate(date)); }
    if (Platform.OS === 'android') setEditFollowUpPickerVisible(false);
  };

  const handleEditDateChange = (event, date) => {
    if (event.type === 'dismissed') { setEditDatePickerVisible(false); return; }
    if (date) { setEditSelectedDate(date); setEditDateApplied(formatDate(date)); }
    if (Platform.OS === 'android') setEditDatePickerVisible(false);
  };

  const filtered = applications
    .map((app, origIdx) => ({ app, origIdx }))
    .filter(({ app }) => activeFilter === 'All' || app.status === activeFilter)
    .filter(({ app }) => {
      if (!searchText) return true;
      const q = searchText.toLowerCase();
      return app.company?.toLowerCase().includes(q) || app.role?.toLowerCase().includes(q);
    })
    .reverse();

  return (
    <View style={styles.container}>
      <View style={[styles.headerContainer, { paddingTop: insets.top }]}>
        <Text style={styles.appName}>Trax</Text>
        <Text style={styles.header}>Applications</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Search company or role..."
          placeholderTextColor="rgba(255,255,255,0.4)"
          value={searchText}
          onChangeText={setSearchText}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
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
              onPress={() => {
                if (activeFilter !== f) {
                  Haptics.selectionAsync();
                  setActiveFilter(f);
                }
              }}>
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
          filtered.map(({ app, origIdx }, i) => {
            const anim = cardAnims.current[origIdx] ?? new Animated.Value(1);
            return (
            <Animated.View
              key={origIdx}
              style={{
                opacity: anim,
                transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [10, 0] }) }],
              }}>
              <TouchableOpacity style={styles.card} onPress={() => handleOpenEdit(app, origIdx)}>
                <View style={styles.cardInner}>
                  <View style={styles.cardLeft}>
                    <Text style={styles.company}>{app.company}</Text>
                    <Text style={styles.role}>{app.role}</Text>
                    {app.dateApplied ? <Text style={styles.date}>{app.dateApplied}</Text> : null}
                    {app.followUpDate ? <Text style={styles.followUpDate}>🔔 Follow up: {app.followUpDate}</Text> : null}
                    <View style={{ alignSelf: 'flex-start' }}>
                      <View style={[styles.statusBadge, { backgroundColor: (statusColors[app.status] ?? '#64748B') + '22' }]}>
                        <Text style={[styles.statusText, { color: statusColors[app.status] ?? '#64748B' }]}>
                          {app.status === 'Not Yet Open' ? 'Applied' : app.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            </Animated.View>
          );})
        )}
      </ScrollView>

      <TouchableOpacity style={[styles.fab, { bottom: insets.bottom + SP[4] }]} onPress={() => setModalVisible(true)}>
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* ── Add Modal ── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView style={styles.modalContainer} keyboardShouldPersistTaps="handled">
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
                  : <Text style={styles.scanButtonText}>
                      📷 Scan{!isPro && scansLeft <= 5 ? ` (${scansLeft} left)` : ''}
                    </Text>
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

          <Text style={styles.inputLabel}>Follow-Up Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setFollowUpPickerVisible(true)}>
            <Text style={followUpDate ? styles.dateText : styles.datePlaceholder}>
              {followUpDate || 'Set a follow-up reminder (optional)'}
            </Text>
          </TouchableOpacity>
          {followUpDate ? (
            <TouchableOpacity onPress={() => setFollowUpDate('')} style={{ marginTop: -12, marginBottom: 12 }}>
              <Text style={{ color: '#EF4444', fontSize: 13 }}>✕ Clear follow-up date</Text>
            </TouchableOpacity>
          ) : null}
          {followUpPickerVisible && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={followUpSelectedDate}
                mode="date"
                display="inline"
                locale="en-US"
                onChange={handleFollowUpDateChange}
                textColor="#0F172A"
                accentColor="#0EA5E9"
                themeVariant="light"
              />
              <TouchableOpacity style={styles.dateConfirmButton} onPress={() => setFollowUpPickerVisible(false)}>
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
        </KeyboardAvoidingView>
      </Modal>

      {/* ── Edit Modal ── */}
      <Modal
        visible={editModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setEditModalVisible(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.modalHandle} />
        <ScrollView style={styles.modalContainer} keyboardShouldPersistTaps="handled">
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

          <Text style={styles.inputLabel}>Follow-Up Date</Text>
          <TouchableOpacity style={styles.dateInput} onPress={() => setEditFollowUpPickerVisible(true)}>
            <Text style={editFollowUpDate ? styles.dateText : styles.datePlaceholder}>
              {editFollowUpDate || 'Set a follow-up reminder (optional)'}
            </Text>
          </TouchableOpacity>
          {editFollowUpDate ? (
            <TouchableOpacity onPress={() => setEditFollowUpDate('')} style={{ marginTop: -12, marginBottom: 12 }}>
              <Text style={{ color: '#EF4444', fontSize: 13 }}>✕ Clear follow-up date</Text>
            </TouchableOpacity>
          ) : null}
          {editFollowUpPickerVisible && (
            <View style={styles.datePickerContainer}>
              <DateTimePicker
                value={editFollowUpSelectedDate}
                mode="date"
                display="inline"
                locale="en-US"
                onChange={handleEditFollowUpDateChange}
                textColor="#0F172A"
                accentColor="#0EA5E9"
                themeVariant="light"
              />
              <TouchableOpacity style={styles.dateConfirmButton} onPress={() => setEditFollowUpPickerVisible(false)}>
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
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  // ── Screen shell ──
  container: { flex: 1, backgroundColor: '#F8FAFC' },
  headerContainer: { backgroundColor: '#0F172A', paddingBottom: SP[3], paddingHorizontal: SP[6] },
  appName: { ...Type.appBrand },
  header: { ...Type.screenTitle },
  scrollView: { flex: 1, padding: SP[4] },

  // ── Search ──
  searchInput: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 10, paddingVertical: 9, paddingHorizontal: SP[3], marginTop: SP[3], color: '#FFFFFF', fontSize: 15 },

  // ── Filter pills ──
  filterRow: { marginTop: SP[2] },
  filterContent: { gap: SP[2], paddingBottom: 2 },
  filterPill: { borderWidth: 1, borderColor: 'rgba(255,255,255,0.2)', borderRadius: 20, paddingVertical: 6, paddingHorizontal: SP[3], backgroundColor: 'rgba(255,255,255,0.1)' },
  filterPillText: { ...Type.caption, color: '#FFFFFF' },

  // ── Empty state ──
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  empty: { ...Type.cardTitle, fontSize: 18, marginBottom: SP[2] },
  emptySub: { ...Type.cardSubtitle, textAlign: 'center', marginBottom: 0 },

  // ── Cards ──
  card: { backgroundColor: '#FFFFFF', padding: SP[4], borderRadius: 12, marginBottom: SP[2] + 2, borderWidth: 1, borderColor: '#E2E8F0' },
  cardInner: { flexDirection: 'row', alignItems: 'center' },
  cardLeft: { flex: 1 },
  company: { ...Type.cardTitle, flex: 1 },
  role: { ...Type.cardSubtitle },
  date: { ...Type.cardMeta },
  followUpDate: { fontSize: 12, color: '#F59E0B', marginBottom: SP[1] },
  statusBadge: { borderRadius: 20, paddingVertical: 3, paddingHorizontal: SP[2] + 2 },
  statusText: { ...Type.caption },
  // ── Swipe-to-delete ──
  deleteButton: { backgroundColor: '#FEE2E2', justifyContent: 'center', alignItems: 'center', width: 80, borderRadius: 12, marginBottom: SP[2] + 2 },
  deleteText: { fontSize: 22 },
  deleteLabel: { fontSize: 11, color: '#EF4444', fontWeight: '700' },

  // ── FAB ──
  fab: { position: 'absolute', right: SP[6], width: 58, height: 58, borderRadius: 29, backgroundColor: '#0EA5E9', alignItems: 'center', justifyContent: 'center', shadowColor: '#0EA5E9', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 8, elevation: 6 },
  fabText: { color: 'white', fontSize: 32, fontWeight: '300', lineHeight: 36 },

  // ── Modal shell ──
  modalContainer: { flex: 1, backgroundColor: '#F8FAFC', paddingTop: SP[3], paddingHorizontal: SP[6] },
  modalHandle: { width: 40, height: 4, backgroundColor: '#E2E8F0', borderRadius: 2, alignSelf: 'center', marginTop: SP[2], marginBottom: SP[4] },
  modalHeader: { ...Type.modalTitle },
  modalTitleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SP[6] },
  modalTitleActions: { flexDirection: 'row', alignItems: 'center', gap: SP[2] },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center' },
  closeButtonText: { fontSize: 14, color: '#64748B', fontWeight: '600' },

  // ── Scan button ──
  scanButton: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#EFF6FF', borderWidth: 1, borderColor: '#BAE6FD', borderRadius: 20, paddingVertical: 6, paddingHorizontal: SP[3] },
  scanButtonText: { fontSize: 13, color: '#0EA5E9', fontWeight: '600' },
  scanningBanner: { backgroundColor: '#EFF6FF', borderRadius: 10, padding: SP[3], marginBottom: SP[4], alignItems: 'center' },
  scanningText: { color: '#0EA5E9', fontSize: 14, fontWeight: '600' },

  // ── Form fields ──
  inputLabel: { ...Type.label },
  input: { ...Type.body, backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: SP[3] + 2, marginBottom: 18 },
  dateInput: { backgroundColor: '#FFFFFF', borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, padding: SP[3] + 2, marginBottom: 18 },
  dateText: { ...Type.body },
  datePlaceholder: { fontSize: 16, color: '#64748B' },
  datePickerContainer: { backgroundColor: '#FFFFFF', borderRadius: 10, marginBottom: 18, overflow: 'hidden', borderWidth: 1, borderColor: '#E2E8F0' },
  dateConfirmButton: { backgroundColor: '#0EA5E9', padding: SP[3], alignItems: 'center' },
  dateConfirmText: { ...Type.buttonLabel },

  // ── Status picker ──
  statusList: { marginBottom: SP[4] + 4 },
  statusOption: { padding: SP[3] + 2, borderWidth: 1, borderColor: '#E2E8F0', borderRadius: 10, marginBottom: SP[2], flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFFFFF' },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: SP[2] + 2 },
  statusDot: { width: 10, height: 10, borderRadius: 5 },
  statusOptionText: { fontSize: 15, color: '#64748B' },

  // ── Action buttons ──
  saveButton: { backgroundColor: '#0EA5E9', padding: SP[4], borderRadius: 12, alignItems: 'center', marginTop: SP[2] + 2 },
  saveButtonText: { ...Type.buttonLabel },
  cancelButton: { alignItems: 'center', marginTop: SP[3] },
  cancelText: { ...Type.link },
});