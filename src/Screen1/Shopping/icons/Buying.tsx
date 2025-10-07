import React, { useState, useContext, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, Dimensions, FlatList } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { CartContext } from '../ShoppingContent';

const BASE_URL = 'https://goodbackend.onrender.com';
const { width } = Dimensions.get('window');

const Buying = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { product } = route.params as any;
  const { addToCart } = useContext(CartContext);
  const [quantity, setQuantity] = useState(1);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addToCart(product);
    }
    Alert.alert('Success', `${product.name} (${quantity}) added to cart`);
    navigation.navigate('Cart');
  };

  const handleBuyNow = () => {
    // Implement buy now functionality
    Alert.alert('Order Placed', `Your order for ${product.name} (${quantity}) has been placed successfully!`);
    navigation.navigate('Order');
  };

  const increaseQuantity = () => {
    setQuantity(prev => prev + 1);
  };

  const decreaseQuantity = () => {
    if (quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: any) => {
    if (viewableItems.length > 0) {
      setCurrentImageIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50
  }).current;

  const renderImageItem = ({ item }: { item: string }) => (
    <View style={styles.imageContainer}>
      <Image
        source={{ uri: item ? `${BASE_URL}${item}` : 'https://via.placeholder.com/300' }}
        style={styles.productImage}
        resizeMode="contain"
      />
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Product Details</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Image Slider */}
        <View style={styles.imageSliderContainer}>
          <FlatList
            ref={flatListRef}
            data={product.images || []}
            renderItem={renderImageItem}
            keyExtractor={(item, index) => index.toString()}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={viewabilityConfig}
          />
          
          {/* Image Indicator */}
          {product.images && product.images.length > 1 && (
            <View style={styles.imageIndicator}>
              {product.images.map((_: any, index: number) => (
                <View
                  key={index}
                  style={[
                    styles.indicatorDot,
                    index === currentImageIndex ? styles.activeDot : styles.inactiveDot
                  ]}
                />
              ))}
            </View>
          )}
        </View>
        
        <View style={styles.productInfo}>
          <Text style={styles.productName}>{product.name}</Text>
          <Text style={styles.productDescription}>{product.description}</Text>
          
          <View style={styles.priceContainer}>
            <Text style={styles.price}>${product.price.toFixed(2)}</Text>
            {product.originalPrice > product.price && (
              <Text style={styles.originalPrice}>${product.originalPrice.toFixed(2)}</Text>
            )}
            {product.discount > 0 && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>{product.discount}% OFF</Text>
              </View>
            )}
          </View>

          <View style={styles.quantityContainer}>
            <Text style={styles.quantityLabel}>Quantity</Text>
            <View style={styles.quantityControls}>
              <TouchableOpacity style={styles.quantityButton} onPress={decreaseQuantity}>
                <MaterialIcons name="remove" size={20} color="#333" />
              </TouchableOpacity>
              <Text style={styles.quantity}>{quantity}</Text>
              <TouchableOpacity style={styles.quantityButton} onPress={increaseQuantity}>
                <MaterialIcons name="add" size={20} color="#333" />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.totalContainer}>
            <Text style={styles.totalLabel}>Total</Text>
            <Text style={styles.totalPrice}>${(product.price * quantity).toFixed(2)}</Text>
          </View>

          <View style={styles.buttonsContainer}>
            <TouchableOpacity style={styles.cartButton} onPress={handleAddToCart}>
              <Text style={styles.buttonText}>Add to Cart</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.buyButton} onPress={handleBuyNow}>
              <Text style={styles.buttonText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    padding: 5,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 34,
  },
  content: {
    flex: 1,
  },
  imageSliderContainer: {
    height: 300,
    position: 'relative',
  },
  imageContainer: {
    width: width,
    height: 300,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imageIndicator: {
    position: 'absolute',
    bottom: 10,
    flexDirection: 'row',
    alignSelf: 'center',
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    backgroundColor: '#4caf50',
    width: 12,
  },
  inactiveDot: {
    backgroundColor: '#ccc',
  },
  productInfo: {
    padding: 20,
  },
  productName: {
    fontSize: 22,
    fontWeight: '700',
    color: '#333',
    marginBottom: 10,
  },
  productDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 20,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  price: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4caf50',
    marginRight: 10,
  },
  originalPrice: {
    fontSize: 18,
    color: '#999',
    textDecorationLine: 'line-through',
    marginRight: 10,
  },
  discountBadge: {
    backgroundColor: '#ffebee',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 14,
    color: '#e53935',
    fontWeight: '600',
  },
  quantityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingVertical: 15,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#eee',
  },
  quantityLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quantityButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantity: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginHorizontal: 20,
  },
  totalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  totalLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  totalPrice: {
    fontSize: 22,
    fontWeight: '700',
    color: '#4caf50',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cartButton: {
    flex: 1,
    backgroundColor: '#2196f3',
    borderRadius: 8,
    paddingVertical: 15,
    marginRight: 10,
    alignItems: 'center',
  },
  buyButton: {
    flex: 1,
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 15,
    marginLeft: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Buying;