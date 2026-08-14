import React, { useState } from 'react';
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
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import OrderModal, { OrderFormData } from '@/components/OrderModal';
import { useTransactions, TransactionItem } from '@/context/TransactionContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface CalendarCardItem {
  id: string;
  dayName: string;
  dayNumber: string;
  fullDateText: string;
  isRedHeader?: boolean;
}

// 1. DATASET PERIODE: HARI (Urut dari Terbaru: Sabtu s/d Minggu. Hanya Minggu yang Merah)
const MOCK_DAYS_HARI: CalendarCardItem[] = [
  { id: 'day-sat', dayName: 'SAB', dayNumber: '15', fullDateText: 'Sabtu, 15 Agustus 2026', isRedHeader: false },
  { id: 'day-fri', dayName: 'JUM', dayNumber: '14', fullDateText: 'Jumat, 14 Agustus 2026', isRedHeader: false },
  { id: 'day-thu', dayName: 'KAM', dayNumber: '13', fullDateText: 'Kamis, 13 Agustus 2026', isRedHeader: false },
  { id: 'day-wed', dayName: 'RAB', dayNumber: '12', fullDateText: 'Rabu, 12 Agustus 2026', isRedHeader: false },
  { id: 'day-tue', dayName: 'SEL', dayNumber: '11', fullDateText: 'Selasa, 11 Agustus 2026', isRedHeader: false },
  { id: 'day-mon', dayName: 'SEN', dayNumber: '10', fullDateText: 'Senin, 10 Agustus 2026', isRedHeader: false },
  { id: 'day-sun', dayName: 'MIN', dayNumber: '09', fullDateText: 'Minggu, 09 Agustus 2026', isRedHeader: true },
];

// 2. DATASET PERIODE: MINGGU (Terbaru: Minggu ke-5 s/d ke-1)
const MOCK_WEEKS_MINGGU: CalendarCardItem[] = [
  { id: 'week-5', dayName: 'KE-5', dayNumber: 'M-5', fullDateText: 'Minggu Ke-5 (29 - 31 Agustus 2026)', isRedHeader: false },
  { id: 'week-4', dayName: 'KE-4', dayNumber: 'M-4', fullDateText: 'Minggu Ke-4 (22 - 28 Agustus 2026)', isRedHeader: false },
  { id: 'week-3', dayName: 'KE-3', dayNumber: 'M-3', fullDateText: 'Minggu Ke-3 (15 - 21 Agustus 2026)', isRedHeader: false },
  { id: 'week-2', dayName: 'KE-2', dayNumber: 'M-2', fullDateText: 'Minggu Ke-2 (08 - 14 Agustus 2026)', isRedHeader: false },
  { id: 'week-1', dayName: 'KE-1', dayNumber: 'M-1', fullDateText: 'Minggu Ke-1 (01 - 07 Agustus 2026)', isRedHeader: false },
];

// 3. DATASET PERIODE: BULAN (Terbaru: Desember s/d Januari)
const MOCK_MONTHS_BULAN: CalendarCardItem[] = [
  { id: 'm-12', dayName: 'DES', dayNumber: '12', fullDateText: 'Bulan Desember 2026', isRedHeader: false },
  { id: 'm-11', dayName: 'NOV', dayNumber: '11', fullDateText: 'Bulan November 2026', isRedHeader: false },
  { id: 'm-10', dayName: 'OKT', dayNumber: '10', fullDateText: 'Bulan Oktober 2026', isRedHeader: false },
  { id: 'm-9', dayName: 'SEP', dayNumber: '09', fullDateText: 'Bulan September 2026', isRedHeader: false },
  { id: 'm-8', dayName: 'AGU', dayNumber: '08', fullDateText: 'Bulan Agustus 2026', isRedHeader: false },
  { id: 'm-7', dayName: 'JUL', dayNumber: '07', fullDateText: 'Bulan Juli 2026', isRedHeader: false },
  { id: 'm-6', dayName: 'JUN', dayNumber: '06', fullDateText: 'Bulan Juni 2026', isRedHeader: false },
  { id: 'm-5', dayName: 'MEI', dayNumber: '05', fullDateText: 'Bulan Mei 2026', isRedHeader: false },
  { id: 'm-4', dayName: 'APR', dayNumber: '04', fullDateText: 'Bulan April 2026', isRedHeader: false },
  { id: 'm-3', dayName: 'MAR', dayNumber: '03', fullDateText: 'Bulan Maret 2026', isRedHeader: false },
  { id: 'm-2', dayName: 'FEB', dayNumber: '02', fullDateText: 'Bulan Februari 2026', isRedHeader: false },
  { id: 'm-1', dayName: 'JAN', dayNumber: '01', fullDateText: 'Bulan Januari 2026', isRedHeader: false },
];

export default function RekapPemasukanScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  const { transactions, addTransaction } = useTransactions();

  const [activePeriod, setActivePeriod] = useState<'Hari' | 'Minggu' | 'Bulan'>('Hari');
  const [dropdownOpen, setDropdownOpen] = useState<boolean>(false);
  const [selectedDayId, setSelectedDayId] = useState<string>('day-sat');

  // Modals state
  const [tableModalVisible, setTableModalVisible] = useState<boolean>(false);
  const [orderModalVisible, setOrderModalVisible] = useState<boolean>(false);

  // Dynamic active cards list based on Dropdown Period Filter
  const activeCards =
    activePeriod === 'Hari'
      ? MOCK_DAYS_HARI
      : activePeriod === 'Minggu'
      ? MOCK_WEEKS_MINGGU
      : MOCK_MONTHS_BULAN;

  const selectedDay = activeCards.find((d) => d.id === selectedDayId) || activeCards[0];

  // Filter cashier products from central store for the selected day/week/month (Pemasukan only)
  const filteredProducts = transactions.filter(
    (item) => item.dayId === selectedDayId && item.transactionType === 'IN'
  );

  const totalIncomeSelectedDay = filteredProducts.reduce((acc, curr) => acc + curr.total, 0);
  const totalQtySelectedDay = filteredProducts.reduce((acc, curr) => acc + curr.quantity, 0);

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handlePeriodChange = (period: 'Hari' | 'Minggu' | 'Bulan') => {
    setActivePeriod(period);
    setDropdownOpen(false);

    // Auto select first item (newest) of the new period
    if (period === 'Hari') {
      setSelectedDayId(MOCK_DAYS_HARI[0].id);
    } else if (period === 'Minggu') {
      setSelectedDayId(MOCK_WEEKS_MINGGU[0].id);
    } else {
      setSelectedDayId(MOCK_MONTHS_BULAN[0].id);
    }
  };

  // Click handler for calendar date card -> Opens Pop-Up Modal with Table
  const handleCardPress = (dayId: string) => {
    setSelectedDayId(dayId);
    setTableModalVisible(true);
  };

  const handleAddTransaction = (data: OrderFormData) => {
    addTransaction(data, selectedDayId);
    setOrderModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Banner Colored Background (Teal for Income) */}
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

            <Text style={styles.headerTitle}>Rekap Pemasukan</Text>

            <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
              <Ionicons name="calendar-outline" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Dynamic Top Summary Card */}
          <View style={styles.summaryCard}>
            {/* Top Date Header Row */}
            <View style={styles.summaryDateRow}>
              <View style={styles.miniCalendarBox}>
                <View style={styles.miniCalendarHeader}>
                  <View style={styles.miniRingDot} />
                  <View style={styles.miniRingDot} />
                </View>
                <View style={styles.miniCalendarBody}>
                  <Text style={styles.miniCalendarNumber}>{selectedDay.dayNumber}</Text>
                </View>
              </View>

              <Text style={styles.summaryDateTitle}>{selectedDay.fullDateText}</Text>
            </View>

            <View style={styles.summaryDivider} />

            {/* Income / Expense Split Metrics */}
            <View style={styles.metricsRow}>
              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>Total Kuantitas</Text>
                <Text style={styles.metricQtyValue}>{totalQtySelectedDay} Barang</Text>
              </View>

              <View style={styles.verticalDivider} />

              <View style={styles.metricColumn}>
                <Text style={styles.metricLabel}>Total Pemasukan</Text>
                <Text style={styles.metricIncomeValue}>▲ {formatRupiah(totalIncomeSelectedDay)}</Text>
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
        {/* Period Filter Dropdown Selector (Hari / Minggu / Bulan) */}
        <View style={styles.dropdownSection}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={styles.dropdownTrigger}
            onPress={() => setDropdownOpen((prev) => !prev)}
          >
            <View style={styles.dropdownTriggerLeft}>
              <Ionicons name="funnel-outline" size={18} color="#14A39F" style={{ marginRight: 10 }} />
              <Text style={styles.dropdownLabelPrefix}>Periode Rekap: </Text>
              <Text style={styles.dropdownSelectedValue}>{activePeriod}</Text>
            </View>

            <Ionicons
              name={dropdownOpen ? 'chevron-up' : 'chevron-down'}
              size={18}
              color="#64748B"
            />
          </TouchableOpacity>

          {/* Dropdown Options Popup Card */}
          {dropdownOpen && (
            <View style={styles.dropdownMenuCard}>
              {(['Hari', 'Minggu', 'Bulan'] as const).map((periodOption) => {
                const isSelected = activePeriod === periodOption;
                return (
                  <TouchableOpacity
                    key={periodOption}
                    activeOpacity={0.7}
                    style={[styles.dropdownMenuItem, isSelected && styles.dropdownMenuItemActive]}
                    onPress={() => handlePeriodChange(periodOption)}
                  >
                    <Text
                      style={[
                        styles.dropdownMenuText,
                        isSelected && styles.dropdownMenuTextActive,
                      ]}
                    >
                      Rekap Per {periodOption}
                    </Text>
                    {isSelected && <Ionicons name="checkmark-circle" size={18} color="#14A39F" />}
                  </TouchableOpacity>
                );
              })}
            </View>
          )}
        </View>

        {/* Dynamic Card Grid (Hari: Terbaru Sabtu -> Minggu, Minggu: M5 -> M1, Bulan: Des -> Jan) */}
        <View style={styles.calendarGrid}>
          {activeCards.map((item) => {
            const isSelected = selectedDayId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.85}
                style={[styles.calendarCard, isSelected && styles.calendarCardSelected]}
                onPress={() => handleCardPress(item.id)}
              >
                {/* Spiral Binder Rings */}
                <View style={styles.binderRingsRow}>
                  <View style={styles.binderRing} />
                  <View style={styles.binderRing} />
                </View>

                {/* Scalloped Header Banner (Only Minggu/Sun is Red when activePeriod is Hari) */}
                <View
                  style={[
                    styles.cardHeaderBanner,
                    activePeriod === 'Hari'
                      ? item.isRedHeader
                        ? styles.headerRed
                        : styles.headerTeal
                      : styles.headerTeal,
                    isSelected && styles.headerSelected,
                  ]}
                >
                  <Text style={styles.dayNameText}>{item.dayName}</Text>
                  <View style={styles.waveScallopPattern} />
                </View>

                {/* Big Day/Week/Month Number Body */}
                <View style={styles.cardBody}>
                  <Text
                    style={[
                      styles.dayNumberText,
                      isSelected && styles.dayNumberSelected,
                      activePeriod === 'Minggu' && { fontSize: 32 },
                    ]}
                  >
                    {item.dayNumber}
                  </Text>
                  <Text style={styles.tapToViewText}>Tekan untuk rincian</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* POP-UP MODAL CONTAINER WITH CASHIER TABLE */}
      <Modal
        visible={tableModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setTableModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setTableModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
              <View style={styles.tableModalContent}>
                {/* Modal Header */}
                <View style={styles.modalHeaderRow}>
                  <View style={styles.modalHeaderTitleBox}>
                    <Ionicons name="receipt" size={24} color="#14A39F" style={{ marginRight: 8 }} />
                    <View>
                      <Text style={styles.modalHeaderTitle}>Tabel Rekap Pemasukan</Text>
                      <Text style={styles.modalHeaderSub}>{selectedDay.fullDateText}</Text>
                    </View>
                  </View>

                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.closeIconBtn}
                    onPress={() => setTableModalVisible(false)}
                  >
                    <Ionicons name="close" size={24} color="#64748B" />
                  </TouchableOpacity>
                </View>

                <View style={styles.modalDivider} />

                {/* Modal Body: Cashier POS Table */}
                <ScrollView style={{ maxHeight: 380 }} showsVerticalScrollIndicator={false}>
                  {filteredProducts.length > 0 ? (
                    <View style={styles.posTableCardModal}>
                      {/* Table Header */}
                      <View style={styles.posTableHeader}>
                        <Text style={[styles.posTh, { flex: 2.2 }]}>Barang / Produk</Text>
                        <Text style={[styles.posTh, { flex: 1, textAlign: 'center' }]}>Qty</Text>
                        <Text style={[styles.posTh, { flex: 1.3, textAlign: 'right' }]}>Harga</Text>
                        <Text style={[styles.posTh, { flex: 1.6, textAlign: 'right' }]}>Subtotal</Text>
                      </View>

                      {/* Table Rows */}
                      {filteredProducts.map((prod, idx) => (
                        <View
                          key={prod.id}
                          style={[styles.posTableRow, idx % 2 === 1 && styles.posTableRowAlt]}
                        >
                          <View style={{ flex: 2.2, paddingRight: 4 }}>
                            <Text style={styles.posItemName}>{prod.name}</Text>
                            <View style={styles.posTagRow}>
                              <Text style={styles.posCategoryTag}>{prod.category}</Text>
                              <View
                                style={[
                                  styles.statusDot,
                                  prod.paymentMethod === 'Lunas'
                                    ? { backgroundColor: '#10B981' }
                                    : { backgroundColor: '#F59E0B' },
                                ]}
                              />
                            </View>
                          </View>

                          <Text style={[styles.posTd, { flex: 1, textAlign: 'center', fontWeight: '700' }]}>
                            {prod.quantity} {prod.unit}
                          </Text>

                          <Text style={[styles.posTd, { flex: 1.3, textAlign: 'right', color: '#64748B' }]}>
                            {formatRupiah(prod.price)}
                          </Text>

                          <Text style={[styles.posTd, { flex: 1.6, textAlign: 'right', fontWeight: '800', color: '#10B981' }]}>
                            {formatRupiah(prod.total)}
                          </Text>
                        </View>
                      ))}

                      {/* Footer Summary inside Modal */}
                      <View style={styles.posTableFooter}>
                        <View style={{ flex: 2.2 }}>
                          <Text style={styles.footerSummaryTitle}>Total Rekap</Text>
                          <Text style={styles.footerSummarySub}>
                            {filteredProducts.length} Produk • {totalQtySelectedDay} Items
                          </Text>
                        </View>

                        <View style={{ flex: 2.9, alignItems: 'flex-end' }}>
                          <Text style={styles.footerTotalAmountTextTeal}>
                            {formatRupiah(totalIncomeSelectedDay)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  ) : (
                    /* Modal Empty State */
                    <View style={styles.emptyModalBox}>
                      <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
                      <Text style={styles.emptyModalTitle}>Belum Ada Rekap Pemasukan</Text>
                      <Text style={styles.emptyModalSub}>
                        Tidak ada transaksi barang pemasukan pada{' '}
                        <Text style={{ fontWeight: '700', color: '#475569' }}>{selectedDay.fullDateText}</Text>.
                      </Text>
                    </View>
                  )}
                </ScrollView>

                {/* Modal Footer Actions */}
                <View style={styles.modalFooterActions}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.modalBtnClose}
                    onPress={() => setTableModalVisible(false)}
                  >
                    <Text style={styles.modalBtnCloseText}>Tutup</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={styles.modalBtnAddTeal}
                    onPress={() => {
                      setTableModalVisible(false);
                      setOrderModalVisible(true);
                    }}
                  >
                    <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
                    <Text style={styles.modalBtnAddText}>Tambah Barang</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Order Modal for adding new cashier transaction */}
      <OrderModal
        visible={orderModalVisible}
        onClose={() => setOrderModalVisible(false)}
        onSave={handleAddTransaction}
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
    backgroundColor: '#14A39F',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  headerSafeArea: {
    paddingTop: Platform.OS === 'android' ? 36 : 10,
    paddingHorizontal: 20,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  iconButton: {
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
  summaryDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  miniCalendarBox: {
    width: 36,
    height: 38,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    overflow: 'hidden',
    marginRight: 12,
    alignItems: 'center',
  },
  miniCalendarHeader: {
    width: '100%',
    height: 12,
    backgroundColor: '#14A39F',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  miniRingDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#FFFFFF',
  },
  miniCalendarBody: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  miniCalendarNumber: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  summaryDateTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
  },
  summaryDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  metricColumn: {
    flex: 1,
    alignItems: 'flex-start',
    paddingHorizontal: 4,
  },
  verticalDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 12,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#94A3B8',
    marginBottom: 4,
  },
  metricQtyValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#14A39F',
  },
  metricIncomeValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#10B981',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  /* DROPDOWN FILTER STYLES */
  dropdownSection: {
    position: 'relative',
    marginBottom: 20,
    zIndex: 50,
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  dropdownTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dropdownLabelPrefix: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748B',
  },
  dropdownSelectedValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  dropdownMenuCard: {
    position: 'absolute',
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingVertical: 6,
    paddingHorizontal: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 8,
    zIndex: 100,
  },
  dropdownMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
  },
  dropdownMenuItemActive: {
    backgroundColor: '#F0FDFA',
  },
  dropdownMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
  },
  dropdownMenuTextActive: {
    fontWeight: '800',
    color: '#14A39F',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  calendarCard: {
    width: (SCREEN_WIDTH - 52) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  calendarCardSelected: {
    borderColor: '#14A39F',
    transform: [{ scale: 1.02 }],
  },
  binderRingsRow: {
    position: 'absolute',
    top: 6,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    zIndex: 10,
    paddingHorizontal: 30,
  },
  binderRing: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#1E293B',
  },
  cardHeaderBanner: {
    paddingTop: 18,
    paddingBottom: 12,
    alignItems: 'center',
    position: 'relative',
  },
  headerTeal: {
    backgroundColor: '#14A39F',
  },
  headerRed: {
    backgroundColor: '#EF4444',
  },
  headerSelected: {
    backgroundColor: '#14A39F',
  },
  dayNameText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  waveScallopPattern: {
    position: 'absolute',
    bottom: -4,
    left: 0,
    right: 0,
    height: 8,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  cardBody: {
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayNumberText: {
    fontSize: 38,
    fontWeight: '800',
    color: '#0F172A',
  },
  dayNumberSelected: {
    color: '#14A39F',
  },
  tapToViewText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  posTableHeader: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    paddingVertical: 12,
    paddingHorizontal: 14,
    alignItems: 'center',
  },
  posTh: {
    color: '#F8FAFC',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  posTableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFFFFF',
  },
  posTableRowAlt: {
    backgroundColor: '#F8FAFC',
  },
  posItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  posTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 3,
  },
  posCategoryTag: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
    marginRight: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  posTd: {
    fontSize: 13,
    color: '#1E293B',
  },
  posTableFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderTopWidth: 2,
    borderTopColor: '#E2E8F0',
  },
  footerSummaryTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1E293B',
  },
  footerSummarySub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  footerTotalAmountTextTeal: {
    fontSize: 16,
    fontWeight: '800',
    color: '#10B981',
  },
  /* MODAL STYLES FOR CASHIER POP UP */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  tableModalContent: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
    maxHeight: Dimensions.get('window').height * 0.82,
  },
  modalHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalHeaderTitleBox: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  modalHeaderTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalHeaderSub: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginTop: 1,
  },
  closeIconBtn: {
    padding: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  posTableCardModal: {
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 4,
  },
  emptyModalBox: {
    paddingVertical: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginTop: 10,
    marginBottom: 4,
  },
  emptyModalSub: {
    fontSize: 12,
    color: '#64748B',
    textAlign: 'center',
  },
  modalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  modalBtnClose: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  modalBtnCloseText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalBtnAddTeal: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#14A39F',
  },
  modalBtnAddText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
