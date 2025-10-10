import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const WelcomeScreen2 = () => {
  const navigation = useNavigation();

  const handleSkip = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken') || await AsyncStorage.getItem('userToken');
      if (token) {
        navigation.reset({
          index: 0,
          routes: [{ name: 'Screen1' }],
        });
      } else {
        navigation.navigate('WelcomeScreen3');
      }
    } catch (error) {
      console.error('Error in skip:', error);
      navigation.navigate('WelcomeScreen3');
    }
  };

  return (
    <LinearGradient
      colors={['#f0fff0', '#ccffcc']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
        <Text style={styles.skipText}>Skip</Text>
      </TouchableOpacity>

      <Image
        source={require('../assets/logo3.png')}
        style={styles.logo}
        resizeMode="contain"
      />

      <Text style={styles.mainTitle}>Track your ride</Text>

      <Text style={styles.subtitle}>
        Know your driver in advance and be able to view current location in real time on the map.
      </Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity 
          style={styles.continueButton}
          onPress={() => navigation.navigate('WelcomeScreen3')}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.swipeIndicatorContainer}>
        <View style={styles.swipeTrack}>
          <View style={[styles.swipeProgress, { width: '66%' }]} />
        </View>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  skipButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    padding: 10,
  },
  skipText: {
    color: '#4caf50',
    fontSize: 16,
    fontWeight: '500',
  },
  logo: {
    width: 150,
    height: 150,
    marginBottom: 30,
  },
  mainTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 15,
    color: '#333',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    color: '#666',
    paddingHorizontal: 20,
    lineHeight: 24,
  },
  buttonContainer: {
    width: '80%',
    marginBottom: 30,
  },
  continueButton: {
    backgroundColor: '#4caf50',
    paddingVertical: 12,
    borderRadius: 25,
    alignItems: 'center',
  },
  continueButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  swipeIndicatorContainer: {
    position: 'absolute',
    bottom: 32,
    width: '100%',
    alignItems: 'center',
  },
  swipeTrack: {
    width: 100,
    height: 3,
    backgroundColor: '#c8e6c9',
    borderRadius: 3,
    overflow: 'hidden',
  },
  swipeProgress: {
    height: '100%',
    backgroundColor: '#4caf50',
  },
});

export default WelcomeScreen2;

// import React from 'react';
// import { View, Text, Image, StyleSheet, Button } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import LinearGradient from 'react-native-linear-gradient';

// const WelcomeScreen2 = () => {
//   const navigation = useNavigation();

//   return (
//     <LinearGradient
//       colors={['#f0fff0', '#ccffcc']}
//       style={styles.container}
//       start={{ x: 0, y: 0 }}
//       end={{ x: 1, y: 1 }}
//     >
//       <Image
//         source={require('../assets/logo3.png')}
//         style={styles.logo}
//         resizeMode="contain"
//       />

//       <Text style={styles.mainTitle}>Track your ride</Text>

//       <Text style={styles.subtitle}>
//         Know your driver in advance and be able to view current location in real time on the map.
//       </Text>

//       <View style={styles.buttonContainer}>
//         <Button
//           title="Continue"
//           onPress={() => navigation.navigate('WelcomeScreen3')}
//           color="#4caf50"
//         />
//       </View>

//       <View style={styles.swipeIndicatorContainer}>
//         <View style={styles.swipeTrack}>
//           <View style={[styles.swipeProgress, { width: '66%' }]} />
//         </View>
//       </View>
//     </LinearGradient>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//     padding: 20,
//   },
//   logo: {
//     width: 150,
//     height: 150,
//     marginBottom: 30,
//   },
//   mainTitle: {
//     fontSize: 28,
//     fontWeight: 'bold',
//     textAlign: 'center',
//     marginBottom: 15,
//     color: '#333',
//   },
//   subtitle: {
//     fontSize: 16,
//     textAlign: 'center',
//     marginBottom: 40,
//     color: '#666',
//     paddingHorizontal: 20,
//     lineHeight: 24,
//   },
//   buttonContainer: {
//     width: '80%',
//     marginBottom: 30,
//   },
//   swipeIndicatorContainer: {
//     position: 'absolute',
//     bottom: 32,
//     width: '100%',
//     alignItems: 'center',
//   },
//   swipeTrack: {
//     width: 100,
//     height: 3,
//     backgroundColor: '#c8e6c9',
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   swipeProgress: {
//     height: '100%',
//     backgroundColor: '#4caf50',
//   },
// });

// export default WelcomeScreen2;