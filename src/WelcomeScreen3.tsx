// D:\newapp\userapp-main 2\userapp-main\src\WelcomeScreen3.tsx
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
} from 'react-native';
import auth from '@react-native-firebase/auth';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/FontAwesome';
import { RootStackParamList } from '../App';

// Type definition for navigation
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Backend URLs: Tries local first, then falls back to the live server
const LOCAL_IP = Platform.OS === 'android' ? '10.0.2.2' : '192.168.1.107';
const LOCAL_PORT = '5001';
const SERVER_URL = 'https://goodbackend.onrender.com';
const LOCAL_URL = `http://${LOCAL_IP}:${LOCAL_PORT}/api/auth`;

/**
 * Helper function to call the backend API.
 * Attempts to connect to the local server first, falls back to the live server.
 */
const callBackend = async (endpoint: string, data: any, timeout = 5000) => {
  try {
    return await axios.post(`${LOCAL_URL}${endpoint}`, data, { timeout });
  } catch (err) {
    console.warn(`Local backend failed for ${endpoint}, falling back to live server.`);
    return await axios.post(`${SERVER_URL}/api/auth${endpoint}`, data, { timeout });
  }
};

const WelcomeScreen3 = () => {
  const [mobileNumber, setMobileNumber] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendAvailable, setResendAvailable] = useState(true);
  const [resendCountdown, setResendCountdown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const confirmRef = useRef<any>(null);
  const navigation = useNavigation<NavigationProp>();

  // Set auth language and restore previous session
  useEffect(() => {
    const restoreVerification = async () => {
      const verificationId = await AsyncStorage.getItem('verificationId');
      const storedPhone = await AsyncStorage.getItem('phoneNumber');
      if (verificationId && storedPhone) {
        confirmRef.current = {
          confirm: (otp: string) =>
            auth().signInWithCredential(auth.PhoneAuthProvider.credential(verificationId, otp)),
        };
        setMobileNumber(storedPhone);
        setOtpSent(true);
        Alert.alert('Session Restored', `Please enter the OTP sent to ${storedPhone}`);
      }
    };
    restoreVerification();
  }, []);

  // Resend OTP countdown timer
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (resendCountdown > 0) {
      setResendAvailable(false);
      timer = setInterval(() => {
        setResendCountdown((prev) => {
          if (prev <= 1) {
            setResendAvailable(true);
            clearInterval(timer);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Validate Indian phone number format
  const isValidPhoneNumber = useCallback((phone: string) => /^[6-9]\d{9}$/.test(phone), []);

  /**
   * Initiates Firebase phone authentication.
   */
  const sendOTP = useCallback(
    async (phone: string) => {
      if (!phone) {
        Alert.alert('Error', 'Please enter your mobile number.');
        return;
      }
      if (!isValidPhoneNumber(phone)) {
        Alert.alert('Error', 'Please enter a valid 10-digit Indian mobile number.');
        return;
      }
      try {
        setLoading(true);
        const confirmation = await auth().signInWithPhoneNumber(`+91${phone}`);
        confirmRef.current = confirmation;
        await AsyncStorage.setItem('verificationId', confirmation.verificationId);
        await AsyncStorage.setItem('phoneNumber', phone);
        Alert.alert('OTP Sent', 'Please check your phone for the OTP.');
        setOtpSent(true);
        setResendCountdown(30);
      } catch (error: any) {
        if (error.code === 'auth/too-many-requests') {
          Alert.alert(
            'Too Many Attempts',
            'We have blocked all requests from this device due to unusual activity. Try again later.'
          );
        } else if (error.code === 'auth/invalid-phone-number') {
          Alert.alert('Invalid Phone Number', 'The phone number format is invalid or it is not a test number.');
        } else {
          Alert.alert('Error', error.message || 'Failed to send OTP.');
        }
      } finally {
        setLoading(false);
      }
    },
    [isValidPhoneNumber]
  );

  // In WelcomeScreen3.tsx, update the verifyOTP function
// In WelcomeScreen3.tsx, update the verifyOTP function
const verifyOTP = useCallback(async () => {
  if (!code) {
    Alert.alert('Error', 'Please enter the OTP.');
    return;
  }
  if (!confirmRef.current) {
    Alert.alert('Error', 'No OTP session found. Please request a new OTP.');
    return;
  }
  try {
    setLoading(true);
    
    // Verify OTP with Firebase
    await confirmRef.current.confirm(code);
    
    // Store phone number for potential registration
    await AsyncStorage.setItem('phoneNumber', mobileNumber);
    
    // Try to verify with backend
    try {
      const response = await callBackend('/verify-phone', { phoneNumber: mobileNumber });
      
      if (response.data.success && response.data.token) {
        // Existing user - store token and navigate
        await AsyncStorage.setItem('authToken', response.data.token);
        await AsyncStorage.setItem('isRegistered', 'true');
        await AsyncStorage.removeItem('verificationId');
        
        navigation.reset({
          index: 0,
          routes: [{ name: 'Screen1' }],
        });
      } else if (response.data.success && response.data.newUser) {
        // New user - navigate with flag
        navigation.reset({
          index: 0,
          routes: [{ name: 'Screen1', params: { isNewUser: true, phone: mobileNumber } }],
        });
      }
    } catch (backendError: any) {
      // If backend is down, still allow the user to proceed as new user
      console.warn('Backend unavailable, proceeding as new user:', backendError);
      navigation.reset({
        index: 0,
        routes: [{ name: 'Screen1', params: { isNewUser: true, phone: mobileNumber } }],
      });
    }
  } catch (error: any) {
    Alert.alert('Error', error.message || 'The OTP is invalid.');
  } finally {
    setLoading(false);
  }
}, [code, mobileNumber, navigation]);

  return (
    <LinearGradient
      colors={['#f0fff0', '#ccffcc']}
      style={styles.container}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 40 : 0}
      >
        <View style={styles.header}>
          <Icon name="taxi" size={100} color="#4caf50" style={styles.logo} />
        </View>
        <View style={styles.card}>
          <Text style={styles.loginText}>Login with your phone number</Text>
          <TextInput
            style={styles.input}
            placeholder="Mobile Number"
            value={mobileNumber}
            onChangeText={(text) => setMobileNumber(text.replace(/[^0-9]/g, ''))}
            keyboardType="phone-pad"
            maxLength={10}
            editable={!loading}
          />
          {otpSent ? (
            <>
              <TextInput
                style={styles.input}
                placeholder="Enter OTP"
                value={code}
                onChangeText={(text) => setCode(text.replace(/[^0-9]/g, ''))}
                keyboardType="number-pad"
                maxLength={6}
                editable={!loading}
              />
              <TouchableOpacity style={styles.button} onPress={verifyOTP} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Verify OTP</Text>}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.resendButton}
                onPress={() => sendOTP(mobileNumber)}
                disabled={loading || !resendAvailable}
              >
                <Text style={[styles.resendText, !resendAvailable && styles.resendDisabledText]}>
                  {resendAvailable ? 'Resend OTP' : `Resend in ${resendCountdown}s`}
                </Text>
              </TouchableOpacity>
            </>
          ) : (
            <TouchableOpacity style={styles.button} onPress={() => sendOTP(mobileNumber)} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Send OTP</Text>}
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboardContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { marginBottom: 20 },
  logo: { alignSelf: 'center' },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 10,
    padding: 20,
    width: '90%',
    maxWidth: 400,
    elevation: 3,
  },
  loginText: { fontSize: 16, marginBottom: 10, textAlign: 'center' },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
  button: {
    backgroundColor: '#4caf50',
    padding: 12,
    borderRadius: 5,
    alignItems: 'center',
    marginTop: 5,
  },
  buttonText: { color: '#fff', fontWeight: 'bold' },
  resendButton: {
    marginTop: 10,
    alignItems: 'center',
  },
  resendText: {
    color: '#4caf50',
    fontSize: 14,
  },
  resendDisabledText: {
    color: '#ccc',
  },
});

export default WelcomeScreen3;