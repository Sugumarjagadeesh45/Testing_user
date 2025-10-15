// RideDetailsModal.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';

interface RideDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  onContinue: () => void;
  rideType: string | null;
  pickup: string;
  dropoff: string;
  distance: string;
  price: number | null;
}

const RideDetailsModal: React.FC<RideDetailsModalProps> = ({
  visible,
  onClose,
  onContinue,
  rideType,
  pickup,
  dropoff,
  distance,
  price,
}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>RIDE DETAILS</Text>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Pickup:</Text>
            <Text style={styles.value} numberOfLines={1}>{pickup || 'Not selected'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Drop-off:</Text>
            <Text style={styles.value} numberOfLines={1}>{dropoff || 'Not selected'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Distance:</Text>
            <Text style={styles.value}>{distance || '---'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>PRICE:</Text>
            <Text style={styles.priceValue}>₹{price !== null ? price : '---'}</Text>
          </View>

          <TouchableOpacity style={styles.continueButton} onPress={onContinue}>
            <Text style={styles.continueText}>CONTINUE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: '90%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    elevation: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  label: {
    flex: 1,
    fontSize: 14,
    color: '#757575',
  },
  value: {
    flex: 2,
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'right',
  },
  priceValue: {
    flex: 2,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#4CAF50',
    textAlign: 'right',
  },
  continueButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  continueText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default RideDetailsModal;



// // D:\EazyGo\easyGofrontend-main\src\Screen1\Taxibooking\RideTypeSelector.tsx
// import React from 'react';
// import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
// import FontAwesome from 'react-native-vector-icons/FontAwesome';
// import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// interface RideTypeSelectorProps {
//   selectedRideType: string;
//   setSelectedRideType: (type: string) => void;
// }

// const RideTypeSelector: React.FC<RideTypeSelectorProps> = ({ selectedRideType, setSelectedRideType }) => {
//   return (
//     <View style={styles.rideTypeContainer}>
//       <TouchableOpacity
//         style={[styles.rideTypeButton, selectedRideType === 'bike' && styles.selectedRideType]}
//         onPress={() => setSelectedRideType('bike')}
//       >
//         <MaterialIcons
//           name="two-wheeler"
//           size={24}
//           color={selectedRideType === 'bike' ? '#FFFFFF' : '#4caf50'}
//         />
//         <Text style={[styles.rideTypeText, selectedRideType === 'bike' && styles.selectedRideTypeText]}>
//           Bike
//         </Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={[styles.rideTypeButton, selectedRideType === 'taxi' && styles.selectedRideType]}
//         onPress={() => setSelectedRideType('taxi')}
//       >
//         <FontAwesome
//           name="taxi"
//           size={24}
//           color={selectedRideType === 'taxi' ? '#FFFFFF' : '#4caf50'}
//         />
//         <Text style={[styles.rideTypeText, selectedRideType === 'taxi' && styles.selectedRideTypeText]}>
//           Taxi
//         </Text>
//       </TouchableOpacity>

//       <TouchableOpacity
//         style={[styles.rideTypeButton, selectedRideType === 'port' && styles.selectedRideType]}
//         onPress={() => setSelectedRideType('port')}
//       >
//         <MaterialIcons
//           name="local-shipping"
//           size={24}
//           color={selectedRideType === 'port' ? '#FFFFFF' : '#4caf50'}
//         />
//         <Text style={[styles.rideTypeText, selectedRideType === 'port' && styles.selectedRideTypeText]}>
//           Port
//         </Text>
//       </TouchableOpacity>
//     </View>
//   );
// };

// const styles = StyleSheet.create({
//   rideTypeContainer: {
//     flexDirection: 'row',
//     justifyContent: 'space-around',
//     width: '100%',
//     marginBottom: 20,
//     padding: 15,
//     backgroundColor: '#D3D3D3',
//     borderRadius: 15,
//   },
//   rideTypeButton: {
//     flex: 1,
//     alignItems: 'center',
//     paddingVertical: 10,
//     marginHorizontal: 5,
//     borderRadius: 10,
//   },
//   selectedRideType: {
//     backgroundColor: '#4caf50',
//   },
//   rideTypeText: {
//     marginTop: 5,
//     fontSize: 14,
//     color: '#4caf50',
//     fontWeight: '600',
//   },
//   selectedRideTypeText: {
//     color: '#FFFFFF',
//   },
// });

// export default RideTypeSelector;