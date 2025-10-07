// D:\EazyGo\easyGofrontend-main\src\Screen1\Taxibooking\RideTypeSelector.tsx
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface RideTypeSelectorProps {
  selectedRideType: string;
  setSelectedRideType: (type: string) => void;
}

const RideTypeSelector: React.FC<RideTypeSelectorProps> = ({ selectedRideType, setSelectedRideType }) => {
  return (
    <View style={styles.rideTypeContainer}>
      <TouchableOpacity
        style={[styles.rideTypeButton, selectedRideType === 'bike' && styles.selectedRideType]}
        onPress={() => setSelectedRideType('bike')}
      >
        <MaterialIcons
          name="two-wheeler"
          size={24}
          color={selectedRideType === 'bike' ? '#FFFFFF' : '#4caf50'}
        />
        <Text style={[styles.rideTypeText, selectedRideType === 'bike' && styles.selectedRideTypeText]}>
          Bike
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.rideTypeButton, selectedRideType === 'taxi' && styles.selectedRideType]}
        onPress={() => setSelectedRideType('taxi')}
      >
        <FontAwesome
          name="taxi"
          size={24}
          color={selectedRideType === 'taxi' ? '#FFFFFF' : '#4caf50'}
        />
        <Text style={[styles.rideTypeText, selectedRideType === 'taxi' && styles.selectedRideTypeText]}>
          Taxi
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.rideTypeButton, selectedRideType === 'port' && styles.selectedRideType]}
        onPress={() => setSelectedRideType('port')}
      >
        <MaterialIcons
          name="local-shipping"
          size={24}
          color={selectedRideType === 'port' ? '#FFFFFF' : '#4caf50'}
        />
        <Text style={[styles.rideTypeText, selectedRideType === 'port' && styles.selectedRideTypeText]}>
          Port
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  rideTypeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#D3D3D3',
    borderRadius: 15,
  },
  rideTypeButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    marginHorizontal: 5,
    borderRadius: 10,
  },
  selectedRideType: {
    backgroundColor: '#4caf50',
  },
  rideTypeText: {
    marginTop: 5,
    fontSize: 14,
    color: '#4caf50',
    fontWeight: '600',
  },
  selectedRideTypeText: {
    color: '#FFFFFF',
  },
});

export default RideTypeSelector;