import React from 'react';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import {
  SpaceMono_400Regular,
  SpaceMono_700Bold,
} from '@expo-google-fonts/space-mono';
import { View, ActivityIndicator } from 'react-native';

import { RootStackParamList } from './src/types';
import { BookingProvider } from './src/BookingContext';
import { AuthProvider, useAuth } from './src/AuthContext';
import { setNavigationRef } from './src/api/client';
import { Colors } from './src/theme';

// Screens
import WelcomeScreen from './src/screens/WelcomeScreen';
import RoleScreen from './src/screens/RoleScreen';
import WorkerNoteScreen from './src/screens/WorkerNoteScreen';
import RegisterScreen from './src/screens/RegisterScreen';
import LoginScreen from './src/screens/LoginScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AgencyProfileScreen from './src/screens/AgencyProfileScreen';
import BookScreen from './src/screens/BookScreen';
import PayScreen from './src/screens/PayScreen';
import ConfirmScreen from './src/screens/ConfirmScreen';
import BookingDetailScreen from './src/screens/BookingDetailScreen';
import ReviewScreen from './src/screens/ReviewScreen';
import MessagesScreen from './src/screens/MessagesScreen';
import SubscriptionScreen from './src/screens/SubscriptionScreen';
import WorkerProfileSetupScreen from './src/screens/WorkerProfileSetupScreen';
import MainTabs from './src/navigation/MainTabs';

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

const Stack = createNativeStackNavigator<RootStackParamList>();

function AppNavigator() {
  const { token, role, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.paper }}>
        <ActivityIndicator color={Colors.navy} size="large" />
      </View>
    );
  }

  // Workers go to profile setup if they just logged in for the first time
  // (determined by checking their profile on the server — handled inside MainTabs/AccountScreen)
  return (
    <Stack.Navigator
      initialRouteName={token ? 'MainTabs' : 'Welcome'}
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.paper },
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Role" component={RoleScreen} />
      <Stack.Screen name="WorkerNote" component={WorkerNoteScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="MainTabs" component={MainTabs} />
      {/* Legacy worker screen — kept to avoid breaking existing registrations */}
      <Stack.Screen name="Profile" component={ProfileScreen} />
      {/* Agency-centric screens */}
      <Stack.Screen name="AgencyProfile" component={AgencyProfileScreen} />
      <Stack.Screen name="BookAgency" component={BookScreen} />
      {/* Legacy booking screen */}
      <Stack.Screen name="Book" component={BookScreen} />
      <Stack.Screen name="Pay" component={PayScreen} />
      <Stack.Screen name="Confirm" component={ConfirmScreen} />
      <Stack.Screen name="BookingDetail" component={BookingDetailScreen} />
      <Stack.Screen name="Review" component={ReviewScreen} />
      <Stack.Screen name="Messages" component={MessagesScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} />
      <Stack.Screen name="WorkerProfileSetup" component={WorkerProfileSetupScreen} />
    </Stack.Navigator>
  );
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    SpaceMono_400Regular,
    SpaceMono_700Bold,
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.paper }}>
        <ActivityIndicator color={Colors.navy} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <BookingProvider>
          <NavigationContainer
            ref={navigationRef}
            onReady={() => setNavigationRef(navigationRef as any)}
          >
            <StatusBar style="dark" />
            <AppNavigator />
          </NavigationContainer>
        </BookingProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
