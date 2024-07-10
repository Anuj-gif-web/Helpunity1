import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, FlatList, TouchableOpacity, Image, ActivityIndicator, Modal, ScrollView, StyleSheet, Share } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { db, auth } from '../../firebase/firebaseconfig';
import { collection, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import Checkbox from 'expo-checkbox';

const categories = [
  "Animals", "Business", "Community", "Competitions", "Creative",
  "Education", "Emergencies", "Environment", "Events", "Faith",
  "Family", "Funerals & Memorials", "Medical", "Monthly Bills",
  "Newlyweds", "Other", "Sports", "Travel", "Ukraine Relief",
  "Volunteer", "Wishes"
];

const recipients = ["Yourself", "Someone Else", "Charity or Organization"];

const FundraiseScreen = ({ navigation }) => {
  const [fundraisePosts, setFundraisePosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [filteredPosts, setFilteredPosts] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedRecipients, setSelectedRecipients] = useState([]);

  useEffect(() => {
    const fetchFundraisePosts = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, 'fundraisePosts'));
        const posts = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (!data.likes) {
            data.likes = 0;
            data.likedBy = {};
          }
          posts.push({ id: doc.id, ...data });
        });
        setFundraisePosts(posts);
        setFilteredPosts(posts);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching fundraise posts: ", error);
      }
    };

    const fetchUser = async () => {
      const currentUser = auth.currentUser;
      if (currentUser) {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUser({ uid: currentUser.uid, ...userDoc.data() });
        }
      }
    };

    fetchFundraisePosts();
    fetchUser();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [searchText, selectedCategories, selectedRecipients]);

  const applyFilters = () => {
    let filtered = fundraisePosts;

    if (searchText) {
      filtered = filtered.filter(post =>
        post.title.toLowerCase().includes(searchText.toLowerCase()) ||
        post.description.toLowerCase().includes(searchText.toLowerCase()) ||
        (post.categories && post.categories.some(category => category.toLowerCase().includes(searchText.toLowerCase())))
      );
    }

    if (selectedCategories.length > 0) {
      filtered = filtered.filter(post =>
        post.categories && selectedCategories.every(category => post.categories.includes(category))
      );
    }

    if (selectedRecipients.length > 0) {
      filtered = filtered.filter(post =>
        selectedRecipients.includes(post.recipient)
      );
    }

    setFilteredPosts(filtered);
  };

  const toggleCategorySelection = (category) => {
    setSelectedCategories(prevSelectedCategories =>
      prevSelectedCategories.includes(category)
        ? prevSelectedCategories.filter(item => item !== category)
        : [...prevSelectedCategories, category]
    );
  };

  const toggleRecipientSelection = (recipient) => {
    setSelectedRecipients(prevSelectedRecipients =>
      prevSelectedRecipients.includes(recipient)
        ? prevSelectedRecipients.filter(item => item !== recipient)
        : [...prevSelectedRecipients, recipient]
    );
  };

  const handleLike = async (postId, likes, userLiked) => {
    if (!user) {
      alert("Please log in to like posts.");
      return;
    }

    try {
      const postRef = doc(db, 'fundraisePosts', postId);
      if (userLiked) {
        await updateDoc(postRef, {
          likes: likes - 1,
          [`likedBy.${user.uid}`]: false
        });
        setFilteredPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, likes: likes - 1, likedBy: { ...post.likedBy, [user.uid]: false } } : post
          )
        );
      } else {
        await updateDoc(postRef, {
          likes: likes + 1,
          [`likedBy.${user.uid}`]: true
        });
        setFilteredPosts((prevPosts) =>
          prevPosts.map((post) =>
            post.id === postId ? { ...post, likes: likes + 1, likedBy: { ...post.likedBy, [user.uid]: true } } : post
          )
        );
      }
    } catch (error) {
      console.error("Error liking post: ", error);
    }
  };

  const handleShare = async (postId) => {
    try {
      await Share.share({
        message: `Check out this fundraise post: https://example.com/posts/${postId}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const renderItem = ({ item }) => {
    const userLiked = item.likedBy && item.likedBy[user?.uid];

    return (
      <TouchableOpacity onPress={() => navigation.navigate('FundraisePostDetails', { postId: item.id })}>
        <View style={styles.postCard}>
          <View>
            <Image source={{ uri: item.coverPhoto }} style={styles.postImage} />
            <TouchableOpacity style={styles.shareButton} onPress={() => handleShare(item.id)}>
              <View style={styles.shareButtonCircle}>
                <MaterialCommunityIcons name="share" size={24} color="#06038D" />
              </View>
            </TouchableOpacity>
          </View>
          <View style={styles.postContent}>
            <Text style={styles.postTitle}>{item.title}</Text>
            <View style={styles.postDescriptionContainer}>
              <Text style={styles.postDescription}>{item.description.slice(0, 100)}...</Text>
              <View style={styles.likeContainer}>
                <TouchableOpacity style={styles.likeButton} onPress={() => handleLike(item.id, item.likes || 0, userLiked)}>
                  <MaterialCommunityIcons
                    name={userLiked ? "heart" : "heart-outline"}
                    size={24}
                    color={userLiked ? 'red' : 'gray'}
                  />
                  {item.likes > 0 && (
                    <Text style={[styles.likeButtonText, userLiked && { color: 'red' }]}>{item.likes}</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search"
          value={searchText}
          onChangeText={setSearchText}
        />
        <TouchableOpacity onPress={() => setIsModalVisible(true)} style={styles.filterButton}>
          <Text style={styles.filterButtonText}>Filters</Text>
        </TouchableOpacity>
      </View>
      <FlatList
        data={filteredPosts}
        renderItem={renderItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddFundraisePost')}>
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </TouchableOpacity>
      <Modal
        visible={isModalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filters</Text>
              <View style={styles.clearContainer}>
                <TouchableOpacity onPress={() => { setSelectedCategories([]); setSelectedRecipients([]); }} style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear Filters</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.closeButton}>
                  <MaterialCommunityIcons name="close" size={24} color="#06038D" />
                </TouchableOpacity>
              </View>
            </View>
            <Text style={styles.filterLabel}>Whom are you raising money for?</Text>
            <ScrollView style={styles.checkboxScrollView}>
              {recipients.map((recipient, index) => (
                <View key={index} style={styles.checkboxContainer}>
                  <Checkbox
                    value={selectedRecipients.includes(recipient)}
                    onValueChange={() => toggleRecipientSelection(recipient)}
                    color={selectedRecipients.includes(recipient) ? '#06038D' : undefined}
                    style={styles.checkbox}
                  />
                  <Text style={styles.checkboxLabel}>{recipient}</Text>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.filterLabel}>Categories</Text>
            <ScrollView style={styles.checkboxScrollView}>
              {categories.map((category, index) => (
                <View key={index} style={styles.checkboxContainer}>
                  <Checkbox
                    value={selectedCategories.includes(category)}
                    onValueChange={() => toggleCategorySelection(category)}
                    color={selectedCategories.includes(category) ? '#06038D' : undefined}
                    style={styles.checkbox}
                  />
                  <Text style={styles.checkboxLabel}>{category}</Text>
                </View>
              ))}
            </ScrollView>
            <TouchableOpacity onPress={() => setIsModalVisible(false)} style={styles.applyButton}>
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 10,
  },
  searchInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#06038D',
    borderRadius: 20,
    paddingHorizontal: 15,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  filterButton: {
    backgroundColor: '#06038D',
    padding: 10,
    borderRadius: 20,
  },
  filterButtonText: {
    color: '#fff',
  },
  listContainer: {
    padding: 20,
  },
  postCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    overflow: 'hidden',
    borderColor: '#06038D',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  shareButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  shareButtonCircle: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 10,
    padding: 5,
    borderWidth: 1,
    borderColor: '#06038D',
  },
  postContent: {
    padding: 15,
  },
  postTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#06038D',
    marginBottom: 10,
  },
  postDescriptionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postDescription: {
    fontSize: 16,
    color: '#333',
    flex: 1,
  },
  likeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  likeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  likeButtonText: {
    fontSize: 16,
    marginLeft: 5,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    backgroundColor: '#06038D',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 4,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    borderWidth:2,
    borderColor: '#06038D'
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  clearContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  clearButton: {
    backgroundColor: '#FF0000',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginRight: 10,
  },
  clearButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: 'transparent',
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  checkboxScrollView: {
    maxHeight: 200,
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  checkboxLabel: {
    marginLeft: 10,
    fontSize: 16,
  },
  checkbox: {
    borderColor: '#06038D',
    borderWidth: 1,
    borderRadius: 5,
    width: 20,
    height: 20,
  },
  applyButton: {
    backgroundColor: '#06038D',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 10,
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default FundraiseScreen;
