import React from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity, Text, Platform } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import NotificationItem from './NotificationItem';

interface NotificationsProps {
  toggleNotifications: () => void;
}

const Notifications: React.FC<NotificationsProps> = ({ toggleNotifications }) => {
  return (
    <View style={styles.notificationsContainer}>
      <View style={styles.notificationsHeader}>
        <TouchableOpacity onPress={toggleNotifications}>
          <Ionicons name="arrow-back" size={24} color="#28a745" /> 
        </TouchableOpacity>
        <Text style={styles.notificationsTitle}>Notifications</Text>
      </View>

      <ScrollView>
        <NotificationItem
          icon="local-offer"
          title="Special Offer"
          text="Get 20% off on your next ride"
          time="2 hours ago"
        />
        <NotificationItem
          icon="directions-car"
          title="Ride Completed"
          text="Your ride to Downtown has been completed"
          time="Yesterday"
        />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationsContainer: {
    width: '75%',
    height: '100%',
    backgroundColor: '#FFFFFF', // replaced WHITE
    padding: 20,
    marginLeft: 'auto',
  },
  notificationsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    paddingTop: Platform.OS === 'android' ? 20 : 0,
  },
  notificationsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000', // changed to black for readability
    marginLeft: 20,
  },
});

export default Notifications;
