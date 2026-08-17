import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Watermark Bottle/Device Vector SVG Data URI (Light Blue Silhouette)
const WATERMARK_SVG_URI = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjAgMTQwIiBmaWxsPSJub25lIj48cGF0aCBkPSJNMjUgMzUgQyAyNSAxMCwgMTM1IDEwLCAxMzUgMzUgTCAxMzUgMTQwIEwgMjUgMTQwIFoiIGZpbGw9IiNFRUY0RkUiLz48cmVjdCB4PSIzMyIgeT0iNTAiIHdpZHRoPSI5NCIgaGVpZ2h0PSI4MCIgcng9IjgiIGZpbGw9IiNGRkZGRkYiLz48Y2lyY2xlIGN4PSI1OCIgY3k9IjkwIiByPSI4IiBmaWxsPSIjRUVGNEZFIi8+PGNpcmNsZSBjeD0iOTgiIGN5PSI5MCIgcj0iOCIgZmlsbD0iI0VFRjRGRSIvPjwvc3ZnPg==`;

export default function StatisticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  const [activeNav, setActiveNav] = useState<'home' | 'chart' | 'wallet'>('chart');
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [filterPeriod, setFilterPeriod] = useState<string>('Bulan');
  const [sortFilter, setSortFilter] = useState<string>('Urutkan');

  const isIncome = activeTab === 'income';

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />

      {/* Top Header Navigation */}
      <View style={styles.headerBar}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerContent}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={26} color="#1E293B" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Statistik</Text>

            <TouchableOpacity style={styles.notificationButton} activeOpacity={0.8}>
              <Ionicons name="notifications" size={24} color="#14A39F" />
              <View style={styles.notificationBadge} />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 90 + bottomInset }]}
      >
        {/* Income / Expense Toggle Segment */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.toggleButton,
              isIncome && styles.toggleButtonIncomeActive,
            ]}
            onPress={() => setActiveTab('income')}
          >
            <Text
              style={[
                styles.toggleText,
                isIncome && styles.toggleTextIncomeActive,
              ]}
            >
              Pemasukan
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.9}
            style={[
              styles.toggleButton,
              !isIncome && styles.toggleButtonExpenseActive,
            ]}
            onPress={() => setActiveTab('expense')}
          >
            <Text
              style={[
                styles.toggleText,
                !isIncome && styles.toggleTextExpenseActive,
              ]}
            >
              Pengeluaran
            </Text>
          </TouchableOpacity>
        </View>

        {/* Your Transaction Statistics Card Header */}
        <View style={styles.chartCardHeaderRow}>
          <Text style={styles.chartCardTitle}>
            {isIncome ? 'Statistik pemasukan Anda' : 'Statistik pengeluaran Anda'}
          </Text>

          <TouchableOpacity style={styles.dropdownPillLight} activeOpacity={0.8}>
            <Text style={styles.dropdownPillLightText}>{filterPeriod}</Text>
            <Ionicons name="chevron-down" size={14} color="#94A3B8" style={{ marginLeft: 4 }} />
          </TouchableOpacity>
        </View>

        {/* Outer Colored Frame Card (Red for Expense, Teal for Income) */}
        <View
          style={[
            styles.graphicCardOuter,
            { backgroundColor: isIncome ? '#14A39F' : '#FA6B6C' },
          ]}
        >
          {/* Inner White Card */}
          <TouchableOpacity
            activeOpacity={0.88}
            style={styles.graphicCardInner}
            onPress={() => {
              if (isIncome) {
                router.push('/rekap-pemasukan');
              } else {
                router.push('/rekap-pengeluaran');
              }
            }}
          >
            {/* Left Content Row */}
            <View style={styles.graphicCardLeftContent}>
              {/* Blue Left Vertical Bar Pill */}
              <View style={styles.bluePillIndicator} />

              {/* Date Day Number */}
              <Text style={styles.dateNumberText}>13</Text>

              {/* Day Name & Month Year Column */}
              <View style={styles.dateTextColumn}>
                <Text style={styles.dayNameText}>Kamis</Text>
                <Text style={styles.monthYearText}>Agustus 2026</Text>
              </View>
            </View>

            {/* Right Background Watermark Silhouette */}
            <View style={styles.watermarkContainer} pointerEvents="none">
              <Image
                source={{ uri: WATERMARK_SVG_URI }}
                style={styles.watermarkImage}
                contentFit="contain"
              />
            </View>

            {/* Right Chevron Forward Icon */}
            <Ionicons name="chevron-forward" size={24} color="#94A3B8" style={styles.chevronRightIcon} />
          </TouchableOpacity>
        </View>

        {/* Most Popular Transaction Section */}
        <View style={styles.popularSection}>
          <View style={styles.popularHeader}>
            <Text style={styles.popularSectionTitle}>Transaksi paling populer</Text>

            <TouchableOpacity style={styles.dropdownPillTeal} activeOpacity={0.8}>
              <Text style={styles.dropdownPillTealText}>Urutkan</Text>
              <Ionicons name="chevron-down" size={14} color="#FFFFFF" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          <View style={styles.transactionCard}>
            {/* Item 1: Netflix */}
            <TouchableOpacity activeOpacity={0.7} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[styles.avatarCircle, { backgroundColor: '#18181B' }]}>
                  <Text style={{ color: '#E50914', fontWeight: '900', fontSize: 20 }}>N</Text>
                </View>
                <Text style={styles.transactionName}>Netflix</Text>
              </View>
              <Text style={styles.transactionAmountExpense}>– Rp 12.000</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Item 2: Consumption */}
            <TouchableOpacity activeOpacity={0.7} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[styles.avatarCircle, { backgroundColor: '#FEF3C7' }]}>
                  <Ionicons name="restaurant-outline" size={22} color="#D97706" />
                </View>
                <Text style={styles.transactionName}>Konsumsi</Text>
              </View>
              <Text style={styles.transactionAmountExpense}>– Rp 250.000</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Item 3: Boarding house */}
            <TouchableOpacity activeOpacity={0.7} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[styles.avatarCircle, { backgroundColor: '#DBEAFE' }]}>
                  <Ionicons name="home-outline" size={22} color="#2563EB" />
                </View>
                <Text style={styles.transactionName}>Uang Kos</Text>
              </View>
              <Text style={styles.transactionAmountExpense}>– Rp 200.000</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Item 4: Freelance Design */}
            <TouchableOpacity activeOpacity={0.7} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[styles.avatarCircle, { backgroundColor: '#FEF08A' }]}>
                  <Ionicons name="color-palette-outline" size={22} color="#CA8A04" />
                </View>
                <Text style={styles.transactionName}>Desain Freelance</Text>
              </View>
              <Text style={styles.transactionAmountIncome}>+ Rp 1.000.000</Text>
            </TouchableOpacity>

            <View style={styles.divider} />

            {/* Item 5: Maju Jaya Coffee */}
            <TouchableOpacity activeOpacity={0.7} style={styles.transactionItem}>
              <View style={styles.transactionLeft}>
                <View style={[styles.avatarCircle, { backgroundColor: '#FFEDD5' }]}>
                  <Ionicons name="cafe-outline" size={22} color="#EA580C" />
                </View>
                <Text style={styles.transactionName}>Maju Jaya Coffee</Text>
              </View>
              <Text style={styles.transactionAmountIncome}>+ Rp 2.000.000</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

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
          onPress={() => setActiveNav('chart')}
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
          onPress={() => {
            setActiveNav('wallet');
            router.push('/inventory');
          }}
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
  headerBar: {
    backgroundColor: '#F4F7F6',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(226, 232, 240, 0.6)',
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  notificationButton: {
    position: 'relative',
    padding: 4,
  },
  notificationBadge: {
    position: 'absolute',
    top: 3,
    right: 3,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: '#EF4444',
    borderWidth: 1.5,
    borderColor: '#F4F7F6',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#E2E8F0',
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 12,
  },
  toggleButtonIncomeActive: {
    backgroundColor: '#14A39F',
  },
  toggleButtonExpenseActive: {
    backgroundColor: '#FA6B6C',
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  toggleTextIncomeActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  toggleTextExpenseActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  chartCardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  chartCardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  dropdownPillLight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  dropdownPillLightText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
  },
  graphicCardOuter: {
    borderRadius: 24,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  graphicCardInner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    overflow: 'hidden',
  },
  graphicCardLeftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    zIndex: 2,
  },
  bluePillIndicator: {
    width: 4,
    height: 38,
    borderRadius: 2,
    backgroundColor: '#2563EB',
    marginRight: 14,
  },
  dateNumberText: {
    fontSize: 34,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 14,
  },
  dateTextColumn: {
    justifyContent: 'center',
  },
  dayNameText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    lineHeight: 20,
  },
  monthYearText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 2,
  },
  watermarkContainer: {
    position: 'absolute',
    right: 35,
    top: -10,
    bottom: -10,
    width: 140,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  watermarkImage: {
    width: '100%',
    height: '100%',
    opacity: 0.85,
  },
  chevronRightIcon: {
    zIndex: 5,
    marginLeft: 8,
  },
  popularSection: {
    marginBottom: 20,
  },
  popularHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  popularSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
  },
  dropdownPillTeal: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14A39F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  dropdownPillTealText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  transactionAmountExpense: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  transactionAmountIncome: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
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
