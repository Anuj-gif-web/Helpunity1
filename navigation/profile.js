import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { auth, db } from '../firebase/firebaseconfig';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

const ProfileScreen = ({ navigation }) => {
  const [userData, setUserData] = useState({});
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
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
      await updateDoc(doc(db, 'users', userId), userData);
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

  if (loading) {
    return <ActivityIndicator size="large" color="#06038D" />;
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.followContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('Followers', { userId })}>
          <Text style={styles.followText}>Followers: {userData.followers?.length || 0}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate('Following', { userId })}>
          <Text style={styles.followText}>Following: {userData.following?.length || 0}</Text>
        </TouchableOpacity>
      </View>
      <MaterialCommunityIcons
        name="account"
        size={120}
        color="#06038D"
        style={styles.userIcon}
      />
      {isEditMode ? (
        <>
          <Text style={styles.label}>First Name</Text>
          <TextInput
            style={styles.input}
            value={userData.name || ''}
            onChangeText={(text) => setUserData({ ...userData, name: text })}
          />
          <Text style={styles.label}>Last Name</Text>
          <TextInput
            style={styles.input}
            value={userData.lastName || ''}
            onChangeText={(text) => setUserData({ ...userData, lastName: text })}
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            value={userData.email || ''}
            onChangeText={(text) => setUserData({ ...userData, email: text })}
          />
          <Text style={styles.label}>Age</Text>
          <TextInput
            style={styles.input}
            value={userData.age || ''}
            onChangeText={(text) => setUserData({ ...userData, age: text })}
          />
          <Text style={styles.label}>Profession</Text>
          <TextInput
            style={styles.input}
            value={userData.profession || ''}
            onChangeText={(text) => setUserData({ ...userData, profession: text })}
          />
          <Text style={styles.label}>User Type</Text>
          <TextInput
            style={styles.input}
            value={userData.userType || ''}
            onChangeText={(text) => setUserData({ ...userData, userType: text })}
          />
          <TouchableOpacity style={styles.button} onPress={handleUpdate} disabled={updating}>
            <Text style={styles.buttonText}>{updating ? "Updating..." : "Update"}</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Text style={styles.label}>First Name</Text>
          <Text style={styles.text}>{userData.name}</Text>
          <Text style={styles.label}>Last Name</Text>
          <Text style={styles.text}>{userData.lastName}</Text>
          <Text style={styles.label}>Email</Text>
          <Text style={styles.text}>{userData.email}</Text>
          <Text style={styles.label}>Age</Text>
          <Text style={styles.text}>{userData.age}</Text>
          <Text style={styles.label}>Profession</Text>
          <Text style={styles.text}>{userData.profession}</Text>
          <Text style={styles.label}>User Type</Text>
          <Text style={styles.text}>{userData.userType}</Text>
          <TouchableOpacity style={styles.button} onPress={() => setIsEditMode(true)}>
            <Text style={styles.buttonText}>Edit</Text>
          </TouchableOpacity>
        </>
      )}
      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
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
  followContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  followText: {
    color: '#06038D',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userIcon: {
    marginBottom: 20,
  },
  label: {
    width: '100%',
    fontSize: 16,
    color: '#06038D',
    marginBottom: 5,
    fontWeight: 'bold',
  },
  input: {
    width: '100%',
    padding: 15,
    borderColor: '#06038D',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  text: {
    width: '100%',
    padding: 15,
    borderColor: '#06038D',
    borderWidth: 1,
    borderRadius: 10,
    marginBottom: 15,
    backgroundColor: '#fff',
    fontSize: 16,
    color: '#06038D',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
});

export default ProfileScreen;
