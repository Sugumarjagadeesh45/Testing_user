// D:\EazyGo\easyGofrontend-main\src\Screen1\Taxibooking\LocationInput.tsx
import React from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface LocationInputProps {
  pickup: string;
  dropoff: string;
  handlePickupChange: (text: string) => void;
  handleDropoffChange: (text: string) => void;
  showDropoffSuggestions: boolean;
  setSelectingPickup: (value: boolean) => void;
  setSelectingDropoff: (value: boolean) => void;
  onSelectPickupOnMap: () => void;
  onSelectDropoffOnMap: () => void;
  selectingPickup: boolean;
  selectingDropoff: boolean;
}

const LocationInput: React.FC<LocationInputProps> = ({
  pickup,
  dropoff,
  handlePickupChange,
  handleDropoffChange,
  showDropoffSuggestions,
  setSelectingPickup,
  setSelectingDropoff,
  onSelectPickupOnMap,
  onSelectDropoffOnMap,
  selectingPickup,
  selectingDropoff,
}) => {
  return (
    <View style={styles.locationInputContainer}>
      <View style={[styles.locationInput, selectingPickup && styles.selectedPickupInput]}>
        <View style={styles.locationIcon}>
          <MaterialIcons name="my-location" size={20} color='#4caf50' />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Enter Pickup Location"
          value={pickup}
          onChangeText={handlePickupChange}
          placeholderTextColor='#A9A9A9'
          onFocus={() => {
            setSelectingPickup(false);
            setSelectingDropoff(false);
          }}
        />
        <TouchableOpacity
          style={[styles.selectMapButton, selectingPickup && styles.activeSelectButton]}
          onPress={onSelectPickupOnMap}
        >
          <Text style={styles.selectMapButtonText}>Select Map</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.locationInput, selectingDropoff && styles.selectedDropoffInput]}>
        <View style={styles.locationIcon}>
          <MaterialIcons name="location-on" size={20} color='#f75555' />
        </View>
        <TextInput
          style={styles.input}
          placeholder="Where to?"
          value={dropoff}
          onChangeText={handleDropoffChange}
          onFocus={() => {
            setSelectingPickup(false);
            setSelectingDropoff(false);
          }}
          placeholderTextColor='#A9A9A9'
        />
        <TouchableOpacity
          style={[styles.selectMapButton, selectingDropoff && styles.activeSelectButton]}
          onPress={onSelectDropoffOnMap}
        >
          <Text style={styles.selectMapButtonText}>Select Map</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  locationInputContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 20,
    elevation: 8,
    shadowColor: '#000000',
    shadowOpacity: 0.15,
    shadowRadius: 8,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D3D3D3',
    borderRadius: 10,
    height: 50,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  selectedPickupInput: {
    backgroundColor: '#E8F5E9',
    borderWidth: 2,
    borderColor: '#4caf50',
  },
  selectedDropoffInput: {
    backgroundColor: '#FFEBEE',
    borderWidth: 2,
    borderColor: '#f75555',
  },
  locationIcon: { width: 30, alignItems: 'center' },
  input: { flex: 1, height: 50, fontSize: 16, color: '#333333' },
  selectMapButton: {
    backgroundColor: '#4caf50',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  activeSelectButton: {
    backgroundColor: '#2E7D32',
  },
  selectMapButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default LocationInput;