import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, FlatList, TouchableOpacity } from 'react-native';
import { db, auth } from '../../firebase/firebaseconfig';
import { collection, query, where, getDocs,getDoc, doc } from 'firebase/firestore';

const ManageEventSignupsScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState([]);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const q = query(collection(db, 'events'), where('organizer', '==', userId));
        const querySnapshot = await getDocs(q);
        const eventList = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setEvents(eventList);
      } catch (error) {
        console.error("Error fetching events: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, [userId]);

  const handleEventPress = async (eventId) => {
    try {
      const eventDoc = await getDoc(doc(db, 'events', eventId));
      if (eventDoc.exists()) {
        const eventData = eventDoc.data();
        console.log('Navigating to EventSignups with eventData:', eventData);
        navigation.navigate('EventSignups', { eventData: { ...eventData, id: eventId } });
      } else {
        console.error('Event document does not exist for eventId:', eventId);
      }
    } catch (error) {
      console.error("Error fetching event signups: ", error);
    }
  };

  const renderEventItem = ({ item }) => (
    <TouchableOpacity style={styles.eventItem} onPress={() => handleEventPress(item.id)}>
      <Text style={styles.eventText}>{item.title}</Text>
      <Text style={styles.eventText}>{new Date(item.date).toLocaleDateString()}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderEventItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.noDataText}>No events yet</Text>}
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
  eventItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#06038D',
    borderWidth: 1,
  },
  eventText: {
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

export default ManageEventSignupsScreen;
