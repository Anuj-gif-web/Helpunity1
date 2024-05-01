import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View, Image, Button, TouchableOpacity, Alert } from 'react-native';
import firebase from '../firebase/firebaseconfig'; // Make sure this path is correct

const LoginScreen = ({ onLoginSuccess, onSignUp }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
  
    const handleLogin = () => {
      firebase.auth().signInWithEmailAndPassword(email, password)
        .then((userCredentials) => {
          onLoginSuccess(); // Notify App.js about successful login
        })
        .catch(error => Alert.alert("Login failed", error.message));
    };
  
    return (
      <View style={styles.container}>
        <Image source={require('../assets/Helpunitylogo.jpg')} style={styles.logo} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TouchableOpacity style={styles.button} onPress={handleLogin}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>
        <Text style={styles.signupText} onPress={onSignUp}>Sign Up</Text>
      </View>
    );
  };
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#fff', // Background color
    },
    logo: {
      width: 150, // Set appropriate size for the logo
      height: 150, // Set appropriate size for the logo
      marginBottom: 20, // Space between the logo and the first input
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
    buttonText: {
      color: '#fff',
      fontSize: 16
    },
    signupText: {
      color: '#06038D',
      fontSize: 16,
      textDecorationLine: 'underline', // Style to make it look like a link
    }
  });
  
  export default LoginScreen;