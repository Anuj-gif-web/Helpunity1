import React from 'react';
import { View, Text, Button, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const CreateStripeAccountScreen = () => {
  const navigation = useNavigation();

  const handleCreateAccountLink = async () => {
    try {
      const response = await fetch('http://localhost:3000/create-account-link', { // Replace with your server URL
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: 'your-user-id' }),
      });

      const { url } = await response.json();
      if (url) {
        navigation.navigate('WebViewScreen', { url }); // Open the Stripe onboarding link
      }
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create Stripe Account</Text>
      <Button title="Create Account" onPress={handleCreateAccountLink} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 20,
  },
});

export default CreateStripeAccountScreen;
