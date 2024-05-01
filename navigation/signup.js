import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, TouchableOpacity, Image, Alert } from 'react-native';
import firebase from '../firebase/firebaseconfig'; // Make sure this path is correct

const SignupScreen = ({ onSignUpSuccess, onBackToLogin }) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignUp = () => {
    firebase.auth().createUserWithEmailAndPassword(email, password)
      .then((userCredentials) => {
        const user = userCredentials.user;
        console.log('User created:', user.email);
        // Optionally update the user profile
        user.updateProfile({
          displayName: `${firstName} ${lastName}`
        }).then(() => {
          onSignUpSuccess(); // Call this prop when signup is successful
        });
      })
      .catch(error => {
        Alert.alert("Signup failed", error.message);
      });
  };

  return (
    <View style={styles.container}>
      <Image source={require('../assets/Helpunitylogo.jpg')} style={styles.logo} />
      <TextInput
        style={styles.input}
        placeholder="First Name"
        value={firstName}
        onChangeText={setFirstName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Last Name"
        value={lastName}
        onChangeText={setLastName}
        autoCapitalize="words"
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.backButton} onPress={onBackToLogin}>
        <Text style={styles.backButtonText}>Back to Login</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 20,
  },
  input: {
    width: 300,
    height: 50,
    padding: 10,
    borderWidth: 2,
    borderColor: '#06038D',
    marginBottom: 10,
    borderRadius: 5
  },
  button: {
    backgroundColor: '#06038D',
    padding: 10,
    width: 300,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10
  },
  backButton: {
    backgroundColor: '#fff', // A different or more subtle style
    padding: 10
  },
  backButtonText: {
    color: '#06038D',
    fontSize: 16,
    textDecorationLine: 'underline' // Styling to make it look clickable
  },
  buttonText: {
    color: '#fff',
    fontSize: 16
  }
});

export default SignupScreen;
