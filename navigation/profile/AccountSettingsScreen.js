import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native';
import { auth } from '../../firebase/firebaseconfig';
import { sendPasswordResetEmail, deleteUser } from 'firebase/auth';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const AccountSettingsScreen = ({ navigation }) => {
  const user = auth.currentUser;

  const handleChangePassword = () => {
    if (user) {
      sendPasswordResetEmail(auth, user.email)
        .then(() => {
          Alert.alert('Password Reset', 'Password reset email sent successfully.');
        })
        .catch((error) => {
          Alert.alert('Error', error.message);
        });
    }
  };

  const handleDeleteAccount = () => {
    if (user) {
      deleteUser(user)
        .then(() => {
          Alert.alert('Account Deleted', 'Your account has been deleted.');
          navigation.navigate('Login');
        })
        .catch((error) => {
          Alert.alert('Error', error.message);
        });
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <TouchableOpacity style={styles.optionButton} onPress={handleChangePassword}>
        <MaterialCommunityIcons name="lock-reset" size={24} color="#fff" />
        <Text style={styles.optionText}>Change Password</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionButton} onPress={handleDeleteAccount}>
        <MaterialCommunityIcons name="account-remove" size={24} color="#fff" />
        <Text style={styles.optionText}>Delete Account</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionButton} onPress={() => navigation.navigate('PrivacySettings')}>
        <MaterialCommunityIcons name="shield-lock" size={24} color="#fff" />
        <Text style={styles.optionText}>Privacy Settings</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.optionButton} onPress={() => navigation.navigate('NotificationSettings')}>
        <MaterialCommunityIcons name="bell-ring" size={24} color="#fff" />
        <Text style={styles.optionText}>Notification Settings</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    backgroundColor: '#f0f4f7',
    padding: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#06038D',
    padding: 15,
    width: '100%',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  optionText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default AccountSettingsScreen;
