import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import ProductCard from '../components/ProductCard';
import StepIndicator from '../components/StepIndicator';
import { useCart } from '../context/CartContext';
import { fetchProducts } from '../data/mockData';
import { colors, rs } from '../theme';

const PAGE_SIZE = 6; // se renderizan/piden 6 productos por bloque

export default function CatalogScreen() {
  const { items, addItem } = useCart();
  const [products, setProducts] = useState([]);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState('');
  const loadingRef = useRef(false); // evita peticiones duplicadas mientras se hace scroll
  const toastTimer = useRef(null);

  // Lazy loading: cada bloque se pide solo cuando el usuario se acerca al final
  const loadMore = useCallback(async () => {
    if (loadingRef.current || !hasMore) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetchProducts({ page, limit: PAGE_SIZE });
      setProducts((prev) => [...prev, ...res.items]);
      setPage((p) => p + 1);
      setHasMore(res.hasMore);
    } catch (e) {
      console.warn('Error al cargar productos', e);
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [page, hasMore]);

  useEffect(() => {
    loadMore();
    return () => clearTimeout(toastTimer.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const qtyById = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i.quantity])), [items]);

  const showToast = useCallback((message) => {
    setToast(message);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 1600);
  }, []);

  const handleAdd = useCallback(
    (product) => {
      const result = addItem(product);
      if (result.ok) showToast(`${product.name} agregado al carrito`);
      else if (result.reason === 'sin_stock') showToast('Producto agotado');
      else showToast('Ya tienes todo el stock disponible en tu carrito');
    },
    [addItem, showToast]
  );

  const renderItem = useCallback(
    ({ item }) => <ProductCard product={item} inCartQty={qtyById[item.id] || 0} onAdd={handleAdd} />,
    [qtyById, handleAdd]
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={products}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        extraData={qtyById}
        numColumns={2}
        columnWrapperStyle={styles.row}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        // Lazy loading y protección de memoria
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        initialNumToRender={PAGE_SIZE}
        maxToRenderPerBatch={4}
        windowSize={5}
        removeClippedSubviews
        ListHeaderComponent={
          <View>
            <StepIndicator current={1} />
            <Text style={styles.title}>Indumentaria oficial</Text>
          </View>
        }
        ListFooterComponent={
          loading ? (
            <ActivityIndicator style={styles.loader} color={colors.primary} />
          ) : !hasMore && products.length > 0 ? (
            <Text style={styles.end}>Viste todos los productos</Text>
          ) : null
        }
      />

      {!!toast && (
        <View style={styles.toast} pointerEvents="none" accessibilityLiveRegion="polite">
          <Text style={styles.toastText}>{toast}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: '4%', paddingBottom: rs(24) },
  row: { justifyContent: 'space-between' },
  title: { fontSize: rs(22), fontWeight: '800', color: colors.text, marginBottom: rs(12) },
  loader: { paddingVertical: rs(20) },
  end: { textAlign: 'center', color: colors.muted, fontSize: rs(13), paddingVertical: rs(16) },
  toast: {
    position: 'absolute',
    left: '6%',
    right: '6%',
    bottom: rs(16),
    backgroundColor: colors.text,
    borderRadius: rs(12),
    paddingVertical: rs(12),
    paddingHorizontal: rs(14),
  },
  toastText: { color: '#fff', fontSize: rs(13), fontWeight: '600', textAlign: 'center' },
});
