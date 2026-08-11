import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  status: 'Tersedia' | 'Menipis';
  stock: number;
  unit: string;
  progress: number; // 0 to 1
}

const INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: '1',
    name: 'Laptop ASUS ROG',
    category: 'Elektronik',
    status: 'Tersedia',
    stock: 12,
    unit: 'unit',
    progress: 0.9,
  },
  {
    id: '2',
    name: 'Mouse Logitech',
    category: 'Aksesoris',
    status: 'Menipis',
    stock: 3,
    unit: 'unit',
    progress: 0.25,
  },
  {
    id: '3',
    name: 'Kertas A4',
    category: 'ATK',
    status: 'Tersedia',
    stock: 50,
    unit: 'rim',
    progress: 0.7,
  },
  {
    id: '4',
    name: 'Tinta Printer Canon',
    category: 'ATK',
    status: 'Tersedia',
    stock: 8,
    unit: 'botol',
    progress: 0.5,
  },
  {
    id: '5',
    name: 'Keyboard Mechanical',
    category: 'Aksesoris',
    status: 'Menipis',
    stock: 2,
    unit: 'unit',
    progress: 0.2,
  },
];

export default function InventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeNav, setActiveNav] = useState<'home' | 'chart' | 'wallet'>('wallet');

  const filteredItems = INVENTORY_ITEMS.filter(
    (item) =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalItems = INVENTORY_ITEMS.length;
  const lowStockCount = INVENTORY_ITEMS.filter((i) => i.status === 'Menipis').length;
  const totalStock = INVENTORY_ITEMS.reduce((acc, curr) => acc + curr.stock, 0);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Header Section (Teal Background) */}
      <View style={styles.headerContainer}>
        <SafeAreaView style={styles.headerSafeArea}>
          {/* Header Title Bar */}
          <View style={styles.headerTopBar}>
            <View style={styles.headerTitleLeft}>
              <View style={styles.headerIconCircle}>
                <Ionicons name="cube-outline" size={22} color="#14A39F" />
              </View>
              <View style={styles.headerTitleMeta}>
                <Text style={styles.headerTitleText}>Inventori</Text>
                <Text style={styles.headerSubtitleText}>Manajemen Inventori</Text>
              </View>
            </View>

            <TouchableOpacity activeOpacity={0.8} style={styles.headerAddBtn}>
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* 2x2 Metric Cards Grid */}
          <View style={styles.metricsGrid}>
            {/* Card 1: Jenis Barang */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBadge, { backgroundColor: '#E0F2FE' }]}>
                  <Ionicons name="cube" size={16} color="#0284C7" />
                </View>
                <Text style={styles.metricLabel}>Jenis Barang</Text>
              </View>
              <Text style={styles.metricValue}>{totalItems}</Text>
            </View>

            {/* Card 2: Total Stok */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBadge, { backgroundColor: '#DCFCE7' }]}>
                  <Ionicons name="archive" size={16} color="#16A34A" />
                </View>
                <Text style={styles.metricLabel}>Total Stok</Text>
              </View>
              <Text style={styles.metricValue}>{totalStock}</Text>
            </View>

            {/* Card 3: Stok Menipis */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBadge, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="warning" size={16} color="#EA580C" />
                </View>
                <Text style={styles.metricLabel}>Stok Menipis</Text>
              </View>
              <Text style={styles.metricValue}>{lowStockCount}</Text>
            </View>

            {/* Card 4: Nilai Stok */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View style={[styles.metricIconBadge, { backgroundColor: '#FCE7F3' }]}>
                  <Ionicons name="trending-up" size={16} color="#DB2777" />
                </View>
                <Text style={styles.metricLabel}>Nilai Stok</Text>
              </View>
              <Text style={styles.metricValue}>0</Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Floating Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchCard}>
          <Ionicons name="search-outline" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
          <TextInput
            placeholder="Cari barang atau kategori..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
        </View>
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + bottomInset }]}
      >
        {/* Status Counter Bar */}
        <View style={styles.counterRow}>
          <Text style={styles.counterTextLeft}>{totalItems} barang</Text>
          <Text style={styles.counterTextRight}>{lowStockCount} stok menipis</Text>
        </View>

        {/* Inventory Item Cards */}
        {filteredItems.map((item) => {
          const isLow = item.status === 'Menipis';

          return (
            <TouchableOpacity key={item.id} activeOpacity={0.8} style={styles.itemCard}>
              <View style={styles.itemCardHeader}>
                <View style={styles.itemCardLeft}>
                  <View style={styles.itemAvatar}>
                    <Ionicons name="cube-outline" size={20} color="#8B5CF6" />
                  </View>

                  <View style={styles.itemTitleMeta}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View style={styles.itemBadgesRow}>
                      <View
                        style={[
                          styles.categoryBadge,
                          item.category === 'ATK'
                            ? { backgroundColor: '#CCFBF1' }
                            : { backgroundColor: '#F3E8FF' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.categoryBadgeText,
                            item.category === 'ATK' ? { color: '#0D9488' } : { color: '#9333EA' },
                          ]}
                        >
                          {item.category}
                        </Text>
                      </View>

                      <View
                        style={[
                          styles.statusBadge,
                          isLow ? { backgroundColor: '#FFEDD5' } : { backgroundColor: '#DCFCE7' },
                        ]}
                      >
                        <Text
                          style={[
                            styles.statusBadgeText,
                            isLow ? { color: '#EA580C' } : { color: '#16A34A' },
                          ]}
                        >
                          • {item.status}
                        </Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Ionicons name="chevron-forward" size={18} color="#CBD5E1" />
              </View>

              {/* Progress Bar & Stock Unit */}
              <View style={styles.progressRow}>
                <View style={styles.progressBarTrack}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${item.progress * 100}%`,
                        backgroundColor: isLow ? '#F97316' : '#10B981',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.stockUnitText}>
                  <Text style={styles.stockNumberText}>{item.stock}</Text> {item.unit}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Bottom Floating "+ Tambah Barang" Button */}
      <TouchableOpacity
        activeOpacity={0.88}
        style={[styles.tambahBarangBtn, { bottom: 72 + bottomInset }]}
      >
        <Ionicons name="add" size={20} color="#FFFFFF" style={{ marginRight: 6 }} />
        <Text style={styles.tambahBarangBtnText}>Tambah Barang</Text>
      </TouchableOpacity>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { paddingBottom: bottomInset, height: 60 + bottomInset }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navItem}
          onPress={() => {
            setActiveNav('home');
            router.push('/dashboard');
          }}
        >
          <Ionicons
            name={activeNav === 'home' ? 'home' : 'home-outline'}
            size={26}
            color={activeNav === 'home' ? '#14A39F' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navItem}
          onPress={() => {
            setActiveNav('chart');
            router.push('/statistics');
          }}
        >
          <Ionicons
            name={activeNav === 'chart' ? 'stats-chart' : 'stats-chart-outline'}
            size={24}
            color={activeNav === 'chart' ? '#14A39F' : '#94A3B8'}
          />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navItem}
          onPress={() => setActiveNav('wallet')}
        >
          <Ionicons
            name={activeNav === 'wallet' ? 'card' : 'card-outline'}
            size={26}
            color={activeNav === 'wallet' ? '#14A39F' : '#94A3B8'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F7F6',
  },
  headerContainer: {
    backgroundColor: '#14A39F',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 34,
  },
  headerSafeArea: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? 36 : 10,
  },
  headerTopBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  headerTitleMeta: {
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerSubtitleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400',
  },
  headerAddBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  metricCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    width: (SCREEN_WIDTH - 50) / 2,
    borderRadius: 18,
    padding: 14,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#334155',
  },
  metricValue: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginLeft: 2,
  },
  searchContainer: {
    alignItems: 'center',
    marginTop: -22,
    zIndex: 10,
    paddingHorizontal: 20,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    paddingHorizontal: 16,
    height: 46,
    width: '100%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#1E293B',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  counterTextLeft: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  counterTextRight: {
    fontSize: 13,
    fontWeight: '600',
    color: '#EC4899',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  itemCardLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#F3E8FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemTitleMeta: {
    justifyContent: 'center',
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 4,
  },
  itemBadgesRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  progressBarTrack: {
    flex: 1,
    height: 6,
    backgroundColor: '#F1F5F9',
    borderRadius: 3,
    marginRight: 14,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  stockUnitText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  stockNumberText: {
    fontWeight: '700',
    color: '#0F172A',
  },
  tambahBarangBtn: {
    position: 'absolute',
    right: 20,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14A39F',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#14A39F',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
  tambahBarangBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
