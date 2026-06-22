import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import OnboardingScreen from '../screens/OnboardingScreen';
import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import ProfileScreen from '../screens/ProfileScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0A1F44', borderTopColor: '#1C2E4A', height: 60 },
        tabBarActiveTintColor: '#00BCD4',
        tabBarInactiveTintColor: '#888',
        tabBarLabelStyle: { fontSize: 12, marginBottom: 6 },
      }}>
      <Tab.Screen name="Home" component={HomeScreen}
        options={{ tabBarLabel: '🏠 Home' }} />
      <Tab.Screen name="Booking" component={BookingScreen}
        options={{ tabBarLabel: '📋 Book' }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarLabel: '👤 Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Onboarding"
        screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Onboarding" component={OnboardingScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="Main" component={MainTabs} />
        
      </Stack.Navigator>
    </NavigationContainer>
  );
}