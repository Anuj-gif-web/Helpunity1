import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { getAuth, signOut } from 'firebase/auth';
import { useAuth } from './AuthContext';

function HomeScreen() {
  const { setIsLoggedIn } = useAuth();
  const auth = getAuth();

  const handleLogout = () => {
    signOut(auth)
      .then(() => {
        setIsLoggedIn(false); // Update the authentication state
      })
      .catch((error) => {
        console.error("Logout failed", error);
      });
  };

  return (
    <View style={styles.container}>
      <Text>Welcome to the Home Page!</Text>
      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#06038D',
    padding: 10,
    width: 200,
    alignItems: 'center',
    borderRadius: 5,
    marginTop: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default HomeScreen;
