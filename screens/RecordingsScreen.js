import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, NativeModules, ActivityIndicator } from 'react-native';
import { Audio } from 'expo-av';

const { CallStateModule } = NativeModules;

export default function RecordingsScreen() {
  const [recordings, setRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sound, setSound] = useState(null);
  const [playingId, setPlayingId] = useState(null);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    fetchRecordings();
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, []);

  const fetchRecordings = async () => {
    try {
      const files = await CallStateModule.getRecordings();
      // Sort by newest first
      const sortedFiles = files.sort((a, b) => b.timestamp - a.timestamp);
      setRecordings(sortedFiles);
    } catch (e) {
      console.warn('Failed to fetch recordings:', e);
    } finally {
      setLoading(false);
    }
  };

  const playRecording = async (file) => {
    try {
      if (sound && playingId === file.filename) {
        // Stop current playing
        await sound.stopAsync();
        setPlayingId(null);
        return;
      }

      if (sound) {
        await sound.unloadAsync();
      }

      const { sound: newSound } = await Audio.Sound.createAsync(
        { uri: 'file://' + file.path }
      );
      
      setSound(newSound);
      setPlayingId(file.filename);

      newSound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          setDuration(status.durationMillis);
        }
        if (status.didJustFinish) {
          setPlayingId(null);
          setPosition(0);
        }
      });

      await newSound.playAsync();
    } catch (e) {
      console.warn('Playback failed:', e);
    }
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  const formatDuration = (millis) => {
    if (!millis) return '00:00';
    const totalSeconds = Math.floor(millis / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes < 10 ? '0' : ''}${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0000ff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Recordings</Text>
      
      {recordings.length === 0 ? (
        <Text style={styles.emptyText}>No recordings found.</Text>
      ) : (
        <FlatList
          data={recordings}
          keyExtractor={(item) => item.filename}
          renderItem={({ item }) => (
            <View style={styles.cardContainer}>
              <View style={styles.card}>
                <View style={styles.cardInfo}>
                  <Text style={styles.filename}>{item.filename}</Text>
                  <Text style={styles.date}>{formatTimestamp(item.timestamp)}</Text>
                  <Text style={styles.size}>{(item.size / 1024 / 1024).toFixed(2)} MB</Text>
                </View>
                <TouchableOpacity 
                  style={[styles.playButton, playingId === item.filename && styles.playingButton]} 
                  onPress={() => playRecording(item)}
                >
                  <Text style={styles.playIcon}>{playingId === item.filename ? '⏹' : '▶'}</Text>
                </TouchableOpacity>
              </View>
              
              {playingId === item.filename && (
                <View style={styles.progressContainer}>
                  <Text style={styles.timeText}>{formatDuration(position)}</Text>
                  <View style={styles.progressBarBackground}>
                    <View 
                      style={[
                        styles.progressBarFill, 
                        { width: `${duration > 0 ? (position / duration) * 100 : 0}%` }
                      ]} 
                    />
                  </View>
                  <Text style={styles.timeText}>{formatDuration(duration)}</Text>
                </View>
              )}
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 20,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 20,
    marginTop: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 50,
  },
  cardContainer: {
    backgroundColor: '#f5f5f5',
    borderRadius: 14,
    marginBottom: 14,
    overflow: 'hidden',
  },
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardInfo: {
    flex: 1,
  },
  filename: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  date: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  size: {
    fontSize: 12,
    color: '#999',
  },
  playButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#dff5e1',
    marginLeft: 10,
  },
  playingButton: {
    backgroundColor: '#ffcdd2',
  },
  playIcon: {
    fontSize: 22,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  timeText: {
    fontSize: 12,
    color: '#666',
    width: 40,
    textAlign: 'center',
  },
  progressBarBackground: {
    flex: 1,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginHorizontal: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#2196F3',
  },
});
