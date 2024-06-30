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
import ExploreScreen from './navigation/explore'; 
import FundraiseScreen from './navigation/fundraise'; 
import ProfileScreen from './navigation/profile'; 
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

          return <MaterialCommunityIcons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: '#06038D',
        tabBarInactiveTintColor: 'gray',
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeScreen} 
        options={{
          tabBarLabel: 'Home',
        }}
      />
      <Tab.Screen 
        name="Explore" 
        component={ExploreScreen} 
        options={{
          tabBarLabel: 'Explore',
        }}
      />
      <Tab.Screen 
        name="Fundraise" 
        component={FundraiseScreen} 
        options={{
          tabBarLabel: 'Fundraise',
        }}
      />
      <Tab.Screen 
        name="Profile" 
        component={ProfileScreen} 
        options={{
          tabBarLabel: 'Profile',
        }}
      />
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
