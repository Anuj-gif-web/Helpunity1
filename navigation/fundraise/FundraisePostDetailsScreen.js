import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Share, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ProgressBar } from 'react-native-paper';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebaseconfig';

const FundraisePostDetailsScreen = ({ route, navigation }) => {
  const { postId } = route.params;
  const [post, setPost] = useState(null);
  const [likes, setLikes] = useState(0);
  const [userLiked, setUserLiked] = useState(false);
  const [author, setAuthor] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'fundraisePosts', postId));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          setPost(postData);
          setLikes(postData.likes || 0);
          setUserLiked(postData.likedBy && postData.likedBy[auth.currentUser?.uid]);

          const authorDoc = await getDoc(doc(db, 'users', postData.userId));
          if (authorDoc.exists()) {
            setAuthor(authorDoc.data());
          }
        } else {
          alert('Post not found');
          navigation.goBack();
        }
      } catch (error) {
        console.error("Error fetching post: ", error);
        alert('Error fetching post');
      }
      setLoading(false);
    };

    fetchPost();
  }, [postId]);

  const handleLike = async () => {
    if (!auth.currentUser) {
      alert("Please log in to like posts.");
      return;
    }

    try {
      const postRef = doc(db, 'fundraisePosts', postId);
      if (userLiked) {
        await updateDoc(postRef, {
          likes: likes - 1,
          [`likedBy.${auth.currentUser.uid}`]: false
        });
        setLikes(likes - 1);
        setUserLiked(false);
      } else {
        await updateDoc(postRef, {
          likes: likes + 1,
          [`likedBy.${auth.currentUser.uid}`]: true
        });
        setLikes(likes + 1);
        setUserLiked(true);
      }
    } catch (error) {
      console.error("Error liking post: ", error);
    }
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Check out this fundraise post: https://example.com/posts/${postId}`,
      });
    } catch (error) {
      alert(error.message);
    }
  };

  const handleEdit = () => {
    navigation.navigate('AddFundraisePost', { post, isEdit: true });
  };

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  if (!post) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Post not found</Text>
      </View>
    );
  }

  const progress = post.currentAmount / post.goal;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Image source={{ uri: post.coverPhoto }} style={styles.postImage} />
      <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
        <View style={styles.shareButtonCircle}>
          <MaterialCommunityIcons name="share" size={24} color="#06038D" />
        </View>
      </TouchableOpacity>
      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{post.title}</Text>
          <View style={styles.likeContainer}>
            <TouchableOpacity style={styles.likeButton} onPress={handleLike}>
              <MaterialCommunityIcons
                name={userLiked ? "heart" : "heart-outline"}
                size={24}
                color={userLiked ? 'red' : 'gray'}
              />
              <Text style={[styles.likeCount, userLiked && { color: 'red' }]}>{likes}</Text>
            </TouchableOpacity>
            {auth.currentUser?.uid === post.userId && (
              <TouchableOpacity style={styles.editButton} onPress={handleEdit}>
                <MaterialCommunityIcons name="pencil" size={24} color="#06038D" />
              </TouchableOpacity>
            )}
          </View>
        </View>
        <View style={styles.tagsContainer}>
          {Array.isArray(post.categories) && post.categories.map((category, index) => (
            <View key={index} style={styles.tagContainer}>
              <Text style={styles.tag}>{category}</Text>
            </View>
          ))}
        </View>
        {author && (
          <TouchableOpacity style={styles.authorContainer} onPress={() => navigation.navigate('UserProfile', { userId: post.userId })}>
            <MaterialCommunityIcons name="account-circle" size={24} color="#06038D" />
            <Text style={styles.authorName}>{author.name} {author.lastName}</Text>
          </TouchableOpacity>
        )}
        <View style={styles.progressBarContainer}>
          <ProgressBar progress={isNaN(progress) ? 0 : progress} color="#06038D" style={styles.progressBar} />
        </View>
        <Text style={styles.goalText}>
          ${post.currentAmount || 0} raised of ${post.goal} goal
        </Text>
        <Text style={styles.description}>{post.description}</Text>
        <TouchableOpacity style={styles.donateButton}>
          <Text style={styles.donateButtonText}>Donate</Text>
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
  postImage: {
    width: '100%',
    height: 250,
    borderRadius: 10,
    marginBottom: 20,
  },
  shareButton: {
    position: 'absolute',
    top: 30,
    right: 30,
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
    marginTop: -40,
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
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#06038D',
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
  likeCount: {
    fontSize: 16,
    marginLeft: 5,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 15,
  },
  tagContainer: {
    backgroundColor: '#06038D',
    borderRadius: 15,
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
    marginBottom: 15,
  },
  authorName: {
    marginLeft: 10,
    fontSize: 18,
    color: '#06038D',
  },
  progressBarContainer: {
    marginBottom: 10,
    borderRadius: 10,
    overflow: 'hidden',
    borderColor: '#06038D',
    borderWidth: 1,
  },
  progressBar: {
    height: 10,
    borderRadius: 10,
  },
  goalText: {
    fontSize: 16,
    color: '#06038D',
    marginBottom: 20,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#333',
    marginBottom: 20,
    lineHeight: 24,
  },
  donateButton: {
    backgroundColor: '#06038D',
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  donateButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  errorText: {
    fontSize: 18,
    color: 'red',
    textAlign: 'center',
  },
});

export default FundraisePostDetailsScreen;
