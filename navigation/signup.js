import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getAuth, createUserWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
import { db } from '../firebase/firebaseconfig'; 
import { doc, setDoc } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import SegmentControl from '@react-native-segmented-control/segmented-control';
import RNPickerSelect from 'react-native-picker-select';

const professions = [
  { label: 'Engineer', value: 'Engineer' },
  { label: 'Doctor', value: 'Doctor' },
  { label: 'Teacher', value: 'Teacher' },
  { label: 'Artist', value: 'Artist' },
  { label: 'Entrepreneur', value: 'Entrepreneur' },
  { label: 'Consultant', value: 'Consultant' },
  { label: 'Freelancer', value: 'Freelancer' },
  { label: 'Scientist', value: 'Scientist' },
  { label: 'Student', value: 'Student' },
  { label: 'Other', value: 'Other' },
];

const ageOptions = Array.from({ length: 83 }, (_, i) => ({
  label: `${i + 18}`,
  value: `${i + 18}`
}));

const SignupScreen = () => {
  const [userType, setUserType] = useState('volunteer');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
  const [age, setAge] = useState('');
  const [profession, setProfession] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const auth = getAuth();

  const handleSignUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        const user = userCredential.user;

        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          email: user.email,
          userType,
          name,
          lastName: userType === 'volunteer' ? lastName : null,
          age: userType === 'volunteer' ? age : null,
          profession: userType === 'volunteer' ? profession : null,
        });

        await sendEmailVerification(user);

        Alert.alert(
          "Signup Successful",
          "A verification email has been sent to your email address. Please verify your email before logging in.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      })
      .catch((error) => {
        Alert.alert("Signup failed", error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/Helpunitylogo.jpg')} style={styles.logo} />
      <SegmentControl
        values={['Volunteer', 'Organization']}
        selectedIndex={userType === 'volunteer' ? 0 : 1}
        onChange={(event) => {
          setUserType(event.nativeEvent.selectedSegmentIndex === 0 ? 'volunteer' : 'organization');
        }}
        style={styles.segmentControl}
        tintColor="#06038D"
        backgroundColor="#fff"
        fontStyle={{ color: '#06038D' }}
        activeFontStyle={{ color: '#fff' }}
      />
      <TextInput
        style={styles.input}
        placeholder={userType === 'volunteer' ? "First Name" : "Organization Name"}
        placeholderTextColor="#06038D"
        value={name}
        onChangeText={setName}
        autoCapitalize="words"
      />
      {userType === 'volunteer' && (
        <>
          <TextInput
            style={styles.input}
            placeholder="Last Name"
            placeholderTextColor="#06038D"
            value={lastName}
            onChangeText={setLastName}
            autoCapitalize="words"
          />
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              onValueChange={(value) => setAge(value)}
              items={ageOptions}
              style={pickerSelectStyles}
              placeholder={{
                label: 'Select Age',
                value: null,
                color: '#06038D',
              }}
              value={age}
            />
          </View>
          <View style={styles.pickerWrapper}>
            <RNPickerSelect
              onValueChange={(value) => setProfession(value)}
              items={professions}
              style={pickerSelectStyles}
              placeholder={{
                label: 'Select Profession',
                value: null,
                color: '#06038D',
              }}
              value={profession}
            />
          </View>
        </>
      )}
      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#06038D"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#06038D"
        value={password}
        onChangeText={setPassword}
        secureTextEntry={true}
      />
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.navigate('Login')}>
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const pickerSelectStyles = StyleSheet.create({
  inputIOS: {
    height: 40,
    padding: 10,
    color: '#06038D',
    textAlign: 'left',
    paddingLeft: 15,
  },
  inputAndroid: {
    height: 40,
    padding: 10,
    color: '#06038D',
    textAlign: 'left',
    paddingLeft: 15,
  },
  placeholder: {
    color: '#06038D',
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 20,
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  segmentControl: {
    width: '100%',
    marginBottom: 20,
  },
  input: {
    width: '100%',
    height: 40,
    padding: 10,
    borderWidth: 1,
    borderColor: '#06038D',
    marginBottom: 10,
    borderRadius: 5,
    color: '#06038D',
    textAlign: 'left',
    paddingLeft: 15,
  },
  pickerWrapper: {
    width: '100%',
    height: 40,
    padding: 10,
    borderWidth: 1,
    borderColor: '#06038D',
    borderRadius: 5,
    marginBottom: 10,
    justifyContent: 'center', // Ensure content is vertically centered
  },
  button: {
    backgroundColor: '#06038D',
    padding: 10,
    width: '100%',
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  backButton: {
    backgroundColor: '#fff',
    padding: 10,
  },
  backButtonText: {
    color: '#06038D',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default SignupScreen;
