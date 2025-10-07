import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface NotificationItemProps {
  icon: string;
  title: string;
  text: string;
  time: string;
}

const NotificationItem: React.FC<NotificationItemProps> = ({ icon, title, text, time }) => {
  return (
    <View style={styles.notificationItem}>
      <View style={styles.notificationIcon}>
        <MaterialIcons name={icon} size={20} color="#28a745" /> 
      </View>
      <View style={styles.notificationContent}>
        <Text style={styles.notificationTitle}>{title}</Text>
        <Text style={styles.notificationText}>{text}</Text>
        <Text style={styles.notificationTime}>{time}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  notificationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#D3D3D3', // card background
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
  },
  notificationIcon: {
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000', // black for visibility
  },
  notificationText: {
    fontSize: 14,
    color: '#555555', // darker gray for better readability
    marginTop: 5,
    lineHeight: 20,
  },
  notificationTime: {
    fontSize: 12,
    color: '#777777', // lighter gray for timestamp
    marginTop: 5,
  },
});

export default NotificationItem;
