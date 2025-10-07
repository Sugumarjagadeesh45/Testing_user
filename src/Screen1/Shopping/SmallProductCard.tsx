import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';

interface SmallProductCardProps {
  product: {
    _id: string;
    name: string;
    price: number;
    originalPrice: number;
    discount: number;
    images: string[];
  };
  addToCart: (product: any) => void;
}

const BASE_URL =  "http://localhost:5001";

const SmallProductCard: React.FC<SmallProductCardProps> = ({ product, addToCart }) => {
  const navigation = useNavigation();

  const handleBuy = () => {
    navigation.navigate('Buying', { product });
  };

  const handleAddToCart = () => {
    addToCart(product);
    Alert.alert('Success', `${product.name} added to cart`);
  };

  // Safely get the image URL
  const imageUrl = product.images && product.images.length > 0 
    ? `${BASE_URL}${product.images[0]}` 
    : 'https://via.placeholder.com/140x120';

  return (
    <View style={styles.card}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.image}
        />
        {product.discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{product.discount}% OFF</Text>
          </View>
        )}
      </View>
      <Text style={styles.name} numberOfLines={2}>
        {product.name}
      </Text>
      <View style={styles.priceContainer}>
        <Text style={styles.price}>${product.price.toFixed(2)}</Text>
        {product.originalPrice > product.price && (
          <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
        )}
      </View>
      <View style={styles.buttonsContainer}>
        <TouchableOpacity
          style={[styles.smallButton, styles.buyButton]}
          onPress={handleBuy}
        >
          <Text style={styles.smallButtonText}>Buy</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.smallButton, styles.cartButton]}
          onPress={handleAddToCart}
        >
          <Text style={styles.smallButtonText}>Cart</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    width: 160,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  imageContainer: { position: 'relative', marginBottom: 8 },
  image: { width: 136, height: 120, borderRadius: 8, alignSelf: 'center' },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#e53935',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: { color: '#fff', fontSize: 10, fontWeight: 'bold' },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginTop: 5,
    textAlign: 'center',
    height: 40,
  },
  priceContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 5,
  },
  price: { fontSize: 16, fontWeight: '700', color: '#4caf50', marginRight: 5 },
  originalPrice: { fontSize: 12, color: '#999', textDecorationLine: 'line-through' },
  buttonsContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  smallButton: {
    borderRadius: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  buyButton: { backgroundColor: '#4caf50' },
  cartButton: { backgroundColor: '#2196f3' },
  smallButtonText: { color: '#fff', fontSize: 12, fontWeight: '600', textAlign: 'center' },
});

export default SmallProductCard;