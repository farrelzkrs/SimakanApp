import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  SafeAreaView,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useTransactions, TransactionItem } from '@/context/TransactionContext';
import OrderModal, { OrderFormData } from '@/components/OrderModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DebtFilterType = 'ALL' | 'UNPAID' | 'PAID' | 'INCOME_DEBT' | 'EXPENSE_DEBT';

export default function StatisticsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  const { transactions, toggleDebtStatus, deleteTransaction, addTransaction } = useTransactions();

  const [activeNav, setActiveNav] = useState<'home' | 'debt' | 'wallet'>('debt');
  const [activeFilter, setActiveFilter] = useState<DebtFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderFormData | null>(null);

  // Extract all transactions that have paymentMethod === 'Hutang' OR have debtorName
  const allDebtTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.paymentMethod === 'Hutang' || !!t.debtorName || t.debtStatus === 'Belum Lunas'
    );
  }, [transactions]);

  // Aggregate Metrics
  const metrics = useMemo(() => {
    let unpaidTotal = 0;
    let unpaidCount = 0;
    let paidTotal = 0;
    let paidCount = 0;
    let customerReceivableTotal = 0; // Piutang Pemasukan (IN) belum lunas
    let supplierDebtTotal = 0; // Hutang Pengeluaran (OUT) belum lunas

    allDebtTransactions.forEach((t) => {
      if (t.debtStatus === 'Belum Lunas' || (!t.debtStatus && t.paymentMethod === 'Hutang')) {
        unpaidTotal += t.total;
        unpaidCount += 1;
        if (t.transactionType === 'IN') {
          customerReceivableTotal += t.total;
        } else {
          supplierDebtTotal += t.total;
        }
      } else {
        paidTotal += t.total;
        paidCount += 1;
      }
    });

    return {
      unpaidTotal,
      unpaidCount,
      paidTotal,
      paidCount,
      customerReceivableTotal,
      supplierDebtTotal,
      totalRecords: allDebtTransactions.length,
    };
  }, [allDebtTransactions]);

  // Filtered List based on Search & Active Filter Tab
  const filteredDebts = useMemo(() => {
    return allDebtTransactions.filter((t) => {
      const isUnpaid = t.debtStatus === 'Belum Lunas' || (!t.debtStatus && t.paymentMethod === 'Hutang');
      const isPaid = t.debtStatus === 'Lunas';

      // 1. Tab Filter
      if (activeFilter === 'UNPAID' && !isUnpaid) return false;
      if (activeFilter === 'PAID' && !isPaid) return false;
      if (activeFilter === 'INCOME_DEBT' && t.transactionType !== 'IN') return false;
      if (activeFilter === 'EXPENSE_DEBT' && t.transactionType !== 'OUT') return false;

      // 2. Search Query (Name of debtor, item name, or category)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDebtor = (t.debtorName || '').toLowerCase().includes(q);
        const matchItem = t.name.toLowerCase().includes(q);
        const matchCategory = t.category.toLowerCase().includes(q);
        return matchDebtor || matchItem || matchCategory;
      }

      return true;
    });
  }, [allDebtTransactions, activeFilter, searchQuery]);

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleToggleStatus = (item: TransactionItem) => {
    const isCurrentlyUnpaid =
      item.debtStatus === 'Belum Lunas' || (!item.debtStatus && item.paymentMethod === 'Hutang');

    Alert.alert(
      isCurrentlyUnpaid ? 'Konfirmasi Pelunasan' : 'Ubah ke Belum Lunas',
      isCurrentlyUnpaid
        ? `Tandai hutang/piutang "${item.debtorName || item.name}" sebesar ${formatRupiah(
            item.total
          )} sebagai LUNAS?`
        : `Kembalikan status hutang "${item.debtorName || item.name}" menjadi BELUM LUNAS?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: isCurrentlyUnpaid ? 'Tandai Lunas' : 'Ubah Belum Lunas',
          style: 'default',
          onPress: () => {
            toggleDebtStatus(item.id);
            Alert.alert(
              'Berhasil',
              isCurrentlyUnpaid
                ? `Hutang "${item.debtorName || item.name}" berhasil dilunasi!`
                : `Status diubah kembali ke Belum Lunas.`
            );
          },
        },
      ]
    );
  };

  const handleDeleteDebt = (id: string, name: string) => {
    Alert.alert('Hapus Catatan Hutang', `Yakin ingin menghapus catatan hutang "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          deleteTransaction(id);
        },
      },
    ]);
  };

  const handleSaveModalOrder = (data: OrderFormData) => {
    addTransaction(data, 'day-sat');
    setIsModalOpen(false);
    setEditingItem(null);
    Alert.alert('Sukses', `Catatan hutang untuk "${data.debtorName || data.name}" berhasil dicatat!`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Banner Header (Teal with Navy Gradient Feel) */}
      <View style={styles.topHeaderBackground}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButton}
              onPress={() => router.replace('/dashboard')}
            >
              <Ionicons name="chevron-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>

            <View style={styles.headerCenter}>
              <Text style={styles.headerTitle}>Daftar Hutang</Text>
              <Text style={styles.headerSubtitle}>Catatan Piutang Pelanggan & Hutang Toko</Text>
            </View>

            <TouchableOpacity
              style={styles.addDebtBtn}
              activeOpacity={0.8}
              onPress={() => {
                setEditingItem({
                  name: '',
                  category: 'Minuman',
                  stock: 0,
                  quantity: 1,
                  unit: 'Cup',
                  price: 0,
                  paymentMethod: 'Hutang',
                  transactionType: 'IN',
                  debtorName: '',
                  debtStatus: 'Belum Lunas',
                });
                setIsModalOpen(true);
              }}
            >
              <Ionicons name="add" size={22} color="#14A39F" />
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 90 + bottomInset }]}
      >
        {/* Metric Summary Cards Grid */}
        <View style={styles.metricGrid}>
          {/* Card 1: Total Belum Lunas */}
          <View style={styles.metricCardWarning}>
            <View style={styles.metricCardHeader}>
              <View style={styles.iconCircleAmber}>
                <Ionicons name="time" size={18} color="#D97706" />
              </View>
              <View style={styles.badgeAmber}>
                <Text style={styles.badgeAmberText}>{metrics.unpaidCount} Transaksi</Text>
              </View>
            </View>
            <Text style={styles.metricLabel}>Total Belum Lunas</Text>
            <Text style={styles.metricValueAmber}>{formatRupiah(metrics.unpaidTotal)}</Text>
          </View>

          {/* Card 2: Piutang Pelanggan (Pemasukan Belum Lunas) */}
          <View style={styles.metricCardSub}>
            <View style={styles.metricCardHeader}>
              <View style={[styles.iconCircleMini, { backgroundColor: '#F0FDFA' }]}>
                <Ionicons name="arrow-down-circle" size={16} color="#14A39F" />
              </View>
              <Text style={styles.metricSubTag}>Piutang Pelanggan</Text>
            </View>
            <Text style={styles.metricValueMini}>{formatRupiah(metrics.customerReceivableTotal)}</Text>
            <Text style={styles.metricSubHint}>Pemasukan belum dibayar</Text>
          </View>

          {/* Card 3: Hutang Toko (Pengeluaran Belum Lunas) */}
          <View style={styles.metricCardSub}>
            <View style={styles.metricCardHeader}>
              <View style={[styles.iconCircleMini, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="arrow-up-circle" size={16} color="#DC2626" />
              </View>
              <Text style={styles.metricSubTag}>Hutang Toko</Text>
            </View>
            <Text style={[styles.metricValueMini, { color: '#DC2626' }]}>
              {formatRupiah(metrics.supplierDebtTotal)}
            </Text>
            <Text style={styles.metricSubHint}>Kewajiban belanja toko</Text>
          </View>
        </View>

        {/* Live Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Cari nama penghutang / nama barang..."
            placeholderTextColor="#94A3B8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={18} color="#94A3B8" />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter Tabs Horizontal Scroll */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterTabsContainer}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.filterChip, activeFilter === 'ALL' && styles.filterChipActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={[styles.filterChipText, activeFilter === 'ALL' && styles.filterChipTextActive]}>
              Semua ({metrics.totalRecords})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.filterChip, activeFilter === 'UNPAID' && styles.filterChipActiveAmber]}
            onPress={() => setActiveFilter('UNPAID')}
          >
            <Ionicons
              name="alert-circle"
              size={14}
              color={activeFilter === 'UNPAID' ? '#FFFFFF' : '#D97706'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'UNPAID' && styles.filterChipTextActive,
              ]}
            >
              Belum Lunas ({metrics.unpaidCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.filterChip, activeFilter === 'PAID' && styles.filterChipActiveGreen]}
            onPress={() => setActiveFilter('PAID')}
          >
            <Ionicons
              name="checkmark-circle"
              size={14}
              color={activeFilter === 'PAID' ? '#FFFFFF' : '#16A34A'}
              style={{ marginRight: 4 }}
            />
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'PAID' && styles.filterChipTextActive,
              ]}
            >
              Sudah Lunas ({metrics.paidCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.filterChip, activeFilter === 'INCOME_DEBT' && styles.filterChipActive]}
            onPress={() => setActiveFilter('INCOME_DEBT')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'INCOME_DEBT' && styles.filterChipTextActive,
              ]}
            >
              Piutang Pelanggan (IN)
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.filterChip, activeFilter === 'EXPENSE_DEBT' && styles.filterChipActive]}
            onPress={() => setActiveFilter('EXPENSE_DEBT')}
          >
            <Text
              style={[
                styles.filterChipText,
                activeFilter === 'EXPENSE_DEBT' && styles.filterChipTextActive,
              ]}
            >
              Hutang Toko (OUT)
            </Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Section Header */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>Daftar Tagihan ({filteredDebts.length})</Text>
          <Text style={styles.listHeaderSub}>Tekan 'Tandai Lunas' saat tagihan terbayar</Text>
        </View>

        {/* Debt Cards List */}
        {filteredDebts.length > 0 ? (
          filteredDebts.map((item) => {
            const isUnpaid =
              item.debtStatus === 'Belum Lunas' || (!item.debtStatus && item.paymentMethod === 'Hutang');
            const debtorInitial = (item.debtorName || item.name).trim().charAt(0).toUpperCase() || 'H';
            const isIncome = item.transactionType === 'IN';

            return (
              <View
                key={item.id}
                style={[styles.debtCard, isUnpaid ? styles.debtCardUnpaid : styles.debtCardPaid]}
              >
                {/* Top Row: Debtor Info & Nominal */}
                <View style={styles.debtCardTopRow}>
                  {/* Left Avatar & Name */}
                  <View style={styles.debtorInfoLeft}>
                    <View
                      style={[
                        styles.debtorAvatar,
                        { backgroundColor: isUnpaid ? '#FEF3C7' : '#DCFCE7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.debtorAvatarText,
                          { color: isUnpaid ? '#B45309' : '#15803D' },
                        ]}
                      >
                        {debtorInitial}
                      </Text>
                    </View>

                    <View style={{ flex: 1 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                        <Text style={styles.debtorNameText}>
                          {item.debtorName || 'Pelanggan Tanpa Nama'}
                        </Text>
                        <View
                          style={[
                            styles.typeTag,
                            { backgroundColor: isIncome ? '#F0FDFA' : '#FEF2F2' },
                          ]}
                        >
                          <Text
                            style={[
                              styles.typeTagText,
                              { color: isIncome ? '#0D9488' : '#DC2626' },
                            ]}
                          >
                            {isIncome ? 'Piutang' : 'Hutang Belanja'}
                          </Text>
                        </View>
                      </View>

                      <Text style={styles.debtItemDetail}>
                        {item.name} • {item.quantity} {item.unit} (@ {formatRupiah(item.price)})
                      </Text>
                    </View>
                  </View>

                  {/* Right Nominal & Status Badge */}
                  <View style={styles.debtorNominalRight}>
                    <Text style={styles.nominalText}>{formatRupiah(item.total)}</Text>
                    <View
                      style={[
                        styles.statusPill,
                        isUnpaid ? styles.statusPillUnpaid : styles.statusPillPaid,
                      ]}
                    >
                      <Ionicons
                        name={isUnpaid ? 'time' : 'checkmark-circle'}
                        size={12}
                        color={isUnpaid ? '#D97706' : '#16A34A'}
                        style={{ marginRight: 3 }}
                      />
                      <Text
                        style={[
                          styles.statusPillText,
                          isUnpaid ? styles.statusPillTextUnpaid : styles.statusPillTextPaid,
                        ]}
                      >
                        {isUnpaid ? 'Belum Lunas' : 'Lunas'}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.cardDivider} />

                {/* Bottom Row: Date & Action Buttons */}
                <View style={styles.debtCardBottomRow}>
                  <View style={styles.dateInfoRow}>
                    <Ionicons name="calendar-outline" size={13} color="#94A3B8" style={{ marginRight: 4 }} />
                    <Text style={styles.dateInfoText}>
                      {item.fullDateText || item.dateKey} • {item.timeText || '12:00 WIB'}
                    </Text>
                  </View>

                  <View style={styles.actionButtonRow}>
                    {/* Delete Action Button */}
                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.iconDeleteBtn}
                      onPress={() => handleDeleteDebt(item.id, item.debtorName || item.name)}
                    >
                      <Ionicons name="trash-outline" size={16} color="#94A3B8" />
                    </TouchableOpacity>

                    {/* Toggle Lunas Button */}
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[
                        styles.togglePayBtn,
                        isUnpaid ? styles.togglePayBtnUnpaid : styles.togglePayBtnPaid,
                      ]}
                      onPress={() => handleToggleStatus(item)}
                    >
                      <Ionicons
                        name={isUnpaid ? 'checkmark-circle-outline' : 'refresh-outline'}
                        size={15}
                        color={isUnpaid ? '#FFFFFF' : '#475569'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.togglePayBtnText,
                          isUnpaid ? styles.togglePayBtnTextUnpaid : styles.togglePayBtnTextPaid,
                        ]}
                      >
                        {isUnpaid ? 'Tandai Lunas' : 'Batal Lunas'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            );
          })
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="receipt-outline" size={38} color="#94A3B8" />
            </View>
            <Text style={styles.emptyStateTitle}>Tidak ada catatan hutang</Text>
            <Text style={styles.emptyStateSub}>
              {searchQuery
                ? `Tidak ditemukan hutang dengan kata kunci "${searchQuery}".`
                : 'Belum ada transaksi hutang yang tercatat pada filter ini.'}
            </Text>
            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.emptyAddBtn}
              onPress={() => {
                setEditingItem(null);
                setIsModalOpen(true);
              }}
            >
              <Ionicons name="add-circle" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
              <Text style={styles.emptyAddBtnText}>Catat Hutang Baru</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Quick Floating Add Button */}
      <TouchableOpacity
        activeOpacity={0.85}
        style={[styles.floatingAddBtn, { bottom: 75 + bottomInset }]}
        onPress={() => {
          setEditingItem(null);
          setIsModalOpen(true);
        }}
      >
        <Ionicons name="add" size={24} color="#FFFFFF" />
        <Text style={styles.floatingAddBtnText}>Catat Hutang</Text>
      </TouchableOpacity>

      {/* Order Modal for adding / editing debt transactions */}
      <OrderModal
        visible={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingItem(null);
        }}
        onSave={handleSaveModalOrder}
        initialData={editingItem}
        defaultType="IN"
      />

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { paddingBottom: bottomInset, height: 60 + bottomInset }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navItem}
          onPress={() => {
            setActiveNav('home');
            router.replace('/dashboard');
          }}
        >
          <Ionicons name="home-outline" size={26} color="#94A3B8" />
        </TouchableOpacity>

        {/* 2. DAFTAR HUTANG TAB */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navItem}
          onPress={() => setActiveNav('debt')}
        >
          <Ionicons name="receipt" size={26} color="#14A39F" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navItem}
          onPress={() => {
            setActiveNav('wallet');
            router.replace('/inventory');
          }}
        >
          <Ionicons name="card-outline" size={26} color="#94A3B8" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeaderBackground: {
    backgroundColor: '#0F172A',
    paddingBottom: 16,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'android' ? 36 : 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
    marginHorizontal: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.2,
  },
  headerSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  addDebtBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  metricGrid: {
    marginBottom: 16,
    gap: 10,
  },
  metricCardWarning: {
    backgroundColor: '#FFFBEB',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    shadowColor: '#D97706',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircleAmber: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#FEF3C7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeAmber: {
    backgroundColor: '#FDE68A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeAmberText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400E',
    marginBottom: 4,
  },
  metricValueAmber: {
    fontSize: 24,
    fontWeight: '900',
    color: '#B45309',
    letterSpacing: 0.3,
  },
  metricCardSub: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  iconCircleMini: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  metricSubTag: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
    flex: 1,
  },
  metricValueMini: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0D9488',
    marginTop: 2,
  },
  metricSubHint: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 2,
  },
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
  },
  searchBarInput: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  filterTabsContainer: {
    gap: 8,
    paddingBottom: 14,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#0F172A',
    borderColor: '#0F172A',
  },
  filterChipActiveAmber: {
    backgroundColor: '#D97706',
    borderColor: '#D97706',
  },
  filterChipActiveGreen: {
    backgroundColor: '#16A34A',
    borderColor: '#16A34A',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    marginTop: 4,
  },
  listHeaderTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  listHeaderSub: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '500',
  },
  debtCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  debtCardUnpaid: {
    borderColor: '#FED7AA',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  debtCardPaid: {
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  debtCardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  debtorInfoLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
    marginRight: 10,
  },
  debtorAvatar: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  debtorAvatarText: {
    fontSize: 16,
    fontWeight: '900',
  },
  debtorNameText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  typeTag: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  typeTagText: {
    fontSize: 10,
    fontWeight: '800',
  },
  debtItemDetail: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
    marginTop: 4,
  },
  debtorNominalRight: {
    alignItems: 'flex-end',
  },
  nominalText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillUnpaid: {
    backgroundColor: '#FEF3C7',
  },
  statusPillPaid: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  statusPillTextUnpaid: {
    color: '#B45309',
  },
  statusPillTextPaid: {
    color: '#15803D',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  debtCardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dateInfoText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '600',
  },
  actionButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconDeleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#F8FAFC',
  },
  togglePayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  togglePayBtnUnpaid: {
    backgroundColor: '#16A34A',
  },
  togglePayBtnPaid: {
    backgroundColor: '#F1F5F9',
  },
  togglePayBtnText: {
    fontSize: 11,
    fontWeight: '800',
  },
  togglePayBtnTextUnpaid: {
    color: '#FFFFFF',
  },
  togglePayBtnTextPaid: {
    color: '#64748B',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  emptyStateTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  emptyStateSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14A39F',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  floatingAddBtn: {
    position: 'absolute',
    right: 18,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14A39F',
    paddingHorizontal: 18,
    paddingVertical: 12,
    borderRadius: 24,
    shadowColor: '#14A39F',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  floatingAddBtnText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
});
