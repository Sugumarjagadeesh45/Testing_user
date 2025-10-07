import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import Feather from 'react-native-vector-icons/Feather';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { useNavigation } from '@react-navigation/native';

interface ProfileSectionProps {
  name: string;
  phoneNumber: string;
  customerId: string;
  profilePicture?: string;
}

const ProfileSection: React.FC<ProfileSectionProps> = ({
  name,
  phoneNumber,
  customerId,
  profilePicture,
}) => {
  const navigation = useNavigation();

  const handlePress = () => {
    console.log('ProfileSection - Profile picture:', profilePicture ? 'Provided' : 'No profile picture provided');
    console.log('📋 Navigating with customerId:', customerId);

    navigation.navigate('ProfileScreen', {
      name,
      phoneNumber,
      customerId,
      profilePicture,
    });
  };

  return (
    <TouchableOpacity style={styles.profileSection} onPress={handlePress} activeOpacity={0.7}>
      <View style={styles.profileIcon}>
        {profilePicture ? (
          <Image
            source={{ uri: profilePicture }}
            style={styles.profileImage}
            onError={(e) => console.error('Image load error:', e.nativeEvent.error, 'URL:', profilePicture)}
            onLoad={() => console.log('Image loaded successfully:', profilePicture)}
          />
        ) : (
          <FontAwesome name="user" size={24} color="#28a745" />
        )}
      </View>
      <View style={styles.profileInfo}>
        <Text style={styles.profileName}>{name || 'John Doe'}</Text>
        <Text style={styles.profilePhone}>{phoneNumber || '+1 234 567 890'}</Text>
      </View>
      <Feather name="chevron-right" size={20} color="#A9A9A9" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    padding: 10,
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  profileIcon: {
    backgroundColor: '#D3D3D3',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    overflow: 'hidden',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: 25,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  profilePhone: {
    fontSize: 14,
    color: '#A9A9A9',
    lineHeight: 20,
  },
});

export default ProfileSection;