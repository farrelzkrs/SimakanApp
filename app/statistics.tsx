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

// Dual Line Wave SVG Chart Data URI (Income & Expense Crossing Waves)
const DUAL_CHART_SVG_URI = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNTAgMTIwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9InRlYWxHcmFkIiB4MT0iMCIgeTE9IjAiIHkyPSIwIiB5Mj0iMSI+PHN0b3Agb2Zmc2V0PSIwJSIgc3RvcC1jb2xvcj0iIzE0QTM5RiIgc3RvcC1vcGFjaXR5PSIwLjM1Ii8+PHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjMTRBMzlGIiBzdG9wLW9wYWNpdHk9IjAuMDIiLz48L2xpbmVhckdyYWRpZW50PjxsaW5lYXJHcmFkaWVudCBpZD0icmVkR3JhZCIgeDE9IjAiIHkxPSIwIiB4Mj0iMCIgeTI9IjEiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNGQTZCNkMiIHN0b3Atb3BhY2l0eT0iMC4yNSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iI0ZBNkJmQyIgc3RvcC1vcGFjaXR5PSIwLjAyIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTTAsNzAgQzQwLDQwIDcwLDgwIDExMCw1MCBDMTUwLDc1IDE4MCw4NSAyMTAsNDAgQzI0MCw2NSAyNzAsNDAgMzEwLDQ1IEMzMzAsNTAgMzQwLDQ1IDM1MCw1MCBMMzUwLDEyMCBMMCwxMjAgWiIgZmlsbD0idXJsKCN0ZWFsR3JhZCkiLz48cGF0aCBkPSJNMCw3MCBDNDAsNDAgNzAsODAgMTEwLDUwIEMxNTAsNzUgMTgwLDg1IDIxMCw4MCBDMjQwLDY1IDI3MCw0MCAzMTAsNDUgQzMzMCw1MCAzNDAsNDUgMzUwLDUwIiBmaWxsPSJub25lIiBzdHJva2U9IiMxNEEzOUYiIHN0cm9rZS13aWR0aD0iMi41Ii8+PHBhdGggZD0iTTAsODUgQzM1LDY1IDc1LDkwIDExMCw2NSBDMTQ1LDQ1IDE3NSw2MCAyMTAsODAgQzI0NSw5NSA0NzUsNjAgMzEwLDc1IEMzMzAsNTAgMzQwLDcwIDM1MCw2NSBMMzUwLDEyMCBMMCwxMjAgWiIgZmlsbD0idXJsKCNyZWRHcmFkKSIvPjxwYXRoIGQ9Ik0wLDg1IEMzNSw2NSA3NSw5MCAxMTAsNjUgQzE0NSw0NSAxNzUsNjAgMjEwLDgwIEMyNDUsOTUgNDc1LDYwIDMxMCw3NSBDMzMwLDUwIDM0MCw3MCAzNTAsNjUiIGZpbGw9Im5vbmUiIHN0cm9rZT0iI0ZBNkJmQyIgc3Rvc2Utd2lkdGg9IjIiLz48L3N2Zz4=`;

export default function StatisticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  const [activeNav, setActiveNav] = useState<'home' | 'chart' | 'wallet'>('chart');
  const [filterPeriod, setFilterPeriod] = useState<string>('Bulan');
  const [sortFilter, setSortFilter] = useState<string>('Urutkan');

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
        {/* Your Transaction Statistics Card */}
        <View style={styles.chartCard}>
          <View style={styles.chartCardHeader}>
            <Text style={styles.chartCardTitle}>Statistik transaksi Anda</Text>

            <TouchableOpacity style={styles.dropdownPillLight} activeOpacity={0.8}>
              <Text style={styles.dropdownPillLightText}>{filterPeriod}</Text>
              <Ionicons name="chevron-down" size={14} color="#94A3B8" style={{ marginLeft: 4 }} />
            </TouchableOpacity>
          </View>

          {/* Dual Line Chart Area */}
          <View style={styles.chartArea}>
            <Image
              source={{ uri: DUAL_CHART_SVG_URI }}
              style={styles.chartSvg}
              contentFit="fill"
            />

            {/* Highlighted Peak Point Tooltip */}
            <View style={styles.tooltipContainer}>
              <View style={styles.tooltipPill}>
                <Text style={styles.tooltipMonthText}>Juni 2020</Text>
                <Text style={styles.tooltipAmountText}>+ $ 12.000</Text>
              </View>
              <View style={styles.tooltipDot} />
            </View>
          </View>
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
              <Text style={styles.transactionAmountExpense}>– $ 12,00</Text>
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
              <Text style={styles.transactionAmountExpense}>– $ 250,00</Text>
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
              <Text style={styles.transactionAmountExpense}>– $ 200,00</Text>
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
              <Text style={styles.transactionAmountIncome}>+ $ 1.000,00</Text>
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
              <Text style={styles.transactionAmountIncome}>+ $ 2.000,00</Text>
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
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 18,
    marginBottom: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
  },
  chartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  chartCardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
  },
  dropdownPillLight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 14,
  },
  dropdownPillLightText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  chartArea: {
    height: 140,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  chartSvg: {
    width: '100%',
    height: '100%',
  },
  tooltipContainer: {
    position: 'absolute',
    right: 110,
    top: 20,
    alignItems: 'center',
  },
  tooltipPill: {
    backgroundColor: '#14A39F',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 4,
  },
  tooltipMonthText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  tooltipAmountText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  tooltipDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F87171',
    borderWidth: 2,
    borderColor: '#FFFFFF',
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
