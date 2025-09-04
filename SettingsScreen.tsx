import React, { useState } from 'react';
import { View, Text, TextInput, Button, Platform, Picker } from 'react-native';

const calendarOptions = Platform.OS === 'ios'
  ? [
      { label: 'iCloud', value: 'icloud' },
      { label: 'Google', value: 'google' },
    ]
  : [
      { label: 'Google', value: 'google' },
    ];

export default function SettingsScreen({ onSave }) {
  const [calendar, setCalendar] = useState(calendarOptions[0].value);
  const [emails, setEmails] = useState('');

  return (
    <View style={{ padding: 20 }}>
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>Calendar Settings</Text>
      <Text style={{ marginTop: 10 }}>Select calendar to store events:</Text>
      <Picker
        selectedValue={calendar}
        onValueChange={setCalendar}
        style={{ marginVertical: 10 }}
      >
        {calendarOptions.map(opt => (
          <Picker.Item key={opt.value} label={opt.label} value={opt.value} />
        ))}
      </Picker>
      <Text>Family member emails (comma separated):</Text>
      <TextInput
        value={emails}
        onChangeText={setEmails}
        placeholder="email1@example.com, email2@example.com"
        style={{ borderWidth: 1, borderColor: '#ccc', padding: 8, marginVertical: 10 }}
      />
      <Button
        title="Save Settings"
        onPress={() => onSave({ calendar, emails: emails.split(',').map(e => e.trim()) })}
      />
    </View>
  );
}
