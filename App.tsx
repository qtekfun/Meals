

import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, Button, Modal, TextInput, FlatList, TouchableOpacity, Alert, ScrollView } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNCalendarEvents, { Calendar } from 'react-native-calendar-events';

type Settings = {
  calendarId: string;
  emails: string[];
};

type Day = {
  key: string;
  label: string;
};

const Tab = createBottomTabNavigator();

// Helpers para fechas
function getNext7Days(): Day[] {
  const days: Day[] = [];
  const today = new Date();
  for (let i = 0; i < 7; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    days.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'short' })
    });
  }
  return days;
}

interface MenuScreenProps {
  settings: Settings;
  onFirstConfig: () => void;
}
function MenuScreen({ settings, onFirstConfig }: MenuScreenProps) {
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedDay, setSelectedDay] = useState<Day | null>(null);
  const [selectedType, setSelectedType] = useState<string>('');
  const [menuText, setMenuText] = useState<string>('');
  const days = getNext7Days();

  const openMenuModal = (day: Day, type: string) => {
    setSelectedDay(day);
    setSelectedType(type);
    setMenuText('');
    setModalVisible(true);
  };

  const saveMenu = async () => {
    if (!menuText.trim() || !selectedDay) return;
    try {
      await RNCalendarEvents.requestPermissions();
      const eventNotes = settings.emails.length > 0
        ? `Menú: ${menuText}\n\nInvitados:\n${settings.emails.map(email => `- ${email}`).join('\n')}`
        : `Menú: ${menuText}`;

      await RNCalendarEvents.saveEvent(`${selectedType} - ${menuText}`, {
        startDate: `${selectedDay.key}T13:00:00.000Z`,
        endDate: `${selectedDay.key}T14:00:00.000Z`,
        calendarId: settings.calendarId,
        notes: eventNotes,
      });
      setModalVisible(false);
      Alert.alert('Evento creado', `El menú se ha guardado en el calendario${settings.emails.length ? ' con los invitados en las notas' : ''}.`);
    } catch (e) {
      Alert.alert('Error', 'No se pudo crear el evento.');
    }
  };

  if (!settings || !settings.calendarId) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Configura la app para continuar</Text>
        <Button title="Configurar" onPress={onFirstConfig} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16 }}>
      <FlatList
        data={days}
        renderItem={({ item }) => (
          <View style={{ marginBottom: 16, padding: 12, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>{item.label}</Text>
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <Button title="Comida" onPress={() => openMenuModal(item, 'Comida')} />
              <Button title="Cena" onPress={() => openMenuModal(item, 'Cena')} />
            </View>
          </View>
        )}
        keyExtractor={(item: Day) => item.key}
      />
      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008' }}>
          <View style={{ backgroundColor: 'white', padding: 24, borderRadius: 12, width: '80%' }}>
            <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Menú para {selectedType} ({selectedDay ? selectedDay.label : ''})</Text>
            <TextInput
              placeholder="Escribe el menú"
              value={menuText}
              onChangeText={setMenuText}
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8, marginBottom: 16 }}
            />
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Button title="Cancelar" onPress={() => setModalVisible(false)} />
              <Button title="Guardar" onPress={saveMenu} />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

interface SettingsScreenProps {
  settings: Settings;
  setSettings: (s: Settings) => void;
  onFinish?: () => void;
}
function SettingsScreen({ settings, setSettings, onFinish }: SettingsScreenProps) {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [selectedCalendar, setSelectedCalendar] = useState<string>(settings.calendarId || '');
  const [emails, setEmails] = useState<string[]>(settings.emails || []);
  const [emailInput, setEmailInput] = useState<string>('');
  const [permissionError, setPermissionError] = useState<boolean>(false);
  const [loadingCalendars, setLoadingCalendars] = useState<boolean>(false);

  const loadCalendars = async () => {
    setLoadingCalendars(true);
    try {
      await RNCalendarEvents.requestPermissions();
      const cals: Calendar[] = await RNCalendarEvents.findCalendars();
      setCalendars(cals);
      setPermissionError(false);
    } catch (e) {
      setPermissionError(true);
      setCalendars([]);
    }
    setLoadingCalendars(false);
  };

  useEffect(() => {
    loadCalendars();
  }, []);

  const save = async () => {
    const newSettings: Settings = { calendarId: selectedCalendar, emails };
    setSettings(newSettings);
    await AsyncStorage.setItem('settings', JSON.stringify(newSettings));
    Alert.alert('Guardado', 'Ajustes guardados');
    if (onFinish) onFinish();
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        <Text style={{ fontWeight: 'bold', marginBottom: 8 }}>Calendario a usar</Text>
        {loadingCalendars ? (
          <Text style={{ marginBottom: 16 }}>Cargando calendarios...</Text>
        ) : permissionError ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: 'red', marginBottom: 8 }}>No se tienen permisos para acceder a los calendarios.</Text>
            <Button title="Reintentar" onPress={loadCalendars} />
          </View>
        ) : calendars.length === 0 ? (
          <View style={{ marginBottom: 16 }}>
            <Text style={{ color: 'red', marginBottom: 8 }}>No se encontraron calendarios. Revisa los permisos.</Text>
            <Button title="Reintentar" onPress={loadCalendars} />
          </View>
        ) : (
          <FlatList
            data={calendars}
            renderItem={({ item }: { item: Calendar }) => (
              <TouchableOpacity onPress={() => setSelectedCalendar(item.id)} style={{ padding: 8, backgroundColor: selectedCalendar === item.id ? '#cce5ff' : '#eee', borderRadius: 6, marginBottom: 4 }}>
                <Text>{item.title}</Text>
              </TouchableOpacity>
            )}
            keyExtractor={(item: Calendar) => item.id}
            style={{ maxHeight: 150, marginBottom: 8 }}
            showsVerticalScrollIndicator={true}
          />
        )}
        <Text style={{ fontWeight: 'bold', marginTop: 16 }}>Invitados (emails)</Text>
        <View style={{ flexDirection: 'row', marginBottom: 8 }}>
          <TextInput
            placeholder="Email"
            value={emailInput}
            onChangeText={setEmailInput}
            style={{ flex: 1, borderWidth: 1, borderColor: '#ccc', borderRadius: 6, padding: 8 }}
          />
          <Button title="Añadir" onPress={() => {
            if (emailInput.trim()) {
              setEmails([...emails, emailInput.trim()]);
              setEmailInput('');
            }
          }} />
        </View>
        <FlatList
          data={emails}
          renderItem={({ item, index }: { item: string; index: number }) => (
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={{ flex: 1 }}>{item}</Text>
              <Button title="Eliminar" onPress={() => setEmails(emails.filter((_, i) => i !== index))} />
            </View>
          )}
          keyExtractor={(_, idx) => idx.toString()}
        />
        <Button title="Guardar ajustes" onPress={save} />
      </ScrollView>
    </View>
  );
}

export default function App() {
  const [settings, setSettings] = useState<Settings>({ calendarId: '', emails: [] });
  const [firstRun, setFirstRun] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      const s = await AsyncStorage.getItem('settings');
      if (s) {
        setSettings(JSON.parse(s));
        setFirstRun(false);
      } else {
        setFirstRun(true);
      }
      setLoading(false);
    })();
  }, []);

  if (loading) return null;

  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          tabBarIcon: ({ color, size }) => {
            let iconName = '';
            if (route.name === 'Menú semanal') iconName = 'restaurant-menu';
            if (route.name === 'Ajustes') iconName = 'settings';
            return <Icon name={iconName} size={size ?? 24} color={color ?? '#333'} />;
          },
        })}
      >
        <Tab.Screen name="Menú semanal">
          {() => <MenuScreen settings={settings} onFirstConfig={() => setFirstRun(true)} />}
        </Tab.Screen>
        <Tab.Screen name="Ajustes">
          {() => <SettingsScreen settings={settings} setSettings={setSettings} />}
        </Tab.Screen>
      </Tab.Navigator>
      {/* Modal de configuración inicial */}
      {firstRun && (
        <Modal visible animationType="slide" transparent>
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#0008', padding: 20 }}>
            <View style={{ backgroundColor: 'white', borderRadius: 12, width: '90%', maxHeight: '85%', minHeight: '60%' }}>
              <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
                <Text style={{ fontWeight: 'bold', fontSize: 18 }}>Configura la app para empezar</Text>
              </View>
              <View style={{ flex: 1 }}>
                <SettingsScreen
                  settings={settings}
                  setSettings={setSettings}
                  onFinish={() => setFirstRun(false)}
                />
              </View>
            </View>
          </View>
        </Modal>
      )}
    </NavigationContainer>
  );
}
