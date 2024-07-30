import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList } from 'react-native';
import { auth, db } from '../../firebase/firebaseconfig';
import { doc, getDoc } from 'firebase/firestore';

const VolunteerHistoryScreen = () => {
  const [loading, setLoading] = useState(true);
  const [volunteerHistory, setVolunteerHistory] = useState([]);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchVolunteerHistory = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const history = userData.history || [];

          const historyWithEventNames = await Promise.all(
            history.map(async (item) => {
              const eventDoc = await getDoc(doc(db, 'events', item.eventId));
              const eventName = eventDoc.exists() ? eventDoc.data().title : 'Unknown Event';
              return { ...item, eventName };
            })
          );

          setVolunteerHistory(historyWithEventNames);
        }
      } catch (error) {
        console.error("Error fetching volunteer history: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchVolunteerHistory();
  }, [userId]);

  const renderHistoryItem = ({ item }) => (
    <View style={styles.historyItem}>
      <Text style={styles.historyText}>Event: {item.eventName}</Text>
      <Text style={styles.historyText}>Hours Volunteered: {item.hours}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={volunteerHistory}
        renderItem={renderHistoryItem}
        keyExtractor={(item, index) => index.toString()}
        ListEmptyComponent={<Text style={styles.noDataText}>No volunteer history yet</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    padding: 20,
  },
  historyItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#06038D',
    borderWidth: 1,
  },
  historyText: {
    fontSize: 16,
    color: '#06038D',
  },
  noDataText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default VolunteerHistoryScreen;
