import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator, Image } from 'react-native';
import { db } from '../../firebase/firebaseconfig';
import { getAuth } from 'firebase/auth';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const UserPostsScreen = ({ navigation }) => {
  const [fundraisePosts, setFundraisePosts] = useState([]);
  const [eventPosts, setEventPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFundraisers, setShowFundraisers] = useState(true);
  const userId = getAuth().currentUser?.uid;

  useEffect(() => {
    const fetchUserPosts = async () => {
      try {
        const fundraiseQuery = query(collection(db, 'fundraisePosts'), where('userId', '==', userId));
        const eventsQuery = query(collection(db, 'events'), where('organizer', '==', userId));

        const [fundraiseSnap, eventsSnap] = await Promise.all([getDocs(fundraiseQuery), getDocs(eventsQuery)]);

        const fundraisePosts = fundraiseSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const eventPosts = eventsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        setFundraisePosts(fundraisePosts);
        setEventPosts(eventPosts);
      } catch (error) {
        console.error("Error fetching user posts: ", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserPosts();
  }, [userId]);

  const renderFundraiseItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('FundraisePostDetails', { postId: item.id })}
    >
      <Image source={{ uri: item.coverPhoto }} style={styles.cardImage} />
      <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(item.id, 'fundraise')}>
        <MaterialCommunityIcons name="share" size={24} color="#06038D" />
      </TouchableOpacity>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription}>{item.description.slice(0, 100)}...</Text>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}
    >
      <Image source={{ uri: item.coverPhoto }} style={styles.cardImage} />
      <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(item.id, 'event')}>
        <MaterialCommunityIcons name="share" size={24} color="#06038D" />
      </TouchableOpacity>
      <Text style={styles.cardTitle}>{item.title}</Text>
      <Text style={styles.cardDescription}>{item.description.slice(0, 100)}...</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.toggleContainer}>
        <TouchableOpacity
          style={[styles.toggleButton, showFundraisers && styles.activeToggle]}
          onPress={() => setShowFundraisers(true)}
        >
          <Text style={[styles.toggleText, showFundraisers && styles.activeToggleText]}>Fundraisers</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleButton, !showFundraisers && styles.activeToggle]}
          onPress={() => setShowFundraisers(false)}
        >
          <Text style={[styles.toggleText, !showFundraisers && styles.activeToggleText]}>Events</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={showFundraisers ? fundraisePosts : eventPosts}
        renderItem={showFundraisers ? renderFundraiseItem : renderEventItem}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.noDataText}>No posts yet</Text>}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  toggleContainer: {
    flexDirection: 'row',
    marginVertical: 20,
    paddingHorizontal: 20,
  },
  toggleButton: {
    flex: 1,
    padding: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#06038D',
    borderRadius: 5,
  },
  toggleText: {
    fontSize: 16,
    color: '#06038D',
  },
  activeToggle: {
    backgroundColor: '#06038D',
  },
  activeToggleText: {
    color: '#fff',
  },
  card: {
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
    marginHorizontal: 20,
  },
  cardImage: {
    width: '100%',
    height: 150,
    borderRadius: 10,
    marginBottom: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06038D',
    marginBottom: 10,
  },
  cardDescription: {
    fontSize: 16,
    color: '#333',
    marginBottom: 10,
  },
  shareButton: {
    position: 'absolute',
    top: 10,
    right: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: '#06038D',
  },
  noDataText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginTop: 20,
  },
  listContainer: {
    paddingBottom: 20,
  },
});

export default UserPostsScreen;
