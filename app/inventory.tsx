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
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Alert,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useInventory, InventoryItem } from '@/context/InventoryContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const CATEGORIES = [
  'Makanan',
  'Minuman',
];

const UNITS = ['Pcs', 'Dus'];

export default function InventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);

  const { inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('Semua');

  // Form State for Registering / Editing Inventory Item
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Makanan');
  const [stock, setStock] = useState(1);
  const [unit, setUnit] = useState('Pcs');
  const [priceInput, setPriceInput] = useState('');
  const [sellingPriceInput, setSellingPriceInput] = useState('');
  const [pcsPerDus, setPcsPerDus] = useState('');

  const filteredItems = inventoryItems.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategoryFilter === 'Semua' || item.category === selectedCategoryFilter;
    return matchesSearch && matchesCategory;
  });

  const totalItems = inventoryItems.length;
  const lowStockCount = inventoryItems.filter((i) => i.status === 'Menipis').length;
  const totalStock = inventoryItems.reduce((acc, curr) => acc + curr.stock, 0);

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    setCategory('Makanan');
    setStock(1);
    setUnit('Pcs');
    setPriceInput('');
    setSellingPriceInput('');
    setPcsPerDus('');
    setModalVisible(true);
  };

  const handleOpenEditModal = (item: InventoryItem) => {
    setEditingId(item.id);
    setName(item.name);
    setCategory(item.category);
    setStock(item.stock);
    setUnit(item.unit === 'Dus' ? 'Dus' : 'Pcs');
    setPriceInput(item.price ? parseInt(String(item.price), 10).toLocaleString('id-ID') : '');
    setSellingPriceInput(item.sellingPrice ? parseInt(String(item.sellingPrice), 10).toLocaleString('id-ID') : '');
    setPcsPerDus('');
    setModalVisible(true);
  };

  const handleSaveInventory = () => {
    if (!name.trim()) {
      Alert.alert('Peringatan', 'Silakan masukkan nama barang.');
      return;
    }

    const parsedPrice = parseFloat(priceInput.replace(/[^0-9]/g, '')) || 0;
    const parsedSellingPrice = parseFloat(sellingPriceInput.replace(/[^0-9]/g, '')) || 0;

    let finalStock = stock;
    let finalUnit = unit;

    if (unit === 'Dus') {
      const multiplier = parseInt(pcsPerDus.replace(/[^0-9]/g, ''), 10) || 1;
      finalStock = stock * multiplier;
      finalUnit = 'Pcs';
    }

    if (editingId) {
      updateInventoryItem(editingId, {
        name: name.trim(),
        category,
        stock: finalStock,
        unit: finalUnit,
        price: parsedPrice,
        sellingPrice: parsedSellingPrice,
      });
    } else {
      addInventoryItem({
        name: name.trim(),
        category,
        stock: finalStock,
        unit: finalUnit,
        price: parsedPrice,
        sellingPrice: parsedSellingPrice,
      });
    }

    setModalVisible(false);
  };

  const handleDelete = (id: string, itemName: string) => {
    Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus "${itemName}" dari inventori?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => deleteInventoryItem(id),
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Top Header Section (Teal Background) */}
      <View style={styles.headerContainer}>
        <SafeAreaView style={styles.headerSafeArea}>
          {/* Header Title Bar */}
          <View style={styles.headerTopBar}>
            <View style={styles.headerTitleLeft}>
              <View style={styles.headerTitleMeta}>
                <Text style={styles.headerTitleText}>Inventori Barang</Text>
                <Text style={styles.headerSubtitleText}>Pendaftaran & Stok Barang</Text>
              </View>
            </View>


          </View>

          {/* 3 Metrics Cards Grid */}
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
              <Text style={[styles.metricValue, lowStockCount > 0 && { color: '#EA580C' }]}>
                {lowStockCount}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </View>

      {/* Main Content Area */}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 90 + bottomInset }]}
      >
        {/* Search Bar */}
        <View style={styles.searchCard}>
          <Ionicons name="search" size={20} color="#94A3B8" style={{ marginRight: 10 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Cari nama barang atau kategori..."
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

        {/* Category Pills Selector */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryPillScroll}
          contentContainerStyle={{ gap: 8 }}
        >
          {['Semua', ...CATEGORIES].map((cat) => {
            const isSelected = selectedCategoryFilter === cat;
            return (
              <TouchableOpacity
                key={cat}
                activeOpacity={0.8}
                style={[styles.categoryPill, isSelected && styles.categoryPillActive]}
                onPress={() => setSelectedCategoryFilter(cat)}
              >
                <Text style={[styles.categoryPillText, isSelected && styles.categoryPillTextActive]}>
                  {cat}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Section Header */}
        <View style={styles.sectionTitleRow}>
          <Text style={styles.sectionTitle}>Stok Barang</Text>
          <TouchableOpacity activeOpacity={0.8} style={styles.addInlineBtn} onPress={handleOpenAddModal}>
            <Ionicons name="add-circle-outline" size={16} color="#14A39F" style={{ marginRight: 4 }} />
            <Text style={styles.addInlineBtnText}>Tambah Barang</Text>
          </TouchableOpacity>
        </View>

        {/* Inventory Item Cards */}
        {filteredItems.length > 0 ? (
          filteredItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeader}>
                <View style={{ flex: 1 }}>
                  <View style={styles.itemTitleRow}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        item.status === 'Tersedia' ? styles.statusTersedia : styles.statusMenipis,
                      ]}
                    >
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: item.status === 'Tersedia' ? '#16A34A' : '#EA580C' },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusText,
                          { color: item.status === 'Tersedia' ? '#16A34A' : '#EA580C' },
                        ]}
                      >
                        {item.status}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.itemMetaRow}>
                    <Text style={styles.itemCategory}>{item.category}</Text>
                    <Text style={styles.dotSeparator}>•</Text>
                    <Text style={styles.itemPricePerPicis}>
                      Modal: <Text style={styles.priceHighlight}>{formatRupiah(item.price)}</Text>
                    </Text>
                    {item.sellingPrice > 0 && (
                      <>
                        <Text style={styles.dotSeparator}>•</Text>
                        <Text style={styles.itemPricePerPicis}>
                          Jual: <Text style={styles.priceHighlightJual}>{formatRupiah(item.sellingPrice)}</Text>
                        </Text>
                      </>
                    )}
                  </View>
                </View>
              </View>

              {/* Stock Bar Progress */}
              <View style={styles.stockProgressSection}>
                <View style={styles.stockTextRow}>
                  <Text style={styles.stockLabel}>Sisa Stok:</Text>
                  <Text style={styles.stockValue}>
                    {item.stock} <Text style={{ fontSize: 12, fontWeight: '500' }}>{item.unit}</Text>
                  </Text>
                </View>

                <View style={styles.progressBarBg}>
                  <View
                    style={[
                      styles.progressBarFill,
                      {
                        width: `${Math.min(item.progress * 100, 100)}%`,
                        backgroundColor: item.status === 'Tersedia' ? '#14A39F' : '#F59E0B',
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.cardActionRow}>
                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionBtnEdit}
                  onPress={() => handleOpenEditModal(item)}
                >
                  <Ionicons name="create-outline" size={16} color="#0284C7" />
                  <Text style={styles.actionBtnEditText}>Edit Barang</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionBtnDelete}
                  onPress={() => handleDelete(item.id, item.name)}
                >
                  <Ionicons name="trash-outline" size={16} color="#EF4444" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        ) : (
          /* Empty Inventory State */
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={54} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Belum Ada Barang Diinventori</Text>
            <Text style={styles.emptySub}>
              Silakan daftarkan barang baru beserta stok awal dan harga per picis untuk menggunakannya di catatan transaksi.
            </Text>

          </View>
        )}
      </ScrollView>

      {/* POP-UP MODAL PENDAFTARAN BARANG INVENTORI (STYLED IDENTICALLY TO DASHBOARD MODAL) */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <KeyboardAvoidingView
              behavior={Platform.OS === 'ios' ? 'padding' : undefined}
              style={{ width: '100%', alignItems: 'center' }}
            >
              <TouchableWithoutFeedback onPress={(e) => e.stopPropagation()}>
                <View style={styles.modalContentCard}>
                  {/* Modal Header */}
                  <View style={styles.modalHeaderRow}>
                    <View style={styles.modalHeaderTitleBox}>
                      <View style={styles.modalHeaderIconBadge}>
                        <Ionicons name="cube-outline" size={22} color="#14A39F" />
                      </View>
                      <View>
                        <Text style={styles.modalTitle}>
                          {editingId ? 'Edit Barang' : 'Tambah Stok Barang'}
                        </Text>
                      </View>
                    </View>

                    <TouchableOpacity
                      activeOpacity={0.7}
                      style={styles.modalCloseBtn}
                      onPress={() => setModalVisible(false)}
                    >
                      <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalDivider} />

                  <ScrollView style={{ maxHeight: 460 }} showsVerticalScrollIndicator={false}>
                    {/* Form Field 1: Nama Barang */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Nama Barang / Produk <Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Contoh: Kopi Susu Aren 250ml"
                        placeholderTextColor="#94A3B8"
                        value={name}
                        onChangeText={setName}
                      />
                    </View>

                    {/* Form Field 2: Kategori Barang */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Kategori Barang</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
                      >
                        {CATEGORIES.map((cat) => {
                          const isSelected = category === cat;
                          return (
                            <TouchableOpacity
                              key={cat}
                              activeOpacity={0.8}
                              style={[
                                styles.catSelectChip,
                                isSelected && styles.catSelectChipActive,
                              ]}
                              onPress={() => setCategory(cat)}
                            >
                              <Text
                                style={[
                                  styles.catSelectChipText,
                                  isSelected && styles.catSelectChipTextActive,
                                ]}
                              >
                                {cat}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>

                    {/* Form Field 3: Harga Satuan Per Picis (Rp) */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>
                        Harga per Picis<Text style={styles.requiredStar}>*</Text>
                      </Text>
                      <View style={styles.inputPrefixBox}>
                        <Text style={styles.inputPrefixText}>Rp</Text>
                        <TextInput
                          style={styles.prefixedInput}
                          placeholder="Contoh: 25.000"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={priceInput}
                          onChangeText={(val) => {
                            const numeric = val.replace(/[^0-9]/g, '');
                            if (!numeric) {
                              setPriceInput('');
                              return;
                            }
                            setPriceInput(parseInt(numeric, 10).toLocaleString('id-ID'));
                          }}
                        />
                      </View>
                    </View>

                    {/* Form Field 3.5: Harga Jual */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Harga Jual</Text>
                      <View style={styles.inputPrefixBox}>
                        <Text style={styles.inputPrefixText}>Rp</Text>
                        <TextInput
                          style={styles.prefixedInput}
                          placeholder="Contoh: 30.000"
                          placeholderTextColor="#94A3B8"
                          keyboardType="numeric"
                          value={sellingPriceInput}
                          onChangeText={(val) => {
                            const numeric = val.replace(/[^0-9]/g, '');
                            if (!numeric) {
                              setSellingPriceInput('');
                              return;
                            }
                            setSellingPriceInput(parseInt(numeric, 10).toLocaleString('id-ID'));
                          }}
                        />
                      </View>
                    </View>

                    {/* Form Field 4: Stok Awal & Satuan Row */}
                    <View style={styles.rowTwoFields}>
                      {/* Stok Awal Counter */}
                      <View style={[styles.fieldContainer, { flex: 1.2, marginRight: 10 }]}>
                        <Text style={styles.fieldLabel}>Jumlah</Text>
                        <View style={styles.stockCounterRow}>
                          <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => setStock((prev) => (prev > 1 ? prev - 1 : 1))}
                          >
                            <Ionicons name="remove" size={18} color="#475569" />
                          </TouchableOpacity>
                          <TextInput
                            style={styles.counterInput}
                            keyboardType="numeric"
                            value={String(stock)}
                            onChangeText={(val) => {
                              const num = parseInt(val.replace(/[^0-9]/g, ''), 10) || 1;
                              setStock(num);
                            }}
                          />
                          <TouchableOpacity
                            style={styles.counterBtn}
                            onPress={() => setStock((prev) => prev + 1)}
                          >
                            <Ionicons name="add" size={18} color="#475569" />
                          </TouchableOpacity>
                        </View>
                      </View>

                      {/* Dus to Pcs logic */}
                      <View style={[styles.fieldContainer, { flex: 1 }]}>
                        {unit === 'Dus' && (
                          <>
                            <Text style={styles.fieldLabel}>Isi per Dus (Pcs)</Text>
                            <TextInput
                              style={styles.textInput}
                              placeholder="Cth: 24"
                              placeholderTextColor="#94A3B8"
                              keyboardType="numeric"
                              value={pcsPerDus}
                              onChangeText={setPcsPerDus}
                            />
                          </>
                        )}
                      </View>
                    </View>

                    {/* Form Field 5: Satuan Barang */}
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Satuan Unit</Text>
                      <ScrollView
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={{ gap: 6 }}
                      >
                        {UNITS.map((u) => {
                          const isSelected = unit === u;
                          return (
                            <TouchableOpacity
                              key={u}
                              activeOpacity={0.8}
                              style={[
                                styles.unitChip,
                                isSelected && styles.unitChipActive,
                              ]}
                              onPress={() => setUnit(u)}
                            >
                              <Text
                                style={[
                                  styles.unitChipText,
                                  isSelected && styles.unitChipTextActive,
                                ]}
                              >
                                {u}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  </ScrollView>

                  {/* Modal Footer Save Actions */}
                  <View style={styles.modalFooterActions}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.modalBtnCancel}
                      onPress={() => setModalVisible(false)}
                    >
                      <Text style={styles.modalBtnCancelText}>Batal</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.modalBtnSave}
                      onPress={handleSaveInventory}
                    >
                      <Text style={styles.modalBtnSaveText}>Simpan</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Bottom Navigation Bar */}
      <View style={[styles.bottomNav, { paddingBottom: bottomInset, height: 60 + bottomInset }]}>
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navItem}
          onPress={() => router.replace('/dashboard')}
        >
          <Ionicons name="home-outline" size={26} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.navItem}
          onPress={() => router.replace('/statistics')}
        >
          <Ionicons name="receipt-outline" size={24} color="#94A3B8" />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} style={styles.navItem}>
          <Ionicons name="card" size={26} color="#14A39F" />
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
  headerContainer: {
    backgroundColor: '#14A39F',
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    paddingBottom: 20,
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
  headerTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  headerTitleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    padding: 4,
    marginRight: 6,
  },
  headerTitleMeta: {
    justifyContent: 'center',
  },
  headerTitleText: {
    fontSize: 20,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  headerSubtitleText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.85)',
    fontWeight: '500',
  },
  headerAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerAddBtnText: {
    color: '#14A39F',
    fontWeight: '800',
    fontSize: 12,
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  metricCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
  },
  metricCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricIconBadge: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  metricLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#64748B',
  },
  metricValue: {
    fontSize: 20,
    fontWeight: '800',
    color: '#0F172A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  searchCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#0F172A',
  },
  categoryPillScroll: {
    marginBottom: 16,
  },
  categoryPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  categoryPillActive: {
    backgroundColor: '#14A39F',
    borderColor: '#14A39F',
  },
  categoryPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  sectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  addInlineBtn: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  addInlineBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14A39F',
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#F1F5F9',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  itemTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  statusTersedia: {
    backgroundColor: '#DCFCE7',
  },
  statusMenipis: {
    backgroundColor: '#FFEDD5',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  itemMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  itemCategory: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  dotSeparator: {
    marginHorizontal: 6,
    color: '#CBD5E1',
  },
  itemPricePerPicis: {
    fontSize: 12,
    color: '#475569',
  },
  priceHighlight: {
    fontWeight: '800',
    color: '#10B981',
  },
  priceHighlightJual: {
    fontWeight: '800',
    color: '#3B82F6',
  },
  stockProgressSection: {
    marginTop: 8,
    marginBottom: 12,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 14,
  },
  stockTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  stockLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  stockValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  progressBarBg: {
    height: 7,
    backgroundColor: '#E2E8F0',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  cardActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  actionBtnEdit: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0F9FF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  actionBtnEditText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#0284C7',
    marginLeft: 4,
  },
  actionBtnDelete: {
    padding: 6,
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginTop: 12,
    marginBottom: 6,
  },
  emptySub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 18,
  },
  emptyAddBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14A39F',
    paddingHorizontal: 18,
    paddingVertical: 11,
    borderRadius: 16,
  },
  emptyAddBtnText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },

  /* POP-UP MODAL STYLES (MATCHES DASHBOARD ORDER MODAL) */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 18,
  },
  modalContentCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 10,
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
  modalHeaderIconBadge: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 1,
  },
  modalCloseBtn: {
    padding: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 14,
  },
  fieldContainer: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  requiredStar: {
    color: '#EF4444',
  },
  textInput: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  inputPrefixBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  inputPrefixText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#14A39F',
    marginRight: 8,
  },
  prefixedInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  catSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  catSelectChipActive: {
    backgroundColor: '#14A39F',
  },
  catSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catSelectChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  rowTwoFields: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stockCounterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 4,
    paddingVertical: 3,
  },
  counterBtn: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  counterInput: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  unitChipActive: {
    backgroundColor: '#0F172A',
  },
  unitChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  unitChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  modalBtnCancel: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBtnCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalBtnSave: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#14A39F',
  },
  modalBtnSaveText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
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
