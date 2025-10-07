// D:\newapp\userapp-main 2\userapp-main\src\App.tsx
import 'react-native-gesture-handler';
import React, { useState, useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { LanguageProvider } from './src/constants/LanguageContext';
import Screen1 from './src/Screen1';
import SplashScreen from './src/SplashScreen';
import WelcomeScreen1 from './src/WelcomeScreen1';
import WelcomeScreen2 from './src/WelcomeScreen2';
import WelcomeScreen3 from './src/WelcomeScreen3';

import ProfileScreen from './src/Screen1/Menuicon/ProfileScreen';
import Setting from './src/Screen1/Menuicon/Setting';
import ReportDriver from './src/Screen1/Menuicon/ReportDriver';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [userToken, setUserToken] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

  // Check if user is logged in
  useEffect(() => {
    const checkLoginStatus = async () => {
      try {
        setIsLoading(true);
        
        // Check for authentication token
        const token = await AsyncStorage.getItem('authToken');
        const userToken = await AsyncStorage.getItem('userToken');
        const registered = await AsyncStorage.getItem('isRegistered');
        
        // Set the token state (use whichever token exists)
        setUserToken(token || userToken);
        setIsRegistered(registered === 'true');
      } catch (error) {
        console.error('Error checking login status:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkLoginStatus();
  }, []);

  if (isLoading) {
    // Show loading screen while checking authentication status
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={userToken && isRegistered ? "Screen1" : "SplashScreen"}
          screenOptions={{ headerShown: false }}
        >
          <Stack.Screen name="SplashScreen" component={SplashScreen} />
          <Stack.Screen name="WelcomeScreen1" component={WelcomeScreen1} />
          <Stack.Screen name="WelcomeScreen2" component={WelcomeScreen2} />
          <Stack.Screen name="WelcomeScreen3" component={WelcomeScreen3} />
     
          <Stack.Screen name="Screen1" component={Screen1} />
          <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
          <Stack.Screen name="Setting" component={Setting} />
          <Stack.Screen name="ReportDriver" component={ReportDriver} />
        </Stack.Navigator>
      </NavigationContainer>
    </LanguageProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
});

// // D:\newapp\userapp-main 2\userapp-main\App.tsx
// /**
//  * Taxi Booking App
//  */
// import 'react-native-gesture-handler';
// import React, { useEffect, useState } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { StatusBar, View, ActivityIndicator } from 'react-native';

// // Import your screen components
// import WelcomeScreen1 from './src/WelcomeScreen1';
// import WelcomeScreen2 from './src/WelcomeScreen2';
// import WelcomeScreen3 from './src/WelcomeScreen3';
// import WelcomeScreen5 from './src/WelcomeScreen5';
// import WelcomeScreen13 from './src/WelcomeScreen13';
// import Screen1 from './src/Screen1';
// import ProfileScreen from './src/Screen1/Menuicon/ProfileScreen';
// import Setting from './src/Screen1/Menuicon/Setting';
// import ReportDriver from './src/Screen1/Menuicon/ReportDriver';

// // Define your navigation parameter list
// export type RootStackParamList = {
//   WelcomeScreen1: undefined;
//   WelcomeScreen2: undefined;
//   WelcomeScreen3: undefined;
//   WelcomeScreen5: undefined;
//   WelcomeScreen13: undefined;
//   Screen1: { isNewUser?: boolean; phone?: string };
//   ProfileScreen: undefined;
//   Setting: undefined; // Add Setting to the param list
//   ReportDriver: undefined; // Add ReportDriver to the param list
// };

// const Stack = createNativeStackNavigator<RootStackParamList>();

// const App = () => {
//   const [initialRoute, setInitialRoute] = useState<keyof RootStackParamList | null>(null);

//   useEffect(() => {
//     const checkRegistration = async () => {
//       try {
//         const isRegistered = await AsyncStorage.getItem('isRegistered');
//         // If user is registered (logged in), go to Screen1
//         // If not registered or logged out, go to WelcomeScreen3
//         setInitialRoute(isRegistered === 'true' ? 'Screen1' : 'WelcomeScreen3');
//       } catch (error) {
//         console.error('Error reading registration status:', error);
//         // Default to WelcomeScreen3 on error
//         setInitialRoute('WelcomeScreen3');
//       }
//     };
//     checkRegistration();
//   }, []);

//   if (!initialRoute) {
//     // Show a basic loading indicator while determining the initial route
//     return (
//       <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
//         <ActivityIndicator size="large" />
//         <StatusBar barStyle="dark-content" />
//       </View>
//     );
//   }

//   return (
//     <NavigationContainer>
//       <StatusBar barStyle="dark-content" />
//       <Stack.Navigator
//         initialRouteName={initialRoute}
//         screenOptions={{ headerShown: false }}
//       >
//         {/* Welcome / Onboarding Screens */}
//         <Stack.Screen name="WelcomeScreen1" component={WelcomeScreen1} />
//         <Stack.Screen name="WelcomeScreen2" component={WelcomeScreen2} />
//         <Stack.Screen name="WelcomeScreen3" component={WelcomeScreen3} />
//         <Stack.Screen name="WelcomeScreen5" component={WelcomeScreen5} />
//         <Stack.Screen name="WelcomeScreen13" component={WelcomeScreen13} />

//         {/* Main App Screen */}
//         <Stack.Screen name="Screen1" component={Screen1} />

//         <Stack.Screen 
//           name="ProfileScreen" 
//           component={ProfileScreen} 
//           options={{ headerShown: false }}
//         />

//         <Stack.Screen 
//           name="Setting" 
//           component={Setting} 
//           options={{ headerShown: false }} 
//         />

//         <Stack.Screen 
//           name="ReportDriver" 
//           component={ReportDriver} 
//           options={{ headerShown: false }} 
//         />
//       </Stack.Navigator>
//     </NavigationContainer>
//   );
// };

// export default App;