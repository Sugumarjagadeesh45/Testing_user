import React from 'react';
import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

interface CategoryItemProps {
  category: { id: string; name: string };
  getCategoryIcon: (categoryName: string) => string;
  onPress: () => void;
  isSelected?: boolean;
}

const CategoryItem: React.FC<CategoryItemProps> = ({ category, getCategoryIcon, onPress, isSelected }) => {
  return (
    <TouchableOpacity 
      style={[styles.categoryItem, isSelected && styles.selected]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.categoryIcon, isSelected && styles.selectedIcon]}>
        <MaterialIcons 
          name={getCategoryIcon(category.name)} 
          size={24} 
          color={isSelected ? '#fff' : '#4caf50'} 
        />
      </View>
      <Text style={[styles.categoryText, isSelected && styles.selectedText]}>
        {category.name}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  categoryItem: {
    alignItems: 'center',
    marginRight: 15,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    minWidth: 80,
  },
  selected: {
    backgroundColor: '#4caf50',
    shadowColor: '#4caf50',
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  categoryIcon: {
    backgroundColor: '#fff',
    borderRadius: 25,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  selectedIcon: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: 'transparent',
    elevation: 0,
  },
  categoryText: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  selectedText: { 
    color: '#fff',
    fontWeight: '600',
  },
});

export default CategoryItem;