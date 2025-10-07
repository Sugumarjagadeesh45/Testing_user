import React, { useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import CategoryItem from './CategoryItem';
import ProductCard from './ProductCard';
import SmallProductCard from './SmallProductCard';

interface ShoppingContentProps {
  categories: any[];
  products: any[];
  addToCart: (product: any) => void;
  getCategoryIcon: (category: string) => string;
}

const ShoppingContent: React.FC<ShoppingContentProps> = ({ 
  categories, 
  products, 
  addToCart, 
  getCategoryIcon 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');

  const filteredProducts = products.filter((p) =>
    p.name.toLowerCase().includes(searchText.toLowerCase())
  );

  const sections = categories.map((cat) => ({
    title: cat.name,
    data: products.filter((p) => p.category === cat.name),
  }));

  const renderSection = ({ item }: { item: { title: string; data: any[] } }) => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{item.title}</Text>
      <FlatList
        data={item.data}
        renderItem={({ item }) => (
          <SmallProductCard product={item} addToCart={addToCart} />
        )}
        keyExtractor={(item, index) => (item._id ? item._id.toString() : index.toString())}
        horizontal
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Category List */}
      <FlatList
        data={categories}
        renderItem={({ item }) => (
          <CategoryItem
            category={item}
            getCategoryIcon={getCategoryIcon}
            onPress={() => setSelectedCategory(item.name)}
            isSelected={selectedCategory === item.name}
          />
        )}
        keyExtractor={(item, index) => (item.id ? item.id.toString() : index.toString())}
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.categoryList}
      />

      {/* Main List */}
      <FlatList
        data={searchText ? [{ title: 'Search Results', data: filteredProducts }] : sections}
        renderItem={
          searchText
            ? ({ item }) => (
                <FlatList
                  data={item.data}
                  renderItem={({ item }) => (
                    <ProductCard product={item} addToCart={addToCart} />
                  )}
                  keyExtractor={(item, index) => (item._id ? item._id.toString() : index.toString())}
                />
              )
            : renderSection
        }
        keyExtractor={(item, index) =>
          item.title ? item.title.toString() : index.toString()
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  categoryList: { marginBottom: 10 },
  section: { marginBottom: 20 },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginLeft: 10,
    marginBottom: 10,
  },
});

export default ShoppingContent;