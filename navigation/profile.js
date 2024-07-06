import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView, Modal, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../firebase/firebaseconfig';
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

  const renderFollowers = ({ item }) => (
    <View style={styles.followerItem}>
      <Text>{item}</Text>
    </View>
  );

  const renderFollowing = ({ item }) => (
    <View style={styles.followerItem}>
      <Text>{item}</Text>
    </View>
  );

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <MaterialCommunityIcons name="account" size={220} color="#06038D" style={styles.userIcon} />
      <View style={styles.followBox}>
        <TouchableOpacity style={styles.followBoxItem} onPress={() => setIsFollowersModalVisible(true)}>
          <Text style={styles.followBoxText}>Followers</Text>
          <Text style={styles.followBoxCount}>{userData.followers?.length || 0}</Text>
        </TouchableOpacity>
        <View style={styles.separator} />
        <TouchableOpacity style={styles.followBoxItem} onPress={() => setIsFollowingModalVisible(true)}>
          <Text style={styles.followBoxText}>Following</Text>
          <Text style={styles.followBoxCount}>{userData.following?.length || 0}</Text>
        </TouchableOpacity>
      </View>
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
        onRequestClose={() => setIsFollowersModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setIsFollowersModalVisible(false)} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#06038D" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Followers</Text>
            {userData.followers?.length ? (
              <FlatList
                data={userData.followers}
                renderItem={renderFollowers}
                keyExtractor={(item, index) => index.toString()}
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
        onRequestClose={() => setIsFollowingModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <TouchableOpacity onPress={() => setIsFollowingModalVisible(false)} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#06038D" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Following</Text>
            {userData.following?.length ? (
              <FlatList
                data={userData.following}
                renderItem={renderFollowing}
                keyExtractor={(item, index) => index.toString()}
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
    marginBottom: 0,
  },
  followBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
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
    marginBottom: 15,
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
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
  },
});

export default ProfileScreen;
