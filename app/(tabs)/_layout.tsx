import AsyncStorage from '@react-native-async-storage/async-storage';
import { Tabs } from 'expo-router';
import React, { useEffect, useState } from 'react';

import { HapticTab } from '@/components/haptic-tab';
import { IconSymbol } from '@/components/ui/icon-symbol';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export const ApplicationsContext = React.createContext(null);

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const [applications, setApplications] = useState([]);
  const [emails, setEmails] = useState([]);

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

  return (
    <ApplicationsContext.Provider value={{ applications, setApplications, emails, setEmails }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
          tabBarButton: HapticTab,
        }}>
        <Tabs.Screen
          name="dashboard"
          options={{
            title: 'Dashboard',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="chart.bar.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="index"
          options={{
            title: 'Applications',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="house.fill" color={color} />,
          }}
        />
        <Tabs.Screen
          name="explore"
          options={{
            title: 'Emails',
            tabBarIcon: ({ color }) => <IconSymbol size={28} name="paperplane.fill" color={color} />,
          }}
        />
      </Tabs>
    </ApplicationsContext.Provider>
  );
}