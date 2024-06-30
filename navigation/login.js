import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, Image } from 'react-native';
import { getAuth, signInWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import * as Google from 'expo-auth-session/providers/google';
import { useNavigation } from '@react-navigation/native';
import { db } from '../firebase/firebaseconfig'; 
import AsyncStorage from '@react-native-async-storage/async-storage';

const LoginScreen = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigation = useNavigation();
  const auth = getAuth();

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: 'YOUR_EXPO_CLIENT_ID',
    iosClientId: 'YOUR_IOS_CLIENT_ID',
    androidClientId: 'YOUR_ANDROID_CLIENT_ID',
    webClientId: 'YOUR_WEB_CLIENT_ID',
  });

  useEffect(() => {
    if (response?.type === 'success') {
      const { id_token } = response.params;
      const credential = GoogleAuthProvider.credential(id_token);
      signInWithCredential(auth, credential)
        .then(async (userCredential) => {
          if (userCredential.user.emailVerified) {
            await AsyncStorage.setItem('user', JSON.stringify(userCredential.user));
            checkUserSetup(userCredential.user);
          } else {
            Alert.alert("Email not verified", "Please verify your email before logging in.");
          }
        })
        .catch((error) => {
          Alert.alert("Login failed", error.message);
        });
    }
  }, [response]);

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then(async (userCredential) => {
        if (userCredential.user.emailVerified) {
          await AsyncStorage.setItem('user', JSON.stringify(userCredential.user));
          checkUserSetup(userCredential.user);
        } else {
          Alert.alert("Email not verified", "Please verify your email before logging in.");
        }
      })
      .catch((error) => {
        Alert.alert("Login failed", error.message);
      });
  };

  const checkUserSetup = async (user) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      if (userDoc.exists()) {
        navigation.navigate('HomeTabs'); // Ensure this matches the registered name in App.js
      } else {
        navigation.navigate('SetupForm');
      }
    } catch (error) {
      Alert.alert("Error checking user setup", error.message);
    }
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
      <TouchableOpacity style={styles.googleButton} onPress={() => promptAsync()}>
        <Text style={styles.buttonText}>Login with Google</Text>
      </TouchableOpacity>
      <Text style={styles.signupText} onPress={() => navigation.navigate('Signup')}>Sign Up</Text>
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
    borderRadius: 5,
  },
  button: {
    backgroundColor: '#06038D',
    padding: 10,
    width: 300,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  googleButton: {
    backgroundColor: '#DB4437',
    padding: 10,
    width: 300,
    alignItems: 'center',
    borderRadius: 5,
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
  signupText: {
    color: '#06038D',
    fontSize: 16,
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
