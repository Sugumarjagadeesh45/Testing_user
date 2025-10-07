import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Switch, 
  ScrollView,
  Alert,
  Platform,
  Image,
  Modal,
  TextInput,
  DatePickerAndroid,
  TimePickerAndroid,
  Button,
  ActivityIndicator
} from 'react-native';
import { Picker } from '@react-native-picker/picker';

import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../../constants/LanguageContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from '../../util/backendConfig';

const Setting = () => {
  const navigation = useNavigation();
  const { t, language, changeLanguage } = useTranslation();
  
  // Notification settings state
  const [notifications, setNotifications] = useState({
    rideUpdates: true,
    promotions: true,
    paymentReminders: false,
    safetyAlerts: true,
  });
  // Privacy settings state
  const [privacySettings, setPrivacySettings] = useState({
    shareLocation: true,
    shareTripData: false,
    showProfilePhoto: true,
  });
  // Ride preferences
  const [ridePreferences, setRidePreferences] = useState({
    quietRide: false,
    conversation: true,
    climateControl: true,
  });
  // Payment methods
  const [paymentMethods, setPaymentMethods] = useState({
    cash: true,
    creditCard: true,
    wallet: true,
  });
  
  // Modals state
  const [showRideHistory, setShowRideHistory] = useState(false);
  const [showReportDriver, setShowReportDriver] = useState(false);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  
  // Ride history state
  const [rideHistory, setRideHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Report driver form state
  const [reportForm, setReportForm] = useState({
    name: '',
    pickup: '',
    drop: '',
    distance: '',
    price: '',
    dateTime: new Date(),
    issueType: '',
    description: '',
  });
  
  // Toggle notification settings
  const toggleNotification = (setting: string) => {
    setNotifications(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };
  // Toggle privacy settings
  const togglePrivacySetting = (setting: string) => {
    setPrivacySettings(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };
  // Toggle ride preferences
  const toggleRidePreference = (setting: string) => {
    setRidePreferences(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };
  // Toggle payment methods
  const togglePaymentMethod = (setting: string) => {
    setPaymentMethods(prev => ({
      ...prev,
      [setting]: !prev[setting as keyof typeof prev]
    }));
  };
  // Handle language selection
  const handleLanguageSelect = () => {
    Alert.alert(
      t('selectLanguage'),
      t('choosePreferredLanguage'),
      [
        { text: 'English', onPress: () => changeLanguage('en') },
        { text: 'தமிழ்', onPress: () => changeLanguage('ta') },
        { text: 'हिंदी', onPress: () => changeLanguage('hi') },
        { text: t('cancel'), style: 'cancel' }
      ]
    );
  };
  
  // Handle report driver
  const handleReportDriver = () => {
    setShowReportDriver(true);
  };
  
  // Handle emergency contacts
  const handleEmergencyContacts = () => {
    Alert.alert(t('emergencyContacts'), t('emergencyContacts'));
  };
  
  // Handle fare estimate
  const handleFareEstimate = () => {
    Alert.alert(t('fareEstimate'), t('fareEstimate'));
  };
  
  // Update the handleRideHistory function in Setting.tsx
  const handleRideHistory = async () => {
    setShowRideHistory(true);
    setLoadingHistory(true);
    
    try {
      const token = await AsyncStorage.getItem('authToken') || await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        setLoadingHistory(false);
        return;
      }
      
      const backendUrl = getBackendUrl();
      // First get user profile to get user ID
      const userResponse = await axios.get(`${backendUrl}/api/users/me/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!userResponse.data.success) {
        Alert.alert('Error', 'Failed to fetch user data');
        setLoadingHistory(false);
        return;
      }
      
      const userId = userResponse.data.user._id;
      
      // Now fetch rides for this user
      const response = await axios.get(`${backendUrl}/api/rides/user/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data && response.data.rides) {
        setRideHistory(response.data.rides);
      } else {
        // Fallback: try to get all rides and filter by user ID
        const allRidesResponse = await axios.get(`${backendUrl}/api/rides`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (allRidesResponse.data) {
          // Filter rides by user ID
          const userRides = allRidesResponse.data.filter(ride => 
            ride.user && (ride.user._id === userId || ride.user === userId)
          );
          setRideHistory(userRides);
        } else {
          Alert.alert('Error', 'Failed to fetch ride history');
        }
      }
    } catch (error) {
      // console.error('Error fetching ride history:', error);
      // Alert.alert('Error', 'Failed to fetch ride history');
    } finally {
      setLoadingHistory(false);
    }
  };

  // Handle terms & conditions
  const handleTerms = () => {
    setShowTerms(true);
  };
  
  // Handle privacy policy
  const handlePrivacy = () => {
    setShowPrivacy(true);
  };
  
  // Handle logout
  const handleLogout = () => {
    Alert.alert(
      t('confirmLogout'),
      t('logoutConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('logout'), 
          onPress: async () => {
            try {
              await AsyncStorage.multiRemove([
                'authToken', 
                'userToken', 
                'isRegistered', 
                'name', 
                'address', 
                'phoneNumber',
                'customerId',
                'profilePicture'
              ]);
              
              navigation.reset({
                index: 0,
                routes: [{ name: 'WelcomeScreen3' }],
              });
            } catch (err) {
              console.error('Logout error:', err);
              Alert.alert('Error', 'Failed to log out. Please try again.');
            }
          } 
        }
      ]
    );
  };
  
  // Handle delete account
  const handleDeleteAccount = () => {
    Alert.alert(
      t('confirmDeleteAccount'),
      t('deleteAccountConfirmation'),
      [
        { text: t('cancel'), style: 'cancel' },
        { 
          text: t('delete'), 
          onPress: async () => {
            try {
              const token = await AsyncStorage.getItem('authToken') || await AsyncStorage.getItem('userToken');
              if (!token) {
                Alert.alert('Error', 'Authentication token not found');
                return;
              }
              
              const backendUrl = getBackendUrl();
              const response = await axios.delete(`${backendUrl}/api/users/me`, {
                headers: {
                  'Authorization': `Bearer ${token}`,
                  'Content-Type': 'application/json'
                }
              });
              
              if (response.data.success) {
                await AsyncStorage.multiRemove([
                  'authToken', 
                  'userToken', 
                  'isRegistered', 
                  'name', 
                  'address', 
                  'phoneNumber',
                  'customerId',
                  'profilePicture'
                ]);
                
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'WelcomeScreen3' }],
                });
              } else {
                Alert.alert('Error', 'Failed to delete account');
              }
            } catch (error) {
              console.error('Error deleting account:', error);
              Alert.alert('Error', 'Failed to delete account');
            }
          } 
        }
      ]
    );
  };
  
  // Handle report form change
  const handleReportChange = (field: string, value: string) => {
    setReportForm(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // Handle date/time picker
  const showDateTimePicker = async () => {
    try {
      const { action, year, month, day } = await DatePickerAndroid.open({
        date: reportForm.dateTime,
        mode: 'default',
      });
      
      if (action !== DatePickerAndroid.dismissedAction) {
        const { action: timeAction, hour, minute } = await TimePickerAndroid.open({
          hour: reportForm.dateTime.getHours(),
          minute: reportForm.dateTime.getMinutes(),
          is24Hour: false,
        });
        
        if (timeAction !== TimePickerAndroid.dismissedAction) {
          const selectedDate = new Date(year, month, day, hour, minute);
          handleReportChange('dateTime', selectedDate.toISOString());
        }
      }
    } catch (err) {
      console.warn(err);
    }
  };
  
  // Submit report
  const submitReport = async () => {
    if (!reportForm.name || !reportForm.pickup || !reportForm.drop || 
        !reportForm.issueType || !reportForm.description) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    
    try {
      const token = await AsyncStorage.getItem('authToken') || await AsyncStorage.getItem('userToken');
      if (!token) {
        Alert.alert('Error', 'Authentication token not found');
        return;
      }
      
      const backendUrl = getBackendUrl();
      const response = await axios.post(`${backendUrl}/api/reports`, reportForm, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (response.data.success) {
        Alert.alert('Success', 'Your report has been submitted successfully');
        setShowReportDriver(false);
        // Reset form
        setReportForm({
          name: '',
          pickup: '',
          drop: '',
          distance: '',
          price: '',
          dateTime: new Date(),
          issueType: '',
          description: '',
        });
      } else {
        Alert.alert('Error', 'Failed to submit report');
      }
    } catch (error) {
      console.error('Error submitting report:', error);
      Alert.alert('Error', 'Failed to submit report');
    }
  };
  
  // Terms & Conditions content
  const termsContent = `
TERMS & CONDITIONS
Acceptance of Terms
By using the RideEasy app, you agree to comply with and be bound by these Terms & Conditions.
User Responsibilities
- Provide accurate information (phone number, location, payment details)
- Use the app only for legitimate purposes
- Not engage in fraudulent activities or misuse the app
- Respect drivers and other users
Driver Responsibilities
- Follow all traffic laws and regulations
- Maintain vehicle safety and cleanliness
- Provide professional and courteous service
- Adhere to RideEasy's service standards
Booking & Cancellation
- Bookings are subject to availability
- Cancellation charges may apply if cancelled after driver acceptance
- Refunds are processed according to our refund policy
Fares & Payments
- Fares are calculated based on distance, time, and demand
- Additional charges may apply for waiting time or tolls
- Payment must be made through the app using available methods
Liability Disclaimer
RideEasy is a platform connecting riders and drivers. We are not responsible for:
- Actions of drivers or riders
- Accidents, injuries, or damages during rides
- Loss of personal belongings
Account Suspension/Termination
We reserve the right to suspend or terminate accounts that violate these terms.
Changes to Terms
RideEasy may update these terms at any time. Continued use of the app constitutes acceptance of the updated terms.
  `;
  
  // Privacy Policy content
  const privacyContent = `
PRIVACY POLICY
Information We Collect
- Personal information: name, phone number, email address
- Location data: pickup location, destination, live tracking
- Payment information: payment method details
- Usage data: how you use the app
How We Use Data
- To facilitate ride bookings and payments
- To improve our services and user experience
- For customer support and issue resolution
- To ensure safety and security
Data Sharing
- With drivers: for ride fulfillment only
- With third parties: payment processors, map providers, analytics services
- With law enforcement: when required by law or to ensure safety
Data Security
- We use industry-standard encryption to protect your data
- Access to personal data is restricted to authorized personnel
- We regularly review our security practices
User Rights
- Right to access your personal data
- Right to update or correct your information
- Right to request deletion of your account and data
Cookies & Tracking
- We use cookies and similar technologies for app functionality
- You can manage cookie preferences in your device settings
Changes to Policy
We may update this privacy policy from time to time. The updated policy will be effective when posted in the app.
Contact Information
For questions about this privacy policy, contact us at privacy@rideeasy.com
  `;
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('settings')}</Text>
        <View style={{ width: 24 }} /> {/* For balance */}
      </View>
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Header Section */}
        <View style={styles.appHeader}>
          <Image 
            source={require('../../../assets/logo2.png')} 
            style={styles.appIcon}
            resizeMode="contain"
          />
          <Text style={styles.appName}>RideEasy</Text>
          <Text style={styles.appVersion}>{t('appVersion')} 4.2.1</Text>
        </View>
        
        {/* Notification Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('notifications')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="notifications" size={20} color="#28a745" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingText}>{t('rideUpdates')}</Text>
                <Text style={styles.settingSubtext}>{t('rideUpdates')}</Text>
              </View>
            </View>
            <Switch
              value={notifications.rideUpdates}
              onValueChange={() => toggleNotification('rideUpdates')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="pricetag" size={20} color="#28a745" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingText}>{t('promotions')}</Text>
                <Text style={styles.settingSubtext}>{t('promotions')}</Text>
              </View>
            </View>
            <Switch
              value={notifications.promotions}
              onValueChange={() => toggleNotification('promotions')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="card" size={20} color="#28a745" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingText}>{t('paymentReminders')}</Text>
                <Text style={styles.settingSubtext}>{t('paymentReminders')}</Text>
              </View>
            </View>
            <Switch
              value={notifications.paymentReminders}
              onValueChange={() => toggleNotification('paymentReminders')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="shield-checkmark" size={20} color="#28a745" style={styles.settingIcon} />
              <View>
                <Text style={styles.settingText}>{t('safetyAlerts')}</Text>
                <Text style={styles.settingSubtext}>{t('safetyAlerts')}</Text>
              </View>
            </View>
            <Switch
              value={notifications.safetyAlerts}
              onValueChange={() => toggleNotification('safetyAlerts')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        {/* Ride Preferences Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('ridePreferences')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="volume-mute" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('quietRide')}</Text>
            </View>
            <Switch
              value={ridePreferences.quietRide}
              onValueChange={() => toggleRidePreference('quietRide')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="chatbubble" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('driverConversation')}</Text>
            </View>
            <Switch
              value={ridePreferences.conversation}
              onValueChange={() => toggleRidePreference('conversation')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="snow" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('climateControl')}</Text>
            </View>
            <Switch
              value={ridePreferences.climateControl}
              onValueChange={() => toggleRidePreference('climateControl')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        {/* Payment Methods Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('paymentMethods')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="cash" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('cash')}</Text>
            </View>
            <Switch
              value={paymentMethods.cash}
              onValueChange={() => togglePaymentMethod('cash')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="card" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('creditCard')}</Text>
            </View>
            <Switch
              value={paymentMethods.creditCard}
              onValueChange={() => togglePaymentMethod('creditCard')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="wallet" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('wallet')}</Text>
            </View>
            <Switch
              value={paymentMethods.wallet}
              onValueChange={() => togglePaymentMethod('wallet')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>
        
        {/* Privacy & Security Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('privacySecurity')}</Text>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="location" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('shareLiveLocation')}</Text>
            </View>
            <Switch
              value={privacySettings.shareLocation}
              onValueChange={() => togglePrivacySetting('shareLocation')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="analytics" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('shareTripData')}</Text>
            </View>
            <Switch
              value={privacySettings.shareTripData}
              onValueChange={() => togglePrivacySetting('shareTripData')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="person" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('showProfilePhoto')}</Text>
            </View>
            <Switch
              value={privacySettings.showProfilePhoto}
              onValueChange={() => togglePrivacySetting('showProfilePhoto')}
              trackColor={{ false: '#767577', true: '#28a745' }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleEmergencyContacts}>
            <View style={styles.settingInfo}>
              <Ionicons name="alert-circle" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('emergencyContacts')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#28a745" />
          </TouchableOpacity>
        </View>
        
        {/* General Settings Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('general')}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLanguageSelect}>
            <View style={styles.settingInfo}>
              <Ionicons name="language" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('language')}</Text>
            </View>
            <View style={styles.settingValue}>
              <Text style={styles.valueText}>
                {language === 'en' ? 'English' : language === 'ta' ? 'தமிழ்' : 'हिंदी'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color="#28a745" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleFareEstimate}>
            <View style={styles.settingInfo}>
              <Ionicons name="calculator" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('fareEstimate')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#28a745" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleRideHistory}>
            <View style={styles.settingInfo}>
              <Ionicons name="time" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('rideHistory')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#28a745" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleReportDriver}>
            <View style={styles.settingInfo}>
              <Ionicons name="warning" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('reportDriver')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#28a745" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleTerms}>
            <View style={styles.settingInfo}>
              <Ionicons name="document-text" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('termsConditions')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#28a745" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handlePrivacy}>
            <View style={styles.settingInfo}>
              <Ionicons name="lock-closed" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('privacyPolicy')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#28a745" />
          </TouchableOpacity>
        </View>
        
        {/* Support Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('support')}</Text>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="help-circle" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('helpCenter')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#28a745" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="chatbox" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('contactSupport')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#28a745" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem}>
            <View style={styles.settingInfo}>
              <Ionicons name="star" size={20} color="#28a745" style={styles.settingIcon} />
              <Text style={styles.settingText}>{t('rateOurApp')}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#28a745" />
          </TouchableOpacity>
        </View>
        
        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>{t('account')}</Text>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleLogout}>
            <View style={styles.settingInfo}>
              <Ionicons name="log-out" size={20} color="#e74c3c" style={styles.settingIcon} />
              <Text style={[styles.settingText, { color: '#e74c3c' }]}>{t('logout')}</Text>
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.settingItem} onPress={handleDeleteAccount}>
            <View style={styles.settingInfo}>
              <Ionicons name="trash" size={20} color="#e74c3c" style={styles.settingIcon} />
              <Text style={[styles.settingText, { color: '#e74c3c' }]}>{t('deleteAccount')}</Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Ride History Modal */}
      <Modal visible={showRideHistory} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowRideHistory(false)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('rideHistory')}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          {loadingHistory ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#28a745" />
              <Text style={styles.loadingText}>{t('loading')}</Text>
            </View>
          ) : rideHistory.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="time" size={60} color="#cccccc" />
              <Text style={styles.emptyText}>{t('noRideHistory')}</Text>
            </View>
          ) : (
            <ScrollView style={styles.historyContainer}>
              {rideHistory.map((ride, index) => (
                <View key={index} style={styles.historyItem}>
                  <View style={styles.historyHeader}>
                    <Text style={styles.historyDate}>
                      {new Date(ride.Raid_date || ride.createdAt).toLocaleDateString()}
                    </Text>
                    <Text style={styles.historyTime}>
                      {ride.Raid_time || new Date(ride.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    </Text>
                  </View>
                  
                  <View style={styles.historyDetails}>
                    <View style={styles.historyLocation}>
                      <Ionicons name="location" size={16} color="#28a745" />
                      <Text style={styles.historyLocationText}>{ride.pickupLocation || ride.pickup?.addr || ''}</Text>
                    </View>
                    
                    <View style={styles.historyLocation}>
                      <Ionicons name="flag" size={16} color="#e74c3c" />
                      <Text style={styles.historyLocationText}>{ride.dropoffLocation || ride.drop?.addr || ''}</Text>
                    </View>
                    
                    <View style={styles.historyInfo}>
                      <Text style={styles.historyInfoText}>
                        {t('distance')}: {ride.distance || ride.distanceKm ? `${ride.distanceKm.toFixed(2)} km` : 'N/A'}
                      </Text>
                      <Text style={styles.historyInfoText}>
                        {t('fare')}: {ride.fare || ride.price || 'N/A'}
                      </Text>
                    </View>
                    
                    <View style={styles.historyStatus}>
                      <Text style={[
                        styles.historyStatusText,
                        { 
                          color: 
                            ride.status === 'completed' ? '#28a745' : 
                            ride.status === 'ongoing' ? '#17a2b8' : 
                            ride.status === 'pending' ? '#ffc107' : '#dc3545'
                        }
                      ]}>
                        {ride.status || 'Unknown'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </Modal>
      
      {/* Report Driver Modal */}
      <Modal visible={showReportDriver} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowReportDriver(false)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('reportDriver')}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.reportContainer}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('driverName')}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('enterDriverName')}
                value={reportForm.name}
                onChangeText={(text) => handleReportChange('name', text)}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('pickupLocation')}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('enterPickupLocation')}
                value={reportForm.pickup}
                onChangeText={(text) => handleReportChange('pickup', text)}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('dropoffLocation')}</Text>
              <TextInput
                style={styles.formInput}
                placeholder={t('enterDropoffLocation')}
                value={reportForm.drop}
                onChangeText={(text) => handleReportChange('drop', text)}
              />
            </View>
            
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 10 }]}>
                <Text style={styles.formLabel}>{t('distance')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('distance')}
                  value={reportForm.distance}
                  onChangeText={(text) => handleReportChange('distance', text)}
                  keyboardType="numeric"
                />
              </View>
              
              <View style={[styles.formGroup, { flex: 1 }]}>
                <Text style={styles.formLabel}>{t('price')}</Text>
                <TextInput
                  style={styles.formInput}
                  placeholder={t('price')}
                  value={reportForm.price}
                  onChangeText={(text) => handleReportChange('price', text)}
                  keyboardType="numeric"
                />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('dateTime')}</Text>
              <TouchableOpacity style={styles.formInput} onPress={showDateTimePicker}>
                <Text>
                  {new Date(reportForm.dateTime).toLocaleString()}
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('issueType')}</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={reportForm.issueType}
                  onValueChange={(itemValue) => handleReportChange('issueType', itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label={t('selectIssueType')} value="" />
                  <Picker.Item label={t('unsafeDriving')} value="Unsafe driving" />
                  <Picker.Item label={t('rudeBehavior')} value="Rude behavior" />
                  <Picker.Item label={t('vehicleIssue')} value="Vehicle issue" />
                  <Picker.Item label={t('fareDispute')} value="Fare dispute" />
                  <Picker.Item label={t('other')} value="Other" />
                </Picker>
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('description')}</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                placeholder={t('enterDescription')}
                value={reportForm.description}
                onChangeText={(text) => handleReportChange('description', text)}
                multiline
                numberOfLines={4}
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>{t('attachment')} ({t('optional')})</Text>
              <TouchableOpacity style={styles.attachmentButton}>
                <Ionicons name="camera" size={20} color="#28a745" />
                <Text style={styles.attachmentText}>{t('addPhoto')}</Text>
              </TouchableOpacity>
            </View>
            
            <TouchableOpacity style={styles.submitButton} onPress={submitReport}>
              <Text style={styles.submitButtonText}>{t('submitReport')}</Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>
      
      {/* Terms & Conditions Modal */}
      <Modal visible={showTerms} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowTerms(false)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('termsConditions')}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.termsContainer}>
            <Text style={styles.termsText}>{termsContent}</Text>
          </ScrollView>
        </View>
      </Modal>
      
      {/* Privacy Policy Modal */}
      <Modal visible={showPrivacy} animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setShowPrivacy(false)}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>{t('privacyPolicy')}</Text>
            <View style={{ width: 24 }} />
          </View>
          
          <ScrollView style={styles.termsContainer}>
            <Text style={styles.termsText}>{privacyContent}</Text>
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
};
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 25 : 15,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    padding: 15,
  },
  appHeader: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  appIcon: {
    width: 80,
    height: 80,
    marginBottom: 10,
  },
  appName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#28a745',
    marginBottom: 5,
  },
  appVersion: {
    fontSize: 14,
    color: '#6c757d',
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28a745',
    marginBottom: 15,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingIcon: {
    marginRight: 12,
  },
  settingText: {
    fontSize: 16,
    color: '#343a40',
    fontWeight: '500',
  },
  settingSubtext: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 2,
  },
  settingValue: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  valueText: {
    fontSize: 14,
    color: '#6c757d',
    marginRight: 5,
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#28a745',
    paddingVertical: 15,
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 25 : 15,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  
  // Ride History styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
  },
  historyContainer: {
    flex: 1,
    padding: 15,
  },
  historyItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  historyDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
  },
  historyTime: {
    fontSize: 14,
    color: '#6c757d',
  },
  historyDetails: {
    marginTop: 10,
  },
  historyLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  historyLocationText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#495057',
  },
  historyInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  historyInfoText: {
    fontSize: 14,
    color: '#495057',
  },
  historyStatus: {
    alignItems: 'flex-end',
  },
  historyStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  
  // Report Driver styles
  reportContainer: {
    flex: 1,
    padding: 15,
  },
  formGroup: {
    marginBottom: 15,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 15,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#343a40',
    marginBottom: 5,
  },
  formInput: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#495057',
  },
  formTextarea: {
    height: 100,
    textAlignVertical: 'top',
  },
  pickerContainer: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  attachmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 8,
    paddingVertical: 12,
  },
  attachmentText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#28a745',
  },
  submitButton: {
    backgroundColor: '#28a745',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Terms & Privacy styles
  termsContainer: {
    flex: 1,
    padding: 15,
  },
  termsText: {
    fontSize: 14,
    lineHeight: 22,
    color: '#495057',
  },
});
export default Setting;