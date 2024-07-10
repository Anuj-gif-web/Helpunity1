import React, { useEffect, useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, Share, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseconfig';

const EventDetailsScreen = ({ route, navigation }) => {
  const { eventId } = route.params;
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [userLiked, setUserLiked] = useState(false);
  const [likes, setLikes] = useState(0);
  const [organizer, setOrganizer] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const docRef = doc(db, 'events', eventId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const eventData = docSnap.data();
          setEvent(eventData);
          setLikes(eventData.likes || 0);
          setUserLiked(eventData.likedBy && eventData.likedBy[auth.currentUser?.uid]);

          const organizerDoc = await getDoc(doc(db, 'users', eventData.organizer));
          if (organizerDoc.exists()) {
            setOrganizer(organizerDoc.data());
          }
        } else {
          Alert.alert('Error', 'Event not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching event: ", error);
        Alert.alert('Error', 'Error fetching event: ' + error.message);
      }
      setLoading(false);
    };

    fetchEvent();
  }, [eventId, navigation]);

  const handleEdit = () => {
    navigation.navigate('AddEvent', { event, isEdit: true });
  };

  const handleLike = async () => {
    if (!auth.currentUser) {
      alert("Please log in to like events.");
      return;
    }

    try {
      const eventRef = doc(db, 'events', eventId);
      if (userLiked) {
        await updateDoc(eventRef, {
          likes: likes - 1,
          [`likedBy.${auth.currentUser.uid}`]: false
        });
        setLikes(likes - 1);
        setUserLiked(false);
      } else {
        await updateDoc(eventRef, {
          likes: likes + 1,
          [`likedBy.${auth.currentUser.uid}`]: true
        });
        setLikes(likes + 1);
        setUserLiked(true);
      }
    } catch (error) {
      console.error("Error liking event: ", error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this event: https://example.com/events/${eventId}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleVolunteer = async () => {
    if (!auth.currentUser) {
      alert("Please log in to volunteer for events.");
      return;
    }
  
    const userId = auth.currentUser.uid;
  
    try {
      // Fetch the latest event data to ensure the participants list is up-to-date
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      if (eventSnap.exists()) {
        const eventData = eventSnap.data();
        if (eventData.participants && eventData.participants[userId]) {
          Alert.alert("Error", "You are already signed up for this event.");
          return;
        }
  
        Alert.alert(
          "Confirm Signup",
          "Are you sure you want to sign up for this event?",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Confirm",
              onPress: async () => {
                try {
                  await updateDoc(eventRef, {
                    [`participants.${userId}`]: true
                  });
                  Alert.alert("Success", "You have successfully signed up for the event!");
                } catch (error) {
                  console.error("Error signing up for event: ", error);
                  Alert.alert("Error", "Error signing up for the event: " + error.message);
                }
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', 'Event not found');
      }
    } catch (error) {
      console.error("Error checking event participants: ", error);
      Alert.alert("Error", "Error checking event participants: " + error.message);
    }
  };
  

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  if (!event) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Event not found</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.imageContainer}>
        <Image source={{ uri: event.coverPhoto }} style={styles.image} />
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <View style={styles.shareButtonCircle}>
            <MaterialCommunityIcons name="share" size={24} color="#06038D" />
          </View>
        </TouchableOpacity>
      </View>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{event.title}</Text>
          <View style={styles.actionsContainer}>
            <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
              <MaterialCommunityIcons
                name={userLiked ? "heart" : "heart-outline"}
                size={24}
                color={userLiked ? 'red' : 'gray'}
              />
              {likes > 0 && (
                <Text style={[styles.likeCount, userLiked && { color: 'red' }]}>{likes}</Text>
              )}
            </TouchableOpacity>
            {event.organizer === auth.currentUser.uid && (
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <MaterialCommunityIcons name="pencil" size={24} color="#06038D" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.tagsContainer}>
          <View style={styles.tagContainer}>
            <Text style={styles.tag}>{event.category}</Text>
          </View>
        </View>
        {organizer && (
          <TouchableOpacity style={styles.authorContainer} onPress={() => navigation.navigate('UserProfile', { userId: event.organizer })}>
            <MaterialCommunityIcons name="account-supervisor-circle" size={24} color="#06038D" />
            <Text style={styles.authorName}>{organizer.name} {organizer.lastName}</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.date}>{new Date(event.date).toLocaleDateString()} at {new Date(event.time).toLocaleTimeString()}</Text>
        <Text style={styles.location}>Location: {event.location}</Text>
        <Text style={styles.description}>{event.description}</Text>
        <TouchableOpacity style={styles.volunteerButton} onPress={handleVolunteer}>
          <MaterialCommunityIcons name="handshake" size={24} color="#fff" style={styles.volunteerButtonIcon} />
          <Text style={styles.volunteerButtonText}>Volunteer</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#f0f4f7',
  },
  imageContainer: {
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    overflow: 'hidden',
    marginBottom: -10, // Remove gap between image and container
  },
  image: {
    width: '100%',
    height: 250,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  shareButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    zIndex: 1,
  },
  shareButtonCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: '#06038D',
  },
  content: {
    padding: 15,
    backgroundColor: '#fff',
    borderRadius: 10,
    borderColor: '#06038D',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#06038D',
  },
  actionsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  likeCount: {
    fontSize: 16,
    marginLeft: 5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  tagContainer: {
    backgroundColor: '#06038D',
    borderRadius: 15, // Rounded corners
    paddingVertical: 5,
    paddingHorizontal: 10,
    marginRight: 5,
    marginBottom: 5,
  },
  tag: {
    color: '#fff',
    fontSize: 14,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorName: {
    marginLeft: 10,
    fontSize: 18,
    color: '#06038D',
  },
  date: {
    fontSize: 16,
    color: '#333',
    marginBottom: 5,
  },
  location: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
  },
  volunteerButton: {
    backgroundColor: '#06038D',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    alignSelf: 'center',
    flexDirection: 'row',
  },
  volunteerButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  volunteerButtonIcon: {
    marginRight: 10,
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
});

export default EventDetailsScreen;
