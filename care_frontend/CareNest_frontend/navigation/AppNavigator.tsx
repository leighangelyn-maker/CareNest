import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import LoginScreen from '../screens/LoginScreen';
import RegisterScreen from '../screens/RegisterScreen';
import HomeScreen from '../screens/HomeScreen';
import BookingScreen from '../screens/BookingScreen';
import ProfileScreen from '../screens/ProfileScreen';
import PaymentScreen from '../screens/PaymentScreen';
import OnboardingScreen from '../screens/OnboardingScreen';
import AgencyHomeScreen from '../screens/AgencyHomeScreen';
import AgencySearchScreen from '../screens/AgencySearchScreen';
import AgencyProfileScreen from '../screens/AgencyProfileScreen';
import ChatScreen from '../screens/ChatScreen';

const Tab = createBottomTabNavigator();
const HomeStack = createNativeStackNavigator();
const BookingStack = createNativeStackNavigator();
const RootStack = createNativeStackNavigator();

function HomeStackScreen() {
  return (
    <HomeStack.Navigator screenOptions={{ headerShown: false }}>
      <HomeStack.Screen name="HomeMain" component={HomeScreen} />
      <HomeStack.Screen name="AgencySearch" component={AgencySearchScreen} />
      <HomeStack.Screen name="AgencyProfile" component={AgencyProfileScreen} />
      <HomeStack.Screen name="Chat" component={ChatScreen} />
      <HomeStack.Screen name="Payment" component={PaymentScreen} />
    </HomeStack.Navigator>
  );
}

function BookingStackScreen() {
  return (
    <BookingStack.Navigator screenOptions={{ headerShown: false }}>
      <BookingStack.Screen name="BookingMain" component={BookingScreen} />
      <BookingStack.Screen name="AgencySearch" component={AgencySearchScreen} />
      <BookingStack.Screen name="AgencyProfile" component={AgencyProfileScreen} />
      <BookingStack.Screen name="Chat" component={ChatScreen} />
      <BookingStack.Screen name="Payment" component={PaymentScreen} />
    </BookingStack.Navigator>
  );
}

function ClientTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: '#0A1F44', borderTopColor: '#1C2E4A' },
        tabBarActiveTintColor: '#00BCD4',
        tabBarInactiveTintColor: '#888',
      }}>
      <Tab.Screen name="Home" component={HomeStackScreen}
        options={{ tabBarLabel: '🏠 Home' }} />
      <Tab.Screen name="Booking" component={BookingStackScreen}
        options={{ tabBarLabel: '📋 Book' }} />
      <Tab.Screen name="Profile" component={ProfileScreen}
        options={{ tabBarLabel: '👤 Profile' }} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <RootStack.Navigator initialRouteName="Onboarding"
        screenOptions={{ headerShown: false }}>
        <RootStack.Screen name="Onboarding" component={OnboardingScreen} />
        <RootStack.Screen name="Login" component={LoginScreen} />
        <RootStack.Screen name="Register" component={RegisterScreen} />
        <RootStack.Screen name="Main" component={ClientTabs} />
        <RootStack.Screen name="AgencyHome" component={AgencyHomeScreen} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}