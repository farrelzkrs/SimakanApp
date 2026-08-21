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

import { useTransactions, TransactionItem } from '@/context/TransactionContext';
import OrderModal, { OrderFormData } from '@/components/OrderModal';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type DebtFilterType = 'ALL' | 'UNPAID' | 'PAID' | 'INCOME_DEBT' | 'EXPENSE_DEBT';

interface DebtorGroup {
  key: string;
  debtorName: string;
  avatarInitial: string;
  items: TransactionItem[];
  totalAmount: number;
  unpaidAmount: number;
  paidAmount: number;
  unpaidCount: number;
  paidCount: number;
  hasUnpaid: boolean;
  hasIncomeDebt: boolean;
  hasExpenseDebt: boolean;
  latestTimestamp: number;
}

export default function StatisticsScreen() {
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  const {
    transactions,
    toggleDebtStatus,
    settleAllDebtsForPerson,
    deleteTransaction,
    addTransaction,
  } = useTransactions();


  const [activeFilter, setActiveFilter] = useState<DebtFilterType>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<OrderFormData | null>(null);

  // Expanded debtor groups map (key: boolean)
  const [expandedDebtorKeys, setExpandedDebtorKeys] = useState<Record<string, boolean>>({});

  // Extract all transactions that are debts or have debtorName
  const allDebtTransactions = useMemo(() => {
    return transactions.filter(
      (t) => t.paymentMethod === 'Hutang' || !!t.debtorName || t.debtStatus === 'Belum Lunas'
    );
  }, [transactions]);

  // Aggregate Debtor Groups (Grouped by Debtor Name)
  const groupedDebtors = useMemo<DebtorGroup[]>(() => {
    const map = new Map<string, DebtorGroup>();

    allDebtTransactions.forEach((t) => {
      const rawName = (t.debtorName || 'Pelanggan Tanpa Nama').trim();
      const normKey = rawName.toLowerCase();
      const isUnpaid = t.debtStatus === 'Belum Lunas' || (!t.debtStatus && t.paymentMethod === 'Hutang');

      if (!map.has(normKey)) {
        const initial = rawName.charAt(0).toUpperCase() || 'H';
        map.set(normKey, {
          key: normKey,
          debtorName: rawName,
          avatarInitial: initial,
          items: [],
          totalAmount: 0,
          unpaidAmount: 0,
          paidAmount: 0,
          unpaidCount: 0,
          paidCount: 0,
          hasUnpaid: false,
          hasIncomeDebt: false,
          hasExpenseDebt: false,
          latestTimestamp: t.timestamp || 0,
        });
      }

      const grp = map.get(normKey)!;
      grp.items.push(t);
      grp.totalAmount += t.total;
      if (isUnpaid) {
        grp.unpaidAmount += t.total;
        grp.unpaidCount += 1;
        grp.hasUnpaid = true;
      } else {
        grp.paidAmount += t.total;
        grp.paidCount += 1;
      }
      if (t.transactionType === 'IN') grp.hasIncomeDebt = true;
      if (t.transactionType === 'OUT') grp.hasExpenseDebt = true;
      if ((t.timestamp || 0) > grp.latestTimestamp) {
        grp.latestTimestamp = t.timestamp || 0;
      }
    });

    return Array.from(map.values()).sort((a, b) => {
      // Prioritize groups with unpaid debts first, then latest timestamp
      if (a.hasUnpaid && !b.hasUnpaid) return -1;
      if (!a.hasUnpaid && b.hasUnpaid) return 1;
      return b.latestTimestamp - a.latestTimestamp;
    });
  }, [allDebtTransactions]);

  // Aggregate Screen Metrics
  const metrics = useMemo(() => {
    let unpaidTotal = 0;
    let unpaidCount = 0;
    let paidTotal = 0;
    let paidCount = 0;
    let customerReceivableTotal = 0;
    let supplierDebtTotal = 0;

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
      totalPersons: groupedDebtors.length,
      totalRecords: allDebtTransactions.length,
    };
  }, [allDebtTransactions, groupedDebtors]);

  // Filtered Debtor Groups based on Search & Active Filter Tab
  const filteredDebtorGroups = useMemo(() => {
    return groupedDebtors.filter((grp) => {
      // 1. Filter Tab
      if (activeFilter === 'UNPAID' && !grp.hasUnpaid) return false;
      if (activeFilter === 'PAID' && grp.hasUnpaid) return false;
      if (activeFilter === 'INCOME_DEBT' && !grp.hasIncomeDebt) return false;
      if (activeFilter === 'EXPENSE_DEBT' && !grp.hasExpenseDebt) return false;

      // 2. Search Query (Name of debtor, item name, or category inside the group)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDebtor = grp.debtorName.toLowerCase().includes(q);
        const matchItem = grp.items.some(
          (i) => i.name.toLowerCase().includes(q) || i.category.toLowerCase().includes(q)
        );
        return matchDebtor || matchItem;
      }

      return true;
    });
  }, [groupedDebtors, activeFilter, searchQuery]);

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const toggleExpandDebtor = (key: string) => {
    setExpandedDebtorKeys((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleToggleItemStatus = (item: TransactionItem, personName: string) => {
    const isCurrentlyUnpaid =
      item.debtStatus === 'Belum Lunas' || (!item.debtStatus && item.paymentMethod === 'Hutang');

    Alert.alert(
      isCurrentlyUnpaid ? 'Konfirmasi Pelunasan' : 'Ubah ke Belum Lunas',
      isCurrentlyUnpaid
        ? `Tandai tagihan "${item.name}" (${formatRupiah(item.total)}) dari ${personName} sebagai LUNAS?`
        : `Kembalikan status tagihan "${item.name}" menjadi BELUM LUNAS?`,
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
                ? `Tagihan "${item.name}" berhasil dilunasi!`
                : `Status diubah kembali ke Belum Lunas.`
            );
          },
        },
      ]
    );
  };

  const handleSettleAllForPerson = (grp: DebtorGroup) => {
    Alert.alert(
      'Lunasi Semua Tagihan',
      `Apakah Anda yakin ingin menandai SEMUA ${grp.unpaidCount} tagihan dari "${grp.debtorName}" (Total: ${formatRupiah(
        grp.unpaidAmount
      )}) sebagai LUNAS?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Lunasi Semua',
          style: 'default',
          onPress: () => {
            settleAllDebtsForPerson(grp.debtorName);
            Alert.alert('Berhasil', `Semua hutang atas nama "${grp.debtorName}" telah lunas!`);
          },
        },
      ]
    );
  };

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert('Hapus Transaksi', `Yakin ingin menghapus catatan tagihan "${name}"?`, [
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
    addTransaction(data);
    setIsModalOpen(false);
    setEditingItem(null);
    Alert.alert('Sukses', `Catatan hutang untuk "${data.debtorName || data.name}" berhasil dicatat!`);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Banner Header */}
      <View style={styles.topHeaderBackground}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <View style={styles.headerTitleContainer}>
              <Text style={styles.headerTitle}>Daftar Hutang</Text>
              <Text style={styles.headerSubtitle}>
                {metrics.totalPersons} Orang • {metrics.unpaidCount} Tagihan Belum Lunas
              </Text>
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
                <Text style={styles.badgeAmberText}>{metrics.unpaidCount} Tagihan Belum Lunas</Text>
              </View>
            </View>
            <Text style={styles.metricLabel}>Total Hutang Belum Lunas</Text>
            <Text style={styles.metricValueAmber}>{formatRupiah(metrics.unpaidTotal)}</Text>
          </View>


        </View>

        {/* Live Search Bar */}
        <View style={styles.searchBarContainer}>
          <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchBarInput}
            placeholder="Cari nama orang / nama barang hutang..."
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
              Semua ({metrics.totalPersons} Orang)
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
              Belum Lunas ({groupedDebtors.filter((g) => g.hasUnpaid).length})
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
              Semua Lunas ({groupedDebtors.filter((g) => !g.hasUnpaid).length})
            </Text>
          </TouchableOpacity>

        </ScrollView>

        {/* Section Header */}
        <View style={styles.listHeaderRow}>
          <Text style={styles.listHeaderTitle}>
            Daftar Orang Berhutang ({filteredDebtorGroups.length})
          </Text>
        </View>

        {/* Grouped Debtor Accordion Cards List */}
        {filteredDebtorGroups.length > 0 ? (
          filteredDebtorGroups.map((grp) => {
            const isExpanded = !!expandedDebtorKeys[grp.key];

            return (
              <View
                key={grp.key}
                style={[
                  styles.debtorGroupCard,
                  grp.hasUnpaid ? styles.debtorGroupCardUnpaid : styles.debtorGroupCardPaid,
                ]}
              >
                {/* Main Debtor Card Trigger (Tap to Expand/Collapse) */}
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.debtorHeaderPressable}
                  onPress={() => toggleExpandDebtor(grp.key)}
                >
                  <View style={styles.debtorMainRow}>
                    {/* Avatar Circle */}
                    <View
                      style={[
                        styles.debtorAvatar,
                        { backgroundColor: grp.hasUnpaid ? '#FEF3C7' : '#DCFCE7' },
                      ]}
                    >
                      <Text
                        style={[
                          styles.debtorAvatarText,
                          { color: grp.hasUnpaid ? '#B45309' : '#15803D' },
                        ]}
                      >
                        {grp.avatarInitial}
                      </Text>
                    </View>

                    {/* Debtor Name & Item Count Info */}
                    <View style={{ flex: 1, marginRight: 8 }}>
                      <Text style={styles.debtorNameTitle}>{grp.debtorName}</Text>
                      <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3, flexWrap: 'wrap', gap: 6 }}>
                        <View style={styles.trxCountBadge}>
                          <Ionicons name="receipt-outline" size={11} color="#64748B" style={{ marginRight: 3 }} />
                          <Text style={styles.trxCountBadgeText}>{grp.items.length} Transaksi</Text>
                        </View>

                      </View>
                    </View>

                    {/* Right Nominal & Status Pill */}
                    <View style={styles.debtorRightBlock}>
                      <Text style={styles.debtorTotalAmountText}>
                        {formatRupiah(grp.hasUnpaid ? grp.unpaidAmount : grp.totalAmount)}
                      </Text>
                      <View
                        style={[
                          styles.statusPill,
                          grp.hasUnpaid ? styles.statusPillUnpaid : styles.statusPillPaid,
                        ]}
                      >
                        <Ionicons
                          name={grp.hasUnpaid ? 'time' : 'checkmark-circle'}
                          size={11}
                          color={grp.hasUnpaid ? '#D97706' : '#16A34A'}
                          style={{ marginRight: 3 }}
                        />
                        <Text
                          style={[
                            styles.statusPillText,
                            grp.hasUnpaid ? styles.statusPillTextUnpaid : styles.statusPillTextPaid,
                          ]}
                        >
                          {grp.hasUnpaid ? `${grp.unpaidCount} Belum Lunas` : 'Lunas'}
                        </Text>
                      </View>
                    </View>

                    {/* Chevron Indicator */}
                    <View style={styles.chevronBox}>
                      <Ionicons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={18}
                        color="#94A3B8"
                      />
                    </View>
                  </View>
                </TouchableOpacity>

                {/* EXPANDED TRANSACTION HISTORY DRAWER */}
                {isExpanded && (
                  <View style={styles.drawerContainer}>
                    <View style={styles.drawerHeaderRow}>
                      <Text style={styles.drawerHeaderTitle}>
                        Rincian Transaksi ({grp.items.length} Item)
                      </Text>
                      {grp.hasUnpaid && grp.unpaidCount > 1 && (
                        <TouchableOpacity
                          activeOpacity={0.8}
                          style={styles.settleAllBtn}
                          onPress={() => handleSettleAllForPerson(grp)}
                        >
                          <Ionicons name="checkmark-done" size={13} color="#FFFFFF" style={{ marginRight: 4 }} />
                          <Text style={styles.settleAllBtnText}>Lunasi Semua ({grp.unpaidCount})</Text>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* Individual Items List */}
                    {grp.items.map((item, idx) => {
                      const isItemUnpaid =
                        item.debtStatus === 'Belum Lunas' ||
                        (!item.debtStatus && item.paymentMethod === 'Hutang');

                      return (
                        <View
                          key={item.id}
                          style={[
                            styles.subItemRow,
                            idx < grp.items.length - 1 && styles.subItemRowBorder,
                            isItemUnpaid ? styles.subItemUnpaidBg : styles.subItemPaidBg,
                          ]}
                        >
                          {/* Item Left Info */}
                          <View style={{ flex: 1, marginRight: 10 }}>
                            <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' }}>
                              <Text style={styles.subItemName}>{item.name}</Text>

                            </View>

                            <Text style={styles.subItemQtyPrice}>
                              {item.quantity} {item.unit} @ {formatRupiah(item.price)}
                            </Text>

                            <Text style={styles.subItemDateText}>
                              📅 {item.fullDateText || item.dateKey} • {item.timeText || '12:00 WIB'}
                            </Text>
                          </View>

                          {/* Item Right Nominal & Actions */}
                          <View style={{ alignItems: 'flex-end' }}>
                            <Text style={styles.subItemNominal}>{formatRupiah(item.total)}</Text>

                            <View style={styles.subItemActionsRow}>
                              {/* Delete button */}
                              <TouchableOpacity
                                activeOpacity={0.7}
                                style={styles.subItemDeleteBtn}
                                onPress={() => handleDeleteItem(item.id, item.name)}
                              >
                                <Ionicons name="trash-outline" size={14} color="#94A3B8" />
                              </TouchableOpacity>

                              {/* Toggle Status Button */}
                              <TouchableOpacity
                                activeOpacity={0.85}
                                style={[
                                  styles.subItemPayBtn,
                                  isItemUnpaid
                                    ? styles.subItemPayBtnUnpaid
                                    : styles.subItemPayBtnPaid,
                                ]}
                                onPress={() => handleToggleItemStatus(item, grp.debtorName)}
                              >
                                <Ionicons
                                  name={
                                    isItemUnpaid
                                      ? 'checkmark-circle-outline'
                                      : 'refresh-outline'
                                  }
                                  size={13}
                                  color={isItemUnpaid ? '#FFFFFF' : '#475569'}
                                  style={{ marginRight: 3 }}
                                />
                                <Text
                                  style={[
                                    styles.subItemPayBtnText,
                                    isItemUnpaid
                                      ? styles.subItemPayBtnTextUnpaid
                                      : styles.subItemPayBtnTextPaid,
                                  ]}
                                >
                                  {isItemUnpaid ? 'Lunasi' : 'Batal'}
                                </Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            );
          })
        ) : (
          <View style={styles.emptyStateContainer}>
            <View style={styles.emptyIconCircle}>
              <Ionicons name="people-outline" size={38} color="#94A3B8" />
            </View>
            <Text style={styles.emptyStateTitle}>Tidak ada catatan hutang</Text>
            <Text style={styles.emptyStateSub}>
              {searchQuery
                ? `Tidak ditemukan penghutang dengan kata kunci "${searchQuery}".`
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
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
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
  subMetricsRow: {
    flexDirection: 'row',
  },
  metricCardSub: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  metricCardHeaderMini: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  iconCircleMini: {
    width: 22,
    height: 22,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  metricSubTag: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    flex: 1,
  },
  metricValueMini: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0D9488',
    marginTop: 2,
  },
  metricSubHint: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
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
  debtorGroupCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  debtorGroupCardUnpaid: {
    borderColor: '#FED7AA',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
  },
  debtorGroupCardPaid: {
    borderColor: '#E2E8F0',
    opacity: 0.9,
  },
  debtorHeaderPressable: {
    padding: 14,
  },
  debtorMainRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  debtorAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  debtorAvatarText: {
    fontSize: 17,
    fontWeight: '900',
  },
  debtorNameTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  trxCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  trxCountBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#475569',
  },
  typeTagMini: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  typeTagMiniText: {
    fontSize: 9,
    fontWeight: '800',
  },
  debtorRightBlock: {
    alignItems: 'flex-end',
    marginRight: 6,
  },
  debtorTotalAmountText: {
    fontSize: 15,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 3,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPillUnpaid: {
    backgroundColor: '#FEF3C7',
  },
  statusPillPaid: {
    backgroundColor: '#DCFCE7',
  },
  statusPillText: {
    fontSize: 10,
    fontWeight: '800',
  },
  statusPillTextUnpaid: {
    color: '#B45309',
  },
  statusPillTextPaid: {
    color: '#15803D',
  },
  chevronBox: {
    padding: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  drawerContainer: {
    backgroundColor: '#F8FAFC',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  drawerHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  drawerHeaderTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#475569',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  settleAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#16A34A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  settleAllBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  subItemRow: {
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subItemRowBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  subItemUnpaidBg: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  subItemPaidBg: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    opacity: 0.85,
  },
  subItemName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginRight: 6,
  },
  subItemTypePill: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 1,
  },
  subItemTypePillText: {
    fontSize: 9,
    fontWeight: '800',
  },
  subItemQtyPrice: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  subItemDateText: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
    marginTop: 2,
  },
  subItemNominal: {
    fontSize: 13,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 4,
  },
  subItemActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  subItemDeleteBtn: {
    padding: 5,
    borderRadius: 6,
    backgroundColor: '#F1F5F9',
  },
  subItemPayBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  subItemPayBtnUnpaid: {
    backgroundColor: '#16A34A',
  },
  subItemPayBtnPaid: {
    backgroundColor: '#E2E8F0',
  },
  subItemPayBtnText: {
    fontSize: 10,
    fontWeight: '800',
  },
  subItemPayBtnTextUnpaid: {
    color: '#FFFFFF',
  },
  subItemPayBtnTextPaid: {
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
