import React, { useState, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { CartContext } from '../ShoppingContent';

const BASE_URL = 'https://goodbackend.onrender.com';

const Cart = () => {
  const navigation = useNavigation();
  const { cartItems, removeFromCart, clearCart } = useContext(CartContext);
  const [loading, setLoading] = useState(false);

  const handleRemoveItem = (productId: string) => {
    Alert.alert(
      'Remove Item',
      'Are you sure you want to remove this item from your cart?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', onPress: () => removeFromCart(productId) },
      ]
    );
  };

  const handleCheckout = () => {
    if (cartItems.length === 0) {
      Alert.alert('Empty Cart', 'Your cart is empty. Add some products to checkout.');
      return;
    }
    
    setLoading(true);
    // Simulate checkout process
    setTimeout(() => {
      setLoading(false);
      Alert.alert(
        'Order Confirmed',
        'Your order has been placed successfully!',
        [
          { text: 'OK', onPress: () => {
            clearCart();
            navigation.navigate('Order');
          }}
        ]
      );
    }, 1500);
  };

  const calculateTotal = () => {
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const calculateTotalItems = () => {
    return cartItems.reduce((total, item) => total + item.quantity, 0);
  };

  const renderCartItem = ({ item }: any) => (
    <View style={styles.cartItem}>
      <Image
        source={{ uri: item.images[0] ? `${BASE_URL}${item.images[0]}` : 'https://via.placeholder.com/100' }}
        style={styles.itemImage}
      />
      <View style={styles.itemInfo}>
        <Text style={styles.itemName}>{item.name}</Text>
        <Text style={styles.itemPrice}>${item.price.toFixed(2)} × {item.quantity}</Text>
        <Text style={styles.itemTotal}>${(item.price * item.quantity).toFixed(2)}</Text>
      </View>
      <TouchableOpacity 
        style={styles.removeButton} 
        onPress={() => handleRemoveItem(item._id)}
      >
        <MaterialIcons name="delete" size={20} color="#e53935" />
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Cart</Text>
        {cartItems.length > 0 && (
          <TouchableOpacity onPress={clearCart} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {cartItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="shopping-cart" size={80} color="#ddd" />
          <Text style={styles.emptyText}>Your cart is empty</Text>
          <TouchableOpacity 
            style={styles.shopButton} 
            onPress={() => navigation.navigate('Shopping')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <FlatList
            data={cartItems}
            renderItem={renderCartItem}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.cartList}
            showsVerticalScrollIndicator={false}
          />

          <View style={styles.summaryContainer}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Items ({calculateTotalItems()})</Text>
              <Text style={styles.summaryValue}>${calculateTotal().toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Shipping</Text>
              <Text style={styles.summaryValue}>$5.99</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Tax</Text>
              <Text style={styles.summaryValue}>${(calculateTotal() * 0.08).toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Total</Text>
              <Text style={styles.totalValue}>
                ${(calculateTotal() + 5.99 + (calculateTotal() * 0.08)).toFixed(2)}
              </Text>
            </View>

            <TouchableOpacity 
              style={[styles.checkoutButton, loading && styles.disabledButton]} 
              onPress={handleCheckout}
              disabled={loading}
            >
              {loading ? (
                <Text style={styles.checkoutButtonText}>Processing...</Text>
              ) : (
                <Text style={styles.checkoutButtonText}>Checkout</Text>
              )}
            </TouchableOpacity>
          </View>
        </>
      )}
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
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 14,
    color: '#e53935',
    fontWeight: '500',
  },
  cartList: {
    padding: 15,
    paddingBottom: 200,
  },
  cartItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 15,
  },
  itemInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 5,
  },
  itemPrice: {
    fontSize: 14,
    color: '#666',
    marginBottom: 5,
  },
  itemTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4caf50',
  },
  removeButton: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 20,
    marginBottom: 30,
  },
  shopButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 30,
  },
  shopButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  summaryContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    padding: 20,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: -2 },
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#666',
  },
  summaryValue: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 10,
    marginTop: 5,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4caf50',
  },
  checkoutButton: {
    backgroundColor: '#4caf50',
    borderRadius: 8,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 15,
  },
  disabledButton: {
    backgroundColor: '#cccccc',
  },
  checkoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default Cart;