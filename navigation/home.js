import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator, Share, ScrollView, Image } from 'react-native';
import { getAuth } from 'firebase/auth';
import { db } from '../firebase/firebaseconfig';
import { collection, getDocs, query, where, updateDoc, doc, getDoc, arrayUnion } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const HomeScreen = ({ navigation }) => {
  const auth = getAuth();
  const userId = auth.currentUser?.uid;
  const [events, setEvents] = useState([]);
  const [fundraisePosts, setFundraisePosts] = useState([]);
  const [suggestedFollowers, setSuggestedFollowers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!userId) {
          setLoading(false);
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', userId));
        if (!userDoc.exists()) {
          setLoading(false);
          return;
        }

        const following = userDoc.data().following || [];

        const eventsQuery = query(collection(db, 'events'), where('organizer', 'in', following.length > 0 ? following : ['']));
        const fundraiseQuery = query(collection(db, 'fundraisePosts'), where('userId', 'in', following.length > 0 ? following : ['']));
        const usersQuery = query(collection(db, 'users'), where('uid', 'not-in', following.concat(userId)));

        const [eventsSnap, fundraiseSnap, usersSnap] = await Promise.all([
          getDocs(eventsQuery),
          getDocs(fundraiseQuery),
          getDocs(usersQuery)
        ]);

        const eventsList = await Promise.all(eventsSnap.docs.map(async (docSnap) => {
          const data = docSnap.data();
          const organizerDoc = await getDoc(doc(db, 'users', data.organizer));
          const organizer = organizerDoc.exists() ? organizerDoc.data() : null;
          return { id: docSnap.id, ...data, organizer };
        }));

        const fundraiseList = fundraiseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const usersList = usersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setEvents(eventsList);
        setFundraisePosts(fundraiseList);
        setSuggestedFollowers(usersList);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching data: ", error);
        setLoading(false);
      }
    };

    fetchData();
  }, [userId]);

  const handleShare = async (id, type) => {
    try {
      await Share.share({
        message: `Check out this ${type}: https://example.com/${type}/${id}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleSignup = async (eventId, organizerId) => {
    try {
      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);
      const eventData = eventDoc.data();

      if (eventData.participants && eventData.participants[userId]) {
        alert('You are already signed up for this event.');
        return;
      }

      await updateDoc(eventRef, {
        [`participants.${userId}`]: true,
      });

      await updateDoc(doc(db, 'users', userId), {
        history: arrayUnion({ eventId, hours: 0 }),
      });

      alert('You have successfully signed up for the event!');
    } catch (error) {
      console.error("Error signing up for event: ", error);
      alert('Error signing up for the event.');
    }
  };

  const handleFollow = async (followerId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        following: arrayUnion(followerId)
      });
      alert('You are now following this user!');
    } catch (error) {
      console.error("Error following user: ", error);
      alert('Error following the user.');
    }
  };

  const renderEventItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}>
      <Image source={{ uri: item.coverPhoto }} style={styles.cardImage} />
      <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(item.id, 'event')}>
        <MaterialCommunityIcons name="share" size={24} color="#06038D" />
      </TouchableOpacity>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        {item.organizer && (
          <View style={styles.authorContainer}>
            <MaterialCommunityIcons name="account-supervisor-circle" size={24} color="#06038D" />
            <Text style={styles.authorName}>{item.organizer.name} {item.organizer.lastName}</Text>
          </View>
        )}
        <Text style={styles.cardDescription}>{item.description.slice(0, 100)}...</Text>
        <View style={styles.cardActions}>
          <TouchableOpacity style={styles.signupButton} onPress={() => handleSignup(item.id, item.organizer)}>
            <MaterialCommunityIcons name="handshake" size={24} color="#fff" />
            <Text style={styles.signupButtonText}>Volunteer</Text>
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderFundraiseItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('FundraisePostDetails', { postId: item.id })}>
      <Image source={{ uri: item.coverPhoto }} style={styles.cardImage} />
      <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(item.id, 'fundraise')}>
        <MaterialCommunityIcons name="share" size={24} color="#06038D" />
      </TouchableOpacity>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.title}</Text>
        <Text style={styles.cardDescription}>{item.description.slice(0, 100)}...</Text>
      </View>
    </TouchableOpacity>
  );

  const renderFollowerItem = ({ item }) => (
    <TouchableOpacity
      style={styles.followerCard}
      onPress={() => navigation.navigate('UserProfile', { userId: item.id })}
    >
      <MaterialCommunityIcons name="account-circle" size={100} color="#06038D" style={styles.followerIcon} />
      <Text style={styles.followerName}>{item.name} {item.lastName}</Text>
      <TouchableOpacity style={styles.followButton} onPress={() => handleFollow(item.id)}>
        <Text style={styles.followButtonText}>Follow</Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <ScrollView style={styles.container}>
      <LinearGradient
        colors={['#0000FF', '#00FFFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.header}
      >
        <Text style={styles.headerText}>Welcome to HelpUnity!</Text>
        <Text style={styles.headerSubText}>Be kind for no reason</Text>
      </LinearGradient>
      <View style={styles.whiteBackground}>
        <Text style={styles.sectionTitle}>Featured Events</Text>
        <FlatList
          data={events}
          renderItem={renderEventItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.listContainer}
        />
        <Text style={styles.sectionTitle}>Fundraise Posts</Text>
        <FlatList
          data={fundraisePosts}
          renderItem={renderFundraiseItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.listContainer}
        />
        <Text style={styles.sectionTitle}>Suggested Followers</Text>
        <FlatList
          data={suggestedFollowers}
          renderItem={renderFollowerItem}
          keyExtractor={(item) => item.id}
          horizontal
          showsHorizontalScrollIndicator={true}
          contentContainerStyle={styles.listContainer}
        />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  header: {
    padding: 20,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  headerText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 10,
  },
  headerSubText: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
  },
  whiteBackground: {
    backgroundColor: '#fff',
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#06038D',
    marginBottom: 10,
    marginLeft: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    borderColor: '#06038D',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    width: 300,
    marginRight: 15,
    marginLeft: 10,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  cardContent: {
    padding: 15,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06038D',
    marginBottom: 5,
  },
  cardAuthor: {
    fontSize: 14,
    color: '#555',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareButton: {
    position: 'absolute',
    top: 20,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: '#06038D',
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
  followerCard: {
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
    width: 150,
    marginRight: 15,
    marginLeft: 10,
    alignItems: 'center',
  },
  followerIcon: {
    marginBottom: 10,
  },
  followerName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06038D',
    marginBottom: 10,
    textAlign: 'center',
  },
  followButton: {
    backgroundColor: '#06038D',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 5,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  authorName: {
    marginLeft: 10,
    fontSize: 14,
    color: '#06038D',
  },
});

export default HomeScreen;
