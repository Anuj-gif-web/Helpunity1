import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { doc, getDoc, updateDoc, arrayUnion, arrayRemove, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseconfig';

const UserProfileScreen = ({ route, navigation }) => {
  const { userId } = route.params;
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [fundraisePosts, setFundraisePosts] = useState([]);
  const [eventPosts, setEventPosts] = useState([]);
  const [showFundraisers, setShowFundraisers] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUser(userData);
          setFollowersCount(userData.followers ? userData.followers.length : 0);
          setFollowingCount(userData.following ? userData.following.length : 0);
          setIsFollowing(userData.followers && userData.followers.includes(auth.currentUser.uid));
          fetchUserPosts();
        }
      } catch (error) {
        console.error("Error fetching user data: ", error);
      }
      setLoading(false);
    };

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
      }
    };

    fetchUserData();
  }, [userId]);

  const handleFollow = async () => {
    if (!auth.currentUser) {
      alert("Please log in to follow users.");
      return;
    }

    try {
      const currentUserRef = doc(db, 'users', auth.currentUser.uid);
      const userRef = doc(db, 'users', userId);

      if (isFollowing) {
        await updateDoc(currentUserRef, {
          following: arrayRemove(userId)
        });
        await updateDoc(userRef, {
          followers: arrayRemove(auth.currentUser.uid)
        });
        setFollowersCount(followersCount - 1);
        setIsFollowing(false);
      } else {
        await updateDoc(currentUserRef, {
          following: arrayUnion(userId)
        });
        await updateDoc(userRef, {
          followers: arrayUnion(auth.currentUser.uid)
        });
        setFollowersCount(followersCount + 1);
        setIsFollowing(true);
      }
    } catch (error) {
      console.error("Error following/unfollowing user: ", error);
    }
  };

  const renderFundraiseItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('FundraisePostDetails', { postId: item.id })}>
      <View style={styles.postCard}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDescription}>{item.description.slice(0, 100)}...</Text>
      </View>
    </TouchableOpacity>
  );

  const renderEventItem = ({ item }) => (
    <TouchableOpacity onPress={() => navigation.navigate('EventDetails', { eventId: item.id })}>
      <View style={styles.postCard}>
        <Text style={styles.postTitle}>{item.title}</Text>
        <Text style={styles.postDescription}>{item.description.slice(0, 100)}...</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <View style={styles.container}>
      {user && (
        <>
          <MaterialCommunityIcons 
            name={user.userType === 'organization' ? 'account-supervisor-circle' : 'account-circle'} 
            size={170} 
            color="#06038D" 
            style={styles.userIcon} 
          />
          <View style={styles.header}>
            <Text style={styles.name}>{user.name} {user.lastName}</Text>
            <Text style={styles.joined}>
              {user.userType === 'volunteer' ? 'Member volunteer' : 'Organization'} since: {user.createdAt ? new Date(user.createdAt.seconds * 1000).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Unknown'}
            </Text>
            <View style={styles.followContainer}>
              <TouchableOpacity>
                <Text style={styles.followText}>Followers: {followersCount}</Text>
              </TouchableOpacity>
              <Text style={styles.separator}>|</Text>
              <TouchableOpacity>
                <Text style={styles.followText}>Following: {followingCount}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.followButton} onPress={handleFollow}>
              <Text style={styles.followButtonText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, showFundraisers && styles.activeTab]}
              onPress={() => setShowFundraisers(true)}
            >
              <Text style={styles.tabText}>Fundraise Posts</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, !showFundraisers && styles.activeTab]}
              onPress={() => setShowFundraisers(false)}
            >
              <Text style={styles.tabText}>Event Posts</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={showFundraisers ? fundraisePosts : eventPosts}
            renderItem={showFundraisers ? renderFundraiseItem : renderEventItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.postsContainer}
            ListEmptyComponent={<Text style={styles.noPostsText}>No posts yet</Text>}
          />
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    padding: 20,
  },
  userIcon: {
    alignSelf: 'center',
    marginBottom: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#06038D',
  },
  joined: {
    fontSize: 16,
    color: '#333',
  },
  followContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  followText: {
    fontSize: 16,
    color: '#06038D',
  },
  separator: {
    marginHorizontal: 10,
    color: '#06038D',
  },
  followButton: {
    backgroundColor: '#06038D',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    padding: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderColor: 'transparent',
  },
  activeTab: {
    borderColor: '#06038D',
  },
  tabText: {
    fontSize: 16,
    color: '#06038D',
  },
  postsContainer: {
    paddingBottom: 20,
  },
  postCard: {
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
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06038D',
    marginBottom: 5,
  },
  postDescription: {
    fontSize: 16,
    color: '#333',
  },
  noPostsText: {
    textAlign: 'center',
    fontSize: 18,
    color: '#06038D',
    marginTop: 20,
  },
});

export default UserProfileScreen;
