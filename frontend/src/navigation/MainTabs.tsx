import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../types';
import { useAuth } from '../AuthContext';

// Family screens
import HomeScreen from '../screens/HomeScreen';
import BookingsScreen from '../screens/BookingsScreen';
import MessagesListScreen from '../screens/MessagesListScreen';
import AccountScreen from '../screens/AccountScreen';

// Agency screens
import AgencyDashboardScreen from '../screens/AgencyDashboardScreen';

import {
  HomeIcon,
  BookingsIcon,
  MessagesIcon,
  AccountIcon,
} from '../components/atoms';
import { Colors, Fonts } from '../theme';

const Tab = createBottomTabNavigator<MainTabParamList>();

export default function MainTabs() {
  const insets = useSafeAreaInsets();
  const { role } = useAuth();
  const isAgency = role === 'AGENCY_ADMIN';
  const tabBarHeight = 52 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: tabBarHeight,
          paddingTop: 6,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 6,
          borderTopWidth: 1,
          borderTopColor: Colors.line,
          backgroundColor: Colors.paper,
          elevation: 8,
          shadowColor: Colors.navy,
          shadowOpacity: 0.06,
          shadowOffset: { width: 0, height: -2 },
          shadowRadius: 8,
        },
        tabBarLabelStyle: {
          fontFamily: Fonts.interSemiBold,
          fontSize: 10,
          letterSpacing: 0.2,
          marginBottom: 2,
        },
        tabBarActiveTintColor: Colors.navy,
        tabBarInactiveTintColor: Colors.slateSoft,
        tabBarShowLabel: true,
        tabBarIconStyle: { marginTop: 2 },
        tabBarItemStyle: {
          paddingVertical: 0,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarAllowFontScaling: false,
      }}
    >
      <Tab.Screen
        name="Home"
        component={isAgency ? AgencyDashboardScreen : HomeScreen}
        options={{
          tabBarLabel: isAgency ? 'Dashboard' : 'Search',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Bookings"
        component={BookingsScreen}
        options={{
          tabBarLabel: 'Bookings',
          tabBarIcon: ({ color }) => <BookingsIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="MessagesTab"
        component={MessagesListScreen}
        options={{
          tabBarLabel: 'Messages',
          tabBarIcon: ({ color }) => <MessagesIcon color={color} />,
        }}
      />
      <Tab.Screen
        name="Account"
        component={AccountScreen}
        options={{
          tabBarLabel: 'Account',
          tabBarIcon: ({ color }) => <AccountIcon color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}
