import React, { useState, useEffect } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { registerRootComponent } from 'expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { AuthProvider, useAuth } from './navigation/AuthContext';
import LoginScreen from './navigation/login';
import SignupScreen from './navigation/signup';
import SplashScreen from './navigation/splash';
import HomeScreen from './navigation/home';
import ExploreScreen from './navigation/explore/explore';
import FundraiseScreen from './navigation/fundraise/fundraise';
import ProfileScreen from './navigation/profile/profile';
import AddFundraisePostScreen from './navigation/fundraise/AddFundraisePostScreen';
import FundraisePostDetailsScreen from './navigation/fundraise/FundraisePostDetailsScreen';
import AddEventScreen from './navigation/explore/AddEventScreen';
import EventDetailsScreen from './navigation/explore/EventDetailsScreen';
import UserProfileScreen from './navigation/profile/UserProfileScreen';
import UserPosts from './navigation/profile/UserPostsScreen';
import VolunteerHistoryScreen from './navigation/profile/VolunteerHistoryScreen';
import ManageEventSignupsScreen from './navigation/profile/ManageEventSignupsScreen';
import EventSignupsScreen from './navigation/profile/EventSignupsScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const windowWidth = Dimensions.get('window').width;

const TabBarIcon = ({ name, focused }) => (
  <View style={styles.iconContainer}>
    <MaterialCommunityIcons name={name} size={35} color={focused ? '#06038D' : 'gray'} />
  </View>
);

const HomeTabs = () => (
  <View style={styles.tabContainer}>
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = 'home';
          } else if (route.name === 'Explore') {
            iconName = 'compass';
          } else if (route.name === 'Fundraise') {
            iconName = 'hand-heart';
          } else if (route.name === 'Profile') {
            iconName = 'account';
          }

          return <TabBarIcon name={iconName} focused={focused} />;
        },
        tabBarActiveTintColor: '#06038D',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 75,
          paddingVertical: 10,
          backgroundColor: '#fff', // Set background color to white
        },
        tabBarIconStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Fundraise" component={FundraiseScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
    <LinearGradient
      colors={['#0000FF', '#00FFFF']}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={styles.gradientLine}
    />
  </View>
);

function App() {
  const [isSplashVisible, setIsSplashVisible] = useState(true);
  const { isLoggedIn, setIsLoggedIn } = useAuth();
  const auth = getAuth();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user && user.emailVerified) {
        await AsyncStorage.setItem('user', JSON.stringify(user));
        setIsLoggedIn(true);
      } else {
        await AsyncStorage.removeItem('user');
        setIsLoggedIn(false);
      }
    });

    return () => unsubscribe();
  }, [setIsLoggedIn]);

  useEffect(() => {
    setTimeout(() => {
      setIsSplashVisible(false);
    }, 4000);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        {isSplashVisible ? (
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        ) : isLoggedIn ? (
          <Stack.Screen name="HomeTabs" component={HomeTabs} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          </>
        )}
        <Stack.Screen name="AddFundraisePost" component={AddFundraisePostScreen} options={{ title: 'Add Fundraise Post', headerBackTitleVisible: false }} />
        <Stack.Screen name="FundraisePostDetails" component={FundraisePostDetailsScreen} options={{ title: 'Fundraise Details', headerBackTitleVisible: false }} />
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: 'Event Details', headerBackTitleVisible: false }} />
        <Stack.Screen name="AddEvent" component={AddEventScreen} options={{ title: 'Add Event Post', headerBackTitleVisible: false }} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'User Profile', headerBackTitleVisible: false }} />
        <Stack.Screen name="UserPosts" component={UserPosts} options={{ title: 'User Posts', headerBackTitleVisible: false }} />
        <Stack.Screen name="VolunteerHistory" component={VolunteerHistoryScreen} options={{ title: 'Volunteer History', headerBackTitleVisible: false }} />
        <Stack.Screen name="ManageEventSignups" component={ManageEventSignupsScreen} options={{ title: 'Your Event', headerBackTitleVisible: false }} />
        <Stack.Screen name="EventSignups" component={EventSignupsScreen} options={{ title: 'Event Signups', headerBackTitleVisible: false }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AppWrapper() {
  return (
    <AuthProvider>
      <App />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  tabContainer: {
    flex: 1,
  },
  gradientLine: {
    width: windowWidth,
    height: 2,
    position: 'absolute',
    bottom: 75, 
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

registerRootComponent(AppWrapper);

export default AppWrapper;
