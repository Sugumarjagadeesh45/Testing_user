import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, Text, ScrollView, ActivityIndicator, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Feather from 'react-native-vector-icons/Feather';
import ProfileSection from './ProfileSection';
import WalletSection from './WalletSection';
import MenuItem from './MenuItem';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from '../../constants/LanguageContext';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getBackendUrl } from '../../util/backendConfig';

interface MenuProps {
  name: string;
  phoneNumber: string;
  profilePicture?: string;
  customerId: string;
  toggleMenu: () => void;
  handleLogout: () => Promise<void>;
}

interface Payment {
  dateTime: string;
  amount: number;
  reason: string;
  status: string;
}

interface Travel {
  id: string;
  dateTime: string;
  pickup: string;
  destination: string;
  status: string;
}

const Menu: React.FC<MenuProps> = ({
  name,
  phoneNumber,
  profilePicture,
  customerId,
  toggleMenu,
  handleLogout,
}) => {
  const navigation = useNavigation();
  const { t } = useTranslation();
  const [userName, setUserName] = useState(name);
  const [userPhone, setUserPhone] = useState(phoneNumber);
  const [userProfilePicture, setUserProfilePicture] = useState<string | undefined>(profilePicture);
  const [activePage, setActivePage] = useState<'menu' | 'payment' | 'travel'>('menu');
  const [payments, setPayments] = useState<Payment[]>([]);
  const [travels, setTravels] = useState<Travel[]>([]);
  const [loadingTravels, setLoadingTravels] = useState(false);

  // Construct full profile picture URL
  const baseUrl = getBackendUrl();
  const fullProfilePicture = profilePicture ? `${baseUrl}${profilePicture}` : undefined;

  useEffect(() => {
    setUserName(name);
    setUserPhone(phoneNumber);
    setUserProfilePicture(fullProfilePicture);
  }, [name, phoneNumber, fullProfilePicture]);

  const handleProfileUpdate = (newName: string, newPhone: string) => {
    setUserName(newName);
    setUserPhone(newPhone);
  };

  const navigateToSettings = () => {
    toggleMenu();
    navigation.navigate('Setting', { refresh: Date.now() });
  };

  const fetchTravelHistory = async () => {
    try {
      setLoadingTravels(true);
      const token = await AsyncStorage.getItem('userToken') || await AsyncStorage.getItem('authToken');
      const backendUrl = getBackendUrl();
      if (!token) {
        setTravels([]);
        return;
      }
      const response = await axios.get(`${backendUrl}/api/travels/history`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      if (response.data.success) {
        setTravels(response.data.travels || []);
      } else {
        setTravels([]);
      }
    } catch (error) {
      console.error('❌ Error fetching travel history:', error);
      setTravels([]);
    } finally {
      setLoadingTravels(false);
    }
  };

  const renderPaymentPage = () => (
    <View style={styles.fullPageContainer}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => setActivePage('menu')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#343a40" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{t('paymentHistory')}</Text>
        <View style={styles.headerRight} />
      </View>
      <ScrollView style={styles.fullPageScrollView}>
        <View style={styles.tableContainer}>
          <View style={styles.tableHeader}>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>{t('dateTime')}</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>{t('amount')}</Text>
            <Text style={[styles.tableHeaderText, { flex: 2 }]}>{t('reason')}</Text>
            <Text style={[styles.tableHeaderText, { flex: 1 }]}>{t('status')}</Text>
          </View>
          {payments.map((payment, index) => (
            <View key={index} style={styles.tableRow}>
              <Text style={[styles.tableCell, { flex: 2 }]}>{payment.dateTime}</Text>
              <Text style={[styles.tableCell, { flex: 1 }]}>₹{payment.amount}</Text>
              <Text style={[styles.tableCell, { flex: 2 }]}>{payment.reason}</Text>
              <Text
                style={[
                  styles.tableCell,
                  { flex: 1 },
                  {
                    color:
                      payment.status === 'Paid'
                        ? '#28a745'
                        : payment.status === 'Processing'
                        ? '#ffc107'
                        : '#dc3545',
                  },
                ]}
              >
                {payment.status}
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );

  const renderTravelPage = () => (
    <View style={styles.fullPageContainer}>
      <View style={styles.pageHeader}>
        <TouchableOpacity onPress={() => setActivePage('menu')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#343a40" />
        </TouchableOpacity>
        <Text style={styles.pageTitle}>{t('travelHistory')}</Text>
        <View style={styles.headerRight} />
      </View>
      {loadingTravels ? (
        <View style={styles.fullPageLoadingContainer}>
          <ActivityIndicator size="large" color="#28a745" />
        </View>
      ) : travels.length === 0 ? (
        <View style={styles.fullPageNoDataContainer}>
          <Feather name="map" size={60} color="#6c757d" />
          <Text style={styles.noDataText}>No travel history found</Text>
          <Text style={styles.noDataSubText}>Your completed rides will appear here</Text>
        </View>
      ) : (
        <ScrollView style={styles.fullPageScrollView}>
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>{t('dateTime')}</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>{t('pickup')}</Text>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>{t('destination')}</Text>
              <Text style={[styles.tableHeaderText, { flex: 1 }]}>{t('status')}</Text>
            </View>
            {travels.map((travel) => (
              <View key={travel.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { flex: 2 }]}>{travel.dateTime}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{travel.pickup}</Text>
                <Text style={[styles.tableCell, { flex: 2 }]} numberOfLines={1}>{travel.destination}</Text>
                <Text
                  style={[
                    styles.tableCell,
                    { flex: 1 },
                    { color: travel.status === 'Completed' ? '#28a745' : '#dc3545' },
                  ]}
                >
                  {travel.status}
                </Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );

  const renderMenuPage = () => (
    <View style={styles.menuContainer}>
      <View style={styles.menuHeader}>
        <TouchableOpacity onPress={toggleMenu}>
          <Ionicons name="arrow-back" size={24} color="#343a40" />
        </TouchableOpacity>
        <Text style={styles.menuTitle}>{t('menu')}</Text>
      </View>
      <ScrollView showsVerticalScrollIndicator={false}>
        <ProfileSection
          name={userName}
          phoneNumber={userPhone}
          customerId={customerId}
          profilePicture={userProfilePicture}
        />
        <WalletSection />
        <View style={styles.menuDivider} />
        <MenuItem
          icon="payment"
          text={t('payment')}
          onPress={() => {
            setPayments([
              { dateTime: '10-09-25 03:15 PM', amount: 500, reason: 'Ride Booking', status: 'Paid' },
              { dateTime: '09-09-25 07:00 PM', amount: 2000, reason: 'Shopping', status: 'Processing' },
              { dateTime: '08-09-25 11:30 AM', amount: 750, reason: 'Ride Booking', status: 'Paid' },
              { dateTime: '07-09-25 05:45 PM', amount: 1200, reason: 'Shopping', status: 'Failed' },
            ]);
            setActivePage('payment');
          }}
        />
        <MenuItem
          icon="history"
          text={t('myTravelHistory')}
          onPress={() => {
            fetchTravelHistory();
            setActivePage('travel');
          }}
        />
        <MenuItem icon="settings" text={t('settings')} onPress={navigateToSettings} />
        <MenuItem icon="logout" text={t('logout')} onPress={handleLogout} />
        <View style={styles.menuDivider} />
        <View style={styles.menuFooter}>
          <Text style={styles.footerText}>App Version 1.0.0</Text>
          <Text style={styles.footerText}>© 2025 TaxiApp Inc.</Text>
        </View>
      </ScrollView>
    </View>
  );

  if (activePage === 'payment') return renderPaymentPage();
  if (activePage === 'travel') return renderTravelPage();
  return renderMenuPage();
};

const styles = StyleSheet.create({
  menuContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  menuTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#343a40',
    marginLeft: 20,
    fontFamily: 'System',
  },
  fullPageContainer: {
    flex: 1,
    width: Dimensions.get('window').width,
    backgroundColor: '#f8f9fa',
  },
  pageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  backButton: {
    padding: 8,
  },
  pageTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#343a40',
  },
  headerRight: {
    width: 40,
  },
  fullPageScrollView: {
    flex: 1,
    padding: 16,
  },
  fullPageLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullPageNoDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  tableContainer: {
    backgroundColor: '#fff',
    borderRadius: 10,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#28a745',
    padding: 12,
  },
  tableHeaderText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
    textAlign: 'left',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
    backgroundColor: '#fff',
  },
  tableCell: {
    fontSize: 14,
    color: '#343a40',
    textAlign: 'left',
  },
  menuDivider: {
    height: 1,
    backgroundColor: '#e9ecef',
    marginVertical: 15,
  },
  menuFooter: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#6c757d',
    marginTop: 5,
    fontFamily: 'System',
  },
  noDataText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c757d',
    marginTop: 16,
    textAlign: 'center',
  },
  noDataSubText: {
    fontSize: 14,
    color: '#6c757d',
    marginTop: 8,
    textAlign: 'center',
  },
});

export default Menu;

// // D:\newapp\userapp-main 2\userapp-main\src\Screen1\Menuicon\Menu.tsx
// import React, { useState, useEffect } from 'react';
// import { View, StyleSheet, TouchableOpacity, Platform } from 'react-native';
// import Ionicons from 'react-native-vector-icons/Ionicons';
// import ProfileSection from './ProfileSection';
// import WalletSection from './WalletSection';
// import MenuItem from './MenuItem';
// import { Text } from 'react-native';
// import { useNavigation } from '@react-navigation/native';
// import { useTranslation } from '../../constants/LanguageContext';

// interface MenuProps {
//   name: string;
//   phoneNumber: string;
//   profilePicture?: string;
//   customerId: string;
//   toggleMenu: () => void;
//   handleLogout: () => Promise<void>;
// }

// const Menu: React.FC<MenuProps> = ({ 
//   name, 
//   phoneNumber, 
//   profilePicture,
//   customerId,
//   toggleMenu, 
//   handleLogout,
// }) => {
//   const navigation = useNavigation();
//   const { t } = useTranslation();
//   const [userName, setUserName] = useState(name);
//   const [userPhone, setUserPhone] = useState(phoneNumber);
//   const [userProfilePicture, setUserProfilePicture] = useState(profilePicture);
  
//   useEffect(() => {
//     setUserName(name);
//     setUserPhone(phoneNumber);
//     setUserProfilePicture(profilePicture);
//   }, [name, phoneNumber, profilePicture]);
  
//   const handleProfileUpdate = (newName: string, newPhone: string) => {
//     setUserName(newName);
//     setUserPhone(newPhone);
//   };

//   const navigateToSettings = () => {
//     toggleMenu();
//     navigation.navigate('Setting');
//   };

//   return (
//     <View style={styles.menuContainer}>
//       <View style={styles.menuHeader}>
//         <TouchableOpacity onPress={toggleMenu}>
//           <Ionicons name="arrow-back" size={24} color='#D3D3D3' />
//         </TouchableOpacity>
//         <Text style={styles.menuTitle}>{t('menu')}</Text>
//       </View>
      
//       <ProfileSection 
//         name={userName}
//         phoneNumber={userPhone}
//         customerId={customerId}
//         profilePicture={userProfilePicture}
//       />
      
//       <WalletSection />
//       <View style={styles.menuDivider} />
//       <MenuItem icon="payment" text={t('payment')} />
//       <MenuItem icon="history" text={t('myTravelHistory')} />
//       <MenuItem icon="settings" text={t('settings')} onPress={navigateToSettings} />
//       <MenuItem icon="logout" text={t('logout')} onPress={handleLogout} />
//       <View style={styles.menuDivider} />
//       <View style={styles.menuFooter}>
//         <Text style={styles.footerText}>App Version 1.0.0</Text>
//         <Text style={styles.footerText}>© 2023 TaxiApp Inc.</Text>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   menuContainer: {
//     width: '75%',
//     height: '100%',
//     backgroundColor: '#FFFFFF',
//     padding: 20,
//   },
//   menuHeader: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     marginBottom: 20,
//     paddingTop: Platform.OS === 'android' ? 20 : 0,
//   },
//   menuTitle: {
//     fontSize: 18,
//     fontWeight: '600',
//     color: '#D3D3D3',
//     marginLeft: 20,
//   },
//   menuDivider: {
//     height: 1,
//     backgroundColor: '#D3D3D3',
//     marginVertical: 15,
//   },
//   menuFooter: {
//     marginTop: 'auto',
//     alignItems: 'center',
//   },
//   footerText: {
//     fontSize: 12,
//     color: '#A9A9A9',
//     marginTop: 5,
//   },
// });

// export default Menu;