import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, TouchableOpacity } from 'react-native';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebaseconfig';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SetupForm = () => {
  const [userType, setUserType] = useState('');
  const [orgName, setOrgName] = useState('');
  const [orgDescription, setOrgDescription] = useState('');
  const [volunteerName, setVolunteerName] = useState('');
  const navigation = useNavigation();
  const auth = getAuth();
  const user = auth.currentUser;

  const handleSubmit = async () => {
    if (userType === 'organization' && (orgName === '' || orgDescription === '')) {
      Alert.alert("Please fill out all fields for organization.");
      return;
    }

    if (userType === 'volunteer' && volunteerName === '') {
      Alert.alert("Please fill out your name.");
      return;
    }

    const userData = {
      userType,
      ...(userType === 'organization' && { orgName, orgDescription }),
      ...(userType === 'volunteer' && { volunteerName })
    };

    try {
      await setDoc(doc(db, 'users', user.uid), userData);
      await AsyncStorage.setItem('userSetup', JSON.stringify(userData));
      navigation.navigate('Home');
    } catch (error) {
      Alert.alert("Error saving data", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Setup Your Profile</Text>
      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={[styles.button, userType === 'organization' && styles.activeButton]} 
          onPress={() => setUserType('organization')}
        >
          <Text style={styles.buttonText}>Organization</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.button, userType === 'volunteer' && styles.activeButton]} 
          onPress={() => setUserType('volunteer')}
        >
          <Text style={styles.buttonText}>Volunteer</Text>
        </TouchableOpacity>
      </View>

      {userType === 'organization' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Organization Name"
            value={orgName}
            onChangeText={setOrgName}
            placeholderTextColor="#06038D"
          />
          <TextInput
            style={styles.input}
            placeholder="Organization Description"
            value={orgDescription}
            onChangeText={setOrgDescription}
            placeholderTextColor="#06038D"
          />
        </>
      )}

      {userType === 'volunteer' && (
        <TextInput
          style={styles.input}
          placeholder="Your Name"
          value={volunteerName}
          onChangeText={setVolunteerName}
          placeholderTextColor="#06038D"
        />
      )}

      <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Text style={styles.submitButtonText}>Submit</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    color: '#06038D',
    marginBottom: 20,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#fff',
    borderColor: '#06038D',
    borderWidth: 2,
    padding: 10,
    margin: 5,
    borderRadius: 5,
    width: 120,
    alignItems: 'center',
  },
  activeButton: {
    backgroundColor: '#06038D',
  },
  buttonText: {
    color: '#06038D',
    fontSize: 16,
  },
  input: {
    width: '100%',
    padding: 10,
    borderWidth: 2,
    borderColor: '#06038D',
    marginBottom: 10,
    borderRadius: 5,
    color: '#06038D',
  },
  submitButton: {
    backgroundColor: '#06038D',
    padding: 10,
    borderRadius: 5,
    alignItems: 'center',
    width: '100%',
  },
  submitButtonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default SetupForm;
