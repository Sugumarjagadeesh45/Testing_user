import React, { useState } from 'react';
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, Alert } from 'react-native';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

const BASE_URL = 'https://goodbackend.onrender.com';

// Mock order data
const mockOrders = [
  {
    id: 'ORD001',
    date: '2023-06-15',
    status: 'Delivered',
    items: [
      {
        _id: '1',
        name: 'Wireless Headphones',
        price: 99.99,
        quantity: 1,
        images: ['/images/headphones.jpg'],
      },
      {
        _id: '2',
        name: 'Phone Case',
        price: 15.99,
        quantity: 2,
        images: ['/images/phonecase.jpg'],
      }
    ],
    total: 131.97,
    shipping: 5.99,
    tax: 10.56,
  },
  {
    id: 'ORD002',
    date: '2023-06-10',
    status: 'Processing',
    items: [
      {
        _id: '3',
        name: 'Bluetooth Speaker',
        price: 49.99,
        quantity: 1,
        images: ['/images/speaker.jpg'],
      }
    ],
    total: 59.98,
    shipping: 5.99,
    tax: 4.80,
  },
  {
    id: 'ORD003',
    date: '2023-06-05',
    status: 'Cancelled',
    items: [
      {
        _id: '4',
        name: 'Smart Watch',
        price: 199.99,
        quantity: 1,
        images: ['/images/smartwatch.jpg'],
      }
    ],
    total: 221.98,
    shipping: 5.99,
    tax: 17.60,
  },
];

const Order = () => {
  const navigation = useNavigation();
  const [orders, setOrders] = useState(mockOrders);

  const handleTrackOrder = (orderId: string) => {
    Alert.alert('Track Order', `Tracking order ${orderId}. This feature will be available soon.`);
  };

  const handleReorder = (items: any[]) => {
    Alert.alert('Reorder', 'Items have been added to your cart.');
    navigation.navigate('Cart');
  };

  const renderOrderItem = ({ item }: any) => (
    <View style={styles.orderCard}>
      <View style={styles.orderHeader}>
        <View>
          <Text style={styles.orderId}>Order #{item.id}</Text>
          <Text style={styles.orderDate}>{item.date}</Text>
        </View>
        <View style={[
          styles.statusBadge, 
          item.status === 'Delivered' && styles.deliveredBadge,
          item.status === 'Processing' && styles.processingBadge,
          item.status === 'Cancelled' && styles.cancelledBadge,
        ]}>
          <Text style={[
            styles.statusText,
            item.status === 'Delivered' && styles.deliveredText,
            item.status === 'Processing' && styles.processingText,
            item.status === 'Cancelled' && styles.cancelledText,
          ]}>
            {item.status}
          </Text>
        </View>
      </View>

      <FlatList
        data={item.items}
        horizontal
        showsHorizontalScrollIndicator={false}
        renderItem={({ item }) => (
          <View style={styles.orderItem}>
            <Image
              source={{ uri: item.images[0] ? `${BASE_URL}${item.images[0]}` : 'https://via.placeholder.com/80' }}
              style={styles.itemImage}
            />
            <View style={styles.itemInfo}>
              <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
              <Text style={styles.itemDetails}>${item.price.toFixed(2)} × {item.quantity}</Text>
            </View>
          </View>
        )}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.itemsList}
      />

      <View style={styles.orderFooter}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>${item.total.toFixed(2)}</Text>
        </View>
        <View style={styles.buttonsContainer}>
          <TouchableOpacity 
            style={[styles.orderButton, styles.trackButton]} 
            onPress={() => handleTrackOrder(item.id)}
          >
            <Text style={styles.trackButtonText}>Track</Text>
          </TouchableOpacity>
          {item.status !== 'Cancelled' && (
            <TouchableOpacity 
              style={[styles.orderButton, styles.reorderButton]} 
              onPress={() => handleReorder(item.items)}
            >
              <Text style={styles.reorderButtonText}>Reorder</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Orders</Text>
        <View style={styles.placeholder} />
      </View>

      {orders.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="receipt" size={80} color="#ddd" />
          <Text style={styles.emptyText}>You have no orders yet</Text>
          <TouchableOpacity 
            style={styles.shopButton} 
            onPress={() => navigation.navigate('Shopping')}
          >
            <Text style={styles.shopButtonText}>Start Shopping</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.ordersList}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9f9f9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    backgroundColor: '#fff',
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
  ordersList: {
    padding: 15,
  },
  orderCard: {
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
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  orderId: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  orderDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  deliveredBadge: {
    backgroundColor: '#e8f5e9',
  },
  processingBadge: {
    backgroundColor: '#e3f2fd',
  },
  cancelledBadge: {
    backgroundColor: '#ffebee',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  deliveredText: {
    color: '#4caf50',
  },
  processingText: {
    color: '#2196f3',
  },
  cancelledText: {
    color: '#e53935',
  },
  itemsList: {
    paddingBottom: 10,
  },
  orderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 15,
    width: 140,
  },
  itemImage: {
    width: 50,
    height: 50,
    borderRadius: 6,
    marginRight: 10,
  },
  itemInfo: {
    flex: 1,
  },
  itemName: {
    fontSize: 12,
    fontWeight: '500',
    color: '#333',
  },
  itemDetails: {
    fontSize: 11,
    color: '#666',
    marginTop: 2,
  },
  orderFooter: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  totalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  totalLabel: {
    fontSize: 14,
    color: '#666',
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  buttonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  orderButton: {
    borderRadius: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    flex: 1,
    marginHorizontal: 5,
  },
  trackButton: {
    backgroundColor: '#f5f5f5',
  },
  trackButtonText: {
    color: '#333',
    fontWeight: '500',
    textAlign: 'center',
  },
  reorderButton: {
    backgroundColor: '#4caf50',
  },
  reorderButtonText: {
    color: '#fff',
    fontWeight: '500',
    textAlign: 'center',
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
});

export default Order;