import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const SplashScreen = () => {
  const [fadeAnim] = useState(new Animated.Value(0));
  const navigation = useNavigation();

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
    }, 1000);
  }, [fadeAnim]);

  // const handlePress = () => {
  //   navigation.navigate('HomeTabs', { screen: 'Home' });
  // };

  return (
    <TouchableOpacity style={styles.container} >
      <Image source={require('../assets/Helpunitylogo.jpg')} style={styles.logo} />
      <Animated.Text style={[styles.text, { opacity: fadeAnim }]}>
        HelpUnity
      </Animated.Text>
    </TouchableOpacity>
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