import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Share } from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebaseconfig';
import { collection, getDocs, query, where, updateDoc, doc, getDoc } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from './AuthContext';

const HomeScreen = () => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        const following = userDoc.exists() ? userDoc.data().following || [] : [];

        let eventsQuery;
        if (following.length > 0) {
          eventsQuery = query(collection(db, 'events'), where('orgId', 'in', following));
        } else {
          eventsQuery = collection(db, 'events'); // Show all events if new user
        }

        const querySnapshot = await getDocs(eventsQuery);
        const eventsList = [];
        querySnapshot.forEach((doc) => {
          eventsList.push({ id: doc.id, ...doc.data() });
        });

        setEvents(eventsList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events: ", error);
        setLoading(false);
      }
    };

    if (userId) {
      fetchEvents();
    }
  }, [userId]);

  const handleShare = async (eventId) => {
    try {
      await Share.share({
        message: `Check out this volunteer event: https://example.com/events/${eventId}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignup = async (eventId, orgId) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const orgRef = doc(db, 'organizations', orgId);

      await updateDoc(eventRef, {
        [`participants.${userId}`]: true,
      });

      await updateDoc(orgRef, {
        [`eventParticipants.${eventId}.${userId}`]: true,
      });

      alert('You have successfully signed up for the event!');
    } catch (error) {
      console.error("Error signing up for event: ", error);
      alert('Error signing up for the event.');
    }
  };

  const renderItem = ({ item }) => (
    <View style={styles.eventCard}>
      <Text style={styles.eventTitle}>{item.title}</Text>
      <Text style={styles.eventDescription}>{item.description}</Text>
      <View style={styles.cardActions}>
        <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(item.id)}>
          <MaterialCommunityIcons name="share" size={24} color="#06038D" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.signupButton} onPress={() => handleSignup(item.id, item.orgId)}>
          <MaterialCommunityIcons name="handshake" size={24} color="#fff" />
          <Text style={styles.signupButtonText}>Volunteer</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={events}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
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
  listContainer: {
    paddingBottom: 20,
  },
  eventCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    borderColor: '#06038D',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06038D',
    marginBottom: 10,
  },
  eventDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shareButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  signupButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06038D',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  signupButtonText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 5,
  },
});

export default HomeScreen;
