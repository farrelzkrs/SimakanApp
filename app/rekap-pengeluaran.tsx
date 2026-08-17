import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  Platform,
  Dimensions,
  Modal,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import OrderModal, { OrderFormData } from '@/components/OrderModal';
import { useTransactions, TransactionItem } from '@/context/TransactionContext';
import { useInventory } from '@/context/InventoryContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// 1. DATA MASTER BULAN
const MONTH_OPTIONS = [
  { id: '2026-08', label: 'Agustus 2026', shortLabel: 'Agustus' },
  { id: '2026-07', label: 'Juli 2026', shortLabel: 'Juli' },
  { id: '2026-06', label: 'Juni 2026', shortLabel: 'Juni' },
  { id: '2026-05', label: 'Mei 2026', shortLabel: 'Mei' },
  { id: '2026-04', label: 'April 2026', shortLabel: 'April' },
  { id: '2026-03', label: 'Maret 2026', shortLabel: 'Maret' },
  { id: '2026-02', label: 'Februari 2026', shortLabel: 'Februari' },
  { id: '2026-01', label: 'Januari 2026', shortLabel: 'Januari' },
  { id: 'ALL', label: 'Semua Bulan (2026)', shortLabel: 'Semua' },
];

// 2. DATA MASTER MINGGU
const WEEK_OPTIONS = [
  { id: 'ALL', label: 'Semua Minggu', shortLabel: 'Semua' },
  { id: 'W1', label: 'Minggu Ke-1 (01 - 07)', shortLabel: 'Minggu 1' },
  { id: 'W2', label: 'Minggu Ke-2 (08 - 14)', shortLabel: 'Minggu 2' },
  { id: 'W3', label: 'Minggu Ke-3 (15 - 21)', shortLabel: 'Minggu 3' },
  { id: 'W4', label: 'Minggu Ke-4 (22 - 28)', shortLabel: 'Minggu 4' },
  { id: 'W5', label: 'Minggu Ke-5 (29 - 31)', shortLabel: 'Minggu 5' },
];

export default function RekapPengeluaranScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  const { transactions, addTransaction, deleteTransaction } = useTransactions();
  const { registerOrRestockExpenseItem } = useInventory();

  // Cascading Filter States
  const [selectedMonth, setSelectedMonth] = useState<string>('2026-08');
  const [selectedWeek, setSelectedWeek] = useState<string>('ALL');
  const [selectedDate, setSelectedDate] = useState<string>('ALL');

  // Active Dropdown Modal State
  const [activeDropdownType, setActiveDropdownType] = useState<'MONTH' | 'WEEK' | 'DAY' | null>(null);

  // Add Transaction Modal State
  const [orderModalVisible, setOrderModalVisible] = useState<boolean>(false);

  // Dynamic Day Options based on selected Month and Week
  const dynamicDayOptions = useMemo(() => {
    const options: { id: string; label: string; shortLabel: string }[] = [
      { id: 'ALL', label: 'Semua Hari & Tanggal', shortLabel: 'Semua' },
    ];

    // Find dates that exist in transactions for expense
    const matchedDates = new Set<string>();
    transactions.forEach((t) => {
      if (t.transactionType === 'OUT') {
        const matchMonth = selectedMonth === 'ALL' || t.monthKey === selectedMonth;
        const matchWeek = selectedWeek === 'ALL' || t.weekKey === selectedWeek;
        if (matchMonth && matchWeek && t.dateKey) {
          matchedDates.add(t.dateKey);
        }
      }
    });

    // If month is August 2026, also supply default key days for easy filtering
    if (selectedMonth === '2026-08' || selectedMonth === 'ALL') {
      if (selectedWeek === 'W3' || selectedWeek === 'ALL') {
        matchedDates.add('2026-08-15');
      }
      if (selectedWeek === 'W2' || selectedWeek === 'ALL') {
        matchedDates.add('2026-08-14');
        matchedDates.add('2026-08-12');
        matchedDates.add('2026-08-10');
      }
      if (selectedWeek === 'W1' || selectedWeek === 'ALL') {
        matchedDates.add('2026-08-04');
      }
    }

    const sortedDates = Array.from(matchedDates).sort((a, b) => b.localeCompare(a));
    sortedDates.forEach((dStr) => {
      const parts = dStr.split('-');
      if (parts.length === 3) {
        const dObj = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        const dayName = dObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' });
        options.push({
          id: dStr,
          label: dObj.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }),
          shortLabel: dayName,
        });
      }
    });

    return options;
  }, [selectedMonth, selectedWeek, transactions]);

  // Filtered Transactions for Rekap Pengeluaran
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (t.transactionType !== 'OUT') return false;
      if (selectedMonth !== 'ALL' && t.monthKey !== selectedMonth) return false;
      if (selectedWeek !== 'ALL' && t.weekKey !== selectedWeek) return false;
      if (selectedDate !== 'ALL' && t.dateKey !== selectedDate) return false;
      return true;
    });
  }, [transactions, selectedMonth, selectedWeek, selectedDate]);

  // Aggregate Metrics
  const totalAmount = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => acc + curr.total, 0);
  }, [filteredTransactions]);

  const totalQuantity = useMemo(() => {
    return filteredTransactions.reduce((acc, curr) => acc + curr.quantity, 0);
  }, [filteredTransactions]);

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  // Label Helpers
  const selectedMonthObj = MONTH_OPTIONS.find((m) => m.id === selectedMonth) || MONTH_OPTIONS[0];
  const selectedWeekObj = WEEK_OPTIONS.find((w) => w.id === selectedWeek) || WEEK_OPTIONS[0];
  const selectedDayObj = dynamicDayOptions.find((d) => d.id === selectedDate) || dynamicDayOptions[0];

  const handleSelectMonth = (monthId: string) => {
    setSelectedMonth(monthId);
    setSelectedWeek('ALL');
    setSelectedDate('ALL');
    setActiveDropdownType(null);
  };

  const handleSelectWeek = (weekId: string) => {
    setSelectedWeek(weekId);
    setSelectedDate('ALL');
    setActiveDropdownType(null);
  };

  const handleSelectDay = (dayId: string) => {
    setSelectedDate(dayId);
    setActiveDropdownType(null);
  };

  const handleResetFilter = () => {
    setSelectedMonth('2026-08');
    setSelectedWeek('ALL');
    setSelectedDate('ALL');
  };

  const handleDeleteItem = (id: string, name: string) => {
    Alert.alert(
      'Hapus Transaksi',
      `Yakin ingin menghapus item "${name}" dari rekap pengeluaran?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Hapus',
          style: 'destructive',
          onPress: () => {
            deleteTransaction(id);
          },
        },
      ]
    );
  };

  const handleSaveTransaction = (data: OrderFormData) => {
    addTransaction(data, 'day-sat');
    registerOrRestockExpenseItem({
      name: data.name,
      category: data.category,
      quantity: data.quantity,
      unit: data.unit,
      price: data.price,
    });
    setOrderModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Banner Header (Orange/Red for Pengeluaran) */}
      <View style={styles.topHeaderBackground}>
        <SafeAreaView style={styles.headerSafeArea}>
          <View style={styles.headerRow}>
            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={26} color="#FFFFFF" />
            </TouchableOpacity>

            <Text style={styles.headerTitle}>Rekap Pengeluaran</Text>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.addHeaderBtn}
              onPress={() => setOrderModalVisible(true)}
            >
              <Ionicons name="add-circle" size={26} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Dynamic Top KPI Summary Card */}
          <View style={styles.summaryCard}>
            {/* Filter Breadcrumb */}
            <View style={styles.filterBreadcrumbRow}>
              <View style={styles.badgeIndicator}>
                <Ionicons name="funnel" size={12} color="#EA580C" />
                <Text style={styles.badgeIndicatorText}>Periode Aktif</Text>
              </View>
              <Text style={styles.breadcrumbText} numberOfLines={1}>
                {selectedMonthObj.shortLabel}
                {selectedWeek !== 'ALL' ? ` › ${selectedWeekObj.shortLabel}` : ''}
                {selectedDate !== 'ALL' ? ` › ${selectedDayObj.shortLabel}` : ''}
              </Text>
            </View>

            <View style={styles.summaryDivider} />

            {/* Metrics Triplet */}
            <View style={styles.metricsRow}>
              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>Total Transaksi</Text>
                <Text style={styles.metricValCount}>{filteredTransactions.length} Data</Text>
              </View>

              <View style={styles.verticalDivider} />

              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>Total Qty</Text>
                <Text style={styles.metricValQty}>{totalQuantity} Items</Text>
              </View>

              <View style={styles.verticalDivider} />

              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>Total Pengeluaran</Text>
                <Text style={styles.metricValExpense}>{formatRupiah(totalAmount)}</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 40 + bottomInset }]}
      >
        {/* ========================================================
            CASCADING MULTI-DROPDOWN FILTER BAR (Bulan -> Minggu -> Hari)
        ======================================================== */}
        <View style={styles.filterSectionCard}>
          <View style={styles.filterSectionHeader}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="options-outline" size={18} color="#EA580C" style={{ marginRight: 6 }} />
              <Text style={styles.filterSectionTitle}>Filter Rekap Bertingkat</Text>
            </View>
            {(selectedMonth !== '2026-08' || selectedWeek !== 'ALL' || selectedDate !== 'ALL') && (
              <TouchableOpacity activeOpacity={0.7} onPress={handleResetFilter}>
                <Text style={styles.resetFilterText}>Reset Filter</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Cascading 3 Dropdown Row */}
          <View style={styles.dropdownsRow}>
            {/* 1. Dropdown BULAN */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.dropdownButton,
                selectedMonth !== 'ALL' && styles.dropdownButtonActive,
              ]}
              onPress={() => setActiveDropdownType('MONTH')}
            >
              <View style={styles.dropdownBtnContent}>
                <Text style={styles.dropdownBtnLabel}>1. Bulan</Text>
                <Text style={styles.dropdownBtnValue} numberOfLines={1}>
                  {selectedMonthObj.shortLabel}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {/* 2. Dropdown MINGGU */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.dropdownButton,
                selectedWeek !== 'ALL' && styles.dropdownButtonActive,
              ]}
              onPress={() => setActiveDropdownType('WEEK')}
            >
              <View style={styles.dropdownBtnContent}>
                <Text style={styles.dropdownBtnLabel}>2. Minggu</Text>
                <Text style={styles.dropdownBtnValue} numberOfLines={1}>
                  {selectedWeekObj.shortLabel}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>

            {/* 3. Dropdown HARI & TANGGAL */}
            <TouchableOpacity
              activeOpacity={0.8}
              style={[
                styles.dropdownButton,
                selectedDate !== 'ALL' && styles.dropdownButtonActive,
              ]}
              onPress={() => setActiveDropdownType('DAY')}
            >
              <View style={styles.dropdownBtnContent}>
                <Text style={styles.dropdownBtnLabel}>3. Hari</Text>
                <Text style={styles.dropdownBtnValue} numberOfLines={1}>
                  {selectedDayObj.shortLabel}
                </Text>
              </View>
              <Ionicons name="chevron-down" size={14} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>

        {/* ========================================================
            REKAP TABEL (Expense Accounting Table View)
        ======================================================== */}
        <View style={styles.tableCardContainer}>
          {/* Table Card Top Bar */}
          <View style={styles.tableCardTopBar}>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Ionicons name="grid" size={18} color="#EA580C" style={{ marginRight: 8 }} />
              <Text style={styles.tableCardTitle}>Tabel Rekapitulasi Pengeluaran</Text>
            </View>
            <View style={styles.countBadge}>
              <Text style={styles.countBadgeText}>{filteredTransactions.length} Baris</Text>
            </View>
          </View>

          {/* Horizontal Scrollable Table Wrapper */}
          {filteredTransactions.length > 0 ? (
            <ScrollView horizontal showsHorizontalScrollIndicator={true} style={styles.horizontalScroll}>
              <View style={styles.tableStructure}>
                {/* Table Header Row */}
                <View style={styles.tableHeaderRow}>
                  <Text style={[styles.thText, { width: 44, textAlign: 'center' }]}>No</Text>
                  <Text style={[styles.thText, { width: 140 }]}>Tanggal & Waktu</Text>
                  <Text style={[styles.thText, { width: 180 }]}>Nama Pengeluaran / Barang</Text>
                  <Text style={[styles.thText, { width: 110 }]}>Kategori</Text>
                  <Text style={[styles.thText, { width: 75, textAlign: 'center' }]}>Qty</Text>
                  <Text style={[styles.thText, { width: 110, textAlign: 'right' }]}>Harga (Rp)</Text>
                  <Text style={[styles.thText, { width: 130, textAlign: 'right' }]}>Total (Rp)</Text>
                  <Text style={[styles.thText, { width: 90, textAlign: 'center' }]}>Status</Text>
                  <Text style={[styles.thText, { width: 60, textAlign: 'center' }]}>Aksi</Text>
                </View>

                {/* Table Body Rows */}
                {filteredTransactions.map((item, index) => {
                  const isEven = index % 2 === 0;
                  return (
                    <View
                      key={item.id}
                      style={[styles.tableDataRow, isEven ? styles.rowEven : styles.rowOdd]}
                    >
                      {/* No */}
                      <Text style={[styles.tdText, { width: 44, textAlign: 'center', color: '#64748B' }]}>
                        {index + 1}
                      </Text>

                      {/* Tanggal & Waktu */}
                      <View style={{ width: 140, paddingRight: 8 }}>
                        <Text style={styles.datePrimaryText}>{item.fullDateText.split(',')[0] || ''}</Text>
                        <Text style={styles.dateSubText}>
                          {item.fullDateText.includes(',') ? item.fullDateText.split(',')[1].trim() : item.fullDateText}
                        </Text>
                        <Text style={styles.timeTagText}>{item.timeText}</Text>
                      </View>

                      {/* Nama Barang/Pengeluaran */}
                      <View style={{ width: 180, paddingRight: 8 }}>
                        <Text style={styles.itemTitleText}>{item.name}</Text>
                      </View>

                      {/* Kategori */}
                      <View style={{ width: 110, paddingRight: 8 }}>
                        <View style={styles.categoryPillOrange}>
                          <Text style={styles.categoryPillText}>{item.category}</Text>
                        </View>
                      </View>

                      {/* Qty */}
                      <View style={{ width: 75, alignItems: 'center' }}>
                        <Text style={styles.qtyText}>
                          {item.quantity} <Text style={{ fontSize: 11, color: '#64748B' }}>{item.unit}</Text>
                        </Text>
                      </View>

                      {/* Harga Satuan */}
                      <Text style={[styles.tdText, { width: 110, textAlign: 'right', color: '#475569' }]}>
                        {item.price.toLocaleString('id-ID')}
                      </Text>

                      {/* Total */}
                      <Text style={[styles.tdText, { width: 130, textAlign: 'right', fontWeight: '800', color: '#EF4444' }]}>
                        {formatRupiah(item.total)}
                      </Text>

                      {/* Status / Metode */}
                      <View style={{ width: 90, alignItems: 'center' }}>
                        <View
                          style={[
                            styles.statusBadge,
                            item.paymentMethod === 'Lunas' ? styles.statusLunas : styles.statusHutang,
                          ]}
                        >
                          <Text
                            style={[
                              styles.statusBadgeText,
                              item.paymentMethod === 'Lunas'
                                ? { color: '#065F46' }
                                : { color: '#92400E' },
                            ]}
                          >
                            {item.paymentMethod}
                          </Text>
                        </View>
                      </View>

                      {/* Aksi */}
                      <View style={{ width: 60, alignItems: 'center' }}>
                        <TouchableOpacity
                          activeOpacity={0.7}
                          style={styles.deleteBtn}
                          onPress={() => handleDeleteItem(item.id, item.name)}
                        >
                          <Ionicons name="trash-outline" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  );
                })}

                {/* Table Summary Footer Row */}
                <View style={styles.tableFooterRow}>
                  <View style={{ width: 474, paddingLeft: 12 }}>
                    <Text style={styles.footerLabelTitle}>TOTAL KESELURUHAN PENGELUARAN</Text>
                    <Text style={styles.footerLabelSub}>
                      {filteredTransactions.length} Transaksi Terpilih
                    </Text>
                  </View>

                  <View style={{ width: 75, alignItems: 'center' }}>
                    <Text style={styles.footerQtyTotal}>{totalQuantity}</Text>
                  </View>

                  <View style={{ width: 110 }} />

                  <View style={{ width: 130, alignItems: 'flex-end', paddingRight: 8 }}>
                    <Text style={styles.footerGrandTotalExpense}>{formatRupiah(totalAmount)}</Text>
                  </View>

                  <View style={{ width: 150 }} />
                </View>
              </View>
            </ScrollView>
          ) : (
            /* Empty State */
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="file-tray-outline" size={44} color="#94A3B8" />
              </View>
              <Text style={styles.emptyTitle}>Tidak Ada Data Pengeluaran</Text>
              <Text style={styles.emptySubtitle}>
                Tidak ada transaksi pada filter periode {selectedMonthObj.shortLabel}
                {selectedWeek !== 'ALL' ? ` (${selectedWeekObj.shortLabel})` : ''}
                {selectedDate !== 'ALL' ? ` (${selectedDayObj.shortLabel})` : ''}.
              </Text>
              <TouchableOpacity
                activeOpacity={0.8}
                style={styles.emptyAddBtnOrange}
                onPress={() => setOrderModalVisible(true)}
              >
                <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text style={styles.emptyAddBtnText}>Tambah Pengeluaran Baru</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Quick Floating Add Bar */}
        <TouchableOpacity
          activeOpacity={0.85}
          style={styles.bottomFloatingBtn}
          onPress={() => setOrderModalVisible(true)}
        >
          <Ionicons name="add-circle" size={22} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.bottomFloatingBtnText}>+ Tambah Transaksi Pengeluaran</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* ========================================================
          DROPDOWN SELECTION MODAL (Bulan / Minggu / Hari)
      ======================================================== */}
      <Modal
        visible={activeDropdownType !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setActiveDropdownType(null)}
      >
        <TouchableWithoutFeedback onPress={() => setActiveDropdownType(null)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.dropdownModalCard}>
                {/* Modal Title Bar */}
                <View style={styles.dropdownModalHeader}>
                  <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                    <Ionicons
                      name={
                        activeDropdownType === 'MONTH'
                          ? 'calendar'
                          : activeDropdownType === 'WEEK'
                          ? 'time'
                          : 'today'
                      }
                      size={20}
                      color="#EA580C"
                      style={{ marginRight: 8 }}
                    />
                    <Text style={styles.dropdownModalTitle}>
                      {activeDropdownType === 'MONTH'
                        ? 'Pilih Bulan Rekap'
                        : activeDropdownType === 'WEEK'
                        ? 'Pilih Minggu ke-Berapa'
                        : 'Pilih Hari & Tanggal'}
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setActiveDropdownType(null)}
                    style={{ padding: 4 }}
                  >
                    <Ionicons name="close" size={22} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.dropdownModalDivider} />

                {/* List of Options */}
                <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                  {activeDropdownType === 'MONTH' &&
                    MONTH_OPTIONS.map((opt) => {
                      const isSelected = selectedMonth === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          activeOpacity={0.7}
                          style={[
                            styles.dropdownModalItem,
                            isSelected && styles.dropdownModalItemActive,
                          ]}
                          onPress={() => handleSelectMonth(opt.id)}
                        >
                          <Text
                            style={[
                              styles.dropdownModalItemText,
                              isSelected && styles.dropdownModalItemTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color="#EA580C" />
                          )}
                        </TouchableOpacity>
                      );
                    })}

                  {activeDropdownType === 'WEEK' &&
                    WEEK_OPTIONS.map((opt) => {
                      const isSelected = selectedWeek === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          activeOpacity={0.7}
                          style={[
                            styles.dropdownModalItem,
                            isSelected && styles.dropdownModalItemActive,
                          ]}
                          onPress={() => handleSelectWeek(opt.id)}
                        >
                          <Text
                            style={[
                              styles.dropdownModalItemText,
                              isSelected && styles.dropdownModalItemTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color="#EA580C" />
                          )}
                        </TouchableOpacity>
                      );
                    })}

                  {activeDropdownType === 'DAY' &&
                    dynamicDayOptions.map((opt) => {
                      const isSelected = selectedDate === opt.id;
                      return (
                        <TouchableOpacity
                          key={opt.id}
                          activeOpacity={0.7}
                          style={[
                            styles.dropdownModalItem,
                            isSelected && styles.dropdownModalItemActive,
                          ]}
                          onPress={() => handleSelectDay(opt.id)}
                        >
                          <Text
                            style={[
                              styles.dropdownModalItemText,
                              isSelected && styles.dropdownModalItemTextActive,
                            ]}
                          >
                            {opt.label}
                          </Text>
                          {isSelected && (
                            <Ionicons name="checkmark-circle" size={20} color="#EA580C" />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Order Modal for adding new cashier transaction */}
      <OrderModal
        visible={orderModalVisible}
        onClose={() => setOrderModalVisible(false)}
        onSave={handleSaveTransaction}
        defaultType="OUT"
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
    backgroundColor: '#EA580C',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 6,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  addHeaderBtn: {
    padding: 4,
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  filterBreadcrumbRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  badgeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF7ED',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginRight: 8,
  },
  badgeIndicatorText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#EA580C',
    marginLeft: 4,
  },
  breadcrumbText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  metricColumn: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 2,
  },
  verticalDivider: {
    width: 1,
    height: 38,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 8,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  metricValCount: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  metricValQty: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EA580C',
  },
  metricValExpense: {
    fontSize: 14,
    fontWeight: '800',
    color: '#EF4444',
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  /* FILTER SECTION CARD */
  filterSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  filterSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#334155',
  },
  resetFilterText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  dropdownsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  dropdownButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  dropdownButtonActive: {
    borderColor: '#EA580C',
    backgroundColor: '#FFF7ED',
  },
  dropdownBtnContent: {
    flex: 1,
    marginRight: 4,
  },
  dropdownBtnLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textTransform: 'uppercase',
  },
  dropdownBtnValue: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
    marginTop: 2,
  },
  /* TABLE CARD CONTAINER */
  tableCardContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginBottom: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  tableCardTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    backgroundColor: '#FFFFFF',
  },
  tableCardTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  countBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  countBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
  },
  horizontalScroll: {
    flexGrow: 0,
  },
  tableStructure: {
    minWidth: 840,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  thText: {
    color: '#F8FAFC',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableDataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  rowEven: {
    backgroundColor: '#FFFFFF',
  },
  rowOdd: {
    backgroundColor: '#F8FAFC',
  },
  tdText: {
    fontSize: 12,
    color: '#1E293B',
  },
  datePrimaryText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  dateSubText: {
    fontSize: 11,
    color: '#64748B',
  },
  timeTagText: {
    fontSize: 10,
    color: '#94A3B8',
    marginTop: 1,
  },
  itemTitleText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0F172A',
  },
  categoryPillOrange: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFF7ED',
    borderColor: '#FFEDD5',
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  categoryPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EA580C',
  },
  qtyText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusLunas: {
    backgroundColor: '#D1FAE5',
  },
  statusHutang: {
    backgroundColor: '#FEF3C7',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 6,
    borderRadius: 8,
    backgroundColor: '#FEE2E2',
  },
  tableFooterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderTopWidth: 2,
    borderTopColor: '#CBD5E1',
  },
  footerLabelTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#0F172A',
    letterSpacing: 0.5,
  },
  footerLabelSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  footerQtyTotal: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  footerGrandTotalExpense: {
    fontSize: 15,
    fontWeight: '800',
    color: '#EF4444',
  },
  /* EMPTY STATE */
  emptyContainer: {
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyAddBtnOrange: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 14,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyAddBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  /* FLOATING BOTTOM BUTTON */
  bottomFloatingBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EA580C',
    borderRadius: 16,
    paddingVertical: 14,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  bottomFloatingBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  /* DROPDOWN MODAL STYLES */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dropdownModalCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  dropdownModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 10,
  },
  dropdownModalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  dropdownModalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 10,
  },
  dropdownModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  dropdownModalItemActive: {
    backgroundColor: '#FFF7ED',
  },
  dropdownModalItemText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  dropdownModalItemTextActive: {
    fontWeight: '800',
    color: '#EA580C',
  },
});
