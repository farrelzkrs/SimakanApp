import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Platform,
} from 'react-native';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const HEADER_HEIGHT = 220;

type TabType = 'IN' | 'OUT';

interface DummyTransaction {
  id: number;
  name: string;
  date: string;
  amount: number;
  icon: string;
  iconBg: string;
}

const DUMMY_INCOME: DummyTransaction[] = [
  { id: 1, name: 'Penjualan Kopi', date: '4 Oktober 2025', amount: 2000, icon: 'local-cafe', iconBg: '#FFF3E0' },
  { id: 2, name: 'Zeus Motorworks', date: '4 Oktober 2025', amount: 4000, icon: 'build', iconBg: '#E8EAF6' },
  { id: 3, name: 'Desain Freelance', date: '4 Oktober 2025', amount: 1000, icon: 'brush', iconBg: '#FCE4EC' },
];

const DUMMY_EXPENSE: DummyTransaction[] = [
  { id: 1, name: 'Kos Bulanan', date: '4 Oktober 2025', amount: 200000, icon: 'house', iconBg: '#E8F5E9' },
  { id: 2, name: 'Netflix', date: '4 Oktober 2025', amount: 12000, icon: 'movie', iconBg: '#FFEBEE' },
  { id: 3, name: 'Konsumsi', date: '4 Oktober 2025', amount: 250000, icon: 'restaurant', iconBg: '#FFF8E1' },
];

const DUMMY_MONTHLY_INCOME = 7000000;
const DUMMY_MONTHLY_EXPENSE = 472000;
const DUMMY_TOTAL_BALANCE = 90000000;

function formatCurrency(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

function MiniChart({ type, color }: { type: TabType; color: string }) {
  const value = type === 'IN' ? DUMMY_MONTHLY_INCOME : DUMMY_MONTHLY_EXPENSE;
  const maxBarWidth = SCREEN_WIDTH - 80;
  const barWidth = type === 'IN' ? maxBarWidth * 0.85 : maxBarWidth * 0.35;

  return (
    <View style={miniChartStyles.container}>
      <View style={miniChartStyles.row}>
        <View style={[miniChartStyles.bar, { width: barWidth, backgroundColor: color + '30' }]}>
          <View style={[miniChartStyles.barFill, { width: '100%', backgroundColor: color + '50' }]} />
        </View>
        <Text style={[miniChartStyles.label, { color }]}>{formatCurrency(value)}</Text>
      </View>
    </View>
  );
}

const miniChartStyles = StyleSheet.create({
  container: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  bar: {
    height: 28,
    borderRadius: 14,
    overflow: 'hidden',
    justifyContent: 'center',
  },
  barFill: {
    height: '100%',
    borderRadius: 14,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
  },
});

function TransactionItem({ item }: { item: DummyTransaction }) {
  return (
    <View style={transactionItemStyles.container}>
      <View style={[transactionItemStyles.iconWrap, { backgroundColor: item.iconBg }]}>
        <MaterialIcons name={item.icon as any} size={22} color="#333" />
      </View>
      <View style={transactionItemStyles.info}>
        <Text style={transactionItemStyles.name}>{item.name}</Text>
        <Text style={transactionItemStyles.date}>{item.date}</Text>
      </View>
      <Text style={transactionItemStyles.amount}>{formatCurrency(item.amount)}</Text>
    </View>
  );
}

const transactionItemStyles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  iconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    flex: 1,
    marginLeft: 14,
  },
  name: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A2E',
  },
  date: {
    fontSize: 12,
    color: '#9E9E9E',
    marginTop: 2,
  },
  amount: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1A1A2E',
  },
});

export default function HomeScreen() {
  const [activeTab, setActiveTab] = useState<TabType>('IN');

  const monthlyValue = activeTab === 'IN' ? DUMMY_MONTHLY_INCOME : DUMMY_MONTHLY_EXPENSE;
  const transactions = activeTab === 'IN' ? DUMMY_INCOME : DUMMY_EXPENSE;
  const chartColor = activeTab === 'IN' ? '#2CBCB6' : '#FF6B6B';

  return (
    <View style={styles.screen}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <View style={styles.headerGradient}>
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <View>
              <Text style={styles.greeting}>Hi, Admin!</Text>
            </View>
            <TouchableOpacity style={styles.notificationBtn}>
              <MaterialIcons name="notifications-none" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <Text style={styles.balanceAmount}>{formatCurrency(DUMMY_TOTAL_BALANCE)}</Text>
          <Text style={styles.balanceLabel}>Total saldo kamu</Text>
        </View>

        <View style={styles.headerCurve} />
      </View>

      <View style={styles.toggleContainer}>
        <View style={styles.toggleWrapper}>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'IN' && styles.toggleBtnActive]}
            onPress={() => setActiveTab('IN')}
            activeOpacity={0.7}>
            <Text style={[styles.toggleText, activeTab === 'IN' && styles.toggleTextActive]}>
              Pemasukan
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, activeTab === 'OUT' && styles.toggleBtnActiveExpense]}
            onPress={() => setActiveTab('OUT')}
            activeOpacity={0.7}>
            <Text style={[styles.toggleText, activeTab === 'OUT' && styles.toggleTextActive]}>
              Pengeluaran
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <View style={styles.monthlyHeader}>
            <Text style={styles.monthlyLabel}>
              {activeTab === 'IN' ? 'Pemasukan bulan ini' : 'Pengeluaran bulan ini'}
            </Text>
            <Text style={styles.monthlyAmount}>{formatCurrency(monthlyValue)}</Text>
          </View>

          <MiniChart type={activeTab} color={chartColor} />
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.recentTitle}>
            {activeTab === 'IN' ? 'Pemasukan terbaru' : 'Pengeluaran terbaru'}
          </Text>

          {transactions.map((item) => (
            <TransactionItem key={item.id} item={item} />
          ))}
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.fab} activeOpacity={0.85}>
        <MaterialIcons name="add" size={28} color="#FFF" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F9',
  },
  headerGradient: {
    backgroundColor: '#2CBCB6',
    paddingTop: Platform.OS === 'ios' ? 60 : (StatusBar.currentHeight ?? 32) + 16,
    paddingBottom: 50,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    position: 'relative',
    overflow: 'hidden',
  },
  headerCurve: {
    position: 'absolute',
    bottom: -20,
    left: -20,
    right: -20,
    height: 60,
    backgroundColor: '#F4F6F9',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
  },
  headerContent: {
    paddingHorizontal: 24,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  notificationBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 32,
    fontWeight: '800',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  balanceLabel: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 4,
  },
  toggleContainer: {
    marginTop: -28,
    zIndex: 10,
    paddingHorizontal: 60,
  },
  toggleWrapper: {
    flexDirection: 'row',
    backgroundColor: '#F0F0F0',
    borderRadius: 25,
    padding: 4,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 22,
    alignItems: 'center',
  },
  toggleBtnActive: {
    backgroundColor: '#2CBCB6',
    elevation: 2,
    shadowColor: '#2CBCB6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  toggleBtnActiveExpense: {
    backgroundColor: '#FF6B6B',
    elevation: 2,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#999',
  },
  toggleTextActive: {
    color: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  monthlyHeader: {
    paddingHorizontal: 24,
  },
  monthlyLabel: {
    fontSize: 12,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  monthlyAmount: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A1A2E',
    marginTop: 4,
  },
  recentSection: {
    marginTop: 24,
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    borderRadius: 20,
    paddingVertical: 20,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A2E',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FF6B6B',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
});
