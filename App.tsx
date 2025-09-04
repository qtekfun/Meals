/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */

import { NewAppScreen } from '@react-native/new-app-screen';
import React, { useState } from 'react';
import { Button } from 'react-native';
import SettingsScreen from './SettingsScreen';
import RNCalendarEvents from 'react-native-calendar-events';
// Helper to create a meal event in the selected calendar
type MealEventParams = {
  title: string;
  date: string;
  calendar: string;
  attendees: string[];
};

async function createMealEvent({ title, date, calendar, attendees }: MealEventParams): Promise<void> {
  await RNCalendarEvents.requestPermissions();
  // Find calendar by type
  const calendars = await RNCalendarEvents.findCalendars();
  let targetCalendar = calendars.find(c => {
    if (calendar === 'google') return c.type === 'com.google';
    if (calendar === 'icloud') return c.type === 'caldav';
    return false;
  });
  // Fallback to default calendar if not found
  const calendarId = targetCalendar ? targetCalendar.id : undefined;
  await RNCalendarEvents.saveEvent(title, {
    startDate: date,
    endDate: date,
    calendarId,
    notes: attendees.length > 0 ? `Attendees: ${attendees.join(', ')}` : undefined,
  });
}
import { StatusBar, StyleSheet, useColorScheme, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';

function App() {
  const isDarkMode = useColorScheme() === 'dark';

  return (
    <SafeAreaProvider>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const safeAreaInsets = useSafeAreaInsets();
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<{ calendar: string; emails: string[] } | null>(null);

  if (showSettings) {
    return (
      <SettingsScreen
        onSave={(s: { calendar: string; emails: string[] }) => {
          setSettings(s);
          setShowSettings(false);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      <NewAppScreen
        templateFileName="App.tsx"
        safeAreaInsets={safeAreaInsets}
      />
      <Button title="Settings" onPress={() => setShowSettings(true)} />
      <Button
        title="Add Sample Meal Event"
        onPress={async () => {
          if (!settings) return;
          await createMealEvent({
            title: 'Dinner: Pasta',
            date: new Date().toISOString(),
            calendar: settings.calendar,
            attendees: settings.emails,
          });
          // Use a simple feedback mechanism
          // ...existing code...
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});

export default App;
