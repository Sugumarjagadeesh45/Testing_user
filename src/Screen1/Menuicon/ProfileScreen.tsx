import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { launchImageLibrary, ImagePickerResponse, Asset } from 'react-native-image-picker';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from '../../util/backendConfig';
import Geolocation from '@react-native-community/geolocation';

interface ProfileData {
  name: string;
  phoneNumber: string;
  customerId: string;
  email: string;
  gender: string;
  altMobile: string;
  profilePicture: string;
  address: string;
}

const ProfileScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const [loading, setLoading] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [fetchingLocation, setFetchingLocation] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  
  const [profileData, setProfileData] = useState<ProfileData>({
    name: '',
    phoneNumber: '',
    customerId: '',
    email: '',
    gender: '',
    altMobile: '',
    profilePicture: '',
    address: '',
  });
  
  // Email validation regex
  const validateEmail = (email: string): boolean => {
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return regex.test(email);
  };
  
  useEffect(() => {
    if (route.params) {
      setProfileData(prev => ({
        ...prev,
        ...route.params,
      }));
    }
    fetchUserProfile();
  }, []);
  
  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('authToken');
      const backendUrl = getBackendUrl();
      
      if (!token) {
        Alert.alert('Error', 'Please login again');
        navigation.navigate('WelcomeScreen3');
        return;
      }
      
      const response = await axios.get(`${backendUrl}/api/users/me/profile`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      
      if (response.data.success) {
        const user = response.data.user;
        let profilePictureUrl = '';
        if (user.profilePicture) {
          profilePictureUrl = user.profilePicture.startsWith('http')
            ? user.profilePicture
            : `${backendUrl}${user.profilePicture}?t=${Date.now()}`;
        }
        
        setProfileData({
          name: user.name || '',
          phoneNumber: user.phoneNumber || '',
          customerId: user.customerId || '',
          email: user.email || '',
          gender: user.gender || '',
          altMobile: user.altMobile || '',
          profilePicture: profilePictureUrl,
          address: user.address || '',
        });
      }
    } catch (error) {
      console.error('❌ Error fetching profile:', error);
      if (error.response?.status === 401) {
        Alert.alert(
          'Session Expired',
          'Your session has expired. Please login again.',
          [{
            text: 'OK',
            onPress: () => {
              AsyncStorage.removeItem('userToken');
              AsyncStorage.removeItem('authToken');
              navigation.navigate('WelcomeScreen3');
            }
          }]
        );
      } else {
        Alert.alert('Error', 'Failed to fetch profile data');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleUpdateProfile = async () => {
    // Validate email before updating
    if (profileData.email && !validateEmail(profileData.email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    
    try {
      setUpdating(true);
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('authToken');
      const backendUrl = getBackendUrl();
      
      if (!token) {
        Alert.alert('Error', 'Please login again');
        navigation.navigate('WelcomeScreen3');
        return;
      }
      
      const formData = new FormData();
      if (profileData.name) formData.append('name', profileData.name);
      if (profileData.email) formData.append('email', profileData.email);
      if (profileData.gender) formData.append('gender', profileData.gender);
      if (profileData.altMobile) formData.append('altMobile', profileData.altMobile);
      if (profileData.address) formData.append('address', profileData.address);
      
      const response = await axios.put(`${backendUrl}/api/users/profile`, formData, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 10000,
      });
      
      if (response.data.success) {
        const user = response.data.user;
        const imageUrl = user.profilePicture 
          ? `${backendUrl}${user.profilePicture}?t=${Date.now()}`
          : '';
        
        setProfileData(prev => ({
          ...prev,
          name: user.name,
          email: user.email,
          gender: user.gender,
          altMobile: user.altMobile,
          address: user.address,
          profilePicture: imageUrl,
        }));
        
        navigation.navigate('Screen1', { refresh: true });
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update profile');
      }
    } catch (error) {
      console.error('❌ Error updating profile:', error);
      Alert.alert('Error', `Failed to update profile: ${error.message}`);
    } finally {
      setUpdating(false);
    }
  };
  
  const handleImagePick = () => {
    try {
      launchImageLibrary({
        mediaType: 'photo',
        maxWidth: 300,
        maxHeight: 300,
        quality: 0.8,
        includeBase64: false,
      }, (response: ImagePickerResponse) => {
        if (response.didCancel) {
          return;
        }
        
        if (response.errorCode) {
          Alert.alert('Error', `Failed to pick image: ${response.errorMessage}`);
          return;
        }
        
        if (response.assets && response.assets.length > 0) {
          const image = response.assets[0];
          uploadImage(image);
        }
      });
    } catch (error) {
      Alert.alert('Error', `Failed to update profile picture: ${error.message}`);
    }
  };
  
  const uploadImage = async (image: Asset) => {
    try {
      setUploadingImage(true);
      
      if (!image.uri) {
        Alert.alert('Error', 'Invalid image selected');
        return;
      }
      
      const formData = new FormData();
      formData.append('profilePicture', {
        uri: image.uri,
        type: image.type || 'image/jpeg',
        name: image.fileName || `profile_${Date.now()}.jpg`,
      });
      
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('authToken');
      if (!token) {
        Alert.alert('Error', 'Please login again');
        navigation.navigate('WelcomeScreen3');
        return;
      }
      
      const backendUrl = getBackendUrl();
      const response = await axios.put(`${backendUrl}/api/users/profile`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
        timeout: 15000,
      });
      
      if (response.data.success) {
        const user = response.data.user;
        const imageUrl = user.profilePicture 
          ? `${backendUrl}${user.profilePicture}?t=${Date.now()}`
          : '';
        
        setProfileData(prev => ({
          ...prev,
          profilePicture: imageUrl,
        }));
        
        navigation.navigate('Screen1', { refresh: true });
        Alert.alert('Success', 'Profile picture updated successfully');
      } else {
        Alert.alert('Error', response.data.message || 'Failed to update profile picture');
      }
    } catch (error) {
      console.error('❌ Error uploading image:', error);
      Alert.alert('Error', `Failed to update profile picture: ${error.message}`);
    } finally {
      setUploadingImage(false);
    }
  };
  
  const getAddressFromCoordinates = async (latitude: number, longitude: number) => {
    try {
      // Using OpenStreetMap Nominatim API for reverse geocoding
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
      );
      const data = await response.json();
      
      if (data && data.display_name) {
        return data.display_name;
      } else {
        throw new Error('No address found');
      }
    } catch (error) {
      console.error('Error fetching address:', error);
      throw error;
    }
  };
  
  const getCurrentLocation = async () => {
    setFetchingLocation(true);
    try {
      if (Platform.OS === 'android') {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
        );
        if (granted !== PermissionsAndroid.RESULTS.GRANTED) {
          Alert.alert('Permission Denied', 'Location permission is required');
          setFetchingLocation(false);
          return;
        }
      }
      
      Geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            // Get the actual address from coordinates
            const address = await getAddressFromCoordinates(latitude, longitude);
            setProfileData(prev => ({
              ...prev,
              address,
            }));
          } catch (error) {
            console.error('Error getting address:', error);
            Alert.alert('Error', 'Failed to get address from location');
          } finally {
            setFetchingLocation(false);
          }
        },
        (error) => {
          console.log('❌ Location Error:', error.message);
          setFetchingLocation(false);
          Alert.alert('Location Error', 'Could not get your current location. Please check your permissions.');
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    } catch (error) {
      console.error('❌ Error fetching location:', error);
      setFetchingLocation(false);
      Alert.alert('Error', 'Failed to fetch current location');
    }
  };
  
  const handleEmailChange = (text: string) => {
    setProfileData(prev => ({ ...prev, email: text }));
    
    // Validate email if it's not empty
    if (text.trim() !== '') {
      if (!validateEmail(text)) {
        setEmailError('Please enter a valid email address');
      } else {
        setEmailError(null);
      }
    } else {
      setEmailError(null);
    }
  };
  
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#28a745" />
      </View>
    );
  }
  
  return (
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <StatusBar backgroundColor="#28a745" barStyle="light-content" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Feather name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <View style={styles.headerRight} />
      </View>
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.profileImageSection}>
          <View style={styles.profileImageCard}>
            <TouchableOpacity onPress={handleImagePick} style={styles.profileImageContainer} disabled={uploadingImage}>
              {profileData.profilePicture ? (
                <Image 
                  source={{ uri: profileData.profilePicture }} 
                  style={styles.profileImage} 
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <FontAwesome name="user" size={40} color="#6c757d" />
                </View>
              )}
              <View style={styles.cameraIcon}>
                {uploadingImage ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="camera" size={16} color="#fff" />
                )}
              </View>
            </TouchableOpacity>
            <Text style={styles.profileImageText}>
              {uploadingImage ? 'Uploading...' : 'Change Profile Photo'}
            </Text>
          </View>
        </View>
        
        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              value={profileData.name}
              onChangeText={(text) => setProfileData(prev => ({ ...prev, name: text }))}
              placeholder="Enter your name"
              placeholderTextColor="#6c757d"
              textAlign="left"
            />
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Customer ID</Text>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText} textAlign="left">{profileData.customerId || 'Loading...'}</Text>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.readOnlyContainer}>
              <Text style={styles.readOnlyText} textAlign="left">{profileData.phoneNumber}</Text>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={[
                styles.input,
                emailError && styles.inputError
              ]}
              value={profileData.email}
              onChangeText={handleEmailChange}
              onBlur={() => setIsEmailFocused(true)}
              onFocus={() => setIsEmailFocused(true)}
              placeholder="Enter your email"
              placeholderTextColor="#6c757d"
              keyboardType="email-address"
              autoCapitalize="none"
              textAlign="left"
            />
            {emailError && isEmailFocused && (
              <Text style={styles.errorText}>{emailError}</Text>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Address</Text>
            <View style={styles.addressContainer}>
              <TextInput
                style={[styles.input, styles.addressInput]}
                value={profileData.address}
                onChangeText={(text) => setProfileData(prev => ({ ...prev, address: text }))}
                placeholder="Enter your address"
                placeholderTextColor="#6c757d"
                multiline
                numberOfLines={3}
                textAlign="left"
              />
              <TouchableOpacity 
                style={styles.locationButton} 
                onPress={getCurrentLocation}
                disabled={fetchingLocation}
              >
                {fetchingLocation ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Feather name="map-pin" size={20} color="#fff" />
                )}
              </TouchableOpacity>
            </View>
            {profileData.address && profileData.address.length < 5 && (
              <Text style={styles.errorText}>Address must be at least 5 characters</Text>
            )}
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Gender</Text>
            <View style={styles.genderContainer}>
              {['Male', 'Female', 'Other'].map((gender) => (
                <TouchableOpacity
                  key={gender}
                  style={[
                    styles.genderOption,
                    profileData.gender === gender && styles.genderOptionSelected
                  ]}
                  onPress={() => setProfileData(prev => ({ ...prev, gender }))}
                >
                  <Text
                    style={[
                      styles.genderText,
                      profileData.gender === gender && styles.genderTextSelected
                    ]}
                    textAlign="center"
                  >
                    {gender}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Alternative Mobile (Optional)</Text>
            <TextInput
              style={styles.input}
              value={profileData.altMobile}
              onChangeText={(text) => {
                const cleanedText = text.replace(/[^0-9]/g, '').substring(0, 10);
                setProfileData(prev => ({ ...prev, altMobile: cleanedText }));
              }}
              placeholder="Enter alternative mobile"
              placeholderTextColor="#6c757d"
              keyboardType="phone-pad"
              maxLength={10}
              textAlign="left"
            />
            {profileData.altMobile && profileData.altMobile.length !== 10 && (
              <Text style={styles.errorText}>Please enter a valid 10-digit mobile number</Text>
            )}
          </View>
          
          <TouchableOpacity
            style={[
              styles.updateButton, 
              updating && styles.updateButtonDisabled,
              emailError && styles.updateButtonDisabled
            ]}
            onPress={handleUpdateProfile}
            disabled={updating || !!emailError}
          >
            {updating ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.updateButtonText}>Update Profile</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#28a745',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#fff',
  },
  headerRight: {
    width: 40,
  },
  profileImageSection: {
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  profileImageCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  profileImageContainer: {
    position: 'relative',
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#dee2e6',
  },
  profileImage: {
    width: 98,
    height: 98,
    borderRadius: 49,
  },
  placeholderImage: {
    width: 98,
    height: 98,
    borderRadius: 49,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e9ecef',
  },
  cameraIcon: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#28a745',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  profileImageText: {
    color: '#6c757d',
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  formContainer: {
    padding: 16,
    backgroundColor: '#f8f9fa',
  },
  inputGroup: {
    marginBottom: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c757d',
    marginBottom: 8,
    textAlign: 'left',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    padding: 10,
    fontSize: 16,
    color: '#343a40',
    textAlign: 'left',
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 2,
  },
  readOnlyContainer: {
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 6,
    padding: 10,
    backgroundColor: '#e9ecef',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'left',
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  addressInput: {
    flex: 1,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  locationButton: {
    backgroundColor: '#28a745',
    borderRadius: 6,
    padding: 8,
    marginLeft: 8,
    justifyContent: 'center',
  },
  genderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  genderOption: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#ced4da',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  genderOptionSelected: {
    backgroundColor: '#28a745',
    borderColor: '#28a745',
  },
  genderText: {
    color: '#343a40',
    fontWeight: '500',
    textAlign: 'center',
  },
  genderTextSelected: {
    color: '#fff',
    fontWeight: '600',
  },
  errorText: {
    color: '#dc3545',
    fontSize: 12,
    marginTop: 6,
    textAlign: 'left',
  },
  updateButton: {
    backgroundColor: '#28a745',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  updateButtonDisabled: {
    backgroundColor: '#6c757d',
  },
  updateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ProfileScreen;