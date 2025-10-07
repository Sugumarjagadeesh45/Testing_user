import React, { useState, useEffect, useContext } from 'react';
import { View, Text, StyleSheet, FlatList, RefreshControl , TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import axios from 'axios';
import ProductCard from '../ProductCard';
import { CartContext } from '../ShoppingContent';

type Product = {
  _id: string;
  name: string;
  description: string;
  price: number;
  originalPrice: number;
  discount: number;
  category: string;
  images: string[];
  createdAt: string;
};

const BASE_URL = 'https://goodbackend.onrender.com';

const TopSale = () => {
  const navigation = useNavigation();
  const { addToCart } = useContext(CartContext);
  const [products, setProducts] = useState<Product[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTopSaleProducts();
  }, []);

  const fetchTopSaleProducts = async () => {
    try {
      setLoading(true);
      // In a real app, this would be a specific endpoint for top sale products
      const res = await axios.get(`${BASE_URL}/api/groceries`);
      const fetchedProducts = res.data.map((p: any) => ({
        ...p,
        createdAt: new Date(p.createdAt),
      }));
      
      // Filter for products with high discount (admin controlled)
      const topSaleProducts = fetchedProducts
        .filter((p: Product) => p.discount > 10)
        .sort((a: Product, b: Product) => b.discount - a.discount);
      
      setProducts(topSaleProducts);
    } catch (err) {
      console.error('Error fetching top sale products:', err);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTopSaleProducts();
    setRefreshing(false);
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Top Sale</Text>
          <View style={styles.placeholder} />
        </View>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading top deals...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Top Sale</Text>
        <View style={styles.placeholder} />
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No top deals available at the moment</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => <ProductCard product={item} addToCart={addToCart} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
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
  backButtonText: {
    fontSize: 16,
    color: '#4caf50',
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  placeholder: {
    width: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  productsList: {
    padding: 15,
  },
});

export default TopSale;