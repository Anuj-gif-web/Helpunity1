import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import LoginScreen from './navigation/login'; 
import SignupScreen from './navigation/signup'; 
import SplashScreen from './navigation/splash'; 

export default function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isSigningUp, setIsSigningUp] = useState(false);

  useEffect(() => {
    setTimeout(() => {
      setIsSplashVisible(false); 
    }, 4000);
  }, []);

  if (isSplashVisible) {
    return <SplashScreen />;
  } else if (!isLoggedIn) {
    if (isSigningUp) {
      return (
        <SignupScreen
          onSignUpSuccess={() => { setIsLoggedIn(true); setIsSigningUp(false); }}
          onBackToLogin={() => setIsSigningUp(false)}
        />
      );
    } else {
      return (
        <LoginScreen
          onLoginSuccess={() => setIsLoggedIn(true)}
          onSignUp={() => setIsSigningUp(true)}
        />
      );
    }
  } else {
    return (
      <View style={styles.container}>
        <Text>Main App Content Here</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  }
});
