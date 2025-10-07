import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import Feather from 'react-native-vector-icons/Feather';

interface MenuItemProps {
  icon: string;
  text: string;
  onPress?: () => void;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, text, onPress }) => {
  return (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <View style={styles.menuIcon}>
        <MaterialIcons name={icon} size={20} color="#28a745" />
      </View>
      <Text style={styles.menuText}>{text}</Text>
      <Feather name="chevron-right" size={20} color="#A9A9A9" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  menuItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 15 },
  menuIcon: { width: 30, alignItems: 'center', marginRight: 15 },
  menuText: { flex: 1, fontSize: 16, fontWeight: '500', color: '#000000' },
});

export default MenuItem;