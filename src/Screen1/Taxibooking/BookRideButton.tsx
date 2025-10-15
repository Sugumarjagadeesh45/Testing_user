// ModeSelectionModal.tsx
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  Dimensions,
} from 'react-native';
import BikeIcon from '../../../assets001/bike.svg';
import LorryIcon from '../../../assets001/lorry.svg';
import TaxiIcon from '../../../assets001/taxi.svg';

interface ModeSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (type: string) => void;
  distance: string;
  travelTime: string;
}

const ModeSelectionModal: React.FC<ModeSelectionModalProps> = ({
  visible,
  onClose,
  onSelect,
  distance,
  travelTime,
}) => {
  const renderIcon = (type: string) => {
    switch (type) {
      case 'port': return <LorryIcon width={32} height={32} fill="#333" />;
      case 'taxi': return <TaxiIcon width={32} height={32} fill="#333" />;
      case 'bike': return <BikeIcon width={32} height={32} fill="#333" />;
      default: return <TaxiIcon width={32} height={32} fill="#333" />;
    }
  };

  const options = [
    { id: 'port', label: 'PORT', description: 'Max 5 ton' },
    { id: 'taxi', label: 'TAXI', description: '4 seats' },
    { id: 'bike', label: 'BIKE', description: '1 person' },
  ];

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <View style={styles.header}>
            <Text style={styles.distanceText}>DISTANCE: {distance}</Text>
            <Text style={styles.timeText}>TRAVEL TIME: {travelTime}</Text>
          </View>

          <View style={styles.optionsContainer}>
            {options.map((option) => (
              <TouchableOpacity
                key={option.id}
                style={styles.optionCard}
                onPress={() => onSelect(option.id)}
              >
                <View style={styles.iconContainer}>
                  {renderIcon(option.id)}
                </View>
                <Text style={styles.optionLabel}>{option.label}</Text>
                <Text style={styles.optionDesc}>{option.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    height: Dimensions.get('window').height * 0.4,
    width: '90%',
    alignSelf: 'center',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
  },
  distanceText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  timeText: {
    fontSize: 14,
    color: '#666',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  optionCard: {
    width: '30%',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    alignItems: 'center',
    elevation: 2,
  },
  iconContainer: {
    marginBottom: 10,
  },
  optionLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  optionDesc: {
    fontSize: 12,
    color: '#757575',
    textAlign: 'center',
  },
});

export default ModeSelectionModal;


// // D:\EazyGo\easyGofrontend-main\src\Screen1\Taxibooking\BookRideButton.tsx
// import React from 'react';
// import { TouchableOpacity, Text, StyleSheet } from 'react-native';

// const BookRideButton: React.FC = () => {
//   return (
//     <TouchableOpacity style={styles.bookRideButton}>
//       <Text style={styles.bookRideButtonText}>Book My Ride</Text>
//     </TouchableOpacity>
//   );
// };

// const styles = StyleSheet.create({
//   bookRideButton: {
//     backgroundColor: '#28a745',
//     width: '100%',
//     height: 50,
//     borderRadius: 10,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
//   bookRideButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
// });

// export default BookRideButton;