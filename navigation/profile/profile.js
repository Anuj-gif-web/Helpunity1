import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/firebaseconfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFollowersModalVisible, setIsFollowersModalVisible] = useState(false);
  const [isFollowingModalVisible, setIsFollowingModalVisible] = useState(false);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  const calculateTotalHours = () => {
    return userData.history?.reduce((total, event) => total + (event.hours || 0), 0) || 0;
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        name: userData.name,
        lastName: userData.lastName,
      });
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating user data: ", error);
    }
    setUpdating(false);
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.navigate('Login');
      })
      .catch((error) => {
        console.error("Error logging out: ", error);
      });
  };

  const handleUnfollow = async (followedUserId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        following: userData.following.filter(id => id !== followedUserId)
      });
      setUserData(prev => ({
        ...prev,
        following: prev.following.filter(id => id !== followedUserId)
      }));
    } catch (error) {
      console.error("Error unfollowing user: ", error);
    }
  };

  const handleFollow = async (userToFollowId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        following: [...userData.following, userToFollowId]
      });
      setUserData(prev => ({
        ...prev,
        following: [...prev.following, userToFollowId]
      }));
    } catch (error) {
      console.error("Error following user: ", error);
    }
  };

  const fetchUserDetails = async (userIds) => {
    const userDetails = await Promise.all(userIds.map(async (id) => {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return { id, ...data };
      }
      return null;
    }));
    return userDetails.filter(user => user !== null);
  };

  const renderFollowerOrFollowing = ({ item }) => {
    const isFollowing = userData.following.includes(item.id);
    return (
      <View style={styles.followerItem}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => {
            setIsFollowersModalVisible(false);
            setIsFollowingModalVisible(false);
            navigation.navigate('UserProfile', { userId: item.id });
          }}
        >
          <MaterialCommunityIcons name="account-circle" size={40} color="#06038D" />
          <Text style={styles.followerName}>{item.name} {item.lastName}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={isFollowing ? styles.unfollowButton : styles.followButton}
          onPress={() => {
            isFollowing ? handleUnfollow(item.id) : handleFollow(item.id)
          }}
        >
          <Text style={styles.followButtonText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const showFollowersModal = async () => {
    if (userData.followers?.length) {
      const followersDetails = await fetchUserDetails(userData.followers);
      setUserData(prev => ({ ...prev, followersDetails }));
    }
    setIsFollowersModalVisible(true);
  };

  const showFollowingModal = async () => {
    if (userData.following?.length) {
      const followingDetails = await fetchUserDetails(userData.following);
      setUserData(prev => ({ ...prev, followingDetails }));
    }
    setIsFollowingModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsFollowersModalVisible(false);
    setIsFollowingModalVisible(false);
  };

  useEffect(() => {
    if (!isFollowersModalVisible) {
      setUserData(prev => ({
        ...prev,
        followersDetails: prev.followersDetails?.filter(user => userData.following.includes(user.id))
      }));
    }
    if (!isFollowingModalVisible) {
      setUserData(prev => ({
        ...prev,
        followingDetails: prev.followingDetails?.filter(user => userData.following.includes(user.id))
      }));
    }
  }, [isFollowersModalVisible, isFollowingModalVisible]);

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <MaterialCommunityIcons name="account" size={260} color="#06038D" style={styles.userIcon} />
      <Text style={styles.hoursText}>Total Hours Volunteered: {calculateTotalHours()}</Text>
      <View style={styles.followBox}>
        <TouchableOpacity style={styles.followBoxItem} onPress={showFollowersModal}>
          <Text style={styles.followBoxText}>Followers</Text>
          <Text style={styles.followBoxCount}>{userData.followers?.length || 0}</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.followBoxItem} onPress={showFollowingModal}>
          <Text style={styles.followBoxText}>Following</Text>
          <Text style={styles.followBoxCount}>{userData.following?.length || 0}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('UserPosts')}>
        <Text style={styles.rowText}>My Posts</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#06038D" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('VolunteerHistory')}>
        <Text style={styles.rowText}>Volunteer History</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#06038D" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ManageEventSignups')}>
        <Text style={styles.rowText}>Manage Event Signups</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#06038D" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('AccountSettings')}>
        <Text style={styles.rowText}>Account Settings</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#06038D" />
      </TouchableOpacity>
      {isEditMode ? (
        <>
          <Text style={styles.label}>First Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userData.name || ''}
              onChangeText={(text) => setUserData({ ...userData, name: text })}
            />
          </View>
          <Text style={styles.label}>Last Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userData.lastName || ''}
              onChangeText={(text) => setUserData({ ...userData, lastName: text })}
            />
          </View>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: 'gray' }]}
              value={userData.email || ''}
              editable={false}
            />
          </View>
          <Text style={styles.label}>Age</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: 'gray' }]}
              value={userData.age || ''}
              editable={false}
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={updating}>
            <Text style={styles.buttonText}>{updating ? "Updating..." : "Update"}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>First Name</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.text}>{userData.name}</Text>
          </View>
          <Text style={styles.label}>Last Name</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.text}>{userData.lastName}</Text>
          </View>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.text}>{userData.email}</Text>
          </View>
          <Text style={styles.label}>Age</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.text}>{userData.age}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={() => setIsEditMode(true)}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
      <Modal
        visible={isFollowersModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#06038D" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Followers</Text>
            {userData.followersDetails?.length ? (
              <FlatList
                data={userData.followersDetails}
                renderItem={renderFollowerOrFollowing}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            ) : (
              <Text style={styles.noDataText}>No followers yet</Text>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={isFollowingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#06038D" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Following</Text>
            {userData.followingDetails?.length ? (
              <FlatList
                data={userData.followingDetails}
                renderItem={renderFollowerOrFollowing}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            ) : (
              <Text style={styles.noDataText}>Not following anyone yet</Text>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f7',
    padding: 20,
  },
  userIcon: {
    marginBottom: 10,
  },
  hoursText: {
    fontSize: 18,
    color: '#06038D',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  followBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#06038D',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 300,
  },
  followBoxItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  followBoxText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#06038D',
  },
  followBoxCount: {
    fontSize: 16,
    color: '#06038D',
  },
  separator: {
    width: 1,
    backgroundColor: '#06038D',
  },
  label: {
    width: '100%',
    fontSize: 16,
    color: '#06038D',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',
    padding: 10,
    borderColor: '#06038D',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  input: {
    width: '100%',
    padding: 5,
    fontSize: 16,
  },
  text: {
    fontSize: 16,
    color: '#06038D',
  },
  button: {
    backgroundColor: '#06038D',
    padding: 15,
    width: '100%',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    width: '100%',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 5,
  },
  rowText: {
    fontSize: 16,
    color: '#06038D',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#06038D',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  noDataText: {
    fontSize: 16,
    color: '#333',
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followerName: {
    fontSize: 16,
    color: '#06038D',
    marginLeft: 10,
  },
  followButton: {
    backgroundColor: '#06038D',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  unfollowButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default ProfileScreen;
import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../../firebase/firebaseconfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isFollowersModalVisible, setIsFollowersModalVisible] = useState(false);
  const [isFollowingModalVisible, setIsFollowingModalVisible] = useState(false);
  const userId = auth.currentUser?.uid;

  useEffect(() => {
    const fetchUserData = async () => {
      if (userId) {
        try {
          const userDoc = await getDoc(doc(db, 'users', userId));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
        setLoading(false);
      }
    };
    fetchUserData();
  }, [userId]);

  const calculateTotalHours = () => {
    return userData.history?.reduce((total, event) => total + (event.hours || 0), 0) || 0;
  };

  const handleUpdate = async () => {
    setUpdating(true);
    try {
      await updateDoc(doc(db, 'users', userId), {
        name: userData.name,
        lastName: userData.lastName,
      });
      setIsEditMode(false);
    } catch (error) {
      console.error("Error updating user data: ", error);
    }
    setUpdating(false);
  };

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        navigation.navigate('Login');
      })
      .catch((error) => {
        console.error("Error logging out: ", error);
      });
  };

  const handleUnfollow = async (followedUserId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        following: userData.following.filter(id => id !== followedUserId)
      });
      setUserData(prev => ({
        ...prev,
        following: prev.following.filter(id => id !== followedUserId)
      }));
    } catch (error) {
      console.error("Error unfollowing user: ", error);
    }
  };

  const handleFollow = async (userToFollowId) => {
    try {
      await updateDoc(doc(db, 'users', userId), {
        following: [...userData.following, userToFollowId]
      });
      setUserData(prev => ({
        ...prev,
        following: [...prev.following, userToFollowId]
      }));
    } catch (error) {
      console.error("Error following user: ", error);
    }
  };

  const fetchUserDetails = async (userIds) => {
    const userDetails = await Promise.all(userIds.map(async (id) => {
      const userDoc = await getDoc(doc(db, 'users', id));
      if (userDoc.exists()) {
        const data = userDoc.data();
        return { id, ...data };
      }
      return null;
    }));
    return userDetails.filter(user => user !== null);
  };

  const renderFollowerOrFollowing = ({ item }) => {
    const isFollowing = userData.following.includes(item.id);
    return (
      <View style={styles.followerItem}>
        <TouchableOpacity
          style={styles.userInfo}
          onPress={() => {
            setIsFollowersModalVisible(false);
            setIsFollowingModalVisible(false);
            navigation.navigate('UserProfile', { userId: item.id });
          }}
        >
          <MaterialCommunityIcons name="account-circle" size={40} color="#06038D" />
          <Text style={styles.followerName}>{item.name} {item.lastName}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={isFollowing ? styles.unfollowButton : styles.followButton}
          onPress={() => {
            isFollowing ? handleUnfollow(item.id) : handleFollow(item.id)
          }}
        >
          <Text style={styles.followButtonText}>{isFollowing ? 'Unfollow' : 'Follow'}</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const showFollowersModal = async () => {
    if (userData.followers?.length) {
      const followersDetails = await fetchUserDetails(userData.followers);
      setUserData(prev => ({ ...prev, followersDetails }));
    }
    setIsFollowersModalVisible(true);
  };

  const showFollowingModal = async () => {
    if (userData.following?.length) {
      const followingDetails = await fetchUserDetails(userData.following);
      setUserData(prev => ({ ...prev, followingDetails }));
    }
    setIsFollowingModalVisible(true);
  };

  const handleCloseModal = () => {
    setIsFollowersModalVisible(false);
    setIsFollowingModalVisible(false);
  };

  useEffect(() => {
    if (!isFollowersModalVisible) {
      setUserData(prev => ({
        ...prev,
        followersDetails: prev.followersDetails?.filter(user => userData.following.includes(user.id))
      }));
    }
    if (!isFollowingModalVisible) {
      setUserData(prev => ({
        ...prev,
        followingDetails: prev.followingDetails?.filter(user => userData.following.includes(user.id))
      }));
    }
  }, [isFollowersModalVisible, isFollowingModalVisible]);

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <MaterialCommunityIcons name="account" size={260} color="#06038D" style={styles.userIcon} />
      <Text style={styles.hoursText}>Total Hours Volunteered: {calculateTotalHours()}</Text>
      <View style={styles.followBox}>
        <TouchableOpacity style={styles.followBoxItem} onPress={showFollowersModal}>
          <Text style={styles.followBoxText}>Followers</Text>
          <Text style={styles.followBoxCount}>{userData.followers?.length || 0}</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.followBoxItem} onPress={showFollowingModal}>
          <Text style={styles.followBoxText}>Following</Text>
          <Text style={styles.followBoxCount}>{userData.following?.length || 0}</Text>
        </TouchableOpacity>
      </View>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('UserPosts')}>
        <Text style={styles.rowText}>My Posts</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#06038D" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('VolunteerHistory')}>
        <Text style={styles.rowText}>Volunteer History</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#06038D" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('ManageEventSignups')}>
        <Text style={styles.rowText}>Manage Event Signups</Text>
        <MaterialCommunityIcons name="chevron-right" size={24} color="#06038D" />
      </TouchableOpacity>
      {isEditMode ? (
        <>
          <Text style={styles.label}>First Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userData.name || ''}
              onChangeText={(text) => setUserData({ ...userData, name: text })}
            />
          </View>
          <Text style={styles.label}>Last Name</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={userData.lastName || ''}
              onChangeText={(text) => setUserData({ ...userData, lastName: text })}
            />
          </View>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: 'gray' }]}
              value={userData.email || ''}
              editable={false}
            />
          </View>
          <Text style={styles.label}>Age</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, { color: 'gray' }]}
              value={userData.age || ''}
              editable={false}
            />
          </View>
          <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={updating}>
            <Text style={styles.buttonText}>{updating ? "Updating..." : "Update"}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>First Name</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.text}>{userData.name}</Text>
          </View>
          <Text style={styles.label}>Last Name</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.text}>{userData.lastName}</Text>
          </View>
          <Text style={styles.label}>Email</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.text}>{userData.email}</Text>
          </View>
          <Text style={styles.label}>Age</Text>
          <View style={styles.inputContainer}>
            <Text style={styles.text}>{userData.age}</Text>
          </View>
          <TouchableOpacity style={styles.button} onPress={() => setIsEditMode(true)}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
      <Modal
        visible={isFollowersModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#06038D" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Followers</Text>
            {userData.followersDetails?.length ? (
              <FlatList
                data={userData.followersDetails}
                renderItem={renderFollowerOrFollowing}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            ) : (
              <Text style={styles.noDataText}>No followers yet</Text>
            )}
          </View>
        </View>
      </Modal>
      <Modal
        visible={isFollowingModalVisible}
        transparent
        animationType="slide"
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={handleCloseModal} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#06038D" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Following</Text>
            {userData.followingDetails?.length ? (
              <FlatList
                data={userData.followingDetails}
                renderItem={renderFollowerOrFollowing}
                keyExtractor={(item) => item.id}
                contentContainerStyle={{ paddingBottom: 20 }}
              />
            ) : (
              <Text style={styles.noDataText}>Not following anyone yet</Text>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f4f7',
    padding: 20,
  },
  userIcon: {
    marginBottom: 10,
  },
  hoursText: {
    fontSize: 18,
    color: '#06038D',
    fontWeight: 'bold',
    marginBottom: 10,
  },
  followBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#06038D',
    overflow: 'hidden',
    width: '100%',
    maxWidth: 300,
  },
  followBoxItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
  },
  followBoxText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#06038D',
  },
  followBoxCount: {
    fontSize: 16,
    color: '#06038D',
  },
  separator: {
    width: 1,
    backgroundColor: '#06038D',
  },
  label: {
    width: '100%',
    fontSize: 16,
    color: '#06038D',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  inputContainer: {
    width: '100%',
    padding: 10,
    borderColor: '#06038D',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
    fontSize: 16,
  },
  input: {
    width: '100%',
    padding: 5,
    fontSize: 16,
  },
  text: {
    fontSize: 16,
    color: '#06038D',
  },
  button: {
    backgroundColor: '#06038D',
    padding: 15,
    width: '100%',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  logoutButton: {
    backgroundColor: '#FF3B30',
    padding: 15,
    width: '100%',
    alignItems: 'center',
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    marginVertical: 5,
  },
  rowText: {
    fontSize: 16,
    color: '#06038D',
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#06038D',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  noDataText: {
    fontSize: 16,
    color: '#333',
  },
  followerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    width: '100%',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  followerName: {
    fontSize: 16,
    color: '#06038D',
    marginLeft: 10,
  },
  followButton: {
    backgroundColor: '#06038D',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  unfollowButton: {
    backgroundColor: '#FF3B30',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 5,
  },
  followButtonText: {
    color: '#fff',
    fontSize: 14,
  },
});

export default ProfileScreen;
