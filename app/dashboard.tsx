import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Image } from 'expo-image';
import { Ionicons, Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import OrderModal, { OrderFormData } from '@/components/OrderModal';
import { useDatabase } from '@/hooks/use-database';
import { TransactionService } from '@/services/TransactionService';
import { useTransactions } from '@/context/TransactionContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// SVG Area Chart Data URI for Income graph (Teal Theme)
const INCOME_CHART_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNTAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWQiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjMTRBMzlGIiBzdG9wLW9wYWNpdHk9IjAuNSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0iIzE0QTM5RiIgc3RvcC1vcGFjaXR5PSIwLjA1Ii8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZD0iTTAsODAgQzUwLDUwIDgwLDcwIDEyMCw3MCBDMTYwLDcwIDE4MCw4NSAyMjAsNjUgQzI2MCw0NSAyODAsODAgMzUwLDQ1IEwzNTAsMTAwIEwwLDEwMCBaIiBmaWxsPSJ1cmwoI2dyYWQpIi8+PHBhdGggZD0iTTAsODAgQzUwLDUwIDgwLDcwIDEyMCw3MCBDMTYwLDcwIDE4MCw4NSAyMjAsNjUgQzI2MCw0NSAyODAsODAgMzUwLDQ1IiBmaWxsPSJub25lIiBzdHJva2U9IiMxNEEzOUYiIHN0cm9rZS13aWR0aD0iMi41Ii8+PC9zdmc+`;

// SVG Area Chart Data URI for Expense graph (Coral/Salmon Red Theme)
const EXPENSE_CHART_SVG = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAzNTAgMTAwIiBwcmVzZXJ2ZUFzcGVjdFJhdGlvPSJub25lIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImdyYWRSZWQiIHgxPSIwIiB5MT0iMCIgeDI9IjAiIHkyPSIxIj48c3RvcCBvZmZzZXQ9IjAlIiBzdG9wLWNvbG9yPSIjRkE2QjZDIiBzdG9wLW9wYWNpdHk9IjAuNjUiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0b3AtY29sb3I9IiNGQTZCNkMiIHN0b3Atb3BhY2l0eT0iMC4wNSIvPjwvbGluZWFyR3JhZGllbnQ+PC9kZWZzPjxwYXRoIGQ9Ik0wLDgwIEM0MCw5MCA3MCw2MCAxMTAsNjUgQzE1MCw3MCAxODAsOTAgMjIwLDcwIEMyNjAsNTAgMjgwLDY1IDM1MCw1NSBMMzUwLDEwMCBMMCwxMDAgWiIgZmlsbD0idXJsKCNncmFkUmVkKSIvPjxwYXRoIGQ9Ik0wLDgwIEM0MCw5MCA3MCw2MCAxMTAsNjUgQzE1MCw3MCAxODAsOTAgMjIwLDcwIEMyNjAsNTAgMjgwLDY1IDM1MCw1NSIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkE2QjZDIiBzdHJva2Utd2lkdGg9IjIuNSIvPjwvc3ZnPg==`;

// Watermark Bottle/Device Vector SVG Data URI (Light Blue Silhouette)
const WATERMARK_SVG_URI = `data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxNjAgMTQwIiBmaWxsPSJub25lIj48cGF0aCBkPSJNMjUgMzUgQyAyNSAxMCwgMTM1IDEwLCAxMzUgMzUgTCAxMzUgMTQwIEwgMjUgMTQwIFoiIGZpbGw9IiNFRUY0RkUiLz48cmVjdCB4PSIzMyIgeT0iNTAiIHdpZHRoPSI5NCIgaGVpZ2h0PSI4MCIgcng9IjgiIGZpbGw9IiNGRkZGRkYiLz48Y2lyY2xlIGN4PSI1OCIgY3k9IjkwIiByPSI4IiBmaWxsPSIjRUVGNEZFIi8+PGNpcmNsZSBjeD0iOTgiIGN5PSI5MCIgcj0iOCIgZmlsbD0iI0VFRjRGRSIvPjwvc3ZnPg==`;

interface TransactionItem {
  id: string;
  name: string;
  category: string;
  date: string;
  amount: number;
  type: 'IN' | 'OUT';
  quantity: number;
  unit: string;
  paymentMethod: 'Lunas' | 'Hutang';
  icon: string;
  bgColor: string;
  iconColor: string;
}

const INITIAL_TRANSACTIONS: TransactionItem[] = [
  {
    id: 'trx-1',
    name: 'Maju Jaya Coffee',
    category: 'Penjualan',
    date: '4 Oktober 2020',
    amount: 2000,
    type: 'IN',
    quantity: 1,
    unit: 'Cup',
    paymentMethod: 'Lunas',
    icon: 'cafe-outline',
    bgColor: '#FFEDD5',
    iconColor: '#EA580C',
  },
  {
    id: 'trx-2',
    name: 'Zeus Motorworks',
    category: 'Penjualan',
    date: '4 Oktober 2020',
    amount: 4000,
    type: 'IN',
    quantity: 1,
    unit: 'Jasa',
    paymentMethod: 'Lunas',
    icon: 'settings-outline',
    bgColor: '#E2E8F0',
    iconColor: '#475569',
  },
  {
    id: 'trx-3',
    name: 'Desain Freelance',
    category: 'Penjualan',
    date: '4 Oktober 2020',
    amount: 1000,
    type: 'IN',
    quantity: 1,
    unit: 'Proyek',
    paymentMethod: 'Lunas',
    icon: 'color-palette-outline',
    bgColor: '#FEF08A',
    iconColor: '#CA8A04',
  },
  {
    id: 'trx-4',
    name: 'Uang Kos',
    category: 'Uang Kos',
    date: '4 Oktober 2020',
    amount: 200,
    type: 'OUT',
    quantity: 1,
    unit: 'Bulan',
    paymentMethod: 'Hutang',
    icon: 'home-outline',
    bgColor: '#DBEAFE',
    iconColor: '#2563EB',
  },
  {
    id: 'trx-5',
    name: 'Netflix',
    category: 'Operasional',
    date: '4 Oktober 2020',
    amount: 12,
    type: 'OUT',
    quantity: 1,
    unit: 'Bln',
    paymentMethod: 'Lunas',
    icon: 'tv-outline',
    bgColor: '#FEE2E2',
    iconColor: '#DC2626',
  },
  {
    id: 'trx-6',
    name: 'Konsumsi',
    category: 'Konsumsi',
    date: '4 Oktober 2020',
    amount: 250,
    type: 'OUT',
    quantity: 2,
    unit: 'Porsi',
    paymentMethod: 'Lunas',
    icon: 'restaurant-outline',
    bgColor: '#FEF3C7',
    iconColor: '#D97706',
  },
];

export default function DashboardScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { db } = useDatabase();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);
  
  const { addTransaction } = useTransactions();
  const [activeTab, setActiveTab] = useState<'income' | 'expense'>('income');
  const [activeNav, setActiveNav] = useState<'home' | 'chart' | 'wallet'>('home');
  const [transactions, setTransactions] = useState<TransactionItem[]>(INITIAL_TRANSACTIONS);

  // Modal CRUD State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderFormData | null>(null);

  const isIncome = activeTab === 'income';
  const themeAccentColor = isIncome ? '#14A39F' : '#FA6B6C';

  // Compute live balances
  const totalIncome = transactions
    .filter((t) => t.type === 'IN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === 'OUT')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalSaldo = 90000 + (totalIncome - totalExpense);

  const filteredTransactions = transactions.filter((t) =>
    isIncome ? t.type === 'IN' : t.type === 'OUT'
  );

  const formatNumber = (num: number) => {
    return num.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  // Load from database if initialized
  const loadDatabaseData = useCallback(async () => {
    if (!db) return;
    try {
      const service = new TransactionService(db);
      const dbList = await service.getTransactions(20);
      if (dbList && dbList.length > 0) {
        const mapped: TransactionItem[] = dbList.map((t) => ({
          id: String(t.id),
          name: t.description || t.category_name || 'Transaksi',
          category: t.category_name || 'Umum',
          date: new Date(t.transaction_date).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }),
          amount: t.nominal,
          type: t.transaction_type,
          quantity: t.quantity || 1,
          unit: 'Pcs',
          paymentMethod: (t.payment_method === 'Hutang' ? 'Hutang' : 'Lunas') as 'Lunas' | 'Hutang',
          icon: t.transaction_type === 'IN' ? 'cart-outline' : 'receipt-outline',
          bgColor: t.transaction_type === 'IN' ? '#DCFCE7' : '#FEE2E2',
          iconColor: t.transaction_type === 'IN' ? '#16A34A' : '#DC2626',
        }));
        setTransactions(mapped);
      }
    } catch (e) {
      console.log('Using in-memory transactions fallback:', e);
    }
  }, [db]);

  useEffect(() => {
    loadDatabaseData();
  }, [loadDatabaseData]);

  // Open modal in Create mode
  const handleOpenAddModal = () => {
    setEditingItem(null);
    setIsModalOpen(true);
  };

  // Open modal in Edit/Delete mode
  const handleEditItem = (item: TransactionItem) => {
    setEditingItem({
      id: item.id,
      name: item.name,
      category: item.category,
      stock: 25,
      quantity: item.quantity,
      unit: item.unit,
      price: item.quantity > 0 ? Math.round(item.amount / item.quantity) : item.amount,
      paymentMethod: item.paymentMethod,
      transactionType: item.type,
    });
    setIsModalOpen(true);
  };

  // CREATE or UPDATE CRUD Handler
  const handleSaveOrder = async (formData: OrderFormData) => {
    const totalAmount = formData.price * formData.quantity;
    const now = new Date();
    const dateStr = now.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    if (formData.id) {
      // UPDATE Operation
      if (db) {
        try {
          const service = new TransactionService(db);
          await service.updateTransaction(formData.id, {
            transaction_type: formData.transactionType,
            nominal: totalAmount,
            quantity: formData.quantity,
            unit_price: formData.price,
            payment_method: formData.paymentMethod,
            description: formData.name,
          });
        } catch (e) {
          console.log('DB Update error fallback:', e);
        }
      }

      setTransactions((prev) =>
        prev.map((t) =>
          t.id === formData.id
            ? {
                ...t,
                name: formData.name,
                category: formData.category,
                amount: totalAmount,
                quantity: formData.quantity,
                unit: formData.unit,
                paymentMethod: formData.paymentMethod,
                type: formData.transactionType,
              }
            : t
        )
      );

      Alert.alert('Sukses', `Pesanan "${formData.name}" berhasil diperbarui!`);
    } else {
      // CREATE Operation
      const newId = `trx-${Date.now()}`;
      if (db) {
        try {
          const service = new TransactionService(db);
          await service.createTransaction({
            transaction_date: now.toISOString().replace('T', ' ').substring(0, 19),
            transaction_type: formData.transactionType,
            category_id: formData.transactionType === 'IN' ? 1 : 4,
            nominal: totalAmount,
            quantity: formData.quantity,
            unit_price: formData.price,
            payment_method: formData.paymentMethod,
            description: formData.name,
          });
        } catch (e) {
          console.log('DB Insert error fallback:', e);
        }
      }

      const newTrx: TransactionItem = {
        id: newId,
        name: formData.name,
        category: formData.category,
        date: dateStr,
        amount: totalAmount,
        type: formData.transactionType,
        quantity: formData.quantity,
        unit: formData.unit,
        paymentMethod: formData.paymentMethod,
        icon: formData.transactionType === 'IN' ? 'cafe-outline' : 'restaurant-outline',
        bgColor: formData.transactionType === 'IN' ? '#FFEDD5' : '#FEF3C7',
        iconColor: formData.transactionType === 'IN' ? '#EA580C' : '#D97706',
      };

      // Add to Central Transaction Context for Rekap sync
      addTransaction(formData, 'day-sat');

      setTransactions((prev) => [newTrx, ...prev]);
      Alert.alert('Sukses', `Pesanan "${formData.name}" berhasil dicatat dan masuk ke Rekap!`);
    }

    setIsModalOpen(false);
  };

  // DELETE CRUD Handler
  const handleDeleteOrder = async (id: string) => {
    if (db) {
      try {
        const service = new TransactionService(db);
        await service.deleteTransaction(id);
      } catch (e) {
        console.log('DB Delete error fallback:', e);
      }
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));
    setIsModalOpen(false);
    Alert.alert('Terhapus', 'Pesanan telah berhasil dihapus.');
  };

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
              <Text style={styles.balanceAmount}>Rp {formatNumber(totalSaldo)}</Text>
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
          {/* Income / Expense Graphic Card (Red for Expense, Teal for Income) */}
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

          {/* Recent Transactions Section */}
          <View style={styles.recentSection}>
            <Text style={styles.recentSectionTitle}>
              {isIncome ? 'Pemasukan terbaru Anda' : 'Pengeluaran terbaru Anda'}
            </Text>

            <View style={styles.transactionCard}>
              {filteredTransactions.length === 0 ? (
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={32} color="#94A3B8" />
                  <Text style={styles.emptyText}>Belum ada data {isIncome ? 'pemasukan' : 'pengeluaran'}</Text>
                </View>
              ) : (
                filteredTransactions.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.transactionItem}
                      onPress={() => handleEditItem(item)}
                    >
                      <View style={styles.transactionLeft}>
                        <View style={[styles.avatarCircle, { backgroundColor: item.bgColor }]}>
                          <Ionicons name={item.icon as any} size={22} color={item.iconColor} />
                          {item.paymentMethod === 'Hutang' ? (
                            <View style={[styles.arrowBadge, { backgroundColor: '#EAB308' }]}>
                              <Ionicons name="time" size={10} color="#FFFFFF" />
                            </View>
                          ) : (
                            <View style={[styles.arrowBadge, { backgroundColor: themeAccentColor }]}>
                              <Ionicons
                                name="arrow-up"
                                size={10}
                                color="#FFFFFF"
                                style={!isIncome ? { transform: [{ rotate: '45deg' }] } : undefined}
                              />
                            </View>
                          )}
                        </View>
                        <View style={styles.transactionMeta}>
                          <Text style={styles.transactionName}>{item.name}</Text>
                          <Text style={styles.transactionDate}>{item.date}</Text>
                        </View>
                      </View>

                      <View style={{ alignItems: 'flex-end' }}>
                        <Text
                          style={[
                            styles.transactionAmount,
                            item.paymentMethod === 'Hutang' && styles.hutangAmountText,
                          ]}
                        >
                          Rp {formatNumber(item.amount)}
                        </Text>
                        {item.paymentMethod === 'Hutang' ? (
                          <View style={styles.hutangBadge}>
                            <Ionicons name="time" size={10} color="#B45309" style={{ marginRight: 3 }} />
                            <Text style={styles.hutangBadgeText}>Hutang</Text>
                          </View>
                        ) : (
                          <View style={styles.lunasBadge}>
                            <Ionicons name="checkmark-circle" size={10} color="#15803D" style={{ marginRight: 3 }} />
                            <Text style={styles.lunasBadgeText}>Lunas</Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>

                    {index < filteredTransactions.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))
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
        onPress={handleOpenAddModal}
      >
        <Ionicons name="add" size={32} color="#FFFFFF" />
      </TouchableOpacity>

      {/* Order CRUD Form Modal matching exact user requirement & design */}
      <OrderModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveOrder}
        onDelete={handleDeleteOrder}
        initialData={editingItem}
        defaultType={isIncome ? 'IN' : 'OUT'}
      />

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
    paddingTop: 20,
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
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  emptyText: {
    fontSize: 14,
    color: '#94A3B8',
    marginTop: 8,
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
  hutangAmountText: {
    color: '#D97706',
    fontWeight: '800',
  },
  hutangBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEF3C7',
    borderColor: '#FDE68A',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  hutangBadgeText: {
    fontSize: 10,
    color: '#B45309',
    fontWeight: '800',
  },
  lunasBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    borderColor: '#86EFAC',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 4,
  },
  lunasBadgeText: {
    fontSize: 10,
    color: '#15803D',
    fontWeight: '700',
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
