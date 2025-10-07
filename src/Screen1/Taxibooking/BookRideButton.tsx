// D:\EazyGo\easyGofrontend-main\src\Screen1\Taxibooking\BookRideButton.tsx
import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';

const BookRideButton: React.FC = () => {
  return (
    <TouchableOpacity style={styles.bookRideButton}>
      <Text style={styles.bookRideButtonText}>Book My Ride</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  bookRideButton: {
    backgroundColor: '#28a745',
    width: '100%',
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bookRideButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
});

export default BookRideButton;