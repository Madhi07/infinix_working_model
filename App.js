import { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, NativeModules, NativeEventEmitter, PermissionsAndroid, Platform, AppState, TouchableOpacity } from 'react-native';
import SignIn from './screens/SignIn';
import LeadListScreen from './screens/LeadListScreen';
import RecordingsScreen from './screens/RecordingsScreen';
import AccessibilityPrompt from './components/AccessibilityPrompt';
import BatteryPrompt from './components/BatteryPrompt';

const { CallStateModule } = NativeModules;
const callStateEmitter = new NativeEventEmitter(CallStateModule);

export default function App() {
  const [showAccessibilityPrompt, setShowAccessibilityPrompt] = useState(false);
  const [showBatteryPrompt, setShowBatteryPrompt] = useState(false);
  const [activeTab, setActiveTab] = useState('leads'); // 'leads' or 'recordings'

  const checkAccessibility = async () => {
    if (Platform.OS === 'android') {
      try {
        const isEnabled = await CallStateModule.checkAccessibilityStatus();
        setShowAccessibilityPrompt(!isEnabled);
      } catch (e) {
        console.warn("Failed to check accessibility status", e);
      }
    }
  };

  const checkBattery = async () => {
    if (Platform.OS === 'android') {
      try {
        const isIgnoring = await CallStateModule.checkBatteryOptimizationStatus();
        setShowBatteryPrompt(!isIgnoring);
      } catch (e) {
        console.warn("Failed to check battery status", e);
      }
    }
  };

  useEffect(() => {
    const requestPermissionsAndStart = async () => {
      if (Platform.OS === 'android') {
        try {
          let permissionsToRequest = [
            PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE,
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          ];

          if (Platform.Version >= 33) {
            permissionsToRequest.push('android.permission.READ_MEDIA_AUDIO');
          } else {
            permissionsToRequest.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
          }

          const granted = await PermissionsAndroid.requestMultiple(permissionsToRequest);

          const hasPhoneState = granted[PermissionsAndroid.PERMISSIONS.READ_PHONE_STATE] === PermissionsAndroid.RESULTS.GRANTED;
          const hasRecordAudio = granted[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
          const hasStorage = Platform.Version >= 33 
              ? granted['android.permission.READ_MEDIA_AUDIO'] === PermissionsAndroid.RESULTS.GRANTED 
              : granted[PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE] === PermissionsAndroid.RESULTS.GRANTED;

          if (hasPhoneState && hasRecordAudio && hasStorage) {
            console.log('Permissions granted! Starting call listener...');
            
            // Check Accessibility and optionally show the prompt
            await checkAccessibility();

            // Check Battery Optimization and optionally show the prompt
            await checkBattery();

            // Start the native listener
            CallStateModule.startListening();
          } else {
            console.warn('Permissions denied, missing necessary permissions');
          }
        } catch (err) {
          console.warn(err);
        }
      }
    };

    requestPermissionsAndStart();

    // Listen to events from the Native Module
    const subscription = callStateEmitter.addListener('onCallStateChanged', (state) => {
      console.log('Call State Changed:', state);
    });

    // Listen to App state to re-check accessibility and battery when returning from settings
    const appStateSubscription = AppState.addEventListener('change', nextAppState => {
      if (nextAppState === 'active') {
        checkAccessibility();
        checkBattery();
      }
    });

    return () => {
      subscription.remove();
      appStateSubscription.remove();
      if (Platform.OS === 'android') {
        CallStateModule.stopListening();
      }
    };
  }, []);

  return (
    <View style={styles.container}>
      <AccessibilityPrompt 
        visible={showAccessibilityPrompt} 
        onOpenSettings={() => CallStateModule.openAccessibilitySettings()} 
      />
      <BatteryPrompt 
        visible={showBatteryPrompt} 
        onOpenSettings={() => CallStateModule.requestBatteryOptimization()} 
      />
      
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'leads' && styles.activeTab]}
          onPress={() => setActiveTab('leads')}
        >
          <Text style={[styles.tabText, activeTab === 'leads' && styles.activeTabText]}>Leads</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recordings' && styles.activeTab]}
          onPress={() => setActiveTab('recordings')}
        >
          <Text style={[styles.tabText, activeTab === 'recordings' && styles.activeTabText]}>Recordings</Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'leads' ? <LeadListScreen /> : <RecordingsScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  tabContainer: {
    flexDirection: 'row',
    marginTop: 50,
    paddingHorizontal: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: '#eee',
  },
  activeTab: {
    borderBottomColor: '#2196F3',
  },
  tabText: {
    fontSize: 16,
    color: '#666',
    fontWeight: '600',
  },
  activeTabText: {
    color: '#2196F3',
  },
});


