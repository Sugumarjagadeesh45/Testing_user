import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import ProductCard from './ProductCard';

const ViewAll = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { title, products, addToCart } = route.params as any;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{title}</Text>
        <View style={styles.placeholder} />
      </View>

      {products.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No products available in this category</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          renderItem={({ item }) => <ProductCard product={item} addToCart={addToCart} />}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.productsList}
          showsVerticalScrollIndicator={false}
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

export default ViewAll;