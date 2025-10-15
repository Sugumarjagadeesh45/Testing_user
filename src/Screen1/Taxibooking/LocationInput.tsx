// LocationInputSection.tsx
import React from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { SuggestionType } from './types';

interface LocationInputSectionProps {
  label: string;
  value: string;
  onChangeText: (text: string) => void;
  onMapPress: () => void;
  suggestions: SuggestionType[];
  showSuggestions: boolean;
  loading: boolean;
  onSelectSuggestion: (suggestion: SuggestionType) => void;
  error: string | null;
}

const LocationInputSection: React.FC<LocationInputSectionProps> = ({
  label,
  value,
  onChangeText,
  onMapPress,
  suggestions,
  showSuggestions,
  loading,
  onSelectSuggestion,
  error,
}) => {
  const icon = label === 'Pickup' ? 'my-location' : 'place';
  const iconColor = label === 'Pickup' ? '#4CAF50' : '#F44336';

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <View style={styles.inputWrapper}>
          <View style={styles.iconContainer}>
            <MaterialIcons name={icon as any} size={20} color={iconColor} />
          </View>
          <TextInput
            style={styles.input}
            placeholder={`Enter ${label.toLowerCase()} location`}
            value={value}
            onChangeText={onChangeText}
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity style={styles.mapButton} onPress={onMapPress}>
          <MaterialIcons name="crosshairs" size={20} color="#4CAF50" />
        </TouchableOpacity>
      </View>

      {showSuggestions && (
        <View style={styles.suggestionsContainer}>
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator size="small" color="#4CAF50" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : suggestions.length > 0 ? (
            suggestions.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={styles.suggestionItem}
                onPress={() => onSelectSuggestion(item)}
              >
                <MaterialIcons name="location-on" size={20} color="#A9A9A9" />
                <View style={styles.suggestionText}>
                  <Text style={styles.suggestionMain}>{item.name}</Text>
                  <Text style={styles.suggestionSub}>{item.address}</Text>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noSuggestions}>No suggestions</Text>
          )}
        </View>
      )}

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { marginHorizontal: 20, marginBottom: 15 },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 5,
    elevation: 2,
  },
  inputWrapper: { flex: 1, flexDirection: 'row', alignItems: 'center', padding: 10 },
  iconContainer: { marginRight: 10 },
  input: { flex: 1, fontSize: 16, color: '#333' },
  mapButton: { padding: 10 },
  suggestionsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    marginTop: 5,
    maxHeight: 150,
    elevation: 2,
  },
  loadingRow: { padding: 10, flexDirection: 'row', alignItems: 'center' },
  loadingText: { marginLeft: 10, color: '#757575' },
  suggestionItem: {
    flexDirection: 'row',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
  },
  suggestionText: { flex: 1, marginLeft: 10 },
  suggestionMain: { fontSize: 16, fontWeight: '500' },
  suggestionSub: { fontSize: 12, color: '#757575', marginTop: 2 },
  noSuggestions: { padding: 12, textAlign: 'center', color: '#999' },
  errorText: { color: '#F44336', marginTop: 5, textAlign: 'center' },
});

export default LocationInputSection;


// // D:\EazyGo\easyGofrontend-main\src\Screen1\Taxibooking\LocationInput.tsx
// import React from 'react';
// import { View, TextInput, StyleSheet, TouchableOpacity, Text } from 'react-native';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// interface LocationInputProps {
//   pickup: string;
//   dropoff: string;
//   handlePickupChange: (text: string) => void;
//   handleDropoffChange: (text: string) => void;
//   showDropoffSuggestions: boolean;
//   setSelectingPickup: (value: boolean) => void;
//   setSelectingDropoff: (value: boolean) => void;
//   onSelectPickupOnMap: () => void;
//   onSelectDropoffOnMap: () => void;
//   selectingPickup: boolean;
//   selectingDropoff: boolean;
// }

// const LocationInput: React.FC<LocationInputProps> = ({
//   pickup,
//   dropoff,
//   handlePickupChange,
//   handleDropoffChange,
//   showDropoffSuggestions,
//   setSelectingPickup,
//   setSelectingDropoff,
//   onSelectPickupOnMap,
//   onSelectDropoffOnMap,
//   selectingPickup,
//   selectingDropoff,
// }) => {
//   return (
//     <View style={styles.locationInputContainer}>
//       <View style={[styles.locationInput, selectingPickup && styles.selectedPickupInput]}>
//         <View style={styles.locationIcon}>
//           <MaterialIcons name="my-location" size={20} color='#4caf50' />
//         </View>
//         <TextInput
//           style={styles.input}
//           placeholder="Enter Pickup Location"
//           value={pickup}
//           onChangeText={handlePickupChange}
//           placeholderTextColor='#A9A9A9'
//           onFocus={() => {
//             setSelectingPickup(false);
//             setSelectingDropoff(false);
//           }}
//         />
//         <TouchableOpacity
//           style={[styles.selectMapButton, selectingPickup && styles.activeSelectButton]}
//           onPress={onSelectPickupOnMap}
//         >
//           <Text style={styles.selectMapButtonText}>Select Map</Text>
//         </TouchableOpacity>
//       </View>
//       <View style={[styles.locationInput, selectingDropoff && styles.selectedDropoffInput]}>
//         <View style={styles.locationIcon}>
//           <MaterialIcons name="location-on" size={20} color='#f75555' />
//         </View>
//         <TextInput
//           style={styles.input}
//           placeholder="Where to?"
//           value={dropoff}
//           onChangeText={handleDropoffChange}
//           onFocus={() => {
//             setSelectingPickup(false);
//             setSelectingDropoff(false);
//           }}
//           placeholderTextColor='#A9A9A9'
//         />
//         <TouchableOpacity
//           style={[styles.selectMapButton, selectingDropoff && styles.activeSelectButton]}
//           onPress={onSelectDropoffOnMap}
//         >
//           <Text style={styles.selectMapButtonText}>Select Map</Text>
//         </TouchableOpacity>
//       </View>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   locationInputContainer: {
//     width: '100%',
//     backgroundColor: '#FFFFFF',
//     borderRadius: 15,
//     padding: 15,
//     marginBottom: 20,
//     elevation: 8,
//     shadowColor: '#000000',
//     shadowOpacity: 0.15,
//     shadowRadius: 8,
//   },
//   locationInput: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     backgroundColor: '#D3D3D3',
//     borderRadius: 10,
//     height: 50,
//     marginBottom: 15,
//     paddingHorizontal: 15,
//   },
//   selectedPickupInput: {
//     backgroundColor: '#E8F5E9',
//     borderWidth: 2,
//     borderColor: '#4caf50',
//   },
//   selectedDropoffInput: {
//     backgroundColor: '#FFEBEE',
//     borderWidth: 2,
//     borderColor: '#f75555',
//   },
//   locationIcon: { width: 30, alignItems: 'center' },
//   input: { flex: 1, height: 50, fontSize: 16, color: '#333333' },
//   selectMapButton: {
//     backgroundColor: '#4caf50',
//     borderRadius: 5,
//     paddingVertical: 8,
//     paddingHorizontal: 10,
//   },
//   activeSelectButton: {
//     backgroundColor: '#2E7D32',
//   },
//   selectMapButtonText: {
//     color: '#FFFFFF',
//     fontSize: 12,
//     fontWeight: '600',
//   },
// });

// export default LocationInput;