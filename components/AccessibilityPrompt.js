import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform } from 'react-native';

export default function AccessibilityPrompt({ visible, onOpenSettings }) {
  if (Platform.OS !== 'android') return null;

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={() => {}}
    >
      <SafeAreaView style={styles.centeredView}>
        <View style={styles.modalView}>
          <Text style={styles.modalTitle}>Recording Setup Required</Text>
          
          <Text style={styles.modalText}>
            To record calls, Agentzee needs its Accessibility Service enabled. 
            Because this app was installed directly via APK, Android applies a security lock.
          </Text>

          <View style={styles.stepsContainer}>
            <Text style={styles.stepTitle}>How to unlock and enable:</Text>
            <Text style={styles.stepText}>1. Open Settings and go to Apps {'>'} Agentzee.</Text>
            <Text style={styles.stepText}>2. Tap the 3 dots (⋮) in the top right corner.</Text>
            <Text style={styles.stepText}>3. Tap <Text style={styles.boldText}>"Allow restricted settings"</Text>.</Text>
            <Text style={styles.stepText}>4. Click the button below to go to Accessibility Settings.</Text>
            <Text style={styles.stepText}>5. Find "Agentzee" (or under Downloaded Apps) and turn it ON.</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={onOpenSettings}
          >
            <Text style={styles.textStyle}>Open Accessibility Settings</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalView: {
    margin: 20,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 25,
    alignItems: 'flex-start',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#1a1a1a',
  },
  modalText: {
    marginBottom: 15,
    fontSize: 15,
    lineHeight: 22,
    color: '#4a4a4a',
  },
  stepsContainer: {
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
  },
  stepTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#1a1a1a',
  },
  stepText: {
    marginBottom: 8,
    color: '#333',
    fontSize: 14,
  },
  boldText: {
    fontWeight: 'bold',
    color: '#000',
  },
  button: {
    backgroundColor: '#2196F3',
    borderRadius: 10,
    padding: 15,
    elevation: 2,
    width: '100%',
    alignItems: 'center',
  },
  textStyle: {
    color: 'white',
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 16,
  },
});
