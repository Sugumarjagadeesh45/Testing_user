import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const SplashScreen = ({ navigation }: any) => {
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.8);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 4000,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 2500,
        easing: Easing.elastic(1),
        useNativeDriver: true,
      })
    ]).start();

    const checkUserStatus = async () => {
      try {
        const token = await AsyncStorage.getItem('authToken') || await AsyncStorage.getItem('userToken');
        
        // Always go to WelcomeScreen1 from splash (first time experience)
        setTimeout(() => {
          navigation.replace('WelcomeScreen1');
        }, 3000);
      } catch (error) {
        console.error('Error checking user status:', error);
        setTimeout(() => {
          navigation.replace('WelcomeScreen1');
        }, 3000);
      }
    };

    checkUserStatus();
  }, []);

  return (
    <LinearGradient
      colors={['#7CEC9F', '#4CD964', '#2ECC71']}
      style={styles.container}
    >
      <Animated.View style={[styles.content, {
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }]
      }]}>
        <Text style={styles.title}>EAZY GO</Text>
        <View style={styles.subtitleContainer}>
          <Text style={styles.subtitle}>Travel Made Simple</Text>
        </View>
      </Animated.View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    fontSize: 42,
    fontWeight: 'bold',
    color: 'white',
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    marginBottom: 10,
  },
  subtitleContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 20,
    marginTop: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'white',
    fontWeight: '500',
  },
});

export default SplashScreen;

// import React, { useEffect } from 'react';
// import { View, Text, StyleSheet, Animated, Easing } from 'react-native';
// import LinearGradient from 'react-native-linear-gradient';

// const SplashScreen = ({ navigation }: any) => {
//   const fadeAnim = new Animated.Value(0);
//   const scaleAnim = new Animated.Value(0.8);

//   useEffect(() => {
//     Animated.parallel([
//       Animated.timing(fadeAnim, {
//         toValue: 1,
//         duration: 4000,
//         useNativeDriver: true,
//       }),
//       Animated.timing(scaleAnim, {
//         toValue: 1,
//         duration: 2500,
//         easing: Easing.elastic(1),
//         useNativeDriver: true,
//       })
//     ]).start();

//     setTimeout(() => {
//       navigation.replace('WelcomeScreen1');
//     }, 1000);
//   }, []);

//   return (
//     <LinearGradient
//       colors={['#7CEC9F', '#4CD964', '#2ECC71']}
//       style={styles.container}
//     >
//       <Animated.View style={[styles.content, {
//         opacity: fadeAnim,
//         transform: [{ scale: scaleAnim }]
//       }]}>
//         <Text style={styles.title}>EAZY GO</Text>
//         <View style={styles.subtitleContainer}>
//           <Text style={styles.subtitle}>Travel Made Simple</Text>
//         </View>
//       </Animated.View>
//     </LinearGradient>
//   );
// };

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   content: {
//     alignItems: 'center',
//   },
//   title: {
//     fontSize: 42,
//     fontWeight: 'bold',
//     color: 'white',
//     textShadowColor: 'rgba(0, 0, 0, 0.3)',
//     textShadowOffset: { width: 1, height: 1 },
//     textShadowRadius: 2,
//     marginBottom: 10,
//   },
//   subtitleContainer: {
//     backgroundColor: 'rgba(255, 255, 255, 0.3)',
//     paddingHorizontal: 20,
//     paddingVertical: 8,
//     borderRadius: 20,
//     marginTop: 10,
//   },
//   subtitle: {
//     fontSize: 16,
//     color: 'white',
//     fontWeight: '500',
//   },
// });

// export default SplashScreen;