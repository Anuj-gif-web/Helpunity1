import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';

const SplashScreen = () => {
  const [fadeAnim] = useState(new Animated.Value(0)); // Initial value for opacity 0

  useEffect(() => {
    setTimeout(() => {
      Animated.timing(
        fadeAnim,
        {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }
      ).start();
    }, 1000); // Start the animation 1 second after mount
  }, []);

  return (
    <View style={styles.container}>
      <Image source={require('../assets/Helpunitylogo.jpg')} style={styles.logo} />
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        HelpUnity
      </Animated.Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff', 
  },
  logo: {
    width: 250, 
    height: 250, 
  },
  text: {
    color: '#06038D', 
    fontSize: 40, 
    fontWeight: 'bold',
  }
});

export default SplashScreen;
