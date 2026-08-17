import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableWithoutFeedback,
  Keyboard,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useInventory, InventoryItem } from '@/context/InventoryContext';

export interface OrderFormData {
  id?: string;
  name: string;
  category: string;
  stock: number;
  quantity: number;
  unit: string;
  price: number;
  paymentMethod: 'Lunas' | 'Hutang';
  transactionType: 'IN' | 'OUT';
  debtorName?: string;
  debtStatus?: 'Belum Lunas' | 'Lunas';
}

export interface OrderModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (data: OrderFormData) => void;
  onDelete?: (id: string) => void;
  initialData?: OrderFormData | null;
  defaultType?: 'IN' | 'OUT';
}

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

const UNIT_OPTIONS = ['Pcs', 'Cup', 'Kg', 'Pack', 'Karton', 'Box', 'Porsi', 'Unit', 'Rim'];

export default function OrderModal({
  visible,
  onClose,
  onSave,
  onDelete,
  initialData,
  defaultType = 'IN',
}: OrderModalProps) {
  const router = useRouter();
  const { inventoryItems, adjustStockByItemName, registerOrRestockExpenseItem } = useInventory();
  const isEditing = !!initialData?.id;

  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Bahan Baku');
  const [stock, setStock] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState('Pcs');
  const [price, setPrice] = useState(0);
  const [priceInput, setPriceInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Lunas' | 'Hutang'>('Lunas');
  const [debtorName, setDebtorName] = useState('');
  const [debtStatus, setDebtStatus] = useState<'Belum Lunas' | 'Lunas'>('Belum Lunas');
  const [transactionType, setTransactionType] = useState<'IN' | 'OUT'>(defaultType);

  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [pickerSearchQuery, setPickerSearchQuery] = useState('');

  // Filter inventory items for Pengeluaran search query
  const matchingExpenseItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(name.trim().toLowerCase())
  );

  // Filter inventory items for Pemasukan dedicated picker search bar
  const matchingPickerItems = inventoryItems.filter(
    (item) =>
      item.name.toLowerCase().includes(pickerSearchQuery.trim().toLowerCase()) ||
      item.category.toLowerCase().includes(pickerSearchQuery.trim().toLowerCase())
  );

  const isExactItemInInventory = inventoryItems.some(
    (item) => item.name.toLowerCase() === name.trim().toLowerCase()
  );

  useEffect(() => {
    if (visible) {
      setPickerSearchQuery('');
      if (initialData) {
        setName(initialData.name || '');
        setCategory(initialData.category || 'Bahan Baku');
        setStock(initialData.stock ?? 0);
        setQuantity(initialData.quantity || 1);
        setUnit(initialData.unit || 'Pcs');
        setPrice(initialData.price || 0);
        setPriceInput(initialData.price ? String(initialData.price) : '');
        setPaymentMethod(initialData.paymentMethod === 'Hutang' ? 'Hutang' : 'Lunas');
        setDebtorName(initialData.debtorName || '');
        setDebtStatus(initialData.debtStatus || 'Belum Lunas');
        setTransactionType(initialData.transactionType || defaultType);

        const matched = inventoryItems.find(
          (i) => i.name.toLowerCase() === initialData.name?.toLowerCase()
        );
        if (matched) setSelectedInventoryItem(matched);
      } else {
        setName('');
        setCategory('Bahan Baku');
        setStock(0);
        setQuantity(1);
        setUnit('Pcs');
        setPrice(0);
        setPriceInput('');
        setPaymentMethod('Lunas');
        setDebtorName('');
        setDebtStatus('Belum Lunas');
        setTransactionType(defaultType);
        setSelectedInventoryItem(null);
      }
    }
  }, [visible, initialData, defaultType, inventoryItems]);

  const handleSelectInventoryItem = (item: InventoryItem) => {
    // RESTRICTION: Operasional category cannot be selected for Pemasukan (Income / IN)!
    if (transactionType === 'IN' && item.category === 'Operasional') {
      Alert.alert(
        'Kategori Operasional Dikunci',
        'Barang dengan kategori Operasional tidak dapat dijual / dijadikan Pemasukan karena khusus untuk Pengeluaran operasional toko.'
      );
      return;
    }

    setSelectedInventoryItem(item);
    setName(item.name);
    setCategory(item.category);
    setStock(item.stock);
    setUnit(item.unit);
    setPrice(item.price);
    setPriceInput(item.price ? String(item.price) : '0');
    setShowSearchDropdown(false);
    setPickerSearchQuery('');
  };

  const handleQuantityIncrement = () => {
    setQuantity((prev) => prev + 1);
  };

  const handleQuantityDecrement = () => {
    setQuantity((prev) => (prev > 1 ? prev - 1 : 1));
  };

  const handleSelectCategoryChip = (cat: string) => {
    if (transactionType === 'IN' && cat === 'Operasional') {
      Alert.alert(
        'Kategori Dikunci',
        'Kategori Operasional dikunci untuk Pemasukan karena barang operasional tidak untuk diperjualbelikan.'
      );
      return;
    }
    setCategory(cat);
  };

  const handleSave = () => {
    if (!name.trim()) {
      Alert.alert(
        'Barang Belum Dipilih',
        transactionType === 'IN'
          ? 'Silakan pilih barang yang terdaftar dari Inventori.'
          : 'Silakan masukkan nama barang terlebih dahulu.'
      );
      return;
    }

    // STRICT CHECK FOR IN (PEMASUKAN): Must be a registered item in Inventory!
    if (transactionType === 'IN' && !isExactItemInInventory) {
      Alert.alert(
        'Pemasukan Ditolak',
        'Hanya barang yang SUDAH TERDAFTAR di Inventori yang dapat dijual / dijadikan Pemasukan. Silakan gunakan fitur cari di pilihan barang.'
      );
      return;
    }

    // Double check Operasional restriction for Pemasukan
    if (transactionType === 'IN' && category === 'Operasional') {
      Alert.alert(
        'Transaksi Ditolak',
        'Kategori Operasional dikunci untuk Pemasukan (khusus Pengeluaran toko).'
      );
      return;
    }

    if (paymentMethod === 'Hutang' && !debtorName.trim()) {
      Alert.alert(
        'Nama Penghutang Wajib Diisi',
        transactionType === 'IN'
          ? 'Silakan masukkan nama pelanggan yang berhutang.'
          : 'Silakan masukkan nama pihak / supplier terkait.'
      );
      return;
    }

    const parsedPrice = parseFloat(priceInput.replace(/[^0-9]/g, '')) || price || 0;

    if (transactionType === 'IN') {
      // Pemasukan (Penjualan): Deduct inventory stock
      adjustStockByItemName(name.trim(), -quantity);
    } else {
      // Pengeluaran (Pembelian / Restock):
      // Automatically register new item in inventory or restock existing item!
      registerOrRestockExpenseItem({
        name: name.trim(),
        category: category.trim() || 'Bahan Baku',
        quantity,
        unit: unit.trim() || 'Pcs',
        price: parsedPrice,
      });
    }

    onSave({
      id: initialData?.id,
      name: name.trim(),
      category: category.trim() || 'Bahan Baku',
      stock,
      quantity,
      unit: unit.trim() || 'Pcs',
      price: parsedPrice,
      paymentMethod,
      transactionType,
      debtorName: paymentMethod === 'Hutang' ? debtorName.trim() : undefined,
      debtStatus: paymentMethod === 'Hutang' ? debtStatus : 'Lunas',
    });

    onClose();
  };

  const handleDelete = () => {
    if (!initialData?.id || !onDelete) return;

    Alert.alert('Konfirmasi Hapus', `Apakah Anda yakin ingin menghapus pesanan "${name}"?`, [
      { text: 'Batal', style: 'cancel' },
      {
        text: 'Hapus',
        style: 'destructive',
        onPress: () => {
          onDelete(initialData.id!);
          onClose();
        },
      },
    ]);
  };

  const handleGoToInventory = () => {
    onClose();
    router.push('/inventory');
  };

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={() => {
            Keyboard.dismiss();
            onClose();
          }}
        />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardAvoidingView}
          pointerEvents="box-none"
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <View style={styles.modalContainer}>
              {/* Sheet Drag Indicator Handle */}
              <View style={styles.handleBar} />

              <ScrollView
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={styles.scrollContent}
              >
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.title}>
                    {isEditing
                      ? 'Edit Transaksi'
                      : transactionType === 'OUT'
                      ? 'Tambah Pengeluaran (Belanja Barang)'
                      : 'Tambah Pemasukan (Penjualan)'}
                  </Text>
                  <Text style={styles.subtitle}>
                    {transactionType === 'OUT'
                      ? 'Input pengeluaran barang akan otomatis mendaftarkan stok ke Inventori'
                      : 'Pilih barang terdaftar dari Inventori (Gunakan fitur cari di bawah)'}
                  </Text>
                </View>

                {/* Switcher Tipe Transaksi (Pemasukan vs Pengeluaran) */}
                <View style={styles.typeToggleContainer}>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.typeToggleBtn,
                      transactionType === 'IN' && styles.typeToggleBtnInActive,
                    ]}
                    onPress={() => {
                      setTransactionType('IN');
                      if (category === 'Operasional') {
                        setCategory('Bahan Baku');
                      }
                    }}
                  >
                    <Ionicons
                      name="arrow-down-circle"
                      size={18}
                      color={transactionType === 'IN' ? '#FFFFFF' : '#16A34A'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.typeToggleText,
                        transactionType === 'IN' && styles.typeToggleTextActive,
                      ]}
                    >
                      Pemasukan
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    style={[
                      styles.typeToggleBtn,
                      transactionType === 'OUT' && styles.typeToggleBtnOutActive,
                    ]}
                    onPress={() => setTransactionType('OUT')}
                  >
                    <Ionicons
                      name="arrow-up-circle"
                      size={18}
                      color={transactionType === 'OUT' ? '#FFFFFF' : '#DC2626'}
                      style={{ marginRight: 6 }}
                    />
                    <Text
                      style={[
                        styles.typeToggleText,
                        transactionType === 'OUT' && styles.typeToggleTextActive,
                      ]}
                    >
                      Pengeluaran
                    </Text>
                  </TouchableOpacity>
                </View>

                {/* FIELD 1: PILIH BARANG (PEMASUKAN = LOCKED PICKER ONLY WITH SEARCH BAR) */}
                <View style={styles.formGroup}>
                  <View style={styles.labelHeaderRow}>
                    <Text style={styles.label}>
                      {transactionType === 'IN' ? 'Pilih Barang Inventori' : 'Cari / Nama Barang'}{' '}
                      <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <TouchableOpacity onPress={handleGoToInventory}>
                      <Text style={styles.addInventoryLink}>Daftar Inventori ➔</Text>
                    </TouchableOpacity>
                  </View>

                  {transactionType === 'IN' ? (
                    /* PEMASUKAN MODE: STRICT PICKER TRIGGER CARD */
                    <TouchableOpacity
                      activeOpacity={0.85}
                      style={[
                        styles.pickerTriggerBox,
                        showSearchDropdown && styles.pickerTriggerBoxActive,
                      ]}
                      onPress={() => setShowSearchDropdown((prev) => !prev)}
                    >
                      <View style={styles.pickerTriggerLeft}>
                        <View style={styles.lockBadgeIcon}>
                          <Ionicons name="search-outline" size={18} color="#14A39F" />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text
                            style={[
                              styles.pickerTriggerTitle,
                              !name && { color: '#94A3B8', fontWeight: '500' },
                            ]}
                          >
                            {name || 'Tekan untuk cari & pilih barang...'}
                          </Text>
                          {selectedInventoryItem ? (
                            <Text style={styles.pickerTriggerSub}>
                              {selectedInventoryItem.category} • Stok: {selectedInventoryItem.stock}{' '}
                              {selectedInventoryItem.unit} • {formatRupiah(selectedInventoryItem.price)}
                            </Text>
                          ) : (
                            <Text style={styles.pickerTriggerLockedNotice}>
                              🔍 Cari barang terdaftar di inventori
                            </Text>
                          )}
                        </View>
                      </View>

                      <Ionicons
                        name={showSearchDropdown ? 'chevron-up' : 'chevron-down'}
                        size={20}
                        color="#64748B"
                      />
                    </TouchableOpacity>
                  ) : (
                    /* PENGELUARAN MODE: FREE TEXT EDITABLE SEARCH INPUT */
                    <View style={styles.searchInputBox}>
                      <Ionicons name="search" size={18} color="#94A3B8" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.searchInputText}
                        placeholder="Ketik nama barang (mis: Indomie, Susu)..."
                        placeholderTextColor="#A1A1AA"
                        value={name}
                        onChangeText={(val) => {
                          setName(val);
                          setShowSearchDropdown(true);
                        }}
                        onFocus={() => setShowSearchDropdown(true)}
                      />
                      {name.length > 0 && (
                        <TouchableOpacity onPress={() => setName('')}>
                          <Ionicons name="close-circle" size={18} color="#94A3B8" />
                        </TouchableOpacity>
                      )}
                    </View>
                  )}

                  {/* DROPDOWN CONTAINER WITH INTEGRATED LIVE SEARCH BAR */}
                  {showSearchDropdown && (
                    <View style={styles.searchDropdownContainer}>
                      {/* DEDICATED LIVE SEARCH INPUT INSIDE DROPDOWN FOR PEMASUKAN */}
                      {transactionType === 'IN' && (
                        <View style={styles.dropdownSearchInputBox}>
                          <Ionicons name="search" size={16} color="#14A39F" style={{ marginRight: 8 }} />
                          <TextInput
                            style={styles.dropdownSearchInputText}
                            placeholder="Cari nama atau kategori barang di inventori..."
                            placeholderTextColor="#94A3B8"
                            value={pickerSearchQuery}
                            onChangeText={setPickerSearchQuery}
                          />
                          {pickerSearchQuery.length > 0 && (
                            <TouchableOpacity onPress={() => setPickerSearchQuery('')}>
                              <Ionicons name="close-circle" size={16} color="#94A3B8" />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}

                      <Text style={styles.dropdownHeaderTitle}>
                        {transactionType === 'IN'
                          ? `Daftar Barang Inventori (${matchingPickerItems.length} barang):`
                          : 'Hasil Pencarian Inventori:'}
                      </Text>

                      <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }} showsVerticalScrollIndicator={false}>
                        {(transactionType === 'IN' ? matchingPickerItems : matchingExpenseItems).length > 0 ? (
                          (transactionType === 'IN' ? matchingPickerItems : matchingExpenseItems).map(
                            (invItem) => {
                              const isOperasionalLocked =
                                transactionType === 'IN' && invItem.category === 'Operasional';
                              const isSelected = selectedInventoryItem?.id === invItem.id;

                              return (
                                <TouchableOpacity
                                  key={invItem.id}
                                  activeOpacity={0.7}
                                  style={[
                                    styles.dropdownItemRow,
                                    isSelected && styles.dropdownItemRowSelected,
                                    isOperasionalLocked && styles.dropdownItemRowLocked,
                                  ]}
                                  onPress={() => handleSelectInventoryItem(invItem)}
                                >
                                  <View style={{ flex: 1 }}>
                                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                                      <Text
                                        style={[
                                          styles.dropdownItemName,
                                          isOperasionalLocked && styles.textLocked,
                                        ]}
                                      >
                                        {invItem.name}
                                      </Text>
                                      {isOperasionalLocked && (
                                        <View style={styles.lockBadgeMini}>
                                          <Ionicons
                                            name="lock-closed"
                                            size={10}
                                            color="#DC2626"
                                            style={{ marginRight: 2 }}
                                          />
                                          <Text style={styles.lockBadgeMiniText}>Operasional</Text>
                                        </View>
                                      )}
                                    </View>
                                    <Text style={styles.dropdownItemMeta}>
                                      {invItem.category} • {formatRupiah(invItem.price)} / {invItem.unit}
                                    </Text>
                                  </View>

                                  <View style={{ alignItems: 'flex-end', flexDirection: 'row' }}>
                                    <Text style={styles.dropdownStockBadge}>
                                      Stok: {invItem.stock} {invItem.unit}
                                    </Text>
                                    {isSelected && (
                                      <Ionicons
                                        name="checkmark-circle"
                                        size={18}
                                        color="#14A39F"
                                        style={{ marginLeft: 6 }}
                                      />
                                    )}
                                  </View>
                                </TouchableOpacity>
                              );
                            }
                          )
                        ) : (
                          <View style={styles.noSearchMatchBox}>
                            <Ionicons name="search-outline" size={24} color="#94A3B8" style={{ marginBottom: 4 }} />
                            <Text style={styles.noMatchTitle}>
                              Barang "{pickerSearchQuery || name}" tidak ditemukan di inventori
                            </Text>
                            <Text style={styles.noMatchSub}>
                              Hanya barang terdaftar di inventori yang dapat dipilih untuk Pemasukan.
                            </Text>
                          </View>
                        )}
                      </ScrollView>
                    </View>
                  )}

                  {/* STATUS BADGE INDICATOR */}
                  {name.trim().length > 0 && (
                    <View style={{ marginTop: 6 }}>
                      {isExactItemInInventory ? (
                        <View style={styles.badgeRegistered}>
                          <Ionicons name="checkmark-circle" size={14} color="#16A34A" style={{ marginRight: 4 }} />
                          <Text style={styles.badgeRegisteredText}>
                            Barang Terdaftar di Inventori ({transactionType === 'IN' ? 'Stok berkurang' : 'Stok bertambah'})
                          </Text>
                        </View>
                      ) : (
                        transactionType === 'OUT' && (
                          <View style={styles.badgeNewItem}>
                            <Ionicons name="sparkles" size={14} color="#0284C7" style={{ marginRight: 4 }} />
                            <Text style={styles.badgeNewItemText}>
                              Barang Baru — Otomatis Didaftarkan ke Inventori saat Disimpan
                            </Text>
                          </View>
                        )
                      )}
                    </View>
                  )}
                </View>

                {/* FIELD 2: KATEGORI BARANG (OPERASIONAL IS LOCKED FOR PEMASUKAN) */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Kategori Barang</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={{ gap: 6, paddingVertical: 4 }}
                  >
                    {CATEGORY_SUGGESTIONS.map((cat) => {
                      const isSelected = category === cat;
                      const isLocked = transactionType === 'IN' && cat === 'Operasional';

                      return (
                        <TouchableOpacity
                          key={cat}
                          activeOpacity={0.8}
                          style={[
                            styles.catChip,
                            isSelected && styles.catChipActive,
                            isLocked && styles.catChipLocked,
                          ]}
                          onPress={() => handleSelectCategoryChip(cat)}
                        >
                          {isLocked && (
                            <Ionicons name="lock-closed" size={12} color="#94A3B8" style={{ marginRight: 4 }} />
                          )}
                          <Text
                            style={[
                              styles.catChipText,
                              isSelected && styles.catChipTextActive,
                              isLocked && styles.catChipTextLocked,
                            ]}
                          >
                            {cat} {isLocked ? '(Dikunci)' : ''}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>

                {/* FIELD 3: HARGA PER PICIS / UNIT (RP) */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>
                    Harga per Picis / Unit (Rp) <Text style={styles.requiredStar}>*</Text>
                  </Text>
                  {transactionType === 'IN' && selectedInventoryItem ? (
                    /* Read-Only Preview for Pemasukan since Price comes from Inventory */
                    <View style={styles.readOnlyPriceBox}>
                      <Text style={styles.readOnlyPriceTextLabel}>
                        {formatRupiah(price)} / {unit}
                      </Text>
                      <Text style={styles.readOnlySubText}>Standard Harga Inventori</Text>
                    </View>
                  ) : (
                    <View style={styles.inputPrefixBox}>
                      <Text style={styles.inputPrefixText}>Rp</Text>
                      <TextInput
                        style={styles.prefixedInput}
                        placeholder="Contoh: 3.500"
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
                  )}
                </View>

                {/* FIELD 4 & 5: JUMLAH (QTY) & SATUAN */}
                <View style={styles.rowGrid}>
                  {/* Stepper Kuantitas */}
                  <View style={[styles.formGroup, { flex: 1.2, marginRight: 10 }]}>
                    <Text style={styles.label}>Jumlah (Qty)</Text>
                    <View style={styles.stepperContainer}>
                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.stepperBtnMinus}
                        onPress={handleQuantityDecrement}
                      >
                        <Ionicons name="remove" size={18} color="#FFFFFF" />
                      </TouchableOpacity>

                      <Text style={styles.stepperValueText}>{quantity}</Text>

                      <TouchableOpacity
                        activeOpacity={0.8}
                        style={styles.stepperBtnPlus}
                        onPress={handleQuantityIncrement}
                      >
                        <Ionicons name="add" size={18} color="#FFFFFF" />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {/* Satuan Unit Selection */}
                  <View style={[styles.formGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Satuan</Text>
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      contentContainerStyle={{ gap: 4 }}
                    >
                      {UNIT_OPTIONS.slice(0, 5).map((u) => {
                        const isSelected = unit === u;
                        return (
                          <TouchableOpacity
                            key={u}
                            activeOpacity={0.8}
                            style={[styles.unitMiniChip, isSelected && styles.unitMiniChipActive]}
                            onPress={() => setUnit(u)}
                          >
                            <Text
                              style={[
                                styles.unitMiniChipText,
                                isSelected && styles.unitMiniChipTextActive,
                              ]}
                            >
                              {u}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                </View>

                {/* TOTAL SUBTOTAL PREVIEW */}
                <View style={styles.subtotalCard}>
                  <Text style={styles.subtotalLabel}>
                    Total Transaksi ({quantity} {unit} @ {formatRupiah(price || 0)})
                  </Text>
                  <Text
                    style={[
                      styles.subtotalValue,
                      { color: transactionType === 'IN' ? '#16A34A' : '#DC2626' },
                    ]}
                  >
                    {formatRupiah((price || 0) * quantity)}
                  </Text>
                </View>

                {/* METODE PEMBAYARAN */}
                <View style={styles.formGroup}>
                  <Text style={styles.label}>Metode Pembayaran</Text>
                  <View style={styles.paymentMethodRow}>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.paymentChip,
                        paymentMethod === 'Lunas' && styles.paymentChipLunasActive,
                      ]}
                      onPress={() => setPaymentMethod('Lunas')}
                    >
                      <Ionicons
                        name="checkmark-circle"
                        size={16}
                        color={paymentMethod === 'Lunas' ? '#FFFFFF' : '#16A34A'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.paymentChipText,
                          paymentMethod === 'Lunas' && styles.paymentChipTextActive,
                        ]}
                      >
                        Lunas
                      </Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={[
                        styles.paymentChip,
                        paymentMethod === 'Hutang' && styles.paymentChipHutangActive,
                      ]}
                      onPress={() => setPaymentMethod('Hutang')}
                    >
                      <Ionicons
                        name="time"
                        size={16}
                        color={paymentMethod === 'Hutang' ? '#FFFFFF' : '#D97706'}
                        style={{ marginRight: 4 }}
                      />
                      <Text
                        style={[
                          styles.paymentChipText,
                          paymentMethod === 'Hutang' && styles.paymentChipTextActive,
                        ]}
                      >
                        Hutang / Kasbon
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* DYNAMIC FIELD: NAMA PENGHUTANG */}
                {paymentMethod === 'Hutang' && (
                  <View style={styles.formGroup}>
                    <Text style={styles.label}>
                      Nama Yang Berhutang <Text style={styles.requiredStar}>*</Text>
                    </Text>
                    <View style={styles.debtorInputBox}>
                      <Ionicons name="person" size={18} color="#D97706" style={{ marginRight: 8 }} />
                      <TextInput
                        style={styles.debtorInputText}
                        placeholder={
                          transactionType === 'IN'
                            ? 'Nama Pelanggan (cth: Pak Budi, Mas Fajar)...'
                            : 'Nama Supplier / Pihak Terkait...'
                        }
                        placeholderTextColor="#A1A1AA"
                        value={debtorName}
                        onChangeText={setDebtorName}
                      />
                    </View>
                    <Text style={styles.debtorHintText}>
                      📌 Transaksi ini akan otomatis masuk ke menu Daftar Hutang.
                    </Text>
                  </View>
                )}

                {/* ACTIONS */}
                <View style={styles.actionRow}>
                  {isEditing && onDelete && (
                    <TouchableOpacity
                      activeOpacity={0.8}
                      style={styles.deleteBtn}
                      onPress={handleDelete}
                    >
                      <Ionicons name="trash-outline" size={18} color="#DC2626" />
                    </TouchableOpacity>
                  )}

                  <TouchableOpacity activeOpacity={0.8} style={styles.cancelBtn} onPress={onClose}>
                    <Text style={styles.cancelBtnText}>Batal</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.85}
                    style={[
                      styles.saveBtn,
                      transactionType === 'IN' ? styles.saveBtnIn : styles.saveBtnOut,
                    ]}
                    onPress={handleSave}
                  >
                    <Text style={styles.saveBtnText}>
                      {isEditing ? 'Perbarui Transaksi' : 'Simpan Transaksi'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </TouchableWithoutFeedback>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  keyboardAvoidingView: {
    width: '100%',
  },
  modalContainer: {
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 19,
    fontWeight: '800',
    color: '#0F172A',
  },
  subtitle: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  typeToggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 16,
    padding: 4,
    marginBottom: 18,
    gap: 6,
  },
  typeToggleBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
  },
  typeToggleBtnInActive: {
    backgroundColor: '#16A34A',
  },
  typeToggleBtnOutActive: {
    backgroundColor: '#DC2626',
  },
  typeToggleText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  typeToggleTextActive: {
    color: '#FFFFFF',
  },
  formGroup: {
    marginBottom: 16,
  },
  labelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  requiredStar: {
    color: '#EF4444',
  },
  addInventoryLink: {
    fontSize: 12,
    fontWeight: '700',
    color: '#14A39F',
  },
  /* PICKER TRIGGER BOX FOR PEMASUKAN */
  pickerTriggerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerTriggerBoxActive: {
    borderColor: '#14A39F',
    backgroundColor: '#F0FDFA',
  },
  pickerTriggerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    paddingRight: 8,
  },
  lockBadgeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#CCFBF1',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  pickerTriggerTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
  },
  pickerTriggerSub: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  pickerTriggerLockedNotice: {
    fontSize: 11,
    color: '#14A39F',
    fontWeight: '600',
    marginTop: 2,
  },
  searchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  searchInputText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  searchDropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: 10,
    marginTop: 6,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 4,
  },
  dropdownSearchInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 8,
    marginBottom: 8,
  },
  dropdownSearchInputText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#0F172A',
  },
  dropdownHeaderTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    paddingHorizontal: 2,
  },
  dropdownItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 12,
    marginBottom: 4,
    backgroundColor: '#F8FAFC',
  },
  dropdownItemRowSelected: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#14A39F',
  },
  dropdownItemRowLocked: {
    opacity: 0.6,
    backgroundColor: '#FEF2F2',
  },
  textLocked: {
    color: '#94A3B8',
    textDecorationLine: 'line-through',
  },
  lockBadgeMini: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginLeft: 6,
  },
  lockBadgeMiniText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#DC2626',
  },
  dropdownItemName: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  dropdownItemMeta: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
  dropdownStockBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#14A39F',
    backgroundColor: '#CCFBF1',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  noSearchMatchBox: {
    paddingVertical: 14,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  noMatchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    textAlign: 'center',
  },
  noMatchSub: {
    fontSize: 11,
    color: '#64748B',
    textAlign: 'center',
    marginTop: 2,
  },
  badgeRegistered: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#DCFCE7',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeRegisteredText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#16A34A',
  },
  badgeNewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E0F2FE',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
  },
  badgeNewItemText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#0284C7',
  },
  catChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    backgroundColor: '#F1F5F9',
  },
  catChipActive: {
    backgroundColor: '#14A39F',
  },
  catChipLocked: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    opacity: 0.7,
  },
  catChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  catChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  catChipTextLocked: {
    color: '#94A3B8',
  },
  readOnlyPriceBox: {
    backgroundColor: '#F0FDFA',
    borderWidth: 1,
    borderColor: '#CCFBF1',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  readOnlyPriceTextLabel: {
    fontSize: 15,
    fontWeight: '800',
    color: '#10B981',
  },
  readOnlySubText: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
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
  rowGrid: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    padding: 3,
    justifyContent: 'space-between',
  },
  stepperBtnMinus: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#94A3B8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperBtnPlus: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#14A39F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepperValueText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  unitMiniChip: {
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
  },
  unitMiniChipActive: {
    backgroundColor: '#0F172A',
  },
  unitMiniChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#64748B',
  },
  unitMiniChipTextActive: {
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
    marginBottom: 16,
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
  paymentMethodRow: {
    flexDirection: 'row',
    gap: 10,
  },
  paymentChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
  },
  paymentChipLunasActive: {
    backgroundColor: '#16A34A',
  },
  paymentChipHutangActive: {
    backgroundColor: '#D97706',
  },
  paymentChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#475569',
  },
  paymentChipTextActive: {
    color: '#FFFFFF',
  },
  debtorInputBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFBEB',
    borderWidth: 1.5,
    borderColor: '#FDE68A',
    borderRadius: 14,
    paddingHorizontal: 14,
  },
  debtorInputText: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    fontWeight: '700',
    color: '#92400E',
  },
  debtorHintText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#D97706',
    marginTop: 4,
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 8,
  },
  deleteBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FEE2E2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
  saveBtn: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center',
  },
  saveBtnIn: {
    backgroundColor: '#16A34A',
  },
  saveBtnOut: {
    backgroundColor: '#DC2626',
  },
  saveBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
