import React from 'react';
import { Modal, StyleSheet, Text, View, TouchableOpacity, SafeAreaView, Platform } from 'react-native';

export default function BatteryPrompt({ visible, onOpenSettings }) {
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
          <Text style={styles.modalTitle}>Battery Optimization Check</Text>
          
          <Text style={styles.modalText}>
            To ensure call recording is not killed in the background during long calls, you MUST disable battery optimization for Agentzee.
          </Text>

          <View style={styles.stepsContainer}>
            <Text style={styles.stepTitle}>How to allow background recording:</Text>
            <Text style={styles.stepText}>1. Click the button below to open Battery Settings.</Text>
            <Text style={styles.stepText}>2. Look for the "Unrestricted" or "No restrictions" option.</Text>
            <Text style={styles.stepText}>3. Select it, and then go back to this app.</Text>
            <Text style={styles.stepText}>4. This prompt will automatically close when it's done correctly.</Text>
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={onOpenSettings}
          >
            <Text style={styles.textStyle}>Open Battery Settings</Text>
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
    backgroundColor: '#fff3e0',
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
    width: '100%',
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
  },
  stepTitle: {
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#e65100',
  },
  stepText: {
    marginBottom: 8,
    color: '#333',
    fontSize: 14,
  },
  button: {
    backgroundColor: '#ff9800',
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
