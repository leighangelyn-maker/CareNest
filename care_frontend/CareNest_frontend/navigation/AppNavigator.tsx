import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import NewBookingScreen from '../screens/NewBookingScreen';
import PaymentScreen from '../screens/PaymentScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AgencyHomeScreen from '../screens/AgencyHomeScreen';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0A1F44', borderTopColor: '#1C2E4A' },
        tabBarActiveTintColor: '#00BCD4',
        tabBarInactiveTintColor: '#888',
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
        <Stack.Screen name="Main" component={ClientTabs} />
        <Stack.Screen name="NewBooking" component={NewBookingScreen} />
        <Stack.Screen name="Payment" component={PaymentScreen} />
        <Stack.Screen name="AgencyHome" component={AgencyHomeScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}