import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Keyboard,
  Pressable,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useInventory, InventoryItem } from '@/context/InventoryContext';

const CATEGORY_SUGGESTIONS = [
  'Bahan Baku',
  'Makanan',
  'Minuman',
  'Kemasan',
  'Elektronik',
  'Aksesoris',
  'ATK',
  'Operasional',
];
const UNIT_OPTIONS = ['Pcs', 'Dus', 'Pack'];

export default function InventoryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'android' ? 16 : 12);
  const { inventoryItems, addInventoryItem, updateInventoryItem, deleteInventoryItem, updateSellingPrice, getProfit } = useInventory();

  const [activeNav, setActiveNav] = useState<'home' | 'chart' | 'wallet'>('wallet');
  const [activeTab, setActiveTab] = useState<'stok' | 'jual'>('stok');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);

  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bahan Baku');
  const [stock, setStock] = useState(1);
  const [unit, setUnit] = useState('Pcs');
  const [price, setPrice] = useState(0);
  const [priceInput, setPriceInput] = useState('');
  const [pcsPerUnit, setPcsPerUnit] = useState(1);
  
  // For 'jual' tab modal
  const [isSalesModalOpen, setIsSalesModalOpen] = useState(false);
  const [sellingPriceInput, setSellingPriceInput] = useState('');

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleOpenAddModal = () => {
    setEditingItem(null);
    setName('');
    setCategory('Bahan Baku');
    setStock(1);
    setUnit('Pcs');
    setPcsPerUnit(1);
    setPrice(0);
    setPriceInput('');
    setIsModalOpen(true);
  };

  const handleEditItem = (item: InventoryItem) => {
    setEditingItem(item);
    setName(item.name);
    setCategory(item.category);
    setStock(item.stock);
    setUnit('Pcs'); // Always load as Pcs
    setPcsPerUnit(1);
    setPrice(item.price);
    setPriceInput(item.price ? String(item.price) : '');
    setIsModalOpen(true);
  };
  
  const handleEditSales = (item: InventoryItem) => {
    setEditingItem(item);
    setSellingPriceInput(item.sellingPrice ? String(item.sellingPrice) : '');
    setIsSalesModalOpen(true);
  };

  const handleSaveItem = () => {
    if (!name.trim()) {
      Alert.alert('Nama Barang Wajib', 'Silakan masukkan nama barang terlebih dahulu.');
      return;
    }

    const parsedPrice = parseFloat(priceInput.replace(/[^0-9]/g, '')) || price || 0;
    const isPackOrDus = unit === 'Dus' || unit === 'Pack';
    const finalStock = isPackOrDus ? stock * pcsPerUnit : stock;
    const finalPrice = isPackOrDus ? parsedPrice / pcsPerUnit : parsedPrice;

    if (editingItem) {
      updateInventoryItem(editingItem.id, {
        name: name.trim(),
        category,
        stock: finalStock,
        unit: 'Pcs',
        price: finalPrice,
      });
      Alert.alert('Diperbarui', `Data barang "${name}" berhasil diperbarui.`);
    } else {
      addInventoryItem({
        name: name.trim(),
        category,
        stock: finalStock,
        unit: 'Pcs',
        price: finalPrice,
      });
      Alert.alert('Ditambahkan', `Barang "${name}" berhasil ditambahkan ke inventori.`);
    }

    setIsModalOpen(false);
  };

  const handleSaveSales = () => {
    if (!editingItem) return;
    
    const parsedPrice = parseFloat(sellingPriceInput.replace(/[^0-9]/g, '')) || 0;
    
    updateSellingPrice(editingItem.id, parsedPrice);
    Alert.alert('Diperbarui', `Harga jual untuk "${editingItem.name}" berhasil disetel.`);
    setIsSalesModalOpen(false);
  };

  const handleDeleteItem = (id: string, itemName: string) => {
    Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus "${itemName}" dari inventori?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          deleteInventoryItem(id);
          setIsModalOpen(false);
          setIsSalesModalOpen(false);
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* HEADER */}
      <View style={[styles.header, { paddingTop: Platform.OS === 'android' ? 40 : insets.top + 10 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Inventori Barang</Text>
          <TouchableOpacity activeOpacity={0.8} style={styles.addBtn} onPress={handleOpenAddModal}>
            <Ionicons name="add" size={20} color="#FFFFFF" />
            <Text style={styles.addBtnText}>Barang</Text>
          </TouchableOpacity>
        </View>

        {/* Tab Switcher */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, activeTab === 'stok' && styles.tabBtnActive]}
            onPress={() => setActiveTab('stok')}
          >
            <Ionicons name="cube-outline" size={16} color={activeTab === 'stok' ? '#FFFFFF' : '#94A3B8'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, activeTab === 'stok' && styles.tabTextActive]}>Daftar Stok (Beli)</Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.tabBtn, activeTab === 'jual' && styles.tabBtnActive]}
            onPress={() => setActiveTab('jual')}
          >
            <Ionicons name="pricetag-outline" size={16} color={activeTab === 'jual' ? '#FFFFFF' : '#94A3B8'} style={{ marginRight: 6 }} />
            <Text style={[styles.tabText, activeTab === 'jual' && styles.tabTextActive]}>Penjualan (Jual)</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.listContainer}>
        {inventoryItems.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons name="cube-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyTitle}>Inventori Kosong</Text>
            <Text style={styles.emptySub}>
              Belum ada barang di inventori. Tambahkan barang secara manual atau otomatis tercatat saat menambah Pengeluaran.
            </Text>
            <TouchableOpacity activeOpacity={0.8} style={styles.emptyAddBtn} onPress={handleOpenAddModal}>
              <Ionicons name="add" size={18} color="#FFFFFF" style={{ marginRight: 4 }} />
              <Text style={styles.emptyAddBtnText}>Tambah Barang Baru</Text>
            </TouchableOpacity>
          </View>
        ) : (
          inventoryItems.map((item) => (
            <View key={item.id} style={styles.itemCard}>
              <View style={styles.itemHeaderRow}>
                <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
                
                {activeTab === 'stok' && (
                  <View
                    style={[
                      styles.statusBadge,
                      item.status === 'Tersedia' ? styles.statusTersedia : styles.statusMenipis,
                    ]}
                  >
                    <View
                      style={[
                        styles.statusDot,
                        { backgroundColor: item.status === 'Tersedia' ? '#16A34A' : '#D97706' },
                      ]}
                    />
                    <Text
                      style={[
                        styles.statusText,
                        { color: item.status === 'Tersedia' ? '#15803D' : '#B45309' },
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                )}
                
                {activeTab === 'jual' && (
                  <View style={[styles.statusBadge, { backgroundColor: '#F0F9FF' }]}>
                    <Ionicons name="trending-up" size={12} color="#0284C7" style={{ marginRight: 4 }} />
                    <Text style={[styles.statusText, { color: '#0369A1' }]}>
                      Profit: {formatRupiah(getProfit(item))}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.itemMetaRow}>
                <Text style={styles.itemCategory}>{item.category}</Text>
                <Text style={styles.dotSeparator}>•</Text>
                {activeTab === 'stok' ? (
                  <Text style={styles.itemPricePerPicis}>
                    Harga Beli: <Text style={styles.priceHighlight}>{formatRupiah(item.price)}</Text> / {item.unit}
                  </Text>
                ) : (
                  <Text style={styles.itemPricePerPicis}>
                    Harga Jual: <Text style={styles.priceHighlight}>{item.sellingPrice > 0 ? formatRupiah(item.sellingPrice) : 'Belum diatur'}</Text> / {item.unit}
                  </Text>
                )}
              </View>

              {activeTab === 'stok' && (
                <View style={styles.stockProgressSection}>
                  <View style={styles.stockTextRow}>
                    <Text style={styles.stockLabel}>Sisa Stok</Text>
                    <Text style={styles.stockValue}>
                      {item.stock} {item.unit}
                    </Text>
                  </View>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        {
                          width: `${item.progress * 100}%`,
                          backgroundColor: item.status === 'Tersedia' ? '#10B981' : '#F59E0B',
                        },
                      ]}
                    />
                  </View>
                </View>
              )}

              <View style={[styles.cardActionRow, activeTab === 'jual' && { marginTop: 12 }]}>
                {activeTab === 'stok' ? (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.actionBtnEdit}
                    onPress={() => handleEditItem(item)}
                  >
                    <Ionicons name="create-outline" size={16} color="#0284C7" />
                    <Text style={styles.actionBtnEditText}>Edit Stok & Beli</Text>
                  </TouchableOpacity>
                ) : (
                   <TouchableOpacity
                    activeOpacity={0.7}
                    style={styles.actionBtnEdit}
                    onPress={() => handleEditSales(item)}
                  >
                    <Ionicons name="pricetag-outline" size={16} color="#0284C7" />
                    <Text style={styles.actionBtnEditText}>Atur Harga Jual</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  activeOpacity={0.7}
                  style={styles.actionBtnDelete}
                  onPress={() => handleDeleteItem(item.id, item.name)}
                >
                  <Ionicons name="trash-outline" size={18} color="#DC2626" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}
      </ScrollView>

      {/* CRUD MODAL FOR STOK/BELI */}
      <Modal visible={isModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsModalOpen(false)}>
        <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); setIsModalOpen(false); }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView} pointerEvents="box-none">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContentCard}>
                <View style={styles.handleBar} />
                
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
                  <View style={styles.modalHeaderRow}>
                    <View style={styles.modalHeaderTitleBox}>
                      <View style={styles.modalHeaderIconBadge}>
                        <Ionicons name="cube-outline" size={20} color="#14A39F" />
                      </View>
                      <View>
                        <Text style={styles.modalTitle}>{editingItem ? 'Edit Barang' : 'Tambah Barang'}</Text>
                        <Text style={styles.modalSubtitle}>Data stok dan harga keluaran (beli)</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsModalOpen(false)}>
                      <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalDivider} />

                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Nama Barang <Text style={styles.requiredStar}>*</Text></Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="Contoh: Kopi Susu Aren"
                      placeholderTextColor="#A1A1AA"
                      value={name}
                      onChangeText={setName}
                    />
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Kategori</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6, paddingVertical: 4 }}>
                      {CATEGORY_SUGGESTIONS.map((cat) => (
                        <TouchableOpacity
                          key={cat}
                          style={[styles.catSelectChip, category === cat && styles.catSelectChipActive]}
                          onPress={() => setCategory(cat)}
                        >
                          <Text style={[styles.catSelectChipText, category === cat && styles.catSelectChipTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Harga Keluaran / Beli per Unit (Rp)</Text>
                    <View style={styles.inputPrefixBox}>
                      <Text style={styles.inputPrefixText}>Rp</Text>
                      <TextInput
                        style={styles.prefixedInput}
                        placeholder="Contoh: 15.000"
                        placeholderTextColor="#A1A1AA"
                        keyboardType="numeric"
                        value={priceInput}
                        onChangeText={(val) => {
                          const numeric = val.replace(/[^0-9]/g, '');
                          setPriceInput(numeric);
                          setPrice(parseFloat(numeric) || 0);
                        }}
                      />
                    </View>
                  </View>

                  <View style={styles.rowTwoFields}>
                    <View style={[styles.fieldContainer, { flex: 1.2, marginRight: 12 }]}>
                      <Text style={styles.fieldLabel}>Stok Tersedia</Text>
                      <View style={styles.stockCounterRow}>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setStock(s => Math.max(0, s - 1))}>
                          <Ionicons name="remove" size={16} color="#475569" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.counterInput}
                          keyboardType="numeric"
                          value={String(stock)}
                          onChangeText={(v) => setStock(parseInt(v.replace(/[^0-9]/g, ''), 10) || 0)}
                        />
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setStock(s => s + 1)}>
                          <Ionicons name="add" size={16} color="#475569" />
                        </TouchableOpacity>
                      </View>
                    </View>

                    <View style={[styles.fieldContainer, { flex: 1 }]}>
                      <Text style={styles.fieldLabel}>Satuan Beli</Text>
                      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 4 }}>
                        {UNIT_OPTIONS.map((u) => (
                          <TouchableOpacity
                            key={u}
                            style={[styles.unitChip, unit === u && styles.unitChipActive]}
                            onPress={() => setUnit(u)}
                          >
                            <Text style={[styles.unitChipText, unit === u && styles.unitChipTextActive]}>{u}</Text>
                          </TouchableOpacity>
                        ))}
                      </ScrollView>
                    </View>
                  </View>

                  {(unit === 'Dus' || unit === 'Pack') && (
                    <View style={styles.fieldContainer}>
                      <Text style={styles.fieldLabel}>Satu {unit} isi berapa Pcs?</Text>
                      <View style={styles.stockCounterRow}>
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setPcsPerUnit(s => Math.max(1, s - 1))}>
                          <Ionicons name="remove" size={16} color="#475569" />
                        </TouchableOpacity>
                        <TextInput
                          style={styles.counterInput}
                          keyboardType="numeric"
                          value={String(pcsPerUnit)}
                          onChangeText={(v) => setPcsPerUnit(parseInt(v.replace(/[^0-9]/g, ''), 10) || 1)}
                        />
                        <TouchableOpacity style={styles.counterBtn} onPress={() => setPcsPerUnit(s => s + 1)}>
                          <Ionicons name="add" size={16} color="#475569" />
                        </TouchableOpacity>
                      </View>
                      <Text style={{ fontSize: 11, color: '#64748B', marginTop: 4 }}>
                        Otomatis dikonversi ke {stock * pcsPerUnit} Pcs di inventori.
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalFooterActions}>
                    <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setIsModalOpen(false)}>
                      <Text style={styles.modalBtnCancelText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalBtnSave} onPress={handleSaveItem}>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.modalBtnSaveText}>Simpan Data</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* SALES MODAL (ATUR HARGA JUAL) */}
      <Modal visible={isSalesModalOpen} animationType="slide" transparent={true} onRequestClose={() => setIsSalesModalOpen(false)}>
         <View style={styles.modalOverlay}>
          <Pressable style={StyleSheet.absoluteFill} onPress={() => { Keyboard.dismiss(); setIsSalesModalOpen(false); }} />
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.keyboardAvoidingView} pointerEvents="box-none">
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.modalContentCard}>
                <View style={styles.handleBar} />
                
                <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={styles.scrollContent}>
                  <View style={styles.modalHeaderRow}>
                    <View style={styles.modalHeaderTitleBox}>
                      <View style={[styles.modalHeaderIconBadge, { backgroundColor: '#E0F2FE' }]}>
                        <Ionicons name="pricetag-outline" size={20} color="#0284C7" />
                      </View>
                      <View>
                        <Text style={styles.modalTitle}>Atur Harga Jual</Text>
                        <Text style={styles.modalSubtitle}>{editingItem?.name}</Text>
                      </View>
                    </View>
                    <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setIsSalesModalOpen(false)}>
                      <Ionicons name="close" size={24} color="#64748B" />
                    </TouchableOpacity>
                  </View>

                  <View style={styles.modalDivider} />

                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Harga Beli / Modal (Info)</Text>
                    <View style={[styles.inputPrefixBox, { backgroundColor: '#F1F5F9' }]}>
                      <Text style={[styles.inputPrefixText, { color: '#64748B' }]}>Rp</Text>
                      <TextInput
                        style={[styles.prefixedInput, { color: '#64748B' }]}
                        value={editingItem ? String(editingItem.price) : '0'}
                        editable={false}
                      />
                    </View>
                  </View>

                  <View style={styles.fieldContainer}>
                    <Text style={styles.fieldLabel}>Harga Jual per Unit (Rp)</Text>
                    <View style={[styles.inputPrefixBox, { borderColor: '#BAE6FD' }]}>
                      <Text style={[styles.inputPrefixText, { color: '#0284C7' }]}>Rp</Text>
                      <TextInput
                        style={styles.prefixedInput}
                        placeholder="Contoh: 25.000"
                        placeholderTextColor="#A1A1AA"
                        keyboardType="numeric"
                        value={sellingPriceInput}
                        onChangeText={(val) => {
                          const numeric = val.replace(/[^0-9]/g, '');
                          setSellingPriceInput(numeric);
                        }}
                      />
                    </View>
                  </View>
                  
                  {editingItem && (
                    <View style={[styles.subtotalCard, { backgroundColor: '#F0F9FF', borderColor: '#BAE6FD', marginTop: 10 }]}>
                      <Text style={[styles.subtotalLabel, { color: '#0369A1' }]}>Potensi Keuntungan per Unit</Text>
                      <Text style={[styles.subtotalValue, { color: '#0369A1' }]}>
                        {formatRupiah(Math.max(0, (parseFloat(sellingPriceInput.replace(/[^0-9]/g, '')) || 0) - editingItem.price))}
                      </Text>
                    </View>
                  )}

                  <View style={styles.modalFooterActions}>
                    <TouchableOpacity style={styles.modalBtnCancel} onPress={() => setIsSalesModalOpen(false)}>
                      <Text style={styles.modalBtnCancelText}>Batal</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={[styles.modalBtnSave, { backgroundColor: '#0284C7' }]} onPress={handleSaveSales}>
                      <Ionicons name="checkmark-circle" size={16} color="#FFFFFF" style={{ marginRight: 6 }} />
                      <Text style={styles.modalBtnSaveText}>Simpan Harga</Text>
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </KeyboardAvoidingView>
        </View>
      </Modal>

      {/* BOTTOM NAV */}
      <View style={[styles.bottomNav, { paddingBottom: bottomInset, height: 60 + bottomInset }]}>
        <TouchableOpacity activeOpacity={0.7} style={styles.navItem} onPress={() => { setActiveNav('home'); router.replace('/dashboard'); }}>
          <Ionicons name={activeNav === 'home' ? 'home' : 'home-outline'} size={26} color={activeNav === 'home' ? '#14A39F' : '#94A3B8'} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={styles.navItem} onPress={() => { setActiveNav('chart'); router.replace('/statistics'); }}>
          <Ionicons name={activeNav === 'chart' ? 'stats-chart' : 'stats-chart-outline'} size={24} color={activeNav === 'chart' ? '#14A39F' : '#94A3B8'} />
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.7} style={styles.navItem} onPress={() => setActiveNav('wallet')}>
          <Ionicons name={activeNav === 'wallet' ? 'card' : 'card-outline'} size={26} color={activeNav === 'wallet' ? '#14A39F' : '#94A3B8'} />
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
  header: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#14A39F',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
  },
  addBtnText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#FFFFFF',
    marginLeft: 4,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
  },
  tabBtnActive: {
    backgroundColor: '#334155',
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 110,
  },
  itemCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  itemHeaderRow: {
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContentCard: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingHorizontal: 20,
    paddingBottom: Platform.OS === 'ios' ? 36 : 24,
    maxHeight: '92%',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  handleBar: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  scrollContent: {
    paddingBottom: 20,
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
  subtotalCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  subtotalLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    flex: 1,
  },
  subtotalValue: {
    fontSize: 15,
    fontWeight: '800',
  },
  modalFooterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 16,
    gap: 10,
  },
  modalBtnCancel: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  modalBtnCancelText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  modalBtnSave: {
    flexDirection: 'row',
    alignItems: 'center',
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
