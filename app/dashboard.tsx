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
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// SVG Area Chart Data URI for Income graph (Teal Theme)
const INCOME_CHART_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNTAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMTRBMzlGIiBzdG9wLW9wYWNpdHk9IjAuNSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzE0QTM5RiIgc3RvcC1vcGFjaXR5PSIwLjA1Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTTAsODAgQzUwLDUwIDgwLDcwIDEyMCw3MCBDMTYwLDcwIDE4MCw4NSAyMjAsNjUgQzI2MCw0NSAyODAsODAgMzUwLDQ1IEwzNTAsMTAwIEwwLDEwMCBaIiBmaWxsPSJ1cmwoI2dyYWQpIi8+PHBhdGggZD0iTTAsODAgQzUwLDUwIDgwLDcwIDEyMCw3MCBDMTYwLDcwIDE4MCw4NSAyMjAsNjUgQzI2MCw0NSAyODAsODAgMzUwLDQ1IiBmaWxsPSJub25lIiBzdHJva2U9IiMxNEEzOUYiIHN0cm9rZS13aWR0aD0iMi41Ii8+PC9zdmc+`;

// SVG Area Chart Data URI for Expense graph (Coral/Salmon Red Theme)
const EXPENSE_CHART_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNTAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRSZWQiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRkE2QjZDIiBzdG9wLW9wYWNpdHk9IjAuNjUiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGQTZCNkMiIHN0b3Atb3BhY2l0eT0iMC4wNSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxwYXRoIGQ9Ik0wLDgwIEM0MCw5MCA3MCw2MCAxMTAsNjUgQzE1MCw3MCAxODAsOTAgMjIwLDcwIEMyNjAsNTAgMjgwLDY1IDM1MCw1NSBMMzUwLDEwMCBMMCwxMDAgWiIgZmlsbD0idXJsKCNncmFkUmVkKSIvPjxwYXRoIGQ9Ik0wLDgwIEM0MCw5MCA3MCw2MCAxMTAsNjUgQzE1MCw3MCAxODAsOTAgMjIwLDcwIEMyNjAsNTAgMjgwLDY1IDM1MCw1NSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkE2QjZDIiBzdHJva2Utd2lkdGg9IjIuNSIvPjwvc3ZnPg==`;

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [activeNav, setActiveNav] = useState<'home' | 'chart' | 'wallet'>('home');

  const isIncome = activeTab === 'income';
  const themeAccentColor = isIncome ? '#14A39F' : '#FA6B6C';

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 110 + bottomInset }]}
      >
        {/* Top Header Section (Teal Card) */}
        <View style={styles.headerContainer}>
          <SafeAreaView style={styles.headerSafeArea}>
            {/* Top Bar: Greeting & Notification */}
            <View style={styles.topBar}>
              <Text style={styles.greetingText}>Halo, Syahrul!</Text>

              <TouchableOpacity style={styles.notificationButton} activeOpacity={0.8}>
                <Ionicons name="notifications" size={24} color="#FFFFFF" />
                <View style={styles.notificationBadge} />
              </TouchableOpacity>
            </View>

            {/* Balance Display */}
            <View style={styles.balanceContainer}>
              <Text style={styles.balanceAmount}>$ 90.000,00</Text>
              <Text style={styles.balanceLabel}>Total saldo Anda</Text>
            </View>
          </SafeAreaView>
        </View>

        {/* Floating Income / Expense Toggle Card */}
        <View style={styles.toggleCardContainer}>
          <View style={styles.toggleCard}>
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
                  isIncome && styles.toggleTextActive,
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
                  !isIncome && styles.toggleTextActive,
                ]}
              >
                Pengeluaran
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Main Body Content */}
        <View style={styles.bodyContent}>
          {/* Income / Expense Chart Card */}
          <View style={styles.chartCard}>
            <View style={styles.chartHeader}>
              <Text style={styles.chartSubtitle}>
                {isIncome ? 'Pemasukan bulan ini' : 'Pengeluaran bulan ini'}
              </Text>
              <Text style={styles.chartTitle}>
                {isIncome ? '$ 7.000,00' : '$ 472,00'}
              </Text>
            </View>

            {/* Area Line Chart Area */}
            <View style={styles.chartArea}>
              <Image
                source={{ uri: isIncome ? INCOME_CHART_SVG : EXPENSE_CHART_SVG }}
                style={styles.chartSvg}
                contentFit="fill"
              />

              {/* Peak Point Tooltip Badge */}
              <View style={styles.chartTooltipContainer}>
                <View
                  style={[
                    styles.chartTooltipPill,
                    { backgroundColor: themeAccentColor },
                  ]}
                >
                  <Text style={styles.chartTooltipText}>
                    {isIncome ? '$ 7.000,00' : '$ 472,00'}
                  </Text>
                </View>
                <View
                  style={[
                    styles.chartDotPoint,
                    !isIncome && { backgroundColor: '#FED7AA' },
                  ]}
                />
              </View>
            </View>
          </View>

          {/* Recent Transactions Section */}
          <View style={styles.recentSection}>
            <Text style={styles.recentSectionTitle}>
              {isIncome ? 'Pemasukan terbaru Anda' : 'Pengeluaran terbaru Anda'}
            </Text>

            <View style={styles.transactionCard}>
              {isIncome ? (
                <>
                  {/* Item 1: Maju Jaya Coffee */}
                  <TouchableOpacity activeOpacity={0.7} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.avatarCircle, { backgroundColor: '#FFEDD5' }]}>
                        <Ionicons name="cafe-outline" size={22} color="#EA580C" />
                        <View style={[styles.arrowBadge, { backgroundColor: '#14A39F' }]}>
                          <Ionicons name="arrow-up" size={10} color="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionName}>Maju Jaya Coffee</Text>
                        <Text style={styles.transactionDate}>4 Oktober 2020</Text>
                      </View>
                    </View>
                    <Text style={styles.transactionAmount}>$ 2.000,00</Text>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {/* Item 2: Zeus Motorworks */}
                  <TouchableOpacity activeOpacity={0.7} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.avatarCircle, { backgroundColor: '#E2E8F0' }]}>
                        <Feather name="settings" size={20} color="#475569" />
                        <View style={[styles.arrowBadge, { backgroundColor: '#14A39F' }]}>
                          <Ionicons name="arrow-up" size={10} color="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionName}>Zeus Motorworks</Text>
                        <Text style={styles.transactionDate}>4 Oktober 2020</Text>
                      </View>
                    </View>
                    <Text style={styles.transactionAmount}>$ 4.000,00</Text>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {/* Item 3: Freelance Design */}
                  <TouchableOpacity activeOpacity={0.7} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.avatarCircle, { backgroundColor: '#FEF08A' }]}>
                        <Ionicons name="color-palette-outline" size={22} color="#CA8A04" />
                        <View style={[styles.arrowBadge, { backgroundColor: '#14A39F' }]}>
                          <Ionicons name="arrow-up" size={10} color="#FFFFFF" />
                        </View>
                      </View>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionName}>Desain Freelance</Text>
                        <Text style={styles.transactionDate}>4 Oktober 2020</Text>
                      </View>
                    </View>
                    <Text style={styles.transactionAmount}>$ 1.000,00</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  {/* Item 1: Boarding house */}
                  <TouchableOpacity activeOpacity={0.7} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.avatarCircle, { backgroundColor: '#DBEAFE' }]}>
                        <Ionicons name="home-outline" size={22} color="#2563EB" />
                        <View style={[styles.arrowBadge, { backgroundColor: '#FA6B6C' }]}>
                          <Ionicons name="arrow-up" size={10} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
                        </View>
                      </View>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionName}>Uang Kos</Text>
                        <Text style={styles.transactionDate}>4 Oktober 2020</Text>
                      </View>
                    </View>
                    <Text style={styles.transactionAmount}>$ 200,00</Text>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {/* Item 2: Netflix */}
                  <TouchableOpacity activeOpacity={0.7} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.avatarCircle, { backgroundColor: '#18181B' }]}>
                        <Text style={{ color: '#E50914', fontWeight: '900', fontSize: 20 }}>N</Text>
                        <View style={[styles.arrowBadge, { backgroundColor: '#FA6B6C' }]}>
                          <Ionicons name="arrow-up" size={10} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
                        </View>
                      </View>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionName}>Netflix</Text>
                        <Text style={styles.transactionDate}>4 Oktober 2020</Text>
                      </View>
                    </View>
                    <Text style={styles.transactionAmount}>$ 12,00</Text>
                  </TouchableOpacity>

                  <View style={styles.divider} />

                  {/* Item 3: Consumption */}
                  <TouchableOpacity activeOpacity={0.7} style={styles.transactionItem}>
                    <View style={styles.transactionLeft}>
                      <View style={[styles.avatarCircle, { backgroundColor: '#FEF3C7' }]}>
                        <Ionicons name="restaurant-outline" size={22} color="#D97706" />
                        <View style={[styles.arrowBadge, { backgroundColor: '#FA6B6C' }]}>
                          <Ionicons name="arrow-up" size={10} color="#FFFFFF" style={{ transform: [{ rotate: '45deg' }] }} />
                        </View>
                      </View>
                      <View style={styles.transactionMeta}>
                        <Text style={styles.transactionName}>Konsumsi</Text>
                        <Text style={styles.transactionDate}>4 Oktober 2020</Text>
                      </View>
                    </View>
                    <Text style={styles.transactionAmount}>$ 250,00</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Floating Action Button (+) */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[
          styles.fabButton,
          {
            backgroundColor: themeAccentColor,
            shadowColor: themeAccentColor,
            bottom: 72 + bottomInset,
          },
        ]}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { paddingBottom: bottomInset, height: 60 + bottomInset }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navItem}
          onPress={() => setActiveNav('home')}
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
  scrollContent: {
    paddingBottom: 110,
  },
  headerContainer: {
    backgroundColor: '#14A39F',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 40,
  },
  headerSafeArea: {
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'android' ? 40 : 10,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
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
    borderColor: '#14A39F',
  },
  balanceContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 10,
  },
  balanceAmount: {
    fontSize: 34,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
    letterSpacing: -0.5,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '400',
  },
  toggleCardContainer: {
    alignItems: 'center',
    marginTop: -28,
    zIndex: 10,
  },
  toggleCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 5,
    width: SCREEN_WIDTH * 0.72,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 5,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleButtonIncomeActive: {
    backgroundColor: '#14A39F',
  },
  toggleButtonExpenseActive: {
    backgroundColor: '#FA6B6C',
  },
  toggleText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#94A3B8',
  },
  toggleTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
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
  chartHeader: {
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  chartSubtitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1E293B',
    marginBottom: 4,
  },
  chartTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#0F172A',
  },
  chartArea: {
    height: 120,
    width: '100%',
    position: 'relative',
    justifyContent: 'flex-end',
  },
  chartSvg: {
    width: '100%',
    height: '100%',
  },
  chartTooltipContainer: {
    position: 'absolute',
    right: 70,
    top: 25,
    alignItems: 'center',
  },
  chartTooltipPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    marginBottom: 4,
  },
  chartTooltipText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '700',
  },
  chartDotPoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#F87171',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  recentSection: {
    marginBottom: 20,
  },
  recentSectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 14,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
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
    position: 'relative',
  },
  arrowBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  transactionMeta: {
    justifyContent: 'center',
  },
  transactionName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  transactionDate: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '400',
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  fabButton: {
    position: 'absolute',
    right: 24,
    bottom: 85,
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 8,
    zIndex: 99,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 70,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingBottom: Platform.OS === 'ios' ? 15 : 0,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
