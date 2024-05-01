import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated } from 'react-native';

const SplashScreen = () => {
  const [fadeAnim] = useState(new Animated.Value(0)); // Initial value for opacity: 0

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
    backgroundColor: '#fff', // White background or any other color
  },
  logo: {
    width: 250, // Adjust the size as needed
    height: 250, // Adjust the size as needed
  },
  text: {
    color: '#06038D', // Blue color code
    fontSize: 40, // Adjust size as needed
    fontWeight: 'bold',
  }
});

export default SplashScreen;
