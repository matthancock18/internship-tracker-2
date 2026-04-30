import AsyncStorage from '@react-native-async-storage/async-storage';
import * as ImagePicker from 'expo-image-picker';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const ApplicationsContext = React.createContext(null);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [applications, setApplications] = useState([]);
  const [emails, setEmails] = useState([]);
  const [scannedImageUri, setScannedImageUri] = useState<string | null>(null);
  const [scanRequested, setScanRequested] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        const savedApplications = await AsyncStorage.getItem('applications');
        const savedEmails = await AsyncStorage.getItem('emails');
        if (savedApplications) setApplications(JSON.parse(savedApplications));
        if (savedEmails) setEmails(JSON.parse(savedEmails));
      } catch (e) {
        console.log('Error loading data', e);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const saveData = async () => {
      try {
        await AsyncStorage.setItem('applications', JSON.stringify(applications));
        await AsyncStorage.setItem('emails', JSON.stringify(emails));
      } catch (e) {
        console.log('Error saving data', e);
      }
    };
    saveData();
  }, [applications, emails]);

  // Runs picker at root level — no modal context interference
  useEffect(() => {
    if (!scanRequested) return;
    setScanRequested(false);

   const launchPicker = async () => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  console.log('Photo library permission status:', status);
  if (status !== 'granted') {
    Alert.alert('Permission Required', 'Please allow photo access in Settings → App Trax → Photos');
    return;
  }
  try {
    console.log('About to launch picker...');
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 1,
    });
    console.log('Picker result:', result.canceled ? 'canceled' : result.assets[0].uri);
    if (!result.canceled) {
      setScannedImageUri(result.assets[0].uri);
    }
  } catch (e) {
    console.log('Picker error:', e);
    Alert.alert('Error', String(e));
  }
};

    // Small delay to ensure any modal animation has fully completed
    setTimeout(launchPicker, 500);
  }, [scanRequested]);

  return (
    <ApplicationsContext.Provider value={{
      applications,
      setApplications,
      emails,
      setEmails,
      scannedImageUri,
      setScannedImageUri,
      setScanRequested,
    }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: '#0EA5E9',
          tabBarInactiveTintColor: '#64748B',
          tabBarStyle: {
            backgroundColor: '#0F172A',
            borderTopColor: '#1E293B',
            borderTopWidth: 1,
          },
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Applications',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="emails"
          options={{
            title: 'Emails',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          }}
        />
      </Tabs>
    </ApplicationsContext.Provider>
  );
}