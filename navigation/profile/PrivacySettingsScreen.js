import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';

const PrivacySettingsScreen = () => {
  const [isPublicProfile, setIsPublicProfile] = React.useState(false);

  const togglePublicProfile = () => setIsPublicProfile(previousState => !previousState);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Privacy Settings</Text>
      <View style={styles.setting}>
        <Text style={styles.settingText}>Public Profile</Text>
        <Switch
          trackColor={{ false: "#767577", true: "#81b0ff" }}
          thumbColor={isPublicProfile ? "#06038D" : "#f4f3f4"}
          onValueChange={togglePublicProfile}
          value={isPublicProfile}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f0f4f7',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#06038D',
    marginBottom: 20,
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  settingText: {
    fontSize: 18,
    color: '#06038D',
  },
});

export default PrivacySettingsScreen;
