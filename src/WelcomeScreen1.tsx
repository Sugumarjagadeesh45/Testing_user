import React from 'react';
import { View, Text, Image, StyleSheet, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LinearGradient from 'react-native-linear-gradient';

const WelcomeScreen1 = () => {
  const navigation = useNavigation();

  const handlePress = () => {
    Keyboard.dismiss();
    navigation.navigate('WelcomeScreen2');
  };

  return (
    <TouchableWithoutFeedback onPress={handlePress}>
      <View style={{ flex: 1 }}>
        <LinearGradient
          colors={['#f0fff0', '#ccffcc']}
          style={styles.container}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <Image
            source={require('../assets/logo2.png')}
            style={styles.logo}
            resizeMode="contain"
          />

          <Text style={styles.mainTitle}>
            Book Your <Text style={styles.highlightedText}>E-Bike</Text>
          </Text>

          <Text style={styles.subtitle}>
            Find and book the perfect e-bike for a comfortable, eco-friendly ride.
          </Text>

          <View style={styles.swipeIndicatorContainer}>
            <View style={styles.swipeTrack}>
              <View style={[styles.swipeProgress, { width: '33%' }]} />
            </View>
          </View>
        </LinearGradient>
      </View>
    </TouchableWithoutFeedback>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
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
  highlightedText: {
    color: '#4caf50',
  },
});

export default WelcomeScreen1;


// import React from 'react';
// import { View, Text, Image, StyleSheet, TouchableWithoutFeedback } from 'react-native';
// import { useNavigation } from '@react-navigation/native';

// const WelcomeScreen1 = () => {
//   const navigation = useNavigation();

//   return (
//     <TouchableWithoutFeedback onPress={() => navigation.navigate('WelcomeScreen2')}>
//       <View style={styles.container}>
//         <Image 
//           source={require('../assets/logo2.png')} 
//           style={styles.logo}
//           resizeMode="contain"
//         />
//         <Text style={styles.mainTitle}>Confirm Your Driver</Text>
//         <Text style={styles.subtitle}>
//           Huge drivers network helps you find comfortable, safe and cheap ride
//         </Text>
//         <View style={styles.swipeIndicatorContainer}>
//           <View style={styles.swipeTrack}>
//             <View style={[styles.swipeProgress, { width: '33%' }]} />
//           </View>
//         </View>
//       </View>
//     </TouchableWithoutFeedback>
//   );
// };

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     justifyContent: 'center', 
//     alignItems: 'center',
//     padding: 20,
//     backgroundColor: '#fff',
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
//   swipeIndicatorContainer: {
//     position: 'absolute',
//     bottom: 32,
//     width: '100%',
//     alignItems: 'center',
//   },
//   swipeTrack: {
//     width: 100,
//     height: 3,
//     backgroundColor: '#e0f2e9',
//     borderRadius: 3,
//     overflow: 'hidden',
//   },
//   swipeProgress: {
//     height: '100%',
//     backgroundColor: '#2ecc71',
//   },
// });

// export default WelcomeScreen1;
