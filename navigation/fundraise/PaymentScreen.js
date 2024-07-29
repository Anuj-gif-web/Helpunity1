import React, { useState } from 'react';
import { View, Button, StyleSheet, Alert, TextInput, Text } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { useNavigation } from '@react-navigation/native';

const PaymentScreen = () => {
  const [loading, setLoading] = useState(false);
  const [amount, setAmount] = useState('');
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  const navigation = useNavigation();

  const fetchPaymentSheetParams = async (amount) => {
    const response = await fetch('http://localhost:3000/create-payment-intent', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ amount }),
    });
    const { clientSecret } = await response.json();
    return { clientSecret };
  };

  const initializePaymentSheet = async () => {
    setLoading(true);
    const { clientSecret } = await fetchPaymentSheetParams(amount * 100); // Convert to smallest currency unit
    const { error } = await initPaymentSheet({
      paymentIntentClientSecret: clientSecret,
      returnURL: 'Helpunity1://return', // Replace with your deep link scheme
      merchantDisplayName: 'Helpunity',
    });
    if (!error) {
      const { error } = await presentPaymentSheet();
      if (error) {
        Alert.alert(`Error code: ${error.code}`, error.message);
      } else {
        Alert.alert('Success', 'Your payment is confirmed!');
        navigation.navigate('Success'); // Navigate to success screen
      }
    }
    setLoading(false);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.label}>Enter Amount to Donate:</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        value={amount}
        onChangeText={setAmount}
      />
      <Button onPress={initializePaymentSheet} title="Checkout" disabled={loading} />
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
  label: {
    fontSize: 18,
    marginBottom: 10,
  },
  input: {
    height: 40,
    width: '100%',
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 20,
    paddingHorizontal: 10,
  },
});

export default PaymentScreen;
