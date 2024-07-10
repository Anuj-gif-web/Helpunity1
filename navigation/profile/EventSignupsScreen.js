import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, Alert, TextInput } from 'react-native';
import { db, auth } from '../../firebase/firebaseconfig';
import { doc, getDoc, updateDoc, arrayUnion } from 'firebase/firestore';

const EventSignupsScreen = ({ route }) => {
  const { eventData } = route.params;
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hours, setHours] = useState('');
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    console.log('EventSignupsScreen eventData:', eventData);  // Log the eventData
    const fetchParticipantNames = async () => {
      try {
        const participantIds = Object.keys(eventData.participants || {});
        const participantPromises = participantIds.map(async (uid) => {
          const userDoc = await getDoc(doc(db, 'users', uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            return { uid, name: `${userData.name} ${userData.lastName}` };
          }
          return { uid, name: uid };
        });
        const participantNames = await Promise.all(participantPromises);
        setParticipants(participantNames);
      } catch (error) {
        console.error("Error fetching participant names: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchParticipantNames();
  }, [eventData]);

  const getOrdinalSuffix = (day) => {
    if (day > 3 && day < 21) return 'th'; // thanks to the `teen` numbers
    switch (day % 10) {
      case 1: return "st";
      case 2: return "nd";
      case 3: return "rd";
      default: return "th";
    }
  };

  const handleAddHours = async (participant) => {
    const hoursValue = parseInt(hours, 10);
    if (isNaN(hoursValue) || hoursValue <= 0) {
      Alert.alert('Error', 'Please enter a valid number of hours worked.');
      return;
    }

    if (!eventData.id) {
      Alert.alert('Error', 'Event ID is missing.');
      console.log('Missing eventData.id:', eventData);  // Log missing eventId issue
      return;
    }

    console.log('Adding hours for event:', eventData.id);
    console.log('Participant:', participant.uid);
    console.log('Hours:', hoursValue);

    try {
      await updateDoc(doc(db, 'users', participant.uid), {
        history: arrayUnion({ eventId: eventData.id, hours: hoursValue })
      });

      Alert.alert('Success', `Added ${hoursValue} hours for ${participant.name}.`);
      setHours('');
    } catch (error) {
      console.error("Error adding hours: ", error);
      Alert.alert('Error', 'There was an error adding hours.');
    }
  };

  const renderParticipantItem = ({ item }) => (
    <View style={styles.participantItem}>
      <Text style={styles.participantText}>{item.name}</Text>
      <TextInput
        style={styles.hoursInput}
        placeholder="Hours"
        keyboardType="numeric"
        value={hours}
        onChangeText={setHours}
      />
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddHours(item)}>
        <Text style={styles.addButtonText}>Add Hours</Text>
      </TouchableOpacity>
    </View>
  );

  const eventDate = new Date(eventData.date);
  const day = eventDate.getDate();
  const month = eventDate.toLocaleString('default', { month: 'long' });
  const year = eventDate.getFullYear();
  const formattedDate = `${day}${getOrdinalSuffix(day)} ${month} ${year}`;

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{eventData.title}</Text>
      <Text style={styles.date}>{formattedDate}</Text>
      <FlatList
        data={participants}
        renderItem={renderParticipantItem}
        keyExtractor={(item) => item.uid}
        ListEmptyComponent={<Text style={styles.noDataText}>No participants yet</Text>}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#06038D',
    marginBottom: 10,
  },
  date: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  participantItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    borderColor: '#06038D',
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  participantText: {
    fontSize: 16,
    color: '#06038D',
    flex: 1,
  },
  hoursInput: {
    width: 60,
    padding: 5,
    borderColor: '#06038D',
    borderWidth: 1,
    borderRadius: 5,
    textAlign: 'center',
  },
  addButton: {
    backgroundColor: '#06038D',
    padding: 10,
    borderRadius: 10,
    marginLeft: 10,
  },
  addButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  noDataText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
});

export default EventSignupsScreen;
