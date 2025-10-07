import { View, Text, StyleSheet, Image, TouchableOpacity, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

interface ProductCardProps {
  product: {
    _id: string;
    name: string;
    description: string;
    price: number;
    originalPrice: number;
    discount: number;
    images: string[];
  };
  addToCart: (product: any) => void;
}

const BASE_URL =  "http://localhost:5001";

const ProductCard: React.FC<ProductCardProps> = ({ product, addToCart }) => {
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
    : 'https://via.placeholder.com/100';

  return (
    <View style={styles.productCard}>
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.productImage}
          onError={() => console.log('Image load error')}
        />
        {product.discount > 0 && (
          <View style={styles.discountBadge}>
            <Text style={styles.discountBadgeText}>{product.discount}% OFF</Text>
          </View>
        )}
      </View>
      <View style={styles.productInfo}>
        <Text style={styles.productName}>{product.name}</Text>
        <Text style={styles.productDescription} numberOfLines={2}>{product.description}</Text>
        <View style={styles.priceContainer}>
          <Text style={styles.productPrice}>${product.price.toFixed(2)}</Text>
          {product.originalPrice > product.price && (
            <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
          )}
          {product.discount > 0 && (
            <View style={styles.discountTag}>
              <Text style={styles.discount}>{product.discount}% off</Text>
            </View>
          )}
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity style={[styles.button, styles.buyButton]} onPress={handleBuy}>
            <Text style={styles.buttonText}>Buy Now</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.cartButton]} onPress={handleAddToCart}>
            <Text style={styles.buttonText}>Add to Cart</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  productCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    padding: 15,
    marginBottom: 15,
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 },
  },
  imageContainer: {
    position: 'relative',
  },
  productImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
  },
  discountBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#e53935',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: 'bold',
  },
  productInfo: { flex: 1 },
  productName: { 
    fontSize: 16, 
    fontWeight: '600', 
    color: '#333',
    marginBottom: 4,
  },
  productDescription: { 
    fontSize: 14, 
    color: '#666', 
    lineHeight: 20,
    marginBottom: 8,
  },
  priceContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 12 
  },
  productPrice: { 
    fontSize: 18, 
    fontWeight: '700', 
    color: '#4caf50', 
    marginRight: 10 
  },
  originalPrice: { 
    fontSize: 14, 
    color: '#999', 
    textDecorationLine: 'line-through', 
    marginRight: 10 
  },
  discountTag: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discount: { 
    fontSize: 12, 
    color: '#e53935', 
    fontWeight: '600' 
  },
  buttonsContainer: { 
    flexDirection: 'row', 
  },
  button: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginRight: 10,
  },
  buyButton: {
    backgroundColor: '#4caf50',
  },
  cartButton: {
    backgroundColor: '#2196f3',
  },
  buttonText: { 
    color: '#fff', 
    fontWeight: '600',
    fontSize: 14,
  },
});

export default ProductCard;