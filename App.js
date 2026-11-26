import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { CartProvider, useCart } from './src/context/CartContext';
import BottomNavBar from './src/components/BottomNavBar';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import CartScreen from './src/screens/CartScreen';
import TicketsScreen from './src/screens/TicketsScreen';
import LeagueScreen from './src/screens/LeagueScreen';
import AdminScreen from './src/screens/AdminScreen';
import { colors } from './src/theme';

/**
 * Navegación mínima por estado (sin dependencias extra) para el MVP.
 * Si el proyecto crece, migrar a React Navigation: cada pantalla ya recibe `navigate`.
 */
function Root() {
  const { hydrated, count } = useCart();
  const insets = useSafeAreaInsets();
  const [user, setUser] = useState(null);
  const [route, setRoute] = useState('home');

  // Esperar a recuperar el carrito guardado antes de mostrar nada
  if (!hydrated) {
    return (
      <View style={styles.splash}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.login}>
        <StatusBar style="light" />
        <LoginScreen
          onLogin={(u) => {
            setUser(u);
            setRoute('home');
          }}
        />
      </SafeAreaView>
    );
  }

  const screens = {
    home: <HomeScreen user={user} navigate={setRoute} onLogout={() => setUser(null)} />,
    catalog: <CatalogScreen />,
    tickets: <TicketsScreen />,
    league: <LeagueScreen />,
    admin: <AdminScreen user={user} navigate={setRoute} />,
    cart: <CartScreen user={user} navigate={setRoute} />,
  };

  // El color de la zona segura superior sigue al encabezado de cada pantalla
  const topColor = route === 'home' ? colors.primary : colors.background;

  return (
    <SafeAreaView style={[styles.app, { backgroundColor: topColor }]} edges={['top', 'left', 'right']}>
      <StatusBar style={route === 'home' ? 'light' : 'dark'} />
      <View style={styles.content}>{screens[route]}</View>
      <View style={[styles.navWrap, { paddingBottom: insets.bottom }]}>
        <BottomNavBar current={route} onNavigate={setRoute} cartCount={count} />
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <CartProvider>
        <Root />
      </CartProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: { flex: 1, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
  login: { flex: 1, backgroundColor: colors.primary },
  app: { flex: 1 },
  navWrap: { backgroundColor: colors.surface },
  content: { flex: 1 },
});
