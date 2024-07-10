import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { registerRootComponent } from 'expo';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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

import { getAuth, onAuthStateChanged } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthProvider, useAuth } from './navigation/AuthContext';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

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

  const TabNavigator = () => (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          if (route.name === 'Home') {
            iconName = focused ? 'home' : 'home-outline';
          } else if (route.name === 'Explore') {
            iconName = focused ? 'compass' : 'compass-outline';
          } else if (route.name === 'Fundraise') {
            iconName = focused ? 'hand-heart' : 'hand-heart-outline';
          } else if (route.name === 'Profile') {
            iconName = focused ? 'account' : 'account-outline';
          }

          return <MaterialCommunityIcons name={iconName} size={35} color={color} />;
        },
        tabBarActiveTintColor: '#06038D',
        tabBarInactiveTintColor: 'gray',
        tabBarShowLabel: false,
        tabBarStyle: {
          height: 90,
          paddingVertical: 10,
        },
        tabBarIconStyle: {
          alignItems: 'center',
          justifyContent: 'center',
        }
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen name="Fundraise" component={FundraiseScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Splash">
        {isSplashVisible ? (
          <Stack.Screen name="Splash" component={SplashScreen} options={{ headerShown: false }} />
        ) : isLoggedIn ? (
          <Stack.Screen name="HomeTabs" component={TabNavigator} options={{ headerShown: false }} />
        ) : (
          <>
            <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
            <Stack.Screen name="Signup" component={SignupScreen} options={{ headerShown: false }} />
          </>
        )}
        <Stack.Screen name="AddFundraisePost" component={AddFundraisePostScreen} options={{ title: 'Add Fundraise Post', headerBackTitleVisible: false}} />
        <Stack.Screen name="FundraisePostDetails" component={FundraisePostDetailsScreen} options={{ title: 'Fundraise Details', headerBackTitleVisible: false }}/>
        <Stack.Screen name="EventDetails" component={EventDetailsScreen} options={{ title: 'Event Details', headerBackTitleVisible: false }}  />
        <Stack.Screen name="AddEvent" component={AddEventScreen} options={{ title: 'Add Event Post', headerBackTitleVisible: false }} />
        <Stack.Screen name="UserProfile" component={UserProfileScreen} options={{ title: 'User Profile', headerBackTitleVisible: false }} />
        <Stack.Screen name="UserPosts" component={UserPosts} options={{ title: 'User Posts', headerBackTitleVisible: false }} />
        <Stack.Screen name="VolunteerHistory" component={VolunteerHistoryScreen} options={{ title: 'Volunteer History', headerBackTitleVisible: false }} />
        <Stack.Screen name="ManageEventSignups" component={ManageEventSignupsScreen} options={{ title: 'Your Event', headerBackTitleVisible: false }}/>
        <Stack.Screen name="EventSignups" component={EventSignupsScreen} options={{ title: 'Event Signups', headerBackTitleVisible: false }}/>
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

registerRootComponent(AppWrapper);

export default AppWrapper;
