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

export type RootStackParamList = {
  SplashScreen: undefined;
  WelcomeScreen1: undefined;
  WelcomeScreen2: undefined;
  WelcomeScreen3: undefined;
  Screen1: { isNewUser?: boolean; phone?: string; refresh?: boolean };
  ProfileScreen: undefined;
  Setting: undefined;
  ReportDriver: undefined;
};

export default function App() {
  const [isLoading, setIsLoading] = useState(true);
  const [isFirstLaunch, setIsFirstLaunch] = useState<boolean | null>(null);
  const [userToken, setUserToken] = useState<string | null>(null);

  // Check app state on startup
  useEffect(() => {
    const checkAppState = async () => {
      try {
        setIsLoading(true);
        
        // Check if this is first launch
        const hasLaunched = await AsyncStorage.getItem('hasLaunched');
        
        // Check for authentication
        const token = await AsyncStorage.getItem('authToken') || await AsyncStorage.getItem('userToken');
        const isRegistered = await AsyncStorage.getItem('isRegistered');
        
        setUserToken(token);
        setIsFirstLaunch(hasLaunched !== 'true');
        
        // Mark as launched for future sessions
        if (!hasLaunched) {
          await AsyncStorage.setItem('hasLaunched', 'true');
        }
      } catch (error) {
        console.error('Error checking app state:', error);
        setIsFirstLaunch(true);
      } finally {
        setIsLoading(false);
      }
    };

    checkAppState();
  }, []);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }

  const getInitialRoute = () => {
    if (userToken) {
      return "Screen1";
    } else if (isFirstLaunch) {
      return "SplashScreen";
    } else {
      return "WelcomeScreen3"; // Direct to login for returning users
    }
  };

  return (
    <LanguageProvider>
      <NavigationContainer>
        <Stack.Navigator 
          initialRouteName={getInitialRoute()}
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

// // D:\newapp\userapp-main 2\userapp-main\src\App.tsx
// import 'react-native-gesture-handler';
// import React, { useState, useEffect } from 'react';
// import { NavigationContainer } from '@react-navigation/native';
// import { createNativeStackNavigator } from '@react-navigation/native-stack';
// import { LanguageProvider } from './src/constants/LanguageContext';
// import Screen1 from './src/Screen1';
// import SplashScreen from './src/SplashScreen';
// import WelcomeScreen1 from './src/WelcomeScreen1';
// import WelcomeScreen2 from './src/WelcomeScreen2';
// import WelcomeScreen3 from './src/WelcomeScreen3';

// import ProfileScreen from './src/Screen1/Menuicon/ProfileScreen';
// import Setting from './src/Screen1/Menuicon/Setting';
// import ReportDriver from './src/Screen1/Menuicon/ReportDriver';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { View, ActivityIndicator, StyleSheet } from 'react-native';

// const Stack = createNativeStackNavigator();

// export default function App() {
//   const [isLoading, setIsLoading] = useState(true);
//   const [userToken, setUserToken] = useState<string | null>(null);
//   const [isRegistered, setIsRegistered] = useState<boolean | null>(null);

//   // Check if user is logged in
//   useEffect(() => {
//     const checkLoginStatus = async () => {
//       try {
//         setIsLoading(true);
        
//         // Check for authentication token
//         const token = await AsyncStorage.getItem('authToken');
//         const userToken = await AsyncStorage.getItem('userToken');
//         const registered = await AsyncStorage.getItem('isRegistered');
        
//         // Set the token state (use whichever token exists)
//         setUserToken(token || userToken);
//         setIsRegistered(registered === 'true');
//       } catch (error) {
//         console.error('Error checking login status:', error);
//       } finally {
//         setIsLoading(false);
//       }
//     };

//     checkLoginStatus();
//   }, []);

//   if (isLoading) {
//     // Show loading screen while checking authentication status
//     return (
//       <View style={styles.loadingContainer}>
//         <ActivityIndicator size="large" color="#28a745" />
//       </View>
//     );
//   }

//   return (
//     <LanguageProvider>
//       <NavigationContainer>
//         <Stack.Navigator 
//           initialRouteName={userToken && isRegistered ? "Screen1" : "SplashScreen"}
//           screenOptions={{ headerShown: false }}
//         >
//           <Stack.Screen name="SplashScreen" component={SplashScreen} />
//           <Stack.Screen name="WelcomeScreen1" component={WelcomeScreen1} />
//           <Stack.Screen name="WelcomeScreen2" component={WelcomeScreen2} />
//           <Stack.Screen name="WelcomeScreen3" component={WelcomeScreen3} />
     
//           <Stack.Screen name="Screen1" component={Screen1} />
//           <Stack.Screen name="ProfileScreen" component={ProfileScreen} />
//           <Stack.Screen name="Setting" component={Setting} />
//           <Stack.Screen name="ReportDriver" component={ReportDriver} />
//         </Stack.Navigator>
//       </NavigationContainer>
//     </LanguageProvider>
//   );
// }

// const styles = StyleSheet.create({
//   loadingContainer: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     backgroundColor: '#f8f9fa',
//   },
// });
